import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Menu, X } from 'lucide-react';

export type HeaderAtmosphere = 'hero-forest' | 'ivory' | 'deep-forest';

interface EditorialHeaderProps {
  visible: boolean;
  atmosphere: HeaderAtmosphere;
  activeSection: string | null;
  readingProgress: number;
}

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', delayClass: 'delay-[75ms]' },
  { id: 'methodology', label: 'Methodology', delayClass: 'delay-[125ms]' },
  { id: 'capabilities', label: 'Capabilities', delayClass: 'delay-[175ms]' },
  { id: 'preview', label: 'Observatory Preview', delayClass: 'delay-[225ms]' },
] as const;

export function EditorialHeader({
  visible,
  atmosphere,
  activeSection,
  readingProgress,
}: EditorialHeaderProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Close mobile drawer automatically if header hides during reverse scroll into darkness
  useEffect(() => {
    if (!visible && mobileNavOpen) {
      setMobileNavOpen(false);
    }
  }, [visible, mobileNavOpen]);

  const isHeroForest = atmosphere === 'hero-forest';
  const isIvory = atmosphere === 'ivory';

  const headerShellClass = isHeroForest
    ? 'bg-transparent shadow-none text-[#F1EFE6]'
    : isIvory
      ? 'bg-[#EEEBDD] shadow-[inset_0_-1px_0_rgba(16,28,23,0.12)] text-[#101C17]'
      : 'bg-[#101C17] shadow-[inset_0_-1px_0_rgba(213,217,198,0.12)] text-[#EEEBDD]';

  const navLinkBaseClass = isIvory
    ? 'text-[#243B2E]/85 hover:text-[#101C17] after:bg-[#4E6142]'
    : 'text-[#D5D9C6]/90 hover:text-[#F1EFE6] after:bg-[#D3A36C]';

  const navLinkActiveClass = isIvory
    ? 'text-[#101C17] after:scale-x-100'
    : 'text-[#F1EFE6] after:scale-x-100';

  const ctaClass = isHeroForest
    ? 'border border-[#EEEBDD]/32 bg-[#0A120E]/28 text-[#F1EFE6] hover:bg-[#EEEBDD]/14 hover:border-[#EEEBDD]/65'
    : isIvory
      ? 'border border-[#101C17] bg-[#101C17] text-[#EEEBDD] hover:bg-[#243B2E]'
      : 'border border-[#EEEBDD] bg-[#EEEBDD] text-[#101C17] hover:bg-[#D5D9C6]';

  const mobileDrawerClass = isIvory
    ? 'border-t border-[#101C17]/12 bg-[#EEEBDD] text-[#101C17]'
    : 'border-t border-[#D5D9C6]/12 bg-[#101C17] text-[#EEEBDD]';

  return (
    <header
      aria-hidden={!visible}
      data-atmosphere={atmosphere}
      className={`fixed top-0 inset-x-0 z-50 transition-[opacity,transform,background-color,box-shadow,color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${headerShellClass} ${
        visible
          ? 'opacity-100 translate-y-0 visible pointer-events-auto'
          : 'opacity-0 -translate-y-3 invisible pointer-events-none'
      }`}
    >
      {/* Smoothly crossfaded top canopy scrim over the living forest hero */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 bg-gradient-to-b from-[#060A07]/78 via-[#060A07]/34 to-transparent transition-opacity duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isHeroForest ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div className="relative z-10 max-w-[1320px] mx-auto px-5 sm:px-10 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element Editorial Brand Wordmark */}
        <Link
          to="/"
          className={`font-serif text-xl sm:text-2xl font-medium tracking-tight whitespace-nowrap shrink-0 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1.5'
          }`}
        >
          EcoSonic 3.0
        </Link>

        {/* Zone 2: Choreographed single-line nav links with origin-left hairline underlines */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-[13px] font-medium tracking-[0.01em]"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`relative py-1 whitespace-nowrap shrink-0 transition-[opacity,transform,color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${item.delayClass} after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[1px] after:origin-left after:transition-transform after:duration-300 after:ease-[cubic-bezier(0.16,1,0.3,1)] ${navLinkBaseClass} ${
                  isActive ? navLinkActiveClass : 'after:scale-x-0 hover:after:scale-x-100'
                } ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1.5'}`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Single adaptive action (quiet hairline over forest hero, crisp solid CTA in editorial scroll) */}
        <div
          className={`flex items-center gap-3 shrink-0 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] delay-[260ms] ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1.5'
          }`}
        >
          <Link
            to="/app/observatory"
            className={`hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-medium tracking-[0.04em] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap shrink-0 min-h-[40px] group ${ctaClass}`}
          >
            <span>Explore the Observatory</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>

          <button
            type="button"
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileNavOpen}
            className={`md:hidden p-2 rounded-sm min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors ${
              isIvory ? 'text-[#101C17] hover:bg-[#101C17]/8' : 'text-[#EEEBDD] hover:bg-[#EEEBDD]/10'
            }`}
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Subtle reading progress hairline once inside editorial sections */}
      {!isHeroForest && (
        <div
          aria-hidden="true"
          className={`h-[1.5px] w-full origin-left transition-transform duration-150 ease-out ${
            isIvory ? 'bg-[#4E6142]/70' : 'bg-[#D3A36C]/70'
          }`}
          style={{ transform: `scaleX(${Math.min(1, Math.max(0, readingProgress))})` }}
        />
      )}

      {mobileNavOpen && (
        <div className={`md:hidden px-5 py-4 space-y-2.5 transition-colors duration-300 ${mobileDrawerClass}`}>
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setMobileNavOpen(false)}
              className="block py-2 text-sm opacity-90 hover:opacity-100"
            >
              {item.label}
            </a>
          ))}
          <Link
            to="/app/observatory"
            className={`mt-2 inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-sm text-sm font-semibold ${
              isIvory ? 'bg-[#101C17] text-[#EEEBDD]' : 'bg-[#EEEBDD] text-[#101C17]'
            }`}
          >
            <span>Explore the Observatory</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </header>
  );
}
