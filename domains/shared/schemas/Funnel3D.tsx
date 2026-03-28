'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Float } from '@react-three/drei';
import { getFunnelData, FunnelMetric, LiveUsage } from '@openrouter-crew/marketing-funnel';
import * as THREE from 'three';

const FunnelSegment = ({ metric, position, index }: { metric: FunnelMetric, position: [number, number, number], index: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Subtle rotation for "energy"
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  const radiusTop = 2.5 - index * 0.7;
  const radiusBottom = 2.5 - (index + 1) * 0.7;

  return (
    <group position={position}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh ref={meshRef}>
          <cylinderGeometry args={[radiusTop, radiusBottom, 1.5, 32, 1, false]} />
          <meshStandardMaterial 
            color={metric.color} 
            transparent 
            opacity={0.8} 
            wireframe={false}
            roughness={0.1}
            metalness={0.8}
          />
        </mesh>
      </Float>
      <Text
        position={[radiusTop + 1.5, 0, 0]}
        fontSize={0.3}
        color="white"
        anchorX="left"
      >
        {`${metric.tier}: ${metric.stage}\nUsage: ${metric.volume.toLocaleString()} tokens\n$${metric.costPerThousand}/1k`}
      </Text>
    </group>
  );
};

export const Funnel3D = () => {
  const [usage, setUsage] = useState<LiveUsage>({
    haiku: 1000000,
    sonnet: 400000,
    opus: 100000
  });

  // Real-time data binding simulation
  // In production, this would fetch from /api/monitoring/cost-metrics
  useEffect(() => {
    const interval = setInterval(() => {
      setUsage(prev => ({
        haiku: prev.haiku + Math.floor(Math.random() * 1000),
        sonnet: prev.sonnet + Math.floor(Math.random() * 500),
        opus: prev.opus + Math.floor(Math.random() * 100)
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const data = getFunnelData(usage);

  return (
    <div className="relative w-full h-screen bg-slate-950">
      <div className="absolute bottom-10 right-10 z-10 flex items-center gap-2 text-green-400 font-mono text-xs">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        LIVE COST TRACKING ACTIVE
      </div>
      
      <div className="w-full h-full">
        <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1.5} />
          <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} />
          {data.map((metric, i) => (
            <FunnelSegment key={metric.stage} metric={metric} position={[0, 2 - i * 2, 0]} index={i} />
          ))}
          <OrbitControls />
        </Canvas>
      </div>
    </div>
  );
};