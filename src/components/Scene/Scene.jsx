import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  calcPosFromAngles,
  OrbitControls,
  Plane,
  Stats,
} from "@react-three/drei";
import { Leva, useControls } from "leva";

import * as THREE from "three";

import SkyBox from "./SkyBox";
import Ocean from "./Ocean";
import Boat from "./Boat";
import { BuoyImage, Buoys } from "./Buoy";
import Cloud from "./Cloud";
import Rain from "./Rain";
import CoastLine from "./CoastLine";
import state from "./config/WeatherStates.json";
import Camera from "./Camera";
import { fogFrag, fogParsFrag, fogParsVertex, fogVertex } from "./data/shaders";

export default function Scene({
  currentBuoy,
  beacons,
  boat,
  setBoat,
  weather,
  data,
  isActive,
}) {
  // scene state variables
  const skyState = state["skyState"][weather["skyState"]];
  const sun = weather["sunPos"];
  const sunPos = calcPosFromAngles(sun.inclination, sun.azimuth);
  sunPos.normalize();
  sunPos.multiplyScalar(10);

  // point light (used to add realism)
  const Light = () => {
    return (
      <pointLight
        color={"white"}
        intensity={(sun.inclination - 0.5) * 10} // the higher the sun, the brighter the light
        position={sunPos}
      />
    );
  };

  // directional light (used to add shadows + sunset effect)
  const DirLight = () => {
    return (
      <directionalLight
        color={"orange"}
        intensity={1 - (sun.inclination - 0.5) * 8} // the lower the sun, the brighter the light
        position={sunPos}
        castShadow
      />
    );
  };

  // updated fog shader chunks - underwater
  THREE.ShaderChunk.fog_pars_vertex = fogParsVertex;
  THREE.ShaderChunk.fog_vertex = fogVertex;
  THREE.ShaderChunk.fog_pars_fragment = fogParsFrag;
  THREE.ShaderChunk.fog_fragment = fogFrag;

  return (
    <>
      <Leva
        id={"leva"}
        titleBar={{
          title: "Control Panel",
          position: { y: 60 },
        }}
        collapsed
      />
      <Suspense
        fallback={
          <p style={{ color: "white", textAlign: "center" }}>
            Loading Scene...
          </p>
        }
      >
        <Canvas
          shadows
          id={"canvas"}
          frameloop={isActive}
          gl={{ localClippingEnabled: true }}
        >
          {/*Camera info*/}
          <Camera>
            {/* Sky */}
            <SkyBox sunPosition={sunPos} skyState={skyState} />
          </Camera>

          {/*Scene Elements*/}
          <Ocean weather={weather} sunPosition={sunPos} boat={boat} />
          <Boat boat={boat} setBoat={setBoat} weather={weather} />
          <Cloud weather={weather} />
          <Rain weather={weather} />
          <CoastLine weather={weather} boat={boat} />
          <Buoys
            currentBuoy={currentBuoy}
            beacons={beacons}
            boat={boat}
            weather={weather}
          />
          {data && <BuoyImage path={data} />}

          {/*Lights*/}
          <ambientLight intensity={sun.inclination - 0.2} color={"white"} />
          <Light />
          <DirLight />

          {/*Contols and helpers*/}
          <OrbitControls
            target={[0, 3, 0]}
            enablePan={false}
            maxDistance={70}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI * 0.55}
          />
          <color attach="background" args={["#8594bd"]} />
          {/* <fog attach="fog" color="lightblue" near={1} far={50} /> */}
          <fogExp2 attach="fog" color={"#8594bd"} density={0.03} />
        </Canvas>
      </Suspense>
    </>
  );
}
