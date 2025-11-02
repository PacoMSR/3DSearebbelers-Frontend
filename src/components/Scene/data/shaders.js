import glsl from "babel-plugin-glsl/macro";

// rain
export const rainVertexShader = glsl`
  #ifdef GL_ES
  precision highp float;
  #endif
  
  varying vec3 v_position;
  varying vec3 v_normal;
  varying vec2 v_coord;
  varying float v_intensity;
    
  uniform float u_time;
  uniform vec2 u_wind_dir;
  uniform float u_wind_speed;
  uniform float u_rain_speed;
  uniform float u_rain_density;
  
  void main() {
    vec3 vertex = position;
    vertex.xz -= u_wind_speed * u_wind_dir * vertex.y;
    
    v_position = (modelMatrix * vec4(vertex,1.0)).xyz;
    v_normal = (modelMatrix * vec4(normal,0.0)).xyz;
    v_coord = uv;
    
    float factor = sin(position.x * 0.1) * 0.1 + cos(position.z * 0.1) * 0.2;
    v_coord.y -= u_time * u_rain_speed + factor;
    v_intensity = mix(factor, 1.0, u_rain_density);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(vertex,1.0);
  }
`;

export const rainFragmentShader = glsl`
  precision highp float;

  varying vec3 v_normal;
  varying vec2 v_coord;
  varying vec3 v_position;
  
  varying float v_intensity;

  uniform vec3 u_skycolor;
  uniform vec3 u_color;
  
  uniform sampler2D u_color_texture;

  void main() {
    vec3 N = normalize(v_normal);
    vec3 E = (v_position - cameraPosition);
    float dist = length(E);
    E /= dist;
    vec4 final_color = texture2D( u_color_texture, v_coord );
    final_color = vec4( u_color * u_skycolor, final_color.x );
    float fresnel = pow(abs(dot(E,N)),2.0);
    final_color.a *= fresnel * v_intensity;
    
    if(final_color.a < 0.01)
      discard;

      gl_FragColor = final_color;
    }  
`;

// clouds
export const cloudVertexShader = glsl`
  precision mediump float;

  varying vec2 vUv;
  varying vec3 vPos;
  
  uniform float uTime;
  uniform float u_wind_speed;
  uniform vec2 u_wind_dir;

  void main() {
    vec3 vertex = position;
    vPos = (modelMatrix * vec4(vertex, 1.0)).xyz;

    float cloudSpeed = uTime * 0.1 * u_wind_speed;
    vUv = uv - (u_wind_dir * cloudSpeed);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(vertex, 1.0);
  }
`;

export const cloudFragmentShader = glsl`
precision mediump float;

varying vec2 vUv;
varying vec3 vPos;

uniform float uCover;
uniform sampler2D u_texture;

void main() {
  float dist = length(vPos - cameraPosition) / 500.0;

  vec3 color = texture2D(u_texture, vUv).rgb;
  float alpha = color.x * uCover;
  alpha *= (1.0 - dist); // clip distance
  alpha = clamp(alpha, 0.0, 1.0); // avoid negative values
  // color = min(color * 2.0, 1.0);
  color = vec3(0.8);
  gl_FragColor = vec4(color, alpha);
}
`;

// skybox
export const skyVertexShader = glsl`

  varying vec3 vWorldPosition;
  
  #include <fog_pars_vertex>
  
  void main()
  {
    #include <begin_vertex> // transformed = position
    #include <project_vertex> // gl_Position = project * mv * transformed

    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    #include <fog_vertex>
  }
`;

export const skyFragmentShader = glsl`
  precision highp float;  
  
  // Based on "A Practical Analytic Model for Daylight" aka The Preetham Model, the de facto standard analytic skydome model
  // http://www.cs.utah.edu/~shirley/papers/sunsky/sunsky.pdf
  // Original implementation by Simon Wallner: http://www.simonwallner.at/projects/atmospheric-scattering
  // Improved by Martin Upitis: http://blenderartists.org/forum/showthread.php?245954-preethams-sky-impementation-HDR
  // Three.js integration by zz85: http://twitter.com/blurspline / https://github.com/zz85 / http://threejs.org/examples/webgl_shaders_sky.html
  // Additional uniforms, refactoring and integrated with editable sky example: https://twitter.com/Sam_Twidale / https://github.com/Tw1ddle/Sky-Particles-Shader

  varying vec3 vWorldPosition;

  uniform float depolarizationFactor;
  uniform float luminance;
  uniform float mieCoefficient;
  uniform float mieDirectionalG;
  uniform vec3 mieKCoefficient;
  uniform float mieV;
  uniform float mieZenithLength;
  uniform float numMolecules;
  uniform vec3 primaries;
  uniform float rayleigh;
  uniform float rayleighZenithLength;
  uniform float refractiveIndex;
  uniform float sunAngularDiameterDegrees;
  uniform float sunIntensityFactor;
  uniform float sunIntensityFalloffSteepness;
  uniform vec3 sunPosition;
  uniform float tonemapWeighting;
  uniform float turbidity;

  #include <fog_pars_fragment>

  const float PI = 3.141592653589793238462643383279502884197169;
  const vec3 UP = vec3(0.0, 1.0, 0.0);

  vec3 totalRayleigh(vec3 lambda)
  {
    return (8.0 * pow(PI, 3.0) * pow(pow(refractiveIndex, 2.0) - 1.0, 2.0) * (6.0 + 3.0 * depolarizationFactor)) / (3.0 * numMolecules * pow(lambda, vec3(4.0)) * (6.0 - 7.0 * depolarizationFactor));
  }

  vec3 totalMie(vec3 lambda, vec3 K, float T)
  {
    float c = 0.2 * T * 10e-18;
    return 0.434 * c * PI * pow((2.0 * PI) / lambda, vec3(mieV - 2.0)) * K;
  }

  float rayleighPhase(float cosTheta)
  {
    return (3.0 / (16.0 * PI)) * (1.0 + pow(cosTheta, 2.0));
  }

  float henyeyGreensteinPhase(float cosTheta, float g)
  {
    return (1.0 / (4.0 * PI)) * ((1.0 - pow(g, 2.0)) / pow(1.0 - 2.0 * g * cosTheta + pow(g, 2.0), 1.5));
  }

  float sunIntensity(float zenithAngleCos)
  {
    float cutoffAngle = PI / 1.95; // Earth shadow hack
    return sunIntensityFactor * max(0.0, 1.0 - exp(-((cutoffAngle - acos(zenithAngleCos)) / sunIntensityFalloffSteepness)));
  }

  // Whitescale tonemapping calculation, see http://filmicgames.com/archives/75
  // Also see http://blenderartists.org/forum/showthread.php?321110-Shaders-and-Skybox-madness
  const float A = 0.15; // Shoulder strength
  const float B = 0.50; // Linear strength
  const float C = 0.10; // Linear angle
  const float D = 0.20; // Toe strength
  const float E = 0.02; // Toe numerator
  const float F = 0.30; // Toe denominator
  vec3 Uncharted2Tonemap(vec3 W)
  {
    return ((W * (A * W + C * B) + D * E) / (W * (A * W + B) + D * F)) - E / F;
  }

  void main()
  {
    if (cameraPosition.y < 0.5 && vWorldPosition.y < 2.0) discard; // do not render if underwater

    // Rayleigh coefficient
    float sunfade = 1.0 - clamp(1.0 - exp((sunPosition.y / 450000.0)), 0.0, 1.0);
    float rayleighCoefficient = rayleigh - (1.0 * (1.0 - sunfade));
    vec3 betaR = totalRayleigh(primaries) * rayleighCoefficient;
    
    // Mie coefficient
    vec3 betaM = totalMie(primaries, mieKCoefficient, turbidity) * mieCoefficient;
    
    // Optical length, cutoff angle at 90 to avoid singularity
    float zenithAngle = acos(max(0.0, dot(UP, normalize(vWorldPosition)))); // box static independent of cameraPos
    float denom = cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / PI), -1.253);
    float sR = rayleighZenithLength / denom;
    float sM = mieZenithLength / denom;
    
    // Combined extinction factor
    vec3 Fex = exp(-(betaR * sR + betaM * sM));
    
    // In-scattering
    vec3 sunDirection = normalize(sunPosition);
    float cosTheta = dot(normalize(vWorldPosition), sunDirection);
    vec3 betaRTheta = betaR * rayleighPhase(cosTheta * 0.5 + 0.5);
    vec3 betaMTheta = betaM * henyeyGreensteinPhase(cosTheta, mieDirectionalG);
    float sunE = sunIntensity(dot(sunDirection, UP));
    vec3 Lin = pow(sunE * ((betaRTheta + betaMTheta) / (betaR + betaM)) * (1.0 - Fex), vec3(1.5));
    Lin *= mix(vec3(1.0), pow(sunE * ((betaRTheta + betaMTheta) / (betaR + betaM)) * Fex, vec3(0.5)), clamp(pow(1.0 - dot(UP, sunDirection), 5.0), 0.0, 1.0));
    
    // Composition + solar disc
    float sunAngularDiameterCos = cos(sunAngularDiameterDegrees);
    float sundisk = smoothstep(sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta);
    sundisk = sundisk * sunPosition.y;
    vec3 L0 = vec3(0.1) * Fex;
    L0 += sunE * 19000.0 * Fex * sundisk;
    vec3 texColor = Lin + L0;
    texColor *= 0.04;
    texColor += vec3(0.0, 0.001, 0.0025) * 0.3;
    
    // Tonemapping
    vec3 whiteScale = 1.0 / Uncharted2Tonemap(vec3(tonemapWeighting));
    vec3 curr = Uncharted2Tonemap((log2(2.0 / pow(luminance, 4.0))) * texColor);
    vec3 color = curr * whiteScale;
    vec3 retColor = pow(color, vec3(1.0 / (1.2 + (1.2 * sunfade))));

    gl_FragColor = vec4(retColor, 1.0);
  }
`;

// coastline
export const coastVertex = /* glsl */ `

  varying vec2 vUv;
  varying vec4 vWorldPosition;
  
  void main() {
    vUv = uv;
    vWorldPosition = modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  
  `;

export const coastFragment = /* glsl */ `
  
  varying vec2 vUv;
  varying vec4 vWorldPosition;

  uniform sampler2D coastmap;

  void main() {
    vec4 color = texture2D(coastmap, vUv);

    if (color.a < 0.1) discard;
    gl_FragColor = color;
  }
  
  `;

// quad - image
export const quadVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vertex;

  uniform float imageRatio;
  uniform float screenRatio;

  void main() {
    vUv = uv;
    vertex = position * vec3(2.0); // position de [-0.5, 0.5] -> vertex de [-1,1]

    float xScale = 1.0;
    float yScale = 1.0;

    if ( imageRatio > screenRatio ){
      yScale = screenRatio / imageRatio;
    } else{
      xScale = imageRatio / screenRatio;
    }

    vertex = vertex * vec3(xScale, yScale, 0.0);

    gl_Position = vec4(vertex, 1.0);
  }
  `;

export const quadFragment = /* glsl */ `
  varying vec2 vUv;
  
  uniform sampler2D map;
  uniform float imageRatio;
  uniform float screenRatio;
  
  void main() {
    vec2 uv = vUv;

    vec3 color = texture2D(map, uv).rgb;
    gl_FragColor = vec4(color, 1.0);
  }
`;

// fog - underwater
export const fogParsVertex = /* glsl */ `
  #ifdef USE_FOG
    varying float vFogDepth;
    varying vec4 vWPosition;
  #endif
`;

export const fogVertex = /* glsl */ `
  #ifdef USE_FOG
    vFogDepth = - mvPosition.z;
    vWPosition = modelMatrix * vec4(transformed, 1.0);
  #endif
`;

export const fogParsFrag = /* glsl */ `
    #ifdef USE_FOG
    
    
    uniform vec3 fogColor;
    uniform vec3 surfaceFogColor;
    varying float vFogDepth;
    varying vec4 vWPosition;
  
    #ifdef FOG_EXP2
      uniform float fogDensity;
  
    #else
      uniform float fogNear;
      uniform float fogFar;
    
    #endif
  #endif
`;

export const fogFrag = /* glsl */ `
  #ifdef USE_FOG

    vec3 blue = vec3(0.05098, 0.08627, 0.56471); // blue color
    vec3 fogCol = fogColor;
    float fogDens = fogDensity;

    if (cameraPosition.y > 0.0) fogDens = 0.0;

    #ifdef FOG_EXP2
      float fogFactor = 1.0 - exp( - fogDens * fogDens * vFogDepth * vFogDepth );
  
    #else
      float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );

    #endif
    
    gl_FragColor.rgb = mix( gl_FragColor.rgb, fogCol, fogFactor );
  
#endif
`;
