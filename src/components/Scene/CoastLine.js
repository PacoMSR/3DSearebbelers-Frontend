import React, { useRef } from "react";
import * as THREE from "three";
import { extend, useFrame, useLoader } from "@react-three/fiber";
import { shaderMaterial, useGLTF } from "@react-three/drei";

import { coastFragment, coastVertex } from "./data/shaders";
import state from "./config/WeatherStates.json";
import { EquirectangularDistance, HarvesineBearing } from "./Boat";

const CoastLineMaterial = new shaderMaterial(
  { coastmap: { value: new THREE.Texture() } }, // uniforms
  coastVertex, // vertex
  coastFragment // fragment
);

extend({ CoastLineMaterial });

export default function CoastLine({ props, weather, boat }) {
  const { nodes } = useGLTF("./assets/semicylinder.gltf"); // mesh - Javi Agenjo's

  const city = state["city"][weather["city"]];
  const coastmap = useLoader(
    THREE.TextureLoader,
    require("./data/textures/" + city["name"] + ".png")
  );
  coastmap.wrapS = coastmap.wrapT = THREE.MirroredRepeatWrapping;

  // const fogFactor = weather["fogState"];

  // position relative to boat location
  // TODO - scale and rotation should be modified too
  const d =
    0.03 *
    EquirectangularDistance(
      boat.latitude,
      boat.longitude,
      city["position"][0],
      city["position"][2]
    );

  const angle = HarvesineBearing(
    boat.latitude,
    boat.longitude,
    city["position"][0],
    city["position"][2]
  );

  const position = [d * Math.sin(angle), 0, d * Math.cos(angle)];

  const ref = useRef();

  useFrame(() => {
    ref.current.lookAt(new THREE.Vector3(0, 0, 0));
  });

  return (
    <group {...props} dispose={null}>
      <mesh
        ref={ref}
        geometry={nodes.Cylinder001.geometry}
        scale={city["scale"]}
        position={position}
        visible={weather["coastLine"] && d < 450}
      >
        <coastLineMaterial coastmap={coastmap} transparent />
      </mesh>
    </group>
  );
}

useGLTF.preload("./assets/semicylinder.gltf");
