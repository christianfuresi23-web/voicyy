"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { useRef } from "react";
import type { Group, Mesh } from "three";
import * as THREE from "three";

function VoiceObject() {
  const group = useRef<Group>(null);
  const pulse = useRef<Mesh>(null);
  const barsRef = useRef<Group>(null);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    
    // Movimento di rotazione base
    if (group.current) {
      group.current.rotation.y += delta * 0.12;
      group.current.rotation.x = Math.sin(t * 0.3) * 0.05;
    }

    // Pulsazione core
    if (pulse.current) {
      const scale = 1 + Math.sin(t * 1.8) * 0.06;
      pulse.current.scale.setScalar(scale);
    }

    // Animazione barre (simula spettro audio)
    if (barsRef.current) {
      barsRef.current.children.forEach((child, i) => {
        const mesh = child as Mesh;
        const offset = i * 0.8;
        const wave = Math.sin(t * 3 + offset) * 0.2 + 0.8;
        mesh.scale.y = THREE.MathUtils.lerp(mesh.scale.y, wave, 0.1);
      });
    }

    // Reazione al mouse
    const mouseX = (state.mouse.x * Math.PI) / 8;
    const mouseY = (state.mouse.y * Math.PI) / 8;
    
    if (group.current) {
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, mouseY + Math.sin(t * 0.3) * 0.05, 0.1);
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, mouseX + t * 0.12, 0.1);
    }
  });

  const bars = [-1.05, -0.7, -0.35, 0, 0.35, 0.7, 1.05];

  return (
    <Float
      speed={2.2} 
      rotationIntensity={0.6} 
      floatIntensity={0.8}
    >
      <group ref={group} rotation={[0.12, -0.45, 0.05]}>
        <mesh ref={pulse}>
          <icosahedronGeometry args={[1.47, 4]} />
          <meshPhysicalMaterial
            color="#101010"
            roughness={0.15}
            metalness={0.4}
            clearcoat={1}
            clearcoatRoughness={0.1}
          />
        </mesh>

        {/* Ring principale lime */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.92, 0.034, 20, 160]} />
          <meshStandardMaterial 
            color="#b7f34a" 
            emissive="#7fae28" 
            emissiveIntensity={1.2} 
          />
        </mesh>
        
        {/* Ring secondari */}
        <mesh rotation={[Math.PI / 2.35, 0.22, 0.52]}>
          <torusGeometry args={[2.22, 0.012, 10, 160]} />
          <meshStandardMaterial color="#2d2d2d" />
        </mesh>
        <mesh rotation={[Math.PI / 1.8, -0.28, -0.58]}>
          <torusGeometry args={[2.48, 0.008, 10, 160]} />
          <meshStandardMaterial color="#8e8e8e" transparent opacity={0.4} />
        </mesh>

        {/* Barre audio animate */}
        <group ref={barsRef} position={[0, 0, 1.42]}>
          {bars.map((x, index) => {
            const height = [0.34, 0.7, 1.05, 1.4, 1.05, 0.7, 0.34][index];
            return (
              <mesh key={x} position={[x * 0.42, 0, 0]}>
                <capsuleGeometry args={[0.055, height * 0.35, 8, 16]} />
                <meshStandardMaterial
                  color={index === 3 ? "#b7f34a" : "#ffffff"}
                  emissive={index === 3 ? "#79a92a" : "#000000"}
                  emissiveIntensity={index === 3 ? 1 : 0}
                />
              </mesh>
            );
          })}
        </group>
      </group>
    </Float>
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
