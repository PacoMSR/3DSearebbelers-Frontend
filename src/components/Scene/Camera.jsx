import React from "react";
import { useRef } from "react";
import { PerspectiveCamera } from "@react-three/drei";

function Camera({ children }) {
  const camera = useRef();

  return (
    <PerspectiveCamera
      makeDefault
      ref={camera}
      position={[0, 5, 15]}
      fov={55}
      near={1}
      far={1000}
    >
      {children}
    </PerspectiveCamera>
  );
}

export default Camera;
