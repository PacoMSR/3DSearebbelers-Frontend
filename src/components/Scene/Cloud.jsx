import React, { useRef } from "react";
import * as THREE from "three";
import { shaderMaterial, useTexture } from "@react-three/drei";
import { extend, useFrame } from "@react-three/fiber";

import state from "./config/WeatherStates.json";
import { cloudVertexShader, cloudFragmentShader } from "./data/shaders";

extend({ planeGeometry: THREE.PlaneGeometry });

const CloudShaderMaterial = shaderMaterial(
  // Uniforms
  {
    uTime: 0,
    uCover: 1,
    u_wind_speed: 1,
    u_wind_dir: new THREE.Vector2(),
    u_texture: new THREE.Texture(),
  },
  // Vertex Shader
  cloudVertexShader,
  // Fragment Shader
  cloudFragmentShader
);

extend({ CloudShaderMaterial });

export default function Cloud({ weather }) {
  const matRef = useRef();

  useFrame(({ clock }) => (matRef.current.uTime = clock.getElapsedTime()));

  // cloud texture
  const [perlin] = useTexture([require("./data/textures/perlin.jpg")]);
  perlin.wrapS = perlin.wrapT = THREE.MirroredRepeatWrapping;

  // information about scene state
  var cloudState = weather["cloudCover"];
  const windDirection = weather["windDirection"];
  const windSpeed = state["seaState"][weather["seaState"]]["windSpeed"];

  return (
    <mesh position={[0, 60, 0]} rotation-x={Math.PI / 2}>
      <planeGeometry args={[1000, 1000]} />
      <cloudShaderMaterial
        ref={matRef}
        u_texture={perlin}
        u_wind_dir={windDirection}
        u_wind_speed={windSpeed}
        uCover={cloudState}
        side={THREE.DoubleSide}
        transparent
      />
    </mesh>
  );
}
