"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { NodeType, NetworkNode, TwinObject } from "@/types/features";

export interface Node3DProps {
  node: NetworkNode;
  twin: TwinObject | undefined;
  isSelected: boolean;
  onClick: () => void;
  showLabels: boolean;
  lowPowerMode: boolean;
  center: { x: number; y: number };
}

export function Node3D({ node, twin, isSelected, onClick, showLabels, lowPowerMode, center }: Node3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Position scaling: scale pixel coords to WebGL units
  const posX = (node.x - center.x) / 100;
  const posZ = (node.y - center.y) / 100;
  const posY = 0;

  // Pulse & Rotation animations
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const time = clock.getElapsedTime();

    // Rotate database and services
    if (!lowPowerMode) {
      if (node.nodeType === NodeType.DATABASE || node.nodeType === NodeType.SERVICE) {
        meshRef.current.rotation.y = time * 0.3;
      } else {
        meshRef.current.rotation.y = Math.sin(time * 0.5) * 0.2;
      }
    }

    // Pulse scale if warning/outage
    let pulseSpeed = 1;
    let pulseAmt = 0.03;
    if (twin) {
      if (twin.status === "down") {
        pulseSpeed = 5;
        pulseAmt = 0.12;
      } else if (twin.status === "degraded") {
        pulseSpeed = 2.5;
        pulseAmt = 0.06;
      }
    }

    if (!lowPowerMode && twin && twin.status !== "up" && twin.status !== "unknown") {
      const scale = 1 + Math.sin(time * pulseSpeed) * pulseAmt;
      meshRef.current.scale.set(scale, scale, scale);
    } else {
      meshRef.current.scale.set(1, 1, 1);
    }
  });

  // Get color based on live state status
  const getNodeColor = () => {
    if (!twin) return "#3B82F6"; // Unmonitored -> Cool Indigo Blue
    switch (twin.status) {
      case "up":
        return "#10B981"; // Healthy Emerald Green
      case "degraded":
        return "#F59E0B"; // Heavy Load Amber
      case "down":
        return "#EF4444"; // Outage Red
      case "unknown":
      default:
        return "#6B7280"; // Offline/Unknown Slate Gray
    }
  };

  const nodeColor = getNodeColor();

  // Custom 3D geometries based on node type
  const renderGeometry = () => {
    switch (node.nodeType) {
      case NodeType.DATABASE:
        return <cylinderGeometry args={[0.5, 0.5, 1.2, 16]} />;
      case NodeType.GATEWAY:
        return <torusGeometry args={[0.45, 0.18, 8, 24]} />;
      case NodeType.CDN:
        return <sphereGeometry args={[0.6, 16, 16]} />;
      case NodeType.EXTERNAL:
        return <octahedronGeometry args={[0.65]} />;
      case NodeType.SERVICE:
      default:
        return <boxGeometry args={[0.9, 0.9, 0.9]} />;
    }
  };

  return (
    <group position={[posX, posY, posZ]}>
      {/* Node Mesh */}
      <mesh ref={meshRef} onClick={(e) => { e.stopPropagation(); onClick(); }} castShadow receiveShadow>
        {renderGeometry()}
        <meshStandardMaterial
          color={nodeColor}
          roughness={0.15}
          metalness={0.8}
          emissive={nodeColor}
          emissiveIntensity={isSelected ? (lowPowerMode ? 0.4 : 0.8) : (lowPowerMode ? 0.1 : 0.25)}
        />
      </mesh>

      {/* Selected Node Glow Outline */}
      {isSelected && !lowPowerMode && (
        <mesh scale={[1.25, 1.25, 1.25]}>
          {renderGeometry()}
          <meshBasicMaterial color={nodeColor} wireframe transparent opacity={0.4} />
        </mesh>
      )}

      {/* Floating 2D label */}
      {showLabels && (
        <Html distanceFactor={14} position={[0, 1.2, 0]} center>
          <div 
            onClick={onClick}
            className={`px-2.5 py-1 rounded-xl bg-slate-950/90 border text-[10px] font-bold text-white whitespace-nowrap cursor-pointer transition-all duration-300 flex items-center gap-1.5 shadow-lg select-none ${
              isSelected ? "border-primary ring-2 ring-primary/20 scale-105" : "border-white/10 hover:border-white/20"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${
              !twin ? "bg-blue-400" :
              twin.status === "up" ? "bg-emerald-400" :
              twin.status === "degraded" ? "bg-amber-400" : "bg-red-400"
            }`} />
            {node.label}
          </div>
        </Html>
      )}
    </group>
  );
}
