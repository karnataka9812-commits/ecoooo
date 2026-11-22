export const CINEMATIC_VERTEX_SHADER = /* glsl */ `
  varying vec2 vWorldUv;
  varying vec4 vClipPos;

  void main() {
    vWorldUv = uv;
    vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vClipPos = clip;
    gl_Position = clip;
  }
`;

export const CINEMATIC_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform sampler2D uTexLake;
  uniform sampler2D uTexForestMid;
  uniform sampler2D uTexForestFar;
  uniform float uLakeReady;
  uniform float uForestReady;

  uniform vec2 uResolution;
  uniform float uTexAspect;
  uniform float uTime;
  uniform vec2 uMouse;

  // Moving physical moonlight uniforms
  uniform vec2 uLightPos;
  uniform float uLightIntensity;
  uniform float uLightRadius;
  uniform float uWaterMotion;

  // Falling leaf lake-shadow & scroll-driven touchdown concentric ripple
  uniform vec2 uLeafShadowPos;
  uniform float uLeafHeightNorm;
  uniform vec2 uImpactOrigin;
  uniform float uImpactRippleProgress;
  uniform float uImpactRippleStrength;

  // Click water ripple uniforms (single active wave packet for mobile/CPU safety)
  uniform vec2 uRippleCenter;
  uniform float uRippleAge;
  uniform float uRippleActive;

  // Slow fluid portal transition & depth forest uniforms
  uniform float uPortalProgress;
  uniform float uSettleScale;
  uniform float uSettleRollRad;
  uniform float uHazeOpacity;
  uniform float uDarknessVeil;

  varying vec2 vWorldUv;
  varying vec4 vClipPos;

  // Aspect-preserving cover UV mapping (prevents stretch on any viewport)
  vec2 coverUv(vec2 uv, float targetAspect, float texAspect) {
    vec2 centered = uv - 0.5;
    if (targetAspect > texAspect) {
      centered.y *= texAspect / targetAspect;
    } else {
      centered.x *= targetAspect / texAspect;
    }
    return centered + 0.5;
  }

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 m = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 4; i++) {
      v += a * valueNoise(p);
      p = m * p * 2.02;
      a *= 0.5;
    }
    return v;
  }

  vec2 rotate2d(vec2 v, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, -s, s, c) * v;
  }

  void main() {
    float screenAspect = max(0.2, uResolution.x / max(1.0, uResolution.y));
    vec2 screenUv = 0.5 + 0.5 * (vClipPos.xy / max(0.0001, vClipPos.w));

    // =========================================================================
    // SCENE A: Nocturnal Lake of Darkness (still pine reflections + ripples)
    // =========================================================================
    vec3 sceneAColor = vec3(0.016, 0.020, 0.018); // deep obsidian lake floor #040505

    vec2 planeCentered = (vWorldUv - 0.5) * 2.6 + 0.5;
    vec2 lakeUv = coverUv(planeCentered, screenAspect, uTexAspect);

    if (uLakeReady > 0.5 && uPortalProgress < 0.995) {
      // Water plane begins cleanly below distant nocturnal pine horizon (~top 68% holds water & reflections)
      float waterZone = smoothstep(0.78, 0.42, screenUv.y);
      float skyNightFade = smoothstep(0.95, 0.55, screenUv.y);

      // Compute concentric wave slope from touchdown impact + ambient water drift + click ripple
      float waveSlope = 0.0;
      float ringHighlight = 0.0;

      // 1. Scroll-driven concentric ripple expanding outward from leaf landing site
      if (uImpactRippleStrength > 0.005) {
        vec2 impVec = screenUv - uImpactOrigin;
        impVec.x *= screenAspect;
        // Perspective foreshortening on lake plane (slightly wider horizontally than vertically)
        impVec.y *= 1.32;
        float impDist = length(impVec);
        float front = mix(0.015, 0.82, uImpactRippleProgress);
        float band = impDist - front;
        float env1 = exp(-(band * band) / 0.0026) * uImpactRippleStrength;
        float band2 = impDist - max(0.0, front - 0.095);
        float env2 = exp(-(band2 * band2) / 0.0018) * uImpactRippleStrength * 0.65;
        float band3 = impDist - max(0.0, front - 0.185);
        float env3 = exp(-(band3 * band3) / 0.0014) * uImpactRippleStrength * 0.36;
        float harmonic = sin(band * 84.0) * env1 + sin(band2 * 104.0) * env2 + sin(band3 * 124.0) * env3;
        waveSlope += harmonic * 1.5;
        ringHighlight += (
          max(0.0, sin(band * 84.0)) * env1 +
          max(0.0, sin(band2 * 104.0)) * env2 * 0.55 +
          max(0.0, sin(band3 * 124.0)) * env3 * 0.35
        ) * waterZone;
      }

      // 2. Subtle nocturnal lake micro-current when stirred
      if (uWaterMotion > 0.01) {
        float micro1 = sin(lakeUv.x * 110.0 + uTime * 1.1 + cos(lakeUv.y * 54.0 - uTime * 0.7) * 1.2);
        float micro2 = sin(lakeUv.y * 145.0 - uTime * 0.9 + sin(lakeUv.x * 68.0 + uTime * 0.5) * 1.0);
        waveSlope += (micro1 * 0.55 + micro2 * 0.45) * 0.22 * uWaterMotion * waterZone;
      }

      // 3. Interactive click ripple anywhere on the lake
      if (uRippleActive > 0.5) {
        vec2 rpVec = lakeUv - uRippleCenter;
        rpVec.x *= uTexAspect;
        rpVec.y *= 1.28;
        float rpDist = length(rpVec);
        float rpFront = uRippleAge * 0.24;
        float rpBand = rpDist - rpFront;
        float rpEnv = exp(-(rpBand * rpBand) / 0.0009) * exp(-uRippleAge * 0.85);
        float clickWave = sin(rpBand * 165.0) * rpEnv * 1.75;
        waveSlope += clickWave;
        ringHighlight += max(0.0, clickWave) * 0.55 * waterZone;
      }

      // Refract dark lake reflection along concentric wave crests
      vec2 refractedLakeUv = clamp(
        lakeUv + vec2(waveSlope * 0.0034, waveSlope * 0.0056) * waterZone,
        0.0,
        1.0
      );
      vec3 lakeSample = texture2D(uTexLake, refractedLakeUv).rgb;

      // Nocturnal moonlight grazing pool centered softly on the dark water & leaf
      vec2 dLight = screenUv - uLightPos;
      dLight.x *= screenAspect * 0.75;
      vec2 rLight = rotate2d(dLight, -0.32);
      float sigX = max(0.11, uLightRadius * 1.75);
      float sigY = max(0.08, uLightRadius * 1.05);
      float beam = exp(-(rLight.x * rLight.x) / (sigX * sigX) - (rLight.y * rLight.y) / (sigY * sigY)) * uLightIntensity;

      // Soft dark vignette keeping obsidian borders while letting lake reflections breathe below
      vec2 vigVec = (screenUv - vec2(0.5, 0.42)) * vec2(1.02, 1.18);
      float lakeVignette = clamp(1.0 - dot(vigVec, vigVec) * 0.58, 0.06, 1.0);

      // Leaf proximity reflection/shadow cast onto the lake below the descending leaf
      vec2 shVec = (screenUv - uLeafShadowPos) * vec2(screenAspect, 1.45);
      float shadowRadius = mix(0.095, 0.24, uLeafHeightNorm);
      float shadowStrength = mix(0.68, 0.16, uLeafHeightNorm) * (1.0 - smoothstep(0.45, 0.72, uPortalProgress));
      float leafShadow = 1.0 - exp(-dot(shVec, shVec) / (shadowRadius * shadowRadius)) * shadowStrength;

      // Low-key obsidian nocturnal grading (preserves deep darkness while letting lake mirror & pine reflections read)
      float nightLighting = (0.075 + beam * 0.42) * lakeVignette * skyNightFade * leafShadow;
      vec3 darkMirror = lakeSample * vec3(0.70, 0.84, 0.88) * nightLighting;

      // Moonlit silver-lichen highlights along expanding concentric lake ripple crests
      vec3 crestTint = vec3(0.54, 0.63, 0.60);
      vec3 crestGlow = crestTint * ringHighlight * (0.24 + beam * 0.34) * lakeVignette;

      // Subtle nocturnal horizon reflection on still black water
      vec3 moonMist = vec3(0.09, 0.12, 0.12) * (0.14 + beam * 0.24) * waterZone * leafShadow;

      sceneAColor = max(sceneAColor, darkMirror + crestGlow + moonMist);
    }

    // =========================================================================
    // SLOW, SMOOTH PORTAL FRONTIER EXPANDING ACROSS FULL LAKE CORNERS
    // =========================================================================
    float noiseField = fbm(screenUv * 3.2 + vec2(uTime * 0.028, -uTime * 0.022));
    vec2 pVec = screenUv - uImpactOrigin;
    pVec.x *= screenAspect;
    float radialDist = length(pVec);
    float organicFrontier = radialDist + (noiseField - 0.5) * 0.28;

    float threshold = mix(-0.24, 1.24, uPortalProgress);
    float portalMask = 1.0 - smoothstep(threshold - 0.26, threshold + 0.26, organicFrontier);
    float rim = smoothstep(0.0, 0.5, portalMask) * (1.0 - smoothstep(0.5, 1.0, portalMask));

    // =========================================================================
    // SCENE B: Photographed Multi-Depth Forest World (Depth Parallax + Fog)
    // =========================================================================
    vec3 sceneBColor = vec3(0.0196, 0.0235, 0.0196);

    if (uForestReady > 0.5 && uPortalProgress > 0.005) {
      vec2 baseB = (screenUv - 0.5);
      baseB = rotate2d(baseB, uSettleRollRad) / max(0.5, uSettleScale) + 0.5;
      vec2 forestUv = coverUv(baseB, screenAspect, uTexAspect);

      vec3 roughMid = texture2D(uTexForestMid, clamp(forestUv, 0.0, 1.0)).rgb;
      float midLuma = dot(roughMid, vec3(0.299, 0.587, 0.114));
      float estimatedDepth = clamp(forestUv.y * 0.48 + smoothstep(0.14, 0.72, midLuma) * 0.52, 0.0, 1.0);

      vec2 parallaxOffset = uMouse * (1.0 - estimatedDepth) * 0.024;
      float frontierPulse = rim * sin(uPortalProgress * 3.14159265);
      vec2 liquidRefraction = vec2(noiseField - 0.5, fbm(screenUv * 3.6 + vec2(3.1, -1.7)) - 0.5) * frontierPulse * 0.032;
      vec2 gentleBreathing = (screenUv - 0.5) * ((1.0 - uPortalProgress) * 0.032);
      vec2 finalForestUv = clamp(forestUv - parallaxOffset - gentleBreathing + liquidRefraction, 0.0, 1.0);

      vec3 midColor = texture2D(uTexForestMid, finalForestUv).rgb;
      vec2 farUv = clamp(forestUv - uMouse * 0.006, 0.0, 1.0);
      vec3 farColor = texture2D(uTexForestFar, farUv).rgb;

      float canopyGap = smoothstep(0.42, 0.86, midLuma) * smoothstep(0.35, 0.85, forestUv.y);
      sceneBColor = mix(midColor, mix(midColor, farColor * 1.04, 0.42), canopyGap);

      float sunDist = length((finalForestUv - vec2(0.56, 0.64)) * vec2(uTexAspect, 1.0));
      float sunHaze = exp(-sunDist * sunDist * 3.8) * uHazeOpacity * 0.14;
      sceneBColor += vec3(0.92, 0.86, 0.74) * sunHaze;
    }

    // Soft mist-weighted liquid frontier between the nocturnal lake and sunlit forest
    vec3 composited = mix(sceneAColor, sceneBColor, portalMask);
    composited *= (1.0 - rim * 0.22 * sin(uPortalProgress * 3.14159265));
    composited = mix(composited, vec3(0.015, 0.019, 0.016), clamp(uDarknessVeil, 0.0, 1.0));

    gl_FragColor = vec4(composited, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const LEAF_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uFallFlutter;

  varying vec2 vUv;
  varying vec3 vModelPos;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Gentle natural botanical curvature along midrib & margins (relaxes flat on water contact)
    float dx = uv.x - 0.5;
    float dy = uv.y - 0.5;
    float camber = (0.042 * cos(dx * 3.14159265) - 0.048 * (dy * dy * 4.0)) * (0.2 + 0.8 * uFallFlutter);
    float flutter = sin(uTime * 2.3 + uv.x * 5.2 + uv.y * 2.4) * 0.016 * uFallFlutter;
    pos.z += camber + flutter;

    vModelPos = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const LEAF_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform sampler2D uTexLeaf;
  uniform float uLeafReady;
  uniform float uOpacity;
  uniform float uLightIntensity;
  uniform float uHeightNorm;

  varying vec2 vUv;
  varying vec3 vModelPos;

  void main() {
    if (uLeafReady < 0.5 || uOpacity <= 0.005) discard;

    vec3 texel = texture2D(uTexLeaf, vUv).rgb;
    float lumC = dot(texel, vec3(0.299, 0.587, 0.114));

    vec2 texStep = vec2(1.0 / 960.0, 1.0 / 540.0);
    float lumL = dot(texture2D(uTexLeaf, clamp(vUv - vec2(texStep.x, 0.0), 0.0, 1.0)).rgb, vec3(0.299, 0.587, 0.114));
    float lumR = dot(texture2D(uTexLeaf, clamp(vUv + vec2(texStep.x, 0.0), 0.0, 1.0)).rgb, vec3(0.299, 0.587, 0.114));
    float lumD = dot(texture2D(uTexLeaf, clamp(vUv - vec2(0.0, texStep.y), 0.0, 1.0)).rgb, vec3(0.299, 0.587, 0.114));
    float lumU = dot(texture2D(uTexLeaf, clamp(vUv + vec2(0.0, texStep.y), 0.0, 1.0)).rgb, vec3(0.299, 0.587, 0.114));

    // Botanical silhouette extraction keyed on warm olive/ochre leaf pigment (strips out cool water meniscus arcs)
    vec2 ell = (vUv - vec2(0.485, 0.502)) / vec2(0.248, 0.198);
    float ellDist = length(ell);
    float outerBounds = 1.0 - smoothstep(0.82, 1.0, ellDist);
    float innerCore = 1.0 - smoothstep(0.26, 0.54, ellDist);

    float warmth = max(0.0, texel.r + texel.g - 1.72 * texel.b);
    float oliveLift = max(0.0, texel.g - texel.b);
    float matterSignal = warmth * 1.45 + oliveLift * 0.9 + lumC * 0.26;
    float keyAlpha = smoothstep(0.044, 0.125, matterSignal);

    float alpha = clamp(max(keyAlpha, innerCore * 0.96) * outerBounds, 0.0, 1.0) * uOpacity;
    if (alpha <= 0.01) discard;

    // Relief normals for moonlight grazing across leaf veins & dew beads
    vec3 surfN = normalize(vec3((lumL - lumR) * 7.2, (lumD - lumU) * 7.2, 1.0));
    vec3 lightDir = normalize(vec3(-0.32, 0.48, 0.82));
    float ndotl = max(0.0, dot(surfN, lightDir));
    vec3 halfVec = normalize(lightDir + vec3(0.0, 0.0, 1.0));

    float avgNeighbor = (lumL + lumR + lumD + lumU) * 0.25;
    float moistureMask = clamp((lumC - avgNeighbor) * 14.0 + smoothstep(0.28, 0.55, lumC) * 0.45, 0.0, 1.0);
    float spec = pow(max(0.0, dot(surfN, halfVec)), 28.0) * moistureMask * (0.35 + uLightIntensity * 0.75);

    // Subtle cool-silver moonlight edge catch when falling high in the dark sky
    float airHighlight = (0.34 + 0.66 * uLightIntensity) * (0.65 + ndotl * 0.85);
    vec3 leafColor = texel * airHighlight + vec3(0.86, 0.89, 0.84) * spec;

    // Soften bottom edge meniscus slightly while airborne so edge reads crisp against dark water
    float meniscusBlend = mix(0.92, 1.0, 1.0 - uHeightNorm);
    gl_FragColor = vec4(leafColor * meniscusBlend, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const MOTES_VERTEX_SHADER = /* glsl */ `
  attribute float aPhase;
  attribute float aScale;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uPixelRatio;

  varying float vAlpha;

  void main() {
    vec3 pos = position;
    pos.x += sin(uTime * 0.25 + aPhase) * 0.06;
    pos.y += cos(uTime * 0.19 + aPhase * 1.7) * 0.05;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPos;
    gl_PointSize = aScale * uPixelRatio * (2.4 / max(0.5, -mvPos.z));

    float twinkle = 0.55 + 0.45 * sin(uTime * 0.9 + aPhase * 3.1);
    vAlpha = uOpacity * twinkle;
  }
`;

export const MOTES_FRAGMENT_SHADER = /* glsl */ `
  precision mediump float;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    float soft = smoothstep(0.5, 0.05, d);
    if (soft <= 0.01) discard;
    gl_FragColor = vec4(0.93, 0.90, 0.81, soft * vAlpha * 0.38);
  }
`;
