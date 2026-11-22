import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, AudioWaveform, Bird, History, ShieldAlert } from 'lucide-react';
import { CinematicHero } from '../components/cinematic/CinematicHero';
import {
  EditorialHeader,
  type HeaderAtmosphere,
} from '../components/cinematic/EditorialHeader';
import { AcousticVisualizer } from '../components/observatory/AcousticVisualizer';
import { MediaImage } from '../components/ui/Primitives';
import { DEMO_DETECTIONS, DEMO_SOUNDSCAPES } from '../data/demoFixtures';
import { formatTimestampTime } from '../lib/acoustics';

const WETLAND_IMG = '/src/assets/images/intro_wetland_habitat_1795327580798.jpg';
const BIRD_IMG = '/src/assets/images/capability_bird_canopy_1795327580975.jpg';
const MOSS_IMG = '/src/assets/images/macro_moss_dew_1795327581100.jpg';
const RIDGE_IMG = '/src/assets/images/closing_alpine_ridge_1795327580352.jpg';

const METHODOLOGY_STEPS = [
  {
    number: '01',
    title: 'Listen',
    subtitle: 'Capture environmental sound',
    description:
      'Continuous field microphones and browser audio streams capture uncompressed acoustic envelopes across forest canopies, wetlands, and alpine basins.',
  },
  {
    number: '02',
    title: 'Analyze',
    subtitle: 'AI-based acoustic inference',
    description:
      'Sliding-window spectral decomposition extracts time-frequency representations for avian species classification and non-biological event detection.',
  },
  {
    number: '03',
    title: 'Interpret',
    subtitle: 'Examine species and soundscape signals',
    description:
      'Acoustic indices (ACI, ADI, AEI, NDSI, and Shannon entropy) quantify spectral complexity, anthrophony balance, and temporal vocalization rhythms.',
  },
  {
    number: '04',
    title: 'Understand',
    subtitle: 'Explore environmental observations',
    description:
      'Researchers review timestamped detections, inspect disturbance timelines, and compare monitoring sessions across habitats and seasons.',
  },
];

export function LandingPage() {
  const [navbarVisible, setNavbarVisible] = useState(false);
  const [headerAtmosphere, setHeaderAtmosphere] = useState<HeaderAtmosphere>('hero-forest');
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);

  const previewDetections = DEMO_DETECTIONS.slice(0, 3);
  const previewSoundscape = DEMO_SOUNDSCAPES['temperate-rainforest'];

  // Adaptive atmosphere & active chapter tracking as visitor scrolls from living forest into editorial sections
  useEffect(() => {
    const sectionOrder: Array<{ id: string; atmosphere: HeaderAtmosphere }> = [
      { id: 'overview', atmosphere: 'ivory' },
      { id: 'methodology', atmosphere: 'deep-forest' },
      { id: 'capabilities', atmosphere: 'ivory' },
      { id: 'preview', atmosphere: 'deep-forest' },
    ];

    const syncHeaderState = () => {
      const overviewEl = document.getElementById('overview');
      if (!overviewEl) return;

      const overviewTop = overviewEl.getBoundingClientRect().top;
      // Stay in transparent canopy gradient while still over the emerged forest hero
      if (overviewTop > 68) {
        setHeaderAtmosphere((prev) => (prev === 'hero-forest' ? prev : 'hero-forest'));
        setActiveSection((prev) => (prev === null ? prev : null));
        setReadingProgress((prev) => (prev === 0 ? prev : 0));
        return;
      }

      let nextAtmosphere: HeaderAtmosphere = 'ivory';
      let nextSection: string | null = 'overview';
      for (const item of sectionOrder) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= 112) {
          nextAtmosphere = item.atmosphere;
          nextSection = item.id;
        }
      }

      const docScroll = window.scrollY;
      const overviewAbsTop = docScroll + overviewTop;
      const totalEditorial = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight - overviewAbsTop
      );
      const nextProgress = Math.min(1, Math.max(0, (docScroll - overviewAbsTop) / totalEditorial));

      setHeaderAtmosphere((prev) => (prev === nextAtmosphere ? prev : nextAtmosphere));
      setActiveSection((prev) => (prev === nextSection ? prev : nextSection));
      setReadingProgress((prev) => (Math.abs(prev - nextProgress) > 0.002 ? nextProgress : prev));
    };

    syncHeaderState();
    window.addEventListener('scroll', syncHeaderState, { passive: true });
    window.addEventListener('resize', syncHeaderState, { passive: true });
    return () => {
      window.removeEventListener('scroll', syncHeaderState);
      window.removeEventListener('resize', syncHeaderState);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#050605] text-[#EEEBDD]">
        <EditorialHeader
          visible={navbarVisible}
          atmosphere={headerAtmosphere}
          activeSection={activeSection}
          readingProgress={readingProgress}
        />

        {/* Opening Film Sequence: Dark Water -> Leaf -> Moving Light -> 180-deg Roll -> Living Forest */}
        <CinematicHero onNavbarVisibilityChange={setNavbarVisible} />

        {/* Section B — Product Introduction (Seamless Forest-to-Ivory Atmospheric Bridge) */}
        <section id="overview" className="bg-[#EEEBDD] text-[#101C17] bg-ivory-grain scroll-mt-16">
          {/* Graduated botanical horizon dissolve eliminating harsh cut below forest hero */}
          <div
            aria-hidden="true"
            className="h-24 sm:h-32 w-full bg-gradient-to-b from-[#060907] via-[#1C2A21]/55 via-40% to-[#EEEBDD]"
          />

          <div className="max-w-[1320px] mx-auto px-5 sm:px-8 pt-10 sm:pt-14 pb-20 sm:pb-28">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-stretch">
              <div className="lg:col-span-6 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-mono tracking-wider text-[#4E6142] uppercase">
                    Acoustic Field Observation
                  </p>
                  <h2 className="mt-3 font-serif text-3xl sm:text-5xl font-semibold leading-[1.08] tracking-tight text-[#101C17]">
                    Transform the sounds of the natural world into meaningful environmental
                    intelligence.
                  </h2>
                  <p className="mt-6 text-base text-[#243B2E] leading-relaxed">
                    Visual surveys capture only what passes in front of a lens. Continuous
                    bioacoustic monitoring listens across dense canopy layers, wetland reedbeds, and
                    nocturnal horizons—converting raw pressure waves into structured scientific
                    observations.
                  </p>
                </div>

                <div className="mt-10 pt-8 border-t border-[#101C17]/15 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-[#101C17]">Species observations</h3>
                    <p className="mt-1.5 text-sm text-[#243B2E]/85 leading-relaxed">
                      Timestamped avian vocalization identifications paired with raw model
                      confidence scores and frequency bounds.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#101C17]">Soundscape fingerprints</h3>
                    <p className="mt-1.5 text-sm text-[#243B2E]/85 leading-relaxed">
                      Empirical spectral diversity, complexity, and biophony-to-anthrophony ratios
                      across standardized frequency bands.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#101C17]">
                      Acoustic disturbance signals
                    </h3>
                    <p className="mt-1.5 text-sm text-[#243B2E]/85 leading-relaxed">
                      Differentiation of transportation corridors, mechanical activity, cultural
                      sounds, and potential environmental hazards.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#101C17]">
                      Temporal environmental patterns
                    </h3>
                    <p className="mt-1.5 text-sm text-[#243B2E]/85 leading-relaxed">
                      Multi-session archival records revealing dawn chorus shifts, seasonal arrival,
                      and ambient acoustic drift.
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 flex flex-col gap-6">
                <div className="flex-1 overflow-hidden rounded-lg border border-[#101C17]/12 min-h-[300px]">
                  <MediaImage
                    src={WETLAND_IMG}
                    alt="Tranquil misty wetland marsh and forest lake at early morning"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Clean architectural signal diagram */}
                <div className="rounded-lg border border-[#101C17]/15 bg-[#E5E1D0] p-5">
                  <div className="text-xs font-mono text-[#4E6142] mb-3">
                    Acoustic Signal Pipeline
                  </div>
                  <svg
                    viewBox="0 0 640 92"
                    className="w-full h-auto"
                    role="img"
                    aria-label="Diagram showing flow from Field Audio Capture to Spectral Decomposition to Ecological Signals"
                  >
                    <rect x="4" y="14" width="142" height="64" rx="6" fill="#EEEBDD" stroke="#243B2E" strokeOpacity="0.28" />
                    <text x="75" y="42" textAnchor="middle" fill="#101C17" fontSize="12" fontWeight="600" fontFamily="Plus Jakarta Sans, sans-serif">Field Audio</text>
                    <text x="75" y="60" textAnchor="middle" fill="#4A594E" fontSize="10" fontFamily="IBM Plex Mono, monospace">48 kHz PCM</text>

                    <line x1="146" y1="46" x2="188" y2="46" stroke="#4E6142" strokeWidth="1.5" />
                    <polygon points="188,42 196,46 188,50" fill="#4E6142" />

                    <rect x="198" y="14" width="174" height="64" rx="6" fill="#EEEBDD" stroke="#243B2E" strokeOpacity="0.28" />
                    <text x="285" y="42" textAnchor="middle" fill="#101C17" fontSize="12" fontWeight="600" fontFamily="Plus Jakarta Sans, sans-serif">Spectral Inference</text>
                    <text x="285" y="60" textAnchor="middle" fill="#4A594E" fontSize="10" fontFamily="IBM Plex Mono, monospace">STFT · Bioacoustics</text>

                    <line x1="372" y1="46" x2="414" y2="46" stroke="#4E6142" strokeWidth="1.5" />
                    <polygon points="414,42 422,46 414,50" fill="#4E6142" />

                    <rect x="424" y="14" width="212" height="64" rx="6" fill="#101C17" />
                    <text x="530" y="42" textAnchor="middle" fill="#EEEBDD" fontSize="12" fontWeight="600" fontFamily="Plus Jakarta Sans, sans-serif">Ecological Intelligence</text>
                    <text x="530" y="60" textAnchor="middle" fill="#D5D9C6" fontSize="10" fontFamily="IBM Plex Mono, monospace">Species · Indices · Events</text>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

      {/* Section C — How EcoSonic Works (Deep Forest) */}
      <section id="methodology" className="bg-[#101C17] text-[#EEEBDD] bg-natural-grain py-20 sm:py-28 border-t border-[#D5D9C6]/12 scroll-mt-16">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5">
              <p className="text-xs font-mono tracking-wider text-[#788B68] uppercase">
                How EcoSonic Works
              </p>
              <h2 className="mt-3 font-serif text-3xl sm:text-5xl font-semibold leading-[1.08] tracking-tight text-[#EEEBDD]">
                From pressure waves to structured ecological memory.
              </h2>
              <p className="mt-5 text-base text-[#A5AC9C] leading-relaxed">
                Every recording passes through a disciplined four-stage analytical chain designed
                for scientific legibility rather than opaque black-box scores.
              </p>

              <div className="mt-8 overflow-hidden rounded-lg border border-[#D5D9C6]/15 aspect-[4/3]">
                <MediaImage
                  src={MOSS_IMG}
                  alt="Macro detail of wild forest moss and fern fronds covered with morning dew"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="lg:col-span-7 divide-y divide-[#D5D9C6]/12 border-t border-b border-[#D5D9C6]/12">
              {METHODOLOGY_STEPS.map((step) => (
                <div
                  key={step.number}
                  className="py-7 sm:py-8 grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-6 items-baseline"
                >
                  <div className="sm:col-span-2 font-mono text-sm text-[#D3A36C]">
                    {step.number}.
                  </div>
                  <div className="sm:col-span-4">
                    <h3 className="font-serif text-2xl font-semibold text-[#EEEBDD]">
                      {step.title}
                    </h3>
                    <div className="mt-1 text-xs text-[#788B68] font-medium">{step.subtitle}</div>
                  </div>
                  <p className="sm:col-span-6 text-sm text-[#D5D9C6]/85 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section D — Intelligence Capabilities (Warm Ivory Asymmetric Grid) */}
      <section id="capabilities" className="bg-[#EEEBDD] text-[#101C17] py-20 sm:py-28 scroll-mt-16">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-mono tracking-wider text-[#4E6142] uppercase">
              Intelligence Capabilities
            </p>
            <h2 className="mt-3 font-serif text-3xl sm:text-5xl font-semibold leading-[1.08] tracking-tight text-[#101C17]">
              Four lenses into the living soundscape.
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Marquee Card: Species Intelligence */}
            <article className="lg:col-span-7 bg-[#E5E1D0] border border-[#101C17]/14 rounded-lg overflow-hidden grid grid-cols-1 md:grid-cols-2">
              <div className="p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-[#4E6142]">
                    <Bird className="w-4 h-4" />
                    <span>01 · Species Intelligence</span>
                  </div>
                  <h3 className="mt-4 font-serif text-2xl sm:text-3xl font-semibold text-[#101C17]">
                    Avian taxonomy & confidence inspection
                  </h3>
                  <p className="mt-3 text-sm text-[#243B2E] leading-relaxed">
                    Review detected bird species with common and scientific binomial names, exact
                    timestamps, frequency bands, and raw model confidence scores without conflating
                    classifier scores with calibrated probability.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#101C17]/12">
                  <Link
                    to="/app/detections"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-[#101C17] hover:underline underline-offset-4"
                  >
                    <span>Open Species Intelligence</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
              <div className="min-h-[240px]">
                <MediaImage
                  src={BIRD_IMG}
                  alt="Woodland songbird perched on a moss and lichen covered cedar branch"
                  className="w-full h-full object-cover"
                />
              </div>
            </article>

            {/* Soundscape Fingerprints */}
            <article className="lg:col-span-5 bg-[#E5E1D0] border border-[#101C17]/14 rounded-lg p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#4E6142]">
                  <AudioWaveform className="w-4 h-4" />
                  <span>02 · Soundscape Fingerprints</span>
                </div>
                <h3 className="mt-4 font-serif text-2xl sm:text-3xl font-semibold text-[#101C17]">
                  Empirical acoustic indices
                </h3>
                <p className="mt-3 text-sm text-[#243B2E] leading-relaxed">
                  Track ACI, ADI, AEI, NDSI, and spectral Shannon entropy alongside frequency-band
                  energy distributions and temporal vocalization activity—presented transparently
                  without fabricated composite health scores.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#101C17]/12 flex items-center justify-between text-xs font-mono text-[#4A594E]">
                <span>ACI · ADI · AEI · NDSI · H′</span>
                <Link
                  to="/app/soundscape"
                  className="inline-flex items-center gap-1.5 font-sans font-semibold text-[#101C17] hover:underline underline-offset-4"
                >
                  <span>Inspect Indices</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>

            {/* Disturbance Radar */}
            <article className="lg:col-span-5 bg-[#E5E1D0] border border-[#101C17]/14 rounded-lg p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#9E6B30]">
                  <ShieldAlert className="w-4 h-4" />
                  <span>03 · Disturbance Radar</span>
                </div>
                <h3 className="mt-4 font-serif text-2xl sm:text-3xl font-semibold text-[#101C17]">
                  Non-animal event classification
                </h3>
                <p className="mt-3 text-sm text-[#243B2E] leading-relaxed">
                  Isolate anthropogenic and abiotic intrusions across four clear categories:
                  transportation corridors, potential environmental hazards, mechanical activity, and
                  cultural sounds.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#101C17]/12">
                <Link
                  to="/app/disturbances"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-[#101C17] hover:underline underline-offset-4"
                >
                  <span>Explore Disturbance Timeline</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>

            {/* Acoustic Memory */}
            <article className="lg:col-span-7 bg-[#E5E1D0] border border-[#101C17]/14 rounded-lg p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#4E6142]">
                  <History className="w-4 h-4" />
                  <span>04 · Acoustic Memory</span>
                </div>
                <h3 className="mt-4 font-serif text-2xl sm:text-3xl font-semibold text-[#101C17]">
                  Session archives & temporal context
                </h3>
                <p className="mt-3 text-sm text-[#243B2E] leading-relaxed">
                  Preserve every monitoring session with its site coordinates, sample rate,
                  duration, species count, disturbance log, and soundscape summary—establishing a
                  structured foundation for longitudinal acoustic comparison.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#101C17]/12 flex items-center justify-between">
                <span className="text-xs text-[#4A594E]">
                  Multi-site session logs & diagnostic metadata
                </span>
                <Link
                  to="/app/sessions"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-[#101C17] hover:underline underline-offset-4"
                >
                  <span>Browse Sessions</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Section E — Observatory Preview (Explicitly Labeled Demonstration Content) */}
      <section id="preview" className="bg-[#101C17] text-[#EEEBDD] py-20 sm:py-28 border-t border-[#D5D9C6]/12 scroll-mt-16">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <p className="text-xs font-mono tracking-wider text-[#D3A36C] uppercase">
                Demonstration Preview · Illustrative Fixture Data
              </p>
              <h2 className="mt-3 font-serif text-3xl sm:text-5xl font-semibold leading-[1.08] tracking-tight text-[#EEEBDD]">
                Inside the Live Observatory.
              </h2>
            </div>
            <p className="text-sm text-[#A5AC9C] max-w-md leading-relaxed">
              The instrument preview below renders local demonstration fixtures from the Hoh Canopy
              Station dataset. Live microphone and backend telemetry connect in Stage 2.
            </p>
          </div>

          <div className="rounded-xl border border-[#D5D9C6]/18 bg-[#18271F] p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-6 border-b border-[#D5D9C6]/12">
              <div className="flex items-center gap-3 text-xs text-[#D5D9C6]">
                <span className="font-mono text-[#D3A36C]">DEMO FIXTURE</span>
                <span aria-hidden="true">·</span>
                <span>{previewSoundscape.siteName}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-[#A5AC9C]">48,000 Hz</span>
              </div>
              <Link
                to="/app/observatory"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#788B68] text-[#101C17] text-xs font-semibold hover:bg-[#899D78] transition-colors whitespace-nowrap"
              >
                <span>Open Full Instrument</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8">
                <AcousticVisualizer
                  status="streaming"
                  presetId="temperate-rainforest"
                  peakFrequencyHz={3420}
                  rmsLevelDbfs={-37.8}
                  height={260}
                />
              </div>

              <div className="lg:col-span-4 flex flex-col justify-between gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#101C17] border border-[#D5D9C6]/12 rounded-md p-3.5">
                    <div className="text-[11px] font-mono text-[#A5AC9C]">ACI (DEMO)</div>
                    <div className="mt-1 text-xl font-mono tabular-nums text-[#EEEBDD]">
                      {previewSoundscape.indices.aci.toFixed(1)}
                    </div>
                  </div>
                  <div className="bg-[#101C17] border border-[#D5D9C6]/12 rounded-md p-3.5">
                    <div className="text-[11px] font-mono text-[#A5AC9C]">NDSI (DEMO)</div>
                    <div className="mt-1 text-xl font-mono tabular-nums text-[#788B68]">
                      +{previewSoundscape.indices.ndsi.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="bg-[#101C17] border border-[#D5D9C6]/12 rounded-md p-4 flex-1">
                  <div className="text-[11px] font-mono text-[#A5AC9C] mb-3">
                    ILLUSTRATIVE SPECIES LOG
                  </div>
                  <ul className="space-y-2.5">
                    {previewDetections.map((det) => (
                      <li
                        key={det.id}
                        className="flex items-baseline justify-between gap-3 text-xs border-b border-[#D5D9C6]/8 pb-2 last:border-b-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <div className="font-medium text-[#EEEBDD] truncate">
                            {det.commonName}
                          </div>
                          <div className="italic text-[#A5AC9C] truncate">{det.scientificName}</div>
                        </div>
                        <div className="text-right shrink-0 font-mono tabular-nums">
                          <div className="text-[#D5D9C6]">{det.confidenceScore.toFixed(2)}</div>
                          <div className="text-[10px] text-[#A5AC9C]">
                            {formatTimestampTime(det.timestampIso)}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section F — Closing CTA */}
      <section className="relative py-28 sm:py-36 overflow-hidden border-t border-[#D5D9C6]/12">
        <div className="absolute inset-0">
          <MediaImage
            src={RIDGE_IMG}
            alt="Misty alpine mountain ridge and evergreen valleys at twilight"
            className="w-full h-full object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#101C17] via-[#101C17]/70 to-[#101C17]/55"
          />
        </div>

        <div className="relative z-10 max-w-[1320px] mx-auto px-5 sm:px-8 text-center flex flex-col items-center">
          <h2 className="font-serif text-4xl sm:text-6xl font-semibold leading-[1.06] tracking-tight text-[#EEEBDD] max-w-2xl">
            Every environment has a story.
            <br />
            Start listening.
          </h2>
          <p className="mt-5 text-base text-[#D5D9C6] max-w-xl leading-relaxed">
            Enter the EcoSonic 3.0 acoustic workspace to inspect demonstration habitats, spectral
            fingerprints, and disturbance timelines.
          </p>
          <Link
            to="/app/observatory"
            className="mt-8 inline-flex items-center gap-2.5 px-7 py-3.5 rounded-md bg-[#EEEBDD] text-[#101C17] text-sm font-semibold hover:bg-[#D5D9C6] transition-colors whitespace-nowrap min-h-[48px]"
          >
            <span>Explore the Observatory</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Section G — Quiet Editorial Footer */}
      <footer className="bg-[#101C17] border-t border-[#D5D9C6]/14 py-14 text-sm text-[#A5AC9C]">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <div className="font-serif text-xl font-semibold text-[#EEEBDD]">EcoSonic 3.0</div>
            <p className="mt-3 text-sm text-[#A5AC9C] max-w-sm leading-relaxed">
              Environmental sound intelligence for bioacoustic observation, soundscape index
              analysis, and acoustic disturbance awareness.
            </p>
          </div>

          <div className="lg:col-span-3 space-y-2.5">
            <div className="text-xs font-mono uppercase tracking-wider text-[#D5D9C6]">
              Observatory Workspace
            </div>
            <ul className="space-y-2">
              <li>
                <Link to="/app/observatory" className="hover:text-[#EEEBDD] transition-colors">
                  Live Observatory
                </Link>
              </li>
              <li>
                <Link to="/app/detections" className="hover:text-[#EEEBDD] transition-colors">
                  Species Intelligence
                </Link>
              </li>
              <li>
                <Link to="/app/soundscape" className="hover:text-[#EEEBDD] transition-colors">
                  Soundscape Indices
                </Link>
              </li>
              <li>
                <Link to="/app/disturbances" className="hover:text-[#EEEBDD] transition-colors">
                  Disturbance Radar
                </Link>
              </li>
              <li>
                <Link to="/app/sessions" className="hover:text-[#EEEBDD] transition-colors">
                  Session History
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2 space-y-2.5">
            <div className="text-xs font-mono uppercase tracking-wider text-[#D5D9C6]">
              Documentation
            </div>
            <ul className="space-y-2">
              <li>
                <a href="#methodology" className="hover:text-[#EEEBDD] transition-colors">
                  Acoustic Pipeline
                </a>
              </li>
              <li>
                <Link to="/app/settings" className="hover:text-[#EEEBDD] transition-colors">
                  Adapter & Diagnostics
                </Link>
              </li>
              <li>
                <a href="#preview" className="hover:text-[#EEEBDD] transition-colors">
                  Demo Fixture Notice
                </a>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2 space-y-2.5">
            <div className="text-xs font-mono uppercase tracking-wider text-[#D5D9C6]">
              Contact
            </div>
            <p className="text-sm text-[#A5AC9C]">fieldnotes@ecosonic.org</p>
            <p className="text-xs text-[#A5AC9C]/75">Bioacoustic Research Platform</p>
          </div>
        </div>

        <div className="max-w-[1320px] mx-auto px-5 sm:px-8 mt-12 pt-6 border-t border-[#D5D9C6]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#A5AC9C]">
          <span>© 2026 EcoSonic 3.0. Environmental Sound Intelligence.</span>
          <span>Stage 1 Frontend · Demonstration Fixtures Active</span>
        </div>
      </footer>
    </div>
  );
}
