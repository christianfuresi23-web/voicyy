"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh } from "three";

function VoiceObject() {
  const group = useRef<Group>(null);
  const pulse = useRef<Mesh>(null);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.18;
      group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.32) * 0.08;
    }

    if (pulse.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 1.45) * 0.045;
      pulse.current.scale.setScalar(scale);
    }
  });

  const bars = [-1.05, -0.7, -0.35, 0, 0.35, 0.7, 1.05];

  return (
    <group ref={group} rotation={[0.12, -0.45, 0.05]}>
      <mesh ref={pulse}>
        <icosahedronGeometry args={[1.47, 4]} />
        <meshPhysicalMaterial
          color="#101010"
          roughness={0.18}
          metalness={0.36}
          clearcoat={0.85}
          clearcoatRoughness={0.2}
        />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.92, 0.034, 16, 160]} />
        <meshStandardMaterial color="#b7f34a" emissive="#7fae28" emissiveIntensity={0.85} />
      </mesh>
      <mesh rotation={[Math.PI / 2.35, 0.22, 0.52]}>
        <torusGeometry args={[2.22, 0.012, 10, 160]} />
        <meshStandardMaterial color="#2d2d2d" />
      </mesh>
      <mesh rotation={[Math.PI / 1.8, -0.28, -0.58]}>
        <torusGeometry args={[2.48, 0.008, 10, 160]} />
        <meshStandardMaterial color="#8e8e8e" transparent opacity={0.52} />
      </mesh>

      <group position={[0, 0, 1.42]}>
        {bars.map((x, index) => {
          const height = [0.34, 0.7, 1.05, 1.4, 1.05, 0.7, 0.34][index];
          return (
            <mesh key={x} position={[x * 0.42, 0, 0]}>
              <capsuleGeometry args={[0.055, height * 0.35, 6, 12]} />
              <meshStandardMaterial
                color={index === 3 ? "#b7f34a" : "#f8f8f8"}
                emissive={index === 3 ? "#79a92a" : "#000000"}
                emissiveIntensity={index === 3 ? 0.72 : 0}
              />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

export default function VoiceSceneCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0.15, 7.2], fov: 43 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <ambientLight intensity={1.7} />
      <directionalLight position={[4, 6, 6]} intensity={3.8} color="#ffffff" />
      <pointLight position={[-4, -1, 4]} intensity={22} color="#b7f34a" distance={9} />
      <pointLight position={[3, -3, 2]} intensity={13} color="#ffffff" distance={8} />
      <VoiceObject />
    </Canvas>
  );
}
