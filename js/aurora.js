// js/aurora.js
(function () {

   const isTablet = document.documentElement.classList.contains('tablet');
  const OGL = window.OGL || window.ogl;

  if (!OGL) {
    console.error('[Aurora] window.OGL è undefined. Controlla lo <script src="https://cdn.jsdelivr.net/npm/ogl@0.0.104/dist/ogl.umd.js"> e l\'ordine degli script.');
    return;
  }

  const { Renderer, Program, Mesh, Color, Triangle } = OGL;

  const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

  const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v){
  const vec4 C = vec4(
      0.211324865405187, 0.366025403784439,
      -0.577350269189626, 0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
      0.5 - vec3(
          dot(x0, x0),
          dot(x12.xy, x12.xy),
          dot(x12.zw, x12.zw)
      ), 
      0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop {
  vec3 color;
  float position;
};

#define COLOR_RAMP(colors, factor, finalColor) {              \
  int index = 0;                                            \
  for (int i = 0; i < 2; i++) {                               \
     ColorStop currentColor = colors[i];                    \
     bool isInBetween = currentColor.position <= factor;    \
     index = int(mix(float(index), float(i), float(isInBetween))); \
  }                                                         \
  ColorStop currentColor = colors[index];                   \
  ColorStop nextColor = colors[index + 1];                  \
  float range = nextColor.position - currentColor.position; \
  float lerpFactor = (factor - currentColor.position) / range; \
  finalColor = mix(currentColor.color, nextColor.color, lerpFactor); \
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  
  ColorStop colors[3];
  colors[0] = ColorStop(uColorStops[0], 0.0);
  colors[1] = ColorStop(uColorStops[1], 0.5);
  colors[2] = ColorStop(uColorStops[2], 1.0);
  
  vec3 rampColor;
  COLOR_RAMP(colors, uv.x, rampColor);
  
  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height;
  
  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);
  
  vec3 auroraColor = intensity * rampColor;
  
  fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
}
`;

  const defaultOptions = {
    colorStops: ['#E50914', '#B81D24', '#3B0B5E'],
    amplitude: 1.0,
    blend: 0.5,
    speed: 0.5
  };

  function hexStopsToVec3(colorStops) {
    return colorStops.map((hex) => {
      const c = new Color(hex);
      return [c.r, c.g, c.b];
    });
  }

  function createAuroraBackground(container, opts = {}) {
    const options = { ...defaultOptions, ...opts };

    const renderer = new Renderer({
      alpha: true,
      premultipliedAlpha: true,
      antialias: true
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.canvas.style.backgroundColor = 'transparent';

    const geometry = new Triangle(gl);
    if (geometry.attributes.uv) {
      delete geometry.attributes.uv;
    }

    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: options.amplitude },
        uColorStops: { value: hexStopsToVec3(options.colorStops) },
        uResolution: { value: [1, 1] },
        uBlend: { value: options.blend }
      }
    });

    const mesh = new Mesh(gl, { geometry, program });
    container.appendChild(gl.canvas);

        function resize() {
      const width = container.offsetWidth;
      const height = container.offsetHeight;

      // iPad/tablet -> qualità più alta, PC -> qualità più bassa
      const baseScale = isTablet ? 0.9 : 0.45;  // prova 0.4–0.6 se serve
      const scale = Math.max(0.35, Math.min(baseScale, 1));

      const rw = Math.floor(width * scale);
      const rh = Math.floor(height * scale);

      // risoluzione del render (più piccola su PC)
      renderer.setSize(rw, rh);
      program.uniforms.uResolution.value = [rw, rh];

      // ma il canvas a schermo resta full-size
      const canvas = renderer.gl.canvas;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
    }


    window.addEventListener('resize', resize);
    resize();

    let frameId;
    let start = performance.now();
    let lastFrame = 0;

    const maxFps = isTablet ? 60 : 30; // iPad 60fps, PC 30fps
    const frameInterval = 1000 / maxFps;

    function update(now) {
      frameId = requestAnimationFrame(update);

      // salta i frame troppo ravvicinati (limita gli FPS)
      if (now - lastFrame < frameInterval) return;
      lastFrame = now;

      const t = (now - start) * 0.001; // secondi
      program.uniforms.uTime.value = t * options.speed;
      renderer.render({ scene: mesh });
    }
    frameId = requestAnimationFrame(update);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // ferma il loop quando la tab è in background
        cancelAnimationFrame(frameId);
      } else {
        // resetta il tempo e riparti
        start = performance.now();
        lastFrame = 0;
        frameId = requestAnimationFrame(update);
      }
    });


    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      if (gl.canvas.parentNode === container) {
        container.removeChild(gl.canvas);
      }
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    const ctn = document.querySelector('.aurora-container');
    if (!ctn) return;

    const isSmallScreen = window.innerWidth < 768;
  if (isSmallScreen) {
    // niente aurora su mobile
    return;
  }

    createAuroraBackground(ctn, {
      // se vuoi cambiare i colori:
      // colorStops: ['#5227FF', '#7CFF67', '#5227FF'],
      amplitude: 1.0,
      blend: 0.5,
      speed: 0.5
    });
  });
})();
