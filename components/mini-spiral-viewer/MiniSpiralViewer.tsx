"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Center, OrbitControls } from "@react-three/drei";
import Model from "@/app/modelo/Model";

function RotatingSpiralMini() {
  const spinRef = useRef<{ rotation: { y: number } } | null>(null);

  useFrame((_, delta) => {
    if (!spinRef.current) return;
    spinRef.current.rotation.y += delta * 0.5;
  });

  return (
    <group ref={spinRef}>
      <Center>
        <Model url="/models/espiral.glb" />
      </Center>
    </group>
  );
}

export default function MiniSpiralViewer() {
  return (
    <Canvas flat camera={{ position: [0, 0, 35], fov: 42 }}>
      <ambientLight intensity={1.05} color="#ffffff" />
      <directionalLight position={[4, 5, 3]} intensity={0.55} color="#ffffff" />
      <directionalLight
        position={[-3, -2, -4]}
        intensity={0.25}
        color="#ffffff"
      />

      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom
        enableRotate
        target={[0, 0, 0]}
        minDistance={20}
        maxDistance={50}
      />

      <RotatingSpiralMini />
    </Canvas>
  );
}
