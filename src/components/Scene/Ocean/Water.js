import {
  Mesh,
  Vector3,
  Color,
  FrontSide,
  Plane,
  Matrix4,
  Vector4,
  PerspectiveCamera,
  WebGLRenderTarget,
  UniformsUtils,
  UniformsLib,
  ShaderMaterial,
  Vector2,
} from "three";
import glsl from "babel-plugin-glsl/macro";

/*
 * Work based on :
 * https://github.com/Slayvin: Flat mirror for three.js
 * https://home.adelphi.edu/~stemkoski/ : An implementation of water shader based on the flat mirror
 * http://29a.ch/ && http://29a.ch/slides/2012/webglwater/ : Water shader explanations in WebGL
 */

class Water extends Mesh {
  constructor(geometry, options = {}) {
    super(geometry);
    const scope = this; // mesh
    // mirror texture size
    const textureWidth =
      options.textureWidth !== undefined ? options.textureWidth : 512;
    const textureHeight =
      options.textureHeight !== undefined ? options.textureHeight : 512;
    // clip mirror texture
    const clipBias = options.clipBias !== undefined ? options.clipBias : 0.0;
    const alpha = options.alpha !== undefined ? options.alpha : 1.0;
    const time = options.time !== undefined ? options.time : 0.0;
    const normalSampler =
      options.waterNormals !== undefined ? options.waterNormals : null;
    const sunDirection =
      options.sunDirection !== undefined
        ? options.sunDirection
        : new Vector3(0.70707, 0.70707, 0.0);
    const sunColor = new Color(
      options.sunColor !== undefined ? options.sunColor : 0xffffff
    );
    const waterColor = new Color(
      options.waterColor !== undefined ? options.waterColor : 0x7f7f7f
    );
    const eye = options.eye !== undefined ? options.eye : new Vector3(0, 0, 0);
    const distortionScale =
      options.distortionScale !== undefined ? options.distortionScale : 20.0;
    const side = options.side !== undefined ? options.side : FrontSide;
    const fog = options.fog !== undefined ? options.fog : false;
    const waves = options.waves !== undefined ? options.waves : [];
    const windSpeed = options.windSpeed !== undefined ? options.windSpeed : 1.0;
    const windDirection =
      options.windDirection !== undefined
        ? options.windDirection
        : new Vector2(0, 0);
    const boatDirection =
      options.boatDirection !== undefined
        ? options.boatDirection
        : new Vector2(1, 0);
    const boatSpeed = options.boatSpeed !== undefined ? options.boatSpeed : 1.0;
    const boatScale =
      options.boatScale !== undefined ? options.boatScale : new Vector2(20.0);
    const boatLength =
      options.boatLength !== undefined ? options.boatLength : 0.5;
    const fogFactor = options.fogFactor !== undefined ? options.fogFactor : 1.0;
    const useNormals =
      options.useNormals !== undefined ? options.useNormals : false;
    const u_foam_texture =
      options.u_foam_texture !== undefined ? options.u_foam_texture : null;
    const u_trail_texture =
      options.u_trail_texture !== undefined ? options.u_trail_texture : null;
    const u_perlin_texture =
      options.u_perlin_texture !== undefined ? options.u_perlin_texture : null;
    const angle = options.angle !== undefined ? options.angle : 0.0;

    const mirrorPlane = new Plane(); // geometry for mirror reflection
    const normal = new Vector3(); // plane normals
    const mirrorWorldPosition = new Vector3(); // plane position
    const cameraWorldPosition = new Vector3(); // reflection camera position
    const rotationMatrix = new Matrix4();
    const lookAtPosition = new Vector3(0, 0, -1);
    const clipPlane = new Vector4();
    const view = new Vector3();
    const target = new Vector3();
    const q = new Vector4();
    const textureMatrix = new Matrix4();
    const mirrorCamera = new PerspectiveCamera();
    const renderTarget = new WebGLRenderTarget(textureWidth, textureHeight);
    const mirrorShader = {
      uniforms: UniformsUtils.merge([
        UniformsLib["fog"],
        UniformsLib["lights"],
        {
          normalSampler: {
            value: null,
          },
          mirrorSampler: {
            value: null,
          },
          alpha: {
            value: 1.0,
          },
          time: {
            value: 0.0,
          },
          size: {
            value: 1.0,
          },
          distortionScale: {
            value: 20.0,
          },
          textureMatrix: {
            value: new Matrix4(),
          },
          sunColor: {
            value: new Color(0x7f7f7f),
          },
          sunDirection: {
            value: new Vector3(0.70707, 0.70707, 0),
          },
          eye: {
            value: new Vector3(),
          },
          waterColor: {
            value: new Color(0x555555),
          },
          waves: {
            value: [],
            properties: {
              k: 1.0,
              speed: 1.0,
              amp: 1.0,
              wave_dir: { type: "v2", value: new Vector2() },
            },
          },
          windSpeed: {
            value: 1.0,
          },
          windDirection: {
            value: new Vector2(),
          },
          boatDirection: {
            value: new Vector2(),
          },
          boatSpeed: {
            value: 1.0,
          },
          boatScale: {
            value: new Vector2(),
          },
          boatLength: {
            value: 0.5,
          },
          fogFactor: {
            value: 1.0,
          },
          useNormals: {
            value: false,
          },
          u_foam_texture: {
            value: null,
          },
          u_trail_texture: {
            value: null,
          },
          u_perlin_texture: {
            value: null,
          },
          angle: {
            value: 0.0,
          },
        },
      ]),
      vertexShader: glsl`
        varying vec4 mirrorCoord;
        varying vec4 worldPosition;
        varying vec3 vViewPosition;
        varying float vHeight;
        varying vec3 objectNorm;
        varying mat3 TBN;

        #include <common> // defines, structs, functions
        #include <normal_pars_vertex> // vNormal
        #include <shadowmap_pars_vertex>
        #include <logdepthbuf_pars_vertex>
        #include <fog_pars_vertex>
        
        #pragma glslify: snoise3 = require(glsl-noise/simplex/3d);
        
        // gerstner waves
        struct Wave {
          float amp; // amplitude = steepness / k
          float k; // 2pi / wavelength
          float speed; // wave speed
          vec2 wave_dir; // wave direction
        };
        
        uniform Wave waves[3];
        uniform mat4 textureMatrix;
        uniform float time;
        uniform vec2 windDirection;
        uniform vec2 boatDirection;
        uniform float boatSpeed;
        
        vec3 miniGestnerWave(Wave wave, vec3 vertex) {
          vec2 dir = normalize(wave.wave_dir) + vec2(0.01);
          float steepness = wave.k * wave.amp;
          float f = wave.k * (dot(dir, vertex.xz) - time * wave.speed);

          // gerstner wave
          return vec3(dir.x * wave.amp * cos(f), wave.amp * sin(f), dir.y * wave.amp * cos(f));
        }
        
        vec3 gestnerWave(Wave wave, vec3 vertex, inout vec3 tangent, inout vec3 binormal) {
          vec2 dir = normalize(cross(vec3(wave.wave_dir, 1.0), vec3(-boatDirection, 1.0)).xy + vec2(0.1));
          float steepness = wave.k * wave.amp;
          float f = wave.k * (dot(dir, vertex.xz) - time * wave.speed * boatSpeed);
          
          tangent += vec3(
            - dir.x * dir.x * steepness * sin(f),
            dir.x * steepness * cos(f),
            - dir.x * dir.y * steepness * sin(f)
          ); // x axis
          tangent = normalize(tangent);
          
          binormal += vec3(
            - dir.x * dir.y * steepness * sin(f),
            dir.y * steepness * cos(f),
            - dir.y * dir.y * steepness * sin(f)
          ); // z axis
          binormal = normalize(binormal);
              
          // gerstner wave
          return vec3(dir.x * wave.amp * cos(f), wave.amp * sin(f), dir.y * wave.amp * cos(f));
        }
        
        void main() {
          #include <beginnormal_vertex> // objnorm = normal
          #include <begin_vertex> // transformed = position

          // gerstner waves
          vec3 tangent = vec3(1.0, 0.0, 0.0); // Tx
          vec3 binormal = vec3(0.0, 0.0, 1.0); // Tz
          
          // three main waves
          transformed += gestnerWave(waves[0], position, tangent, binormal);
          transformed += gestnerWave(waves[1], position, tangent, binormal);
          transformed += gestnerWave(waves[2], position, tangent, binormal);

          // attenuate by distance
          // + some small noise to break repetition
          transformed.y += 0.05 * snoise3(vec3(transformed.x, transformed.z, 1.0));

          // normals
          objectNormal = normalize(cross(binormal, tangent));
          objectNorm = objectNormal;
          
          // Model TBN Matrix
          TBN = mat3(tangent, binormal, objectNormal);
          
          #include <defaultnormal_vertex> // transnorm = normalmat * objnorm
          #include <normal_vertex> // vNormal = transnorm
          #include <project_vertex> // gl_Position = project * mv * transformed
          
          mirrorCoord = modelMatrix * vec4(transformed, 1.0 );
					worldPosition = mirrorCoord.xyzw;
					mirrorCoord = textureMatrix * mirrorCoord;
          
          vViewPosition = - mvPosition.xyz;
          vHeight = transformed.y; // wave height (for foam)
          
          #include <worldpos_vertex> // model * transformed
          
          #include <logdepthbuf_vertex>
          #include <shadowmap_vertex>
          #include <fog_vertex>
			  }`,

      fragmentShader: glsl`
				uniform sampler2D mirrorSampler;
				uniform float alpha;
				uniform float time;
				uniform float size;
				uniform float distortionScale;
				uniform sampler2D normalSampler;
				uniform vec3 sunColor;
				uniform vec3 sunDirection;
				uniform vec3 eye;
				uniform vec3 waterColor;
        
        uniform float boatSpeed;
        uniform vec2 boatDirection;
        uniform vec2 boatScale;
        uniform float boatLength;
        uniform float windSpeed;
        uniform float fogFactor;
        uniform bool useNormals;
				uniform sampler2D u_foam_texture;
				uniform sampler2D u_trail_texture;
				uniform sampler2D u_perlin_texture;
				uniform float angle;
        
        varying vec4 mirrorCoord;
        varying vec3 vViewPosition;
        varying vec4 worldPosition;
        varying float vHeight; // wave height factor
        varying vec3 objectNorm; // normals in world space
        varying mat3 TBN; // tangent, binormal, normal matrix
        
        // get noise from normalmap
				vec4 getNoise4( vec2 uv, float t, sampler2D text ) {
					vec2 uv0 = ( uv / 103.0 ) + vec2(t / 17.0, t / 29.0) * boatDirection * vec2(-1,1);
					vec2 uv1 = uv / 107.0 - vec2( t / -19.0, t / 31.0 ) * boatDirection * vec2(-1,1);
					vec2 uv2 = uv / vec2( 8907.0, 9803.0 ) + vec2( t / 101.0, t / 97.0 ) * boatDirection * vec2(-1,1);
					vec2 uv3 = uv / vec2( 1091.0, 1027.0 ) - vec2( t / 109.0, t / -113.0 ) * boatDirection * vec2(-1,1);
					vec4 noise = texture2D( text, uv0 ) +
						texture2D( text, uv1 ) +
						texture2D( text, uv2 ) +
						texture2D( text, uv3 );
					return noise * 0.5 - 1.0;
				}

        // get noise 2D
				vec4 getNoise2( vec2 uv, float t, sampler2D text ) {
					vec2 uv0 = uv + t * boatDirection * vec2(-0.1, 0.1);
					vec2 uv1 = uv - t * boatDirection * vec2(-0.1, -0.1);
					vec4 noise = texture2D( text, uv0 ) *
						texture2D( text, uv1 ).r;
					return noise;
				}

        // get incident light from the sun
				void sunLight( const vec3 surfaceNormal, const vec3 eyeDirection, float shiny, float spec, float diffuse, inout vec3 diffuseColor, inout vec3 specularColor ) {
					vec3 reflection = normalize( reflect( -sunDirection, surfaceNormal ) );
					float direction = max( 0.0, dot( eyeDirection, reflection ) );
					specularColor += pow( direction, shiny ) * sunColor * spec;
					diffuseColor += max( dot( sunDirection, surfaceNormal ), 0.0 ) * sunColor * diffuse;
				}

				#include <common>
				#include <packing>
				#include <bsdfs>
				#include <logdepthbuf_pars_fragment>
				#include <lights_pars_begin>
				#include <shadowmap_pars_fragment>
				#include <shadowmask_pars_fragment>
				#include <fog_pars_fragment>

				void main() {
					#include <logdepthbuf_fragment>
					vec4 noise = getNoise4( worldPosition.xz * size , time * windSpeed * boatSpeed, normalSampler );
					vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );
          
          // combine normals
          vec3 normal = surfaceNormal; // chosen for artistic reasons
          if (useNormals) {
            normal = surfaceNormal.y * TBN[2] + surfaceNormal.z * TBN[1] + surfaceNormal.x * TBN[0];
            normal = normalize(normal);
          }

          // store light values
					vec3 diffuseLight = vec3(0.0);
					vec3 specularLight = vec3(0.0);

					vec3 worldToEye = eye-worldPosition.xyz;
					vec3 eyeDirection = normalize( worldToEye );
					sunLight( normal, eyeDirection, 100.0, 2.0, 0.5, diffuseLight, specularLight );

					float dist = length(worldToEye);
					float dist_norm = clamp(length(worldPosition) / 350.0, 0.0, 0.8);

          // surface fog 
          float opacity = alpha;
          opacity -= min(1.0, dist * 0.003 * fogFactor); // clip dist
          opacity = clamp(opacity, 0.0, 1.0); // avoid negative values
          if (opacity < 0.01) discard;
    
          // reflection
					vec2 distortion = normal.xz * ( 0.001 + 1.0 / dist ) * distortionScale * dist_norm;
					vec3 reflectionSample = vec3( texture2D( mirrorSampler, mirrorCoord.xy / mirrorCoord.w + distortion ) );

          // reflectance (fresnel)
					float theta = max( dot( eyeDirection, normal ), 0.0 );
					float rf0 = 0.3;
					float reflectance = rf0 + ( 1.0 - rf0 ) * pow( ( 1.0 - theta ), 5.0 );
					
          // scattering
          vec3 scatter = max( 0.0, dot( normal, eyeDirection ) ) * waterColor;
					
          // water color
          vec3 diff = ( sunColor * diffuseLight * 0.3 * waterColor + scatter ) * (getShadowMask() + 0.5) * 0.1;
          vec3 spec = ( vec3( 0.1 ) + reflectionSample * 0.7 * (1.0 - dist_norm) + reflectionSample * specularLight );
          vec3 albedo = mix( diff, spec, reflectance);
          
          // foam trail
          vec2 trail_uv = (worldPosition.xz);
          vec2 forward = normalize(boatDirection); // basis y axis
          vec2 perpendicular = normalize( vec2(forward.y, -forward.x )); // basis x axis
          trail_uv = forward * trail_uv.y + perpendicular * trail_uv.x; // rotate uv's
          trail_uv = trail_uv / vec2(boatScale.x, boatScale.y); // scale
          trail_uv = trail_uv + vec2(0.5, boatLength); // translate to center
          
          vec2 rot_forward = vec2(0.0, 1.0);
          trail_uv = trail_uv + rot_forward * 0.4; // translate to boat cue
          
          // foam
          vec2 foam_uv = worldPosition.xz / 10.0;
          vec3 foam = getNoise2(foam_uv, time * boatSpeed, u_foam_texture).rgb;
          vec3 perlin = getNoise2(foam_uv / 15.0, time * 0.3, u_perlin_texture).rgb * 4.5;
          foam = foam * perlin;
          
          // avoid trail artifacts
          vec3 trail = vec3(0.0);
          if (trail_uv.x > 0.0 && trail_uv.x < 1.0 && trail_uv.y > 0.0 && trail_uv.y < 1.0) {
            trail = texture2D( u_trail_texture, trail_uv).rgb;
            albedo += trail * (foam * 2.5);
          }
          
          // final color
          albedo = mix(albedo, foam, clamp(vHeight * foam.x, 0.0, 0.8)); // simple foam based on wave height
          
          vec3 outgoingLight = albedo;

          if (cameraPosition.y < 0.0) {
            outgoingLight = diff;
            opacity = 1.0;
          } // if underwater, only use diffuse color

          gl_FragColor = vec4(outgoingLight, opacity);
          
          #include <tonemapping_fragment>
          // underwater fog
          if (cameraPosition.y < 0.0) {
            #include <fog_fragment>
          }
        }`,
    };

    const material = new ShaderMaterial({
      fragmentShader: mirrorShader.fragmentShader,
      vertexShader: mirrorShader.vertexShader,
      uniforms: UniformsUtils.clone(mirrorShader.uniforms),
      lights: true,
      side: side,
      fog: fog,
    });

    material.uniforms["mirrorSampler"].value = renderTarget.texture; // mirror texture
    material.uniforms["textureMatrix"].value = textureMatrix; // texture matrix
    material.uniforms["distortionScale"].value = distortionScale;
    material.uniforms["alpha"].value = alpha; // opacity
    material.uniforms["time"].value = time; // elapsed time
    material.uniforms["sunColor"].value = sunColor; // sun color
    material.uniforms["sunDirection"].value = sunDirection;
    material.uniforms["waterColor"].value = waterColor; // water color
    material.uniforms["normalSampler"].value = normalSampler; // water normals texture
    material.uniforms["eye"].value = eye; // camera position
    material.uniforms["waves"].value = waves; // array of wave parameters
    material.uniforms["windSpeed"].value = windSpeed; // speed of wind
    material.uniforms["windDirection"].value = windDirection; // direction of wind
    material.uniforms["boatDirection"].value = boatDirection; // main direction boat
    material.uniforms["boatSpeed"].value = boatSpeed; // boat speed
    material.uniforms["boatScale"].value = boatScale; // boat scale
    material.uniforms["boatLength"].value = boatLength; // boat length
    material.uniforms["fogFactor"].value = fogFactor; // fog
    material.uniforms["useNormals"].value = useNormals; // geometric normals
    material.uniforms["u_foam_texture"].value = u_foam_texture;
    material.uniforms["u_trail_texture"].value = u_trail_texture;
    material.uniforms["u_perlin_texture"].value = u_perlin_texture;
    material.uniforms["angle"].value = angle;
    material.transparent = true;
    material.wireframe = false;
    scope.material = material;

    scope.onBeforeRender = function (renderer, scene, camera) {
      mirrorWorldPosition.setFromMatrixPosition(scope.matrixWorld); // copy water position
      cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld); // copy camera
      rotationMatrix.extractRotation(scope.matrixWorld);
      normal.set(0, 1, 0); // changed init normal
      normal.applyMatrix4(rotationMatrix);
      view.subVectors(mirrorWorldPosition, cameraWorldPosition); // Avoid rendering when mirror is facing away

      if (view.dot(normal) > 0) return;
      view.reflect(normal).negate();
      view.add(mirrorWorldPosition);
      rotationMatrix.extractRotation(camera.matrixWorld);
      lookAtPosition.set(0, 0, -1);
      lookAtPosition.applyMatrix4(rotationMatrix);
      lookAtPosition.add(cameraWorldPosition);
      target.subVectors(mirrorWorldPosition, lookAtPosition);
      target.reflect(normal).negate();
      target.add(mirrorWorldPosition);
      mirrorCamera.position.copy(view);
      mirrorCamera.up.set(0, 1, 0);
      mirrorCamera.up.applyMatrix4(rotationMatrix);
      mirrorCamera.up.reflect(normal);
      mirrorCamera.lookAt(target);
      mirrorCamera.far = camera.far; // Used in WebGLBackground

      mirrorCamera.updateMatrixWorld();
      mirrorCamera.projectionMatrix.copy(camera.projectionMatrix); // Update the texture matrix

      textureMatrix.set(
        0.5,
        0.0,
        0.0,
        0.5,
        0.0,
        0.5,
        0.0,
        0.5,
        0.0,
        0.0,
        0.5,
        0.5,
        0.0,
        0.0,
        0.0,
        1.0
      );
      textureMatrix.multiply(mirrorCamera.projectionMatrix);
      textureMatrix.multiply(mirrorCamera.matrixWorldInverse); // Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
      // Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf

      mirrorPlane.setFromNormalAndCoplanarPoint(normal, mirrorWorldPosition); // define plane
      mirrorPlane.applyMatrix4(mirrorCamera.matrixWorldInverse);
      clipPlane.set(
        mirrorPlane.normal.x,
        mirrorPlane.normal.y,
        mirrorPlane.normal.z,
        mirrorPlane.constant
      );
      const projectionMatrix = mirrorCamera.projectionMatrix;
      q.x =
        (Math.sign(clipPlane.x) + projectionMatrix.elements[8]) /
        projectionMatrix.elements[0];
      q.y =
        (Math.sign(clipPlane.y) + projectionMatrix.elements[9]) /
        projectionMatrix.elements[5];
      q.z = -1.0;
      q.w =
        (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14]; // Calculate the scaled plane vector

      clipPlane.multiplyScalar(2.0 / clipPlane.dot(q)); // Replacing the third row of the projection matrix

      projectionMatrix.elements[2] = clipPlane.x;
      projectionMatrix.elements[6] = clipPlane.y;
      projectionMatrix.elements[10] = clipPlane.z + 1.0 - clipBias;
      projectionMatrix.elements[14] = clipPlane.w;
      eye.setFromMatrixPosition(camera.matrixWorld); // Render

      const currentRenderTarget = renderer.getRenderTarget();
      const currentXrEnabled = renderer.xr.enabled;
      const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;
      scope.visible = false;
      renderer.xr.enabled = false; // Avoid camera modification and recursion

      renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows

      renderer.setRenderTarget(renderTarget);
      renderer.state.buffers.depth.setMask(true); // make sure the depth buffer is writable so it can be properly cleared, see #18897

      if (renderer.autoClear === false) renderer.clear();
      renderer.render(scene, mirrorCamera);
      scope.visible = true;
      renderer.xr.enabled = currentXrEnabled;
      renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;
      renderer.setRenderTarget(currentRenderTarget); // Restore viewport

      const viewport = camera.viewport;

      if (viewport !== undefined) {
        renderer.state.viewport(viewport);
      }
    };
  }
}

Water.prototype.isWater = true;

export { Water };
