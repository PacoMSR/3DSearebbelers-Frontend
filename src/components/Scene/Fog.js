import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";
import React from "react";
import { BoxGeometry } from "three";

// Extend Three.js objects for R3F
extend({ boxGeometry: BoxGeometry });

// Define the custom FogMaterial
const FogMaterial = shaderMaterial(
  {}, // Uniforms
  ` // Vertex Shader
    varying vec3 vPosition;
    void main() {
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  ` // Fragment Shader
    varying vec3 vPosition;
    void main() {
      gl_FragColor = vec4(vPosition * 0.5 + 0.5, 1.0);
    }
  `
);

extend({ FogMaterial });

export default function Fog() {
  return (
    <mesh position={[-20, 20, 0]}>
      {/* Notice the lowercase tag for geometry */}
      <boxGeometry args={[20, 20, 20]} />
      <fogMaterial />
    </mesh>
  );
}