import * as THREE from "three";
import React, { useRef, useMemo } from "react";
import { extend, useLoader, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";

import state from "./config/WeatherStates.json";
import { Water } from "./Ocean/Water";
import { useControls } from "leva";
extend({ Water });

export default function Ocean({ weather, sunPosition, boat }) {
  const windDirection = weather["windDirection"];
  const boatDirection = [
    -Math.sin(boat.direction) + 0.01,
    Math.cos(boat.direction) + 0.01,
  ];

  // control sea state in debug
  /*
  const { waterCol } = useControls({
    waterCol: "#008cff",
  });

  const { sea } = useControls("sea", {
    sea: {
      value: "calm",
      options: [
        "calm",
        "light air",
        "light breeze",
        "gentle breeze",
        "moderate breeze",
        "fresh breeze",
        "strong breeze",
        "near gale",
        "gale",
        "strong gale",
      ],
    },
  });
  */

  // sea state
  // const seaState = state["seaState"][sea];
  const seaState = state["seaState"][weather["seaState"]];
  const fogFactor = weather["fogState"];

  // 3 main waves uniforms
  const waves = mapWaves(seaState["waves"]);

  const [waterNormals, u_foam_texture, u_trail_texture, u_perlin_texture] =
    useLoader(THREE.TextureLoader, [
      require("./data/textures/waternormals.jpeg"),
      require("./data/textures/foam.jpg"),
      require("./data/textures/foam_trail.jpg"), // foamtrace from boat
      require("./data/textures/perlin.jpg"), // perlin noise
    ]);
  waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
  u_foam_texture.wrapS = u_foam_texture.wrapT = THREE.RepeatWrapping;
  u_trail_texture.wrapS = u_trail_texture.wrapT = THREE.ClampToEdgeWrapping;
  u_perlin_texture.wrapS = u_perlin_texture.wrapT =
    THREE.MirroredRepeatWrapping;

  // Ocean LR geometry - Gerard Llorach
  // https://github.com/BlueNetCat/OBSEA/blob/main/Assets/Terrain/OceanSurfaceLR.glb
  const resolution = "MR"; // mesh resolution - choose between LR, MR and HR
  const { nodes } = useGLTF("./assets/OceanSurface" + resolution + ".gltf");
  const oceangeom = nodes["OceanSurface" + resolution].geometry;

  // const geom = useMemo(() => new THREE.PlaneGeometry(350, 350, 1000, 1000), []);
  const geom = useMemo(() => oceangeom, [oceangeom]);

  // ocean uniforms
  const config = useMemo(
    () => ({
      textureWidth: 512,
      textureHeight: 512,
      waterNormals,
      sunDirection: sunPosition,
      sunColor: 0xffffff,
      waterColor: 0x008cff,
      distortionScale: 1.5,
      side: THREE.DoubleSide,
      fog: true,
      waves,
      windSpeed: seaState["windSpeed"],
      fogFactor,
      u_foam_texture,
      u_trail_texture,
      u_perlin_texture,
      windDirection,
      boatDirection,
      boatSpeed: boat.speed,
      boatScale: boat.scale,
      boatLength: boat.length,
      useNormals: seaState["useNormals"],
      angle: boat.direction + Math.PI,
    }),
    [
      waterNormals,
      waves,
      sunPosition,
      u_foam_texture,
      fogFactor,
      seaState,
      windDirection,
      boatDirection,
      boat,
      u_trail_texture,
      u_perlin_texture,
    ]
  );

  const ref = useRef();

  useFrame((state, delta) => {
    // window.searebbel.time += delta;
    ref.current.material.uniforms.time.value += delta;
    ref.current.time += delta;
  });

  console.log("Rendering water:", ref, geom, config);
  
  return (
    <water
      ref={ref}
      name={"water"}
      args={[geom, config]}
      scale={1}
      receiveShadow
      waves={waves}
      time={0}
      // time={window.searebbel.time}
      visible={true}
      position-y={0}
    ></water>
  );
}

// different mesh resolutions
useGLTF.preload("./assets/OceanSurfaceLR.gltf");
useGLTF.preload("./assets/OceanSurfaceMR.gltf");
useGLTF.preload("./assets/OceanSurfaceHR.gltf");

function mapWaves(waves) {
  const uni_waves = [];
  var k = 0;
  var wave;
  for (var i = 0; i < 3; i++) {
    wave = waves[i];
    k = (2 * Math.PI) / wave.wavelength;
    uni_waves[i] = {
      k: k,
      speed: Math.sqrt(9.8 / k),
      amp: wave.steepness / k,
      wave_dir: wave.direction,
    };
  }

  return uni_waves;
}

// gerstenWave function as in shader, to create buoyancy
export function gestnerWave(
  waves,
  vertex,
  time,
  windDirection,
  boatDirection,
  boatSpeed
) {
  var f, steepness, dir, wave;
  var position = new THREE.Vector3(vertex.x, 0, vertex.y);
  var tangent = new THREE.Vector3(1, 0, 0);
  var binormal = new THREE.Vector3(0, 0, 1);

  if (waves) {
    for (let i = 0; i < 3; i++) {
      wave = waves[i];
      dir = new THREE.Vector2(
        wave.wave_dir[1] + boatDirection[1] + 0.1,
        -boatDirection[0] - wave.wave_dir[0] + 0.1
      );
      dir.normalize();
      steepness = wave.k * wave.amp;
      f = wave.k * (dir.dot(vertex) - time * wave.speed * boatSpeed);

      tangent.add(
        new THREE.Vector3(
          -dir.x * dir.x * steepness * Math.sin(f),
          dir.x * steepness * Math.cos(f),
          -dir.x * dir.y * steepness * Math.sin(f)
        )
      ); // x axis
      tangent.normalize();

      binormal.add(
        new THREE.Vector3(
          -dir.x * dir.y * steepness * Math.sin(f),
          dir.y * steepness * Math.cos(f),
          -dir.y * dir.y * steepness * Math.sin(f)
        )
      ); // z axis
      binormal.normalize();

      // gerstner wave
      position.add(
        new THREE.Vector3(
          dir.x * wave.amp * Math.cos(f),
          wave.amp * Math.sin(f),
          dir.y * wave.amp * Math.cos(f)
        )
      );
    }
  }

  var normal = tangent.cross(binormal);
  normal.normalize();

  return { position, normal };
}
