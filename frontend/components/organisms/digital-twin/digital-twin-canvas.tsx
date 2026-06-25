"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Line } from "@react-three/drei";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { toast } from "sonner";
import { 
  useNetworkTopology, 
  useDigitalTwin 
} from "@/hooks";
import { NetworkNode, TwinObject } from "@/types/features";
import { Typography } from "@/components/atoms";
import { FlowingParticles } from "./flowing-particles";
import { Node3D } from "./node-3d";
import { LeftToolbar } from "./left-toolbar";
import { TelemetryHud, TelemetryLog } from "./telemetry-hud";

interface DigitalTwinCanvasProps {
  projectId: string;
  className?: string;
}

export function DigitalTwinCanvas({ projectId, className }: DigitalTwinCanvasProps) {
  // A. Fetch Static Topology Map & Live State
  const { nodes, edges, isLoading: isTopologyLoading } = useNetworkTopology(projectId);
  const { state: twinState, isConnected } = useDigitalTwin(projectId);

  // B. Control States
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [lowPowerMode, setLowPowerMode] = useState(false);
  const orbitRef = useRef<OrbitControlsImpl | null>(null);

  // C. Local Telemetry Log Mock
  const [mockLogs, setMockLogs] = useState<TelemetryLog[]>([]);

  // D. Calculate dynamic topology center to focus 3D scene correctly
  const centerCoords = useMemo(() => {
    if (nodes.length === 0) return { x: 0, y: 0 };
    const sumX = nodes.reduce((sum, n) => sum + n.x, 0);
    const sumY = nodes.reduce((sum, n) => sum + n.y, 0);
    return {
      x: sumX / nodes.length,
      y: sumY / nodes.length,
    };
  }, [nodes]);

  // E. Map twins array for quick O(1) object lookup
  const twinLookup = useMemo(() => {
    const lookup: Record<string, TwinObject> = {};
    if (twinState && twinState.twins) {
      twinState.twins.forEach((twin) => {
        lookup[twin.configId] = twin;
      });
    }
    return lookup;
  }, [twinState]);

  // Selected Object Node & Mapped Twin Status
  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  const selectedTwin = useMemo(() => {
    if (!selectedNode || !selectedNode.configId) return null;
    return twinLookup[selectedNode.configId] || null;
  }, [selectedNode, twinLookup]);

  // F. Push network events into mock logger whenever live state changes
  useEffect(() => {
    if (!twinState) return;

    const timeStr = new Date().toLocaleTimeString();
    
    // Pick one active twin node to simulate traffic logs
    const activeTwins = twinState.twins;
    if (activeTwins.length > 0) {
      const idx = Math.floor(Math.random() * activeTwins.length);
      const twin = activeTwins[idx];
      let logType: "info" | "warn" | "error" | "success" = "success";
      let logMsg = `Gateway routed request to [${twin.name}] with status code 200`;

      if (twin.status === "down") {
        logType = "error";
        logMsg = `ALERT: Connect timeout on endpoint [${twin.name}] - Target Host Down`;
      } else if (twin.status === "degraded") {
        logType = "warn";
        logMsg = `WARN: Performance degraded on [${twin.name}] - Latency exceeded ${twin.latencyMs}ms`;
      } else if (twin.trend === "recovering") {
        logType = "info";
        logMsg = `INFO: Traffic load balancing on [${twin.name}] - Connection recovering`;
      }

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMockLogs((prev) => [
        { time: timeStr, msg: logMsg, type: logType },
        ...prev.slice(0, 14), // Cap logs list size
      ]);
    }
  }, [twinState]);

  const handleResetCamera = () => {
    if (orbitRef.current) {
      orbitRef.current.reset();
      toast.info("Camera view centered");
    }
  };

  const isLoaded = !isTopologyLoading;

  const averageUptime = useMemo(() => {
    if (twinState && twinState.twins.length > 0) {
      const avg = twinState.twins.reduce((acc, t) => acc + t.uptimePercent, 0) / twinState.twins.length;
      return `${avg.toFixed(2)}%`;
    }
    return "100.00%";
  }, [twinState]);

  return (
    <div className={`relative w-full flex flex-col xl:flex-row gap-5 h-180 border border-border/40 rounded-2xl overflow-hidden bg-card/15 shadow-sm ${className}`}>
      
      {/* 1. LEFT TOOLBAR: NAVIGATION CONTROL & SETTINGS */}
      <LeftToolbar
        isConnected={isConnected}
        nodeCount={nodes.length}
        averageUptime={averageUptime}
        showLabels={showLabels}
        onShowLabelsChange={setShowLabels}
        lowPowerMode={lowPowerMode}
        onLowPowerModeChange={setLowPowerMode}
        onResetCamera={handleResetCamera}
      />

      {/* 2. R3F VIEWPORT CANVAS */}
      <div className="flex-1 relative overflow-hidden bg-[#05070a] border border-border/30 rounded-xl">
        
        {/* Connection status overlay badge */}
        {!isConnected && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-xs">
            <div className="flex flex-col items-center gap-2 p-6 bg-slate-900 border border-white/10 rounded-2xl text-center shadow-2xl max-w-xs">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-1" />
              <Typography variant="span" className="text-xs font-bold text-white block">
                Connecting to Digital Twin Socket Gateway...
              </Typography>
              <Typography variant="caption" className="text-[10px] text-muted-foreground/70">
                Attempting handshake at namespace /digital-twin
              </Typography>
            </div>
          </div>
        )}

        {isTopologyLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-xxs">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* 3D CANVAS */}
        {isLoaded && (
          <Canvas camera={{ position: [0, 6, 8], fov: 45 }} shadows className="w-full h-full cursor-grab active:cursor-grabbing">
            {/* Ambient Background Light */}
            <ambientLight intensity={0.4} />
            
            {/* Main Directional Shadow-Casting Light */}
            <directionalLight 
              position={[10, 18, 10]} 
              intensity={0.7} 
              castShadow 
              shadow-mapSize-width={1024} 
              shadow-mapSize-height={1024}
            />
            
            {/* Grid Floor */}
            <gridHelper args={[60, 60, "#1e293b", "#0f172a"]} position={[0, -0.6, 0]} />

            {/* Orbit Camera controls */}
            <OrbitControls 
              ref={orbitRef}
              maxPolarAngle={Math.PI / 2.1} 
              minDistance={2} 
              maxDistance={22} 
            />

            {/* RENDER NODES */}
            {nodes.map((node) => (
              <Node3D
                key={node.id}
                node={node}
                twin={node.configId ? twinLookup[node.configId] : undefined}
                isSelected={selectedNodeId === node.id}
                onClick={() => setSelectedNodeId(node.id)}
                showLabels={showLabels}
                lowPowerMode={lowPowerMode}
                center={centerCoords}
              />
            ))}

            {/* RENDER EDGES WITH FLOWING DATA PARTICLES */}
            {edges.map((edge) => {
              const source = nodes.find((n) => n.id === edge.sourceId);
              const target = nodes.find((n) => n.id === edge.targetId);
              if (!source || !target) return null;

              // Scale coordinates to fit WebGL spatial coordinates
              const x1 = (source.x - centerCoords.x) / 100;
              const z1 = (source.y - centerCoords.y) / 100;
              const x2 = (target.x - centerCoords.x) / 100;
              const z2 = (target.y - centerCoords.y) / 100;

              // Determine traffic status from target/destination twin status
              const targetTwin = target.configId ? twinLookup[target.configId] : null;
              const connectionStatus = targetTwin ? targetTwin.status : "up";

              let strokeColor = "#1e293b"; // Muted dark line
              let lineWidth = 1.0;
              if (connectionStatus === "down") {
                strokeColor = "#EF4444";
                lineWidth = 2.0;
              } else if (connectionStatus === "degraded") {
                strokeColor = "#F59E0B";
                lineWidth = 1.5;
              }

              return (
                <group key={edge.id}>
                  {/* Connection Cable Mesh Line */}
                  <Line
                    points={[[x1, 0, z1], [x2, 0, z2]]}
                    color={strokeColor}
                    lineWidth={lineWidth}
                  />

                  {/* Flowing packet particles */}
                  <FlowingParticles
                    start={[x1, 0, z1]}
                    end={[x2, 0, z2]}
                    status={connectionStatus}
                    lowPowerMode={lowPowerMode}
                  />
                </group>
              );
            })}
          </Canvas>
        )}

        {/* Spatial control tips overlay */}
        <div className="absolute bottom-4 left-4 z-10 text-[9px] font-semibold text-muted-foreground/60 bg-black/60 px-3 py-1.5 border border-white/5 rounded-lg select-none pointer-events-none space-y-0.5">
          <div>🖱️ Drag: Rotate View</div>
          <div>🖱️ Right-Click + Drag: Pan View</div>
          <div>🖱️ Scroll: Zoom View</div>
        </div>
      </div>

      {/* 3. RIGHT SIDEBAR: DIGITAL TWIN TELEMETRY HUD */}
      <TelemetryHud
        selectedNode={selectedNode}
        selectedTwin={selectedTwin}
        mockLogs={mockLogs}
        onClearSelection={() => setSelectedNodeId(null)}
      />
    </div>
  );
}
