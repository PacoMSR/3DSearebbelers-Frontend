import React from "react";
import * as THREE from "three";
import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { skyFragmentShader, skyVertexShader } from "./data/shaders";

// Extend Three.js objects for use in R3F
extend({ boxGeometry: THREE.BoxGeometry });

// Properly define the shader material
const SkyShaderMaterial = shaderMaterial(
  {
    skyLuminance: 1.0,
    turbidity: 1.0,
    rayleigh: 1.0,
    mieCoefficient: 1.0,
    mieDirectionalG: 1.0,
    sunPosition: new THREE.Vector3(),
    refractiveIndex: 1.0003,
    numMolecules: 2.542e25,
    depolarizationFactor: 1.0,
    primaries: new THREE.Vector3(),
    mieKCoefficient: new THREE.Vector3(),
    mieV: 4.0,
    rayleighZenithLength: 8.4e3,
    mieZenithLength: 1.25e3,
    sunIntensityFactor: 1.0,
    sunIntensityFalloffSteepness: 1.5,
    sunAngularDiameterDegrees: 0.0093333,
    tonemapWeighting: 9.5,
    fogDensity: 0.00025,
    fogColor: new THREE.Color("#ffffff"),
  },
  skyVertexShader,
  skyFragmentShader
);

// Extend the material for R3F
extend({ SkyShaderMaterial });

function SkyBox({ sunPosition, skyState }) {
  return (
    <mesh scale={1000}>
      {/* ✅ Use lowercase "boxGeometry" */}
      <boxGeometry />
      <skyShaderMaterial
        skyLuminance={1.0}
        fog
        side={THREE.BackSide}
        sunPosition={sunPosition}
        rayleigh={skyState.rayleigh}
        turbidity={skyState.turbidity}
        mieCoefficient={skyState.mieCoefficient}
        mieDirectionalG={skyState.mieDirectionalG}
        depolarizationFactor={0.035}
        primaries={new THREE.Vector3(6.8e-7, 5.5e-7, 4.5e-7)}
        mieKCoefficient={new THREE.Vector3(0.686, 0.678, 0.666)}
        sunIntensityFactor={skyState.sunIntensityFactor}
      />
    </mesh>
  );
}

export default SkyBox;