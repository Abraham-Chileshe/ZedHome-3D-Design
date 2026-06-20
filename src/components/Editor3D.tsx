/* eslint-disable react-hooks/immutability, @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
import React, { useMemo, useEffect, useRef, useState, Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Sky, PointerLockControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import type { Wall, Opening, Furniture, Point } from '../types';
import { getDistance, getAngle } from '../utils/geometry';
import { findRooms, type DetectedRoom } from '../utils/roomFinder';

// Helper component to render a single extruded wall with openings
const ExtrudedWall: React.FC<{
  wall: Wall;
  points: Record<string, Point>;
  openings: Opening[];
}> = ({ wall, points, openings }) => {
  const p1 = points[wall.p1Id];
  const p2 = points[wall.p2Id];

  const length = useMemo(() => {
    return p1 && p2 ? getDistance(p1, p2) : 0;
  }, [p1, p2]);

  const angle = useMemo(() => {
    return p1 && p2 ? getAngle(p1, p2) : 0;
  }, [p1, p2]);

  const wallHeight = wall.height;
  const wallThickness = wall.thickness;

  // Filter openings belonging to this wall and sort by position percent
  const wallOpenings = useMemo(() => {
    return openings
      .filter((op) => op.wallId === wall.id)
      .sort((a, b) => a.positionPercent - b.positionPercent);
  }, [openings, wall.id]);

  // Segment-based wall extrusion algorithm (cuts out window/door slots)
  const segments = useMemo(() => {
    const list: { type: 'solid' | 'opening'; start: number; end: number; opening?: Opening }[] = [];
    let lastPos = 0;

    wallOpenings.forEach((op) => {
      const opWidth = op.width;
      const center = op.positionPercent * length;
      const start = Math.max(0, center - opWidth / 2);
      const end = Math.min(length, center + opWidth / 2);

      // 1. Add solid wall segment before the opening
      if (start > lastPos) {
        list.push({ type: 'solid', start: lastPos, end: start });
      }

      // 2. Add the opening zone itself
      list.push({ type: 'opening', start, end, opening: op });
      lastPos = end;
    });

    // 3. Add solid wall segment after the last opening
    if (length > lastPos) {
      list.push({ type: 'solid', start: lastPos, end: length });
    }

    return list;
  }, [wallOpenings, length]);

  if (!p1 || !p2) return null;

  // Midpoint coordinate in 3D space
  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;

  // Texture details based on wall thickness (internal partition walls vs external load walls)
  const wallColor = wall.materialId === 'block_4' ? '#e2e8f0' : '#cbd5e1';

  return (
    <group position={[midX, 0, midY]} rotation={[0, -angle, 0]}>
      {segments.map((seg, idx) => {
        const segLen = seg.end - seg.start;
        // Position of segment relative to the center of the wall
        const segCenterRel = (seg.start + seg.end) / 2 - length / 2;

        if (seg.type === 'solid') {
          // Render full height solid wall block
          return (
            <mesh
              key={`solid-${idx}`}
              position={[segCenterRel, wallHeight / 2, 0]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[segLen, wallHeight, wallThickness]} />
              <meshStandardMaterial color={wallColor} roughness={0.6} />
            </mesh>
          );
        } else if (seg.type === 'opening' && seg.opening) {
          const op = seg.opening;
          const isDoor = op.type === 'door';

          return (
            <group key={`op-${idx}`} position={[segCenterRel, 0, 0]}>
              {isDoor ? (
                // --- DOOR OPENING ---
                <>
                  {/* Header wall above the door */}
                  {wallHeight > op.height && (
                    <mesh
                      position={[0, op.height + (wallHeight - op.height) / 2, 0]}
                      castShadow
                      receiveShadow
                    >
                      <boxGeometry args={[segLen, wallHeight - op.height, wallThickness]} />
                      <meshStandardMaterial color={wallColor} roughness={0.6} />
                    </mesh>
                  )}
                  {/* 3D Door frame and leaf */}
                  <group position={[-segLen / 2, 0, 0]} rotation={[0, Math.PI / 4, 0]}> {/* slightly open */}
                    <mesh position={[segLen / 2, op.height / 2, 0]} castShadow>
                      <boxGeometry args={[segLen, op.height, 4]} />
                      <meshStandardMaterial color="#78350f" roughness={0.8} metalness={0.1} /> {/* brown wood */}
                    </mesh>
                    {/* Door handle */}
                    <mesh position={[segLen - 8, op.height / 2, 3]}>
                      <cylinderGeometry args={[0.5, 0.5, 5, 8]} />
                      <meshStandardMaterial color="#d97706" metalness={0.8} roughness={0.2} />
                    </mesh>
                  </group>
                </>
              ) : (
                // --- WINDOW OPENING ---
                <>
                  {/* Lower wall block below window */}
                  {op.elevation > 0 && (
                    <mesh position={[0, op.elevation / 2, 0]} castShadow receiveShadow>
                      <boxGeometry args={[segLen, op.elevation, wallThickness]} />
                      <meshStandardMaterial color={wallColor} roughness={0.6} />
                    </mesh>
                  )}
                  {/* Upper wall block above window */}
                  {wallHeight > op.elevation + op.height && (
                    <mesh
                      position={[
                        0,
                        op.elevation + op.height + (wallHeight - (op.elevation + op.height)) / 2,
                        0,
                      ]}
                      castShadow
                      receiveShadow
                    >
                      <boxGeometry
                        args={[
                          segLen,
                          wallHeight - (op.elevation + op.height),
                          wallThickness,
                        ]}
                      />
                      <meshStandardMaterial color={wallColor} roughness={0.6} />
                    </mesh>
                  )}
                  {/* 3D Glass pane and frame */}
                  <group position={[0, op.elevation + op.height / 2, 0]}>
                    {/* Glass pane */}
                    <mesh>
                      <boxGeometry args={[segLen - 2, op.height - 2, 2]} />
                      <meshStandardMaterial
                        color="#bae6fd"
                        transparent
                        opacity={0.4}
                        roughness={0.1}
                        metalness={0.9}
                      />
                    </mesh>
                    {/* Window Frame (dark slate) */}
                    <mesh>
                      <boxGeometry args={[segLen, op.height, wallThickness + 1]} />
                      <meshStandardMaterial color="#1e293b" wireframe />
                    </mesh>
                  </group>
                </>
              )}
            </group>
          );
        }
        return null;
      })}
    </group>
  );
};

// Procedural 3D Furniture models to avoid loading external assets
const ThreeDFurniture: React.FC<{ furniture: Furniture }> = ({ furniture }) => {
  const { type, x, y, rotation, width, length, height } = furniture;

  const renderModel = () => {
    switch (type) {
      case 'bed':
        return (
          <group>
            {/* Bed base frame (wood) */}
            <mesh position={[0, 15, 0]} castShadow receiveShadow>
              <boxGeometry args={[length, 30, width]} />
              <meshStandardMaterial color="#78350f" roughness={0.8} />
            </mesh>
            {/* Mattress (white/fabric) */}
            <mesh position={[0, 35, 0]} castShadow>
              <boxGeometry args={[length - 10, 18, width - 8]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.9} />
            </mesh>
            {/* Pillows */}
            <mesh position={[-length / 2 + 25, 46, 0]} castShadow>
              <boxGeometry args={[25, 6, width - 20]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.9} />
            </mesh>
            {/* Blanket sheet fold */}
            <mesh position={[20, 37, 0]} castShadow>
              <boxGeometry args={[length - 70, 16.5, width - 6]} />
              <meshStandardMaterial color="#0284c7" roughness={0.8} />
            </mesh>
          </group>
        );

      case 'sofa':
        return (
          <group>
            {/* Base cushions */}
            <mesh position={[0, 20, 0]} castShadow receiveShadow>
              <boxGeometry args={[length, 25, width]} />
              <meshStandardMaterial color="#334155" roughness={0.7} /> {/* slate gray */}
            </mesh>
            {/* Backrest cushion */}
            <mesh position={[0, 50, -width / 2 + 10]} castShadow>
              <boxGeometry args={[length, 45, 20]} />
              <meshStandardMaterial color="#1e293b" roughness={0.7} />
            </mesh>
            {/* Left armrest */}
            <mesh position={[-length / 2 + 10, 35, 0]} castShadow>
              <boxGeometry args={[20, 35, width]} />
              <meshStandardMaterial color="#1e293b" roughness={0.7} />
            </mesh>
            {/* Right armrest */}
            <mesh position={[length / 2 - 10, 35, 0]} castShadow>
              <boxGeometry args={[20, 35, width]} />
              <meshStandardMaterial color="#1e293b" roughness={0.7} />
            </mesh>
          </group>
        );

      case 'table':
        return (
          <group>
            {/* Table top (wood) */}
            <mesh position={[0, height - 3, 0]} castShadow receiveShadow>
              <boxGeometry args={[length, 6, width]} />
              <meshStandardMaterial color="#b45309" roughness={0.5} />
            </mesh>
            {/* Leg 1 */}
            <mesh position={[-length / 2 + 8, (height - 6) / 2, -width / 2 + 8]} castShadow>
              <cylinderGeometry args={[4, 4, height - 6, 8]} />
              <meshStandardMaterial color="#78350f" roughness={0.7} />
            </mesh>
            {/* Leg 2 */}
            <mesh position={[length / 2 - 8, (height - 6) / 2, -width / 2 + 8]} castShadow>
              <cylinderGeometry args={[4, 4, height - 6, 8]} />
              <meshStandardMaterial color="#78350f" roughness={0.7} />
            </mesh>
            {/* Leg 3 */}
            <mesh position={[-length / 2 + 8, (height - 6) / 2, width / 2 - 8]} castShadow>
              <cylinderGeometry args={[4, 4, height - 6, 8]} />
              <meshStandardMaterial color="#78350f" roughness={0.7} />
            </mesh>
            {/* Leg 4 */}
            <mesh position={[length / 2 - 8, (height - 6) / 2, width / 2 - 8]} castShadow>
              <cylinderGeometry args={[4, 4, height - 6, 8]} />
              <meshStandardMaterial color="#78350f" roughness={0.7} />
            </mesh>
          </group>
        );

      case 'chair':
        return (
          <group>
            {/* Seat cushion */}
            <mesh position={[0, 45, 0]} castShadow>
              <boxGeometry args={[length, 6, width]} />
              <meshStandardMaterial color="#475569" roughness={0.7} />
            </mesh>
            {/* Backrest */}
            <mesh position={[0, 75, -width / 2 + 3]} castShadow>
              <boxGeometry args={[length, 60, 6]} />
              <meshStandardMaterial color="#334155" roughness={0.7} />
            </mesh>
            {/* Four thin metal legs */}
            <mesh position={[-length / 2 + 4, 22.5, -width / 2 + 4]} castShadow>
              <cylinderGeometry args={[1.5, 1.5, 45, 8]} />
              <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[length / 2 - 4, 22.5, -width / 2 + 4]} castShadow>
              <cylinderGeometry args={[1.5, 1.5, 45, 8]} />
              <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[-length / 2 + 4, 22.5, width / 2 - 4]} castShadow>
              <cylinderGeometry args={[1.5, 1.5, 45, 8]} />
              <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[length / 2 - 4, 22.5, width / 2 - 4]} castShadow>
              <cylinderGeometry args={[1.5, 1.5, 45, 8]} />
              <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        );

      case 'toilet':
        return (
          <group>
            {/* Bowl */}
            <mesh position={[0, 20, 5]} castShadow>
              <cylinderGeometry args={[18, 14, 40, 16]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.1} />
            </mesh>
            {/* Cistern tank */}
            <mesh position={[0, 60, -width / 2 + 10]} castShadow>
              <boxGeometry args={[40, 40, 20]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.1} />
            </mesh>
            {/* Seat lid (gray) */}
            <mesh position={[0, 41.5, 5]} castShadow>
              <boxGeometry args={[34, 3, 38]} />
              <meshStandardMaterial color="#cbd5e1" roughness={0.4} />
            </mesh>
          </group>
        );

      case 'sink':
        return (
          <group>
            {/* Cabinet base */}
            <mesh position={[0, 38, 0]} castShadow receiveShadow>
              <boxGeometry args={[length, 76, width]} />
              <meshStandardMaterial color="#1e293b" roughness={0.8} /> {/* dark frame */}
            </mesh>
            {/* Basin top (ceramic white) */}
            <mesh position={[0, 78, 0]} castShadow>
              <boxGeometry args={[length + 2, 4, width + 2]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.2} />
            </mesh>
            {/* Tap fixture (chrome metal) */}
            <mesh position={[0, 84, -width / 2 + 8]} castShadow>
              <cylinderGeometry args={[1.5, 1.5, 12, 8]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
            </mesh>
          </group>
        );

      default:
        return (
          <mesh position={[0, height / 2, 0]} castShadow>
            <boxGeometry args={[length, height, width]} />
            <meshStandardMaterial color="#3b82f6" opacity={0.6} transparent />
          </mesh>
        );
    }
  };

  return (
    <group position={[x, 0, y]} rotation={[0, rotation, 0]}>
      {renderModel()}
    </group>
  );
};

// Floor component to render room tiles/concrete slab
const RoomFloor: React.FC<{ room: DetectedRoom }> = ({ room }) => {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    if (room.points.length === 0) return s;
    s.moveTo(room.points[0].x, -room.points[0].y);
    for (let i = 1; i < room.points.length; i++) {
      s.lineTo(room.points[i].x, -room.points[i].y);
    }
    s.closePath();
    return s;
  }, [room.points]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]} receiveShadow>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial 
        color="#e2e8f0" 
        roughness={0.5} 
        metalness={0.15} 
        side={THREE.DoubleSide} 
      />
    </mesh>
  );
};

// Roof component to render flat slab or pitched gable roof
const RoomRoof: React.FC<{
  room: DetectedRoom;
  walls: Wall[];
  roofStyle: 'none' | 'flat' | 'gable';
}> = ({ room, walls, roofStyle }) => {
  const wallHeight = useMemo(() => {
    let maxHeight = 280;
    for (let i = 0; i < room.pointIds.length; i++) {
      const p1Id = room.pointIds[i];
      const p2Id = room.pointIds[(i + 1) % room.pointIds.length];
      const wall = walls.find(
        (w) => (w.p1Id === p1Id && w.p2Id === p2Id) || (w.p1Id === p2Id && w.p2Id === p1Id)
      );
      if (wall && wall.height > maxHeight) {
        maxHeight = wall.height;
      }
    }
    return maxHeight;
  }, [room.pointIds, walls]);

  const shape = useMemo(() => {
    const s = new THREE.Shape();
    if (room.points.length === 0) return s;
    s.moveTo(room.points[0].x, -room.points[0].y);
    for (let i = 1; i < room.points.length; i++) {
      s.lineTo(room.points[i].x, -room.points[i].y);
    }
    s.closePath();
    return s;
  }, [room.points]);

  // Flat concrete slab roof extrusion settings (15cm depth)
  const flatExtrudeSettings = useMemo(() => ({
    depth: 15,
    bevelEnabled: false,
  }), []);

  // Compute bounding box for Pitched Gable roof details
  const bbox = useMemo(() => {
    if (room.points.length === 0) {
      return { width: 0, depth: 0, centerX: 0, centerY: 0, minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    room.points.forEach((p) => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });
    return {
      width: maxX - minX,
      depth: maxY - minY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
      minX,
      maxX,
      minY,
      maxY,
    };
  }, [room.points]);

  if (roofStyle === 'none') return null;

  if (roofStyle === 'flat') {
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, wallHeight, 0]} castShadow receiveShadow>
        <extrudeGeometry args={[shape, flatExtrudeSettings]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.7} metalness={0.1} />
      </mesh>
    );
  }

  if (roofStyle === 'gable') {
    const { width, depth, centerX, centerY, minX, maxX, minY, maxY } = bbox;
    if (width === 0 || depth === 0) return null;

    // Pitch parameters
    const pitchHeight = 120; // 120 cm high peak ridge
    const eaveOverhang = 30; // 30 cm overhang beyond walls
    const gableOverhang = 20; // 20 cm extension beyond ends
    const panelThickness = 4; // 4 cm thick roof panels
    const gableWallThickness = 15; // 15 cm thick end triangular wall

    const isWidthLonger = width >= depth;
    const halfSpan = isWidthLonger ? depth / 2 : width / 2;
    const pitchAngle = Math.atan2(pitchHeight, halfSpan);
    const slopeLen = Math.sqrt(pitchHeight * pitchHeight + halfSpan * halfSpan);
    const totalSlopeLen = slopeLen + eaveOverhang;

    // Standard Zambian IBR sheet charcoal color
    const roofSheetColor = '#2f3e46';
    const gableWallColor = '#cbd5e1'; // matches block walls

    // Setup shapes and extrusion settings for gable end walls (triangles)
    const triangleShape = new THREE.Shape();
    triangleShape.moveTo(-halfSpan, 0);
    triangleShape.lineTo(halfSpan, 0);
    triangleShape.lineTo(0, pitchHeight);
    triangleShape.closePath();

    const gableExtrudeSettings = {
      depth: gableWallThickness,
      bevelEnabled: false,
    };

    if (isWidthLonger) {
      // Case A: Ridge runs along X-axis
      return (
        <group>
          {/* Sloped panel 1: facing towards positive Z (+Y in 2D) */}
          <mesh
            position={[
              centerX,
              (wallHeight + pitchHeight) - (totalSlopeLen / 2) * Math.sin(pitchAngle),
              centerY + (totalSlopeLen / 2) * Math.cos(pitchAngle),
            ]}
            rotation={[pitchAngle, 0, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[width + 2 * gableOverhang, panelThickness, totalSlopeLen]} />
            <meshStandardMaterial color={roofSheetColor} roughness={0.5} metalness={0.3} />
          </mesh>

          {/* Sloped panel 2: facing towards negative Z (-Y in 2D) */}
          <mesh
            position={[
              centerX,
              (wallHeight + pitchHeight) - (totalSlopeLen / 2) * Math.sin(pitchAngle),
              centerY - (totalSlopeLen / 2) * Math.cos(pitchAngle),
            ]}
            rotation={[-pitchAngle, 0, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[width + 2 * gableOverhang, panelThickness, totalSlopeLen]} />
            <meshStandardMaterial color={roofSheetColor} roughness={0.5} metalness={0.3} />
          </mesh>

          {/* Gable Wall 1: at minX (left side) facing positive X (inside extrusion) */}
          <mesh
            position={[minX, wallHeight, centerY]}
            rotation={[0, Math.PI / 2, 0]}
            castShadow
            receiveShadow
          >
            <extrudeGeometry args={[triangleShape, gableExtrudeSettings]} />
            <meshStandardMaterial color={gableWallColor} roughness={0.6} />
          </mesh>

          {/* Gable Wall 2: at maxX (right side) facing negative X (inside extrusion) */}
          <mesh
            position={[maxX, wallHeight, centerY]}
            rotation={[0, -Math.PI / 2, 0]}
            castShadow
            receiveShadow
          >
            <extrudeGeometry args={[triangleShape, gableExtrudeSettings]} />
            <meshStandardMaterial color={gableWallColor} roughness={0.6} />
          </mesh>
        </group>
      );
    } else {
      // Case B: Ridge runs along Y-axis (Z-axis in 3D)
      return (
        <group>
          {/* Sloped panel 1: facing towards positive X */}
          <mesh
            position={[
              centerX + (totalSlopeLen / 2) * Math.cos(pitchAngle),
              (wallHeight + pitchHeight) - (totalSlopeLen / 2) * Math.sin(pitchAngle),
              centerY,
            ]}
            rotation={[0, 0, -pitchAngle]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[totalSlopeLen, panelThickness, depth + 2 * gableOverhang]} />
            <meshStandardMaterial color={roofSheetColor} roughness={0.5} metalness={0.3} />
          </mesh>

          {/* Sloped panel 2: facing towards negative X */}
          <mesh
            position={[
              centerX - (totalSlopeLen / 2) * Math.cos(pitchAngle),
              (wallHeight + pitchHeight) - (totalSlopeLen / 2) * Math.sin(pitchAngle),
              centerY,
            ]}
            rotation={[0, 0, pitchAngle]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[totalSlopeLen, panelThickness, depth + 2 * gableOverhang]} />
            <meshStandardMaterial color={roofSheetColor} roughness={0.5} metalness={0.3} />
          </mesh>

          {/* Gable Wall 1: at minY (front side) facing positive Z (inside extrusion) */}
          <mesh
            position={[centerX, wallHeight, minY]}
            rotation={[0, 0, 0]}
            castShadow
            receiveShadow
          >
            <extrudeGeometry args={[triangleShape, gableExtrudeSettings]} />
            <meshStandardMaterial color={gableWallColor} roughness={0.6} />
          </mesh>

          {/* Gable Wall 2: at maxY (back side) facing negative Z (inside extrusion) */}
          <mesh
            position={[centerX, wallHeight, maxY]}
            rotation={[0, Math.PI, 0]}
            castShadow
            receiveShadow
          >
            <extrudeGeometry args={[triangleShape, gableExtrudeSettings]} />
            <meshStandardMaterial color={gableWallColor} roughness={0.6} />
          </mesh>
        </group>
      );
    }
  }

  return null;
};

// Skybox configurations for atmospheric adjustments
const SKYBOX_SETTINGS: Record<
  string,
  {
    fogColor: string;
    fogNear: number;
    fogFar: number;
    ambientIntensity: number;
    ambientColor: string;
    sunIntensity: number;
    sunColor: string;
  }
> = {
  procedural: {
    fogColor: '#bae6fd',
    fogNear: 1500,
    fogFar: 8000,
    ambientIntensity: 1.2,
    ambientColor: '#ffffff',
    sunIntensity: 1.8,
    sunColor: '#ffffff',
  },
  sunny: {
    fogColor: '#bae6fd',
    fogNear: 1500,
    fogFar: 8000,
    ambientIntensity: 1.2,
    ambientColor: '#ffffff',
    sunIntensity: 1.8,
    sunColor: '#ffffff',
  },
  sunset: {
    fogColor: '#fda4af', // rose/pink horizon
    fogNear: 1000,
    fogFar: 6000,
    ambientIntensity: 0.6,
    ambientColor: '#fecdd3', // soft pink fill
    sunIntensity: 1.0,
    sunColor: '#ea580c', // deep orange sun
  },
  cloudy: {
    fogColor: '#cbd5e1',
    fogNear: 800,
    fogFar: 5000,
    ambientIntensity: 1.4, // diffused flat light
    ambientColor: '#e2e8f0',
    sunIntensity: 0.5,
    sunColor: '#ffffff',
  },
  night: {
    fogColor: '#090d16',
    fogNear: 800,
    fogFar: 4000,
    ambientIntensity: 0.2, // dark ambient
    ambientColor: '#1e1b4b', // deep indigo moonlight fill
    sunIntensity: 0.15,
    sunColor: '#bae6fd', // soft blue moon
  },
  mountain: {
    fogColor: '#bae6fd',
    fogNear: 1500,
    fogFar: 8000,
    ambientIntensity: 1.2,
    ambientColor: '#ffffff',
    sunIntensity: 1.8,
    sunColor: '#ffffff',
  },
  city: {
    fogColor: '#bae6fd',
    fogNear: 1500,
    fogFar: 8000,
    ambientIntensity: 1.2,
    ambientColor: '#ffffff',
    sunIntensity: 1.8,
    sunColor: '#ffffff',
  },
};

// Skybox Loader Component using CubeTextureLoader and Equirectangular Texture Loader
const Skybox: React.FC<{ type: string }> = ({ type }) => {
  const { scene } = useThree();

  useEffect(() => {
    if (type === 'procedural') {
      scene.background = null;
      return;
    }

    const cubeLoader = new THREE.CubeTextureLoader();
    const path = `/skyboxes/${type}/`;
    
    // 1. First, attempt to load as a 6-image cubemap
    cubeLoader.setPath(path).load(
      ['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg'],
      (texture) => {
        scene.background = texture;
      },
      undefined,
      () => {
        // 2. If 6-image cubemap fails, attempt to load as a single panoramic equirectangular image named sky.jpg
        const singleLoader = new THREE.TextureLoader();
        singleLoader.load(
          `${path}sky.jpg`,
          (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.mapping = THREE.EquirectangularReflectionMapping;
            scene.background = texture;
          },
          undefined,
          (err) => {
            console.warn(`Could not load skybox from ${path} (tried 6-image cubemap and single sky.jpg). Falling back to procedural sky.`, err);
            scene.background = null;
          }
        );
      }
    );

    return () => {
      scene.background = null;
    };
  }, [type, scene]);

  return null;
};

// Helper component to render the grass plot base with texture mapping
const GrassPlot: React.FC<{
  centerOfScene: THREE.Vector3;
}> = ({ centerOfScene }) => {
  const [colorMap, normalMap] = useTexture([
    '/textures/grass_color.jpg',
    '/textures/grass_normal.jpg',
  ]);

  useEffect(() => {
    [colorMap, normalMap].forEach((texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(120, 120); // 120 repeats for realistic grass/moss scale
    });
  }, [colorMap, normalMap]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerOfScene.x, -3, centerOfScene.z]} receiveShadow>
      <planeGeometry args={[10000, 10000]} />
      <meshStandardMaterial 
        map={colorMap}
        normalMap={normalMap}
        roughness={0.9} 
      />
    </mesh>
  );
};

// Custom R3F component to handle First-Person WASD and mouse look controls
const FirstPersonControlsImpl: React.FC<{
  cameraPos: { x: number; y: number };
  cameraTarget: { x: number; y: number };
  updateCameraPos: (pos: { x: number; y: number }) => void;
  updateCameraTarget: (target: { x: number; y: number }) => void;
}> = ({ cameraPos, cameraTarget, updateCameraPos, updateCameraTarget }) => {
  const { camera } = useThree();
  const keys = useRef({ w: false, a: false, s: false, d: false, sprint: false, crouch: false, space: false });
  const lastCameraDir = useRef(new THREE.Vector3());
  const lastCameraPos = useRef(new THREE.Vector3());
  const lastSyncTime = useRef(0);

  // Jump and crouch physics state
  const yVelocity = useRef(0);
  const isJumping = useRef(false);
  const currentHeight = useRef(160); // current smooth eye level height

  useEffect(() => {
    // Set initial position and target direction when mounting
    camera.position.set(cameraPos.x, 160, cameraPos.y);
    camera.lookAt(new THREE.Vector3(cameraTarget.x, 150, cameraTarget.y));
    
    // Set baseline coordinates
    lastCameraPos.current.copy(camera.position);
    camera.getWorldDirection(lastCameraDir.current);

    return () => {
      // Reset FOV to default 50 when exiting First Person mode
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = 50;
        camera.updateProjectionMatrix();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not process controls if focus is on input fields
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }

      const code = e.code.toLowerCase();
      if (code === 'keyw' || code === 'arrowup') keys.current.w = true;
      if (code === 'keys' || code === 'arrowdown') keys.current.s = true;
      if (code === 'keya' || code === 'arrowleft') keys.current.a = true;
      if (code === 'keyd' || code === 'arrowright') keys.current.d = true;
      if (code === 'shiftleft' || code === 'shiftright') keys.current.sprint = true;
      if (code === 'keyc') keys.current.crouch = true;
      
      if (code === 'space') {
        // Prevent browser scrolling
        if (document.pointerLockElement !== null) {
          e.preventDefault();
        }
        keys.current.space = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code.toLowerCase();
      if (code === 'keyw' || code === 'arrowup') keys.current.w = false;
      if (code === 'keys' || code === 'arrowdown') keys.current.s = false;
      if (code === 'keya' || code === 'arrowleft') keys.current.a = false;
      if (code === 'keyd' || code === 'arrowright') keys.current.d = false;
      if (code === 'shiftleft' || code === 'shiftright') keys.current.sprint = false;
      if (code === 'keyc') keys.current.crouch = false;
      if (code === 'space') keys.current.space = false;
    };

    const handleWheel = (e: WheelEvent) => {
      const isLocked = document.pointerLockElement !== null;
      if (!isLocked) return;

      const zoomSpeed = 2.5; // degrees of FOV shift per scroll step
      const minFov = 10;
      const maxFov = 110;

      if (camera instanceof THREE.PerspectiveCamera) {
        const targetFov = camera.fov + (e.deltaY > 0 ? zoomSpeed : -zoomSpeed);
        camera.fov = Math.max(minFov, Math.min(maxFov, targetFov));
        camera.updateProjectionMatrix();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('wheel', handleWheel, { passive: false });

    // Force sync state to store on lock/unlock changes
    const handlePointerLockChange = () => {
      if (document.pointerLockElement === null) {
        const currentDir = new THREE.Vector3();
        camera.getWorldDirection(currentDir);
        updateCameraPos({ x: camera.position.x, y: camera.position.z });
        
        const target = new THREE.Vector3();
        target.copy(currentDir).multiplyScalar(150).add(camera.position);
        updateCameraTarget({ x: target.x, y: target.z });
      }
    };
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('wheel', handleWheel);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, [camera, updateCameraPos, updateCameraTarget]);

  const direction = new THREE.Vector3();
  const frontVector = new THREE.Vector3();
  const sideVector = new THREE.Vector3();

  useFrame((_, delta) => {
    const isLocked = document.pointerLockElement !== null;
    if (!isLocked) return;

    // Crouch height and speed modifiers
    const targetGroundHeight = keys.current.crouch ? 100 : 160;
    const speed = keys.current.crouch ? 180 : keys.current.sprint ? 700 : 350;

    // Movement:
    camera.getWorldDirection(direction);
    direction.y = 0; // horizontal lock
    direction.normalize();

    const side = new THREE.Vector3(-direction.z, 0, direction.x).normalize();

    frontVector.set(0, 0, 0);
    sideVector.set(0, 0, 0);

    if (keys.current.w) frontVector.copy(direction);
    if (keys.current.s) frontVector.copy(direction).negate();
    if (keys.current.d) sideVector.copy(side);
    if (keys.current.a) sideVector.copy(side).negate();

    const move = new THREE.Vector3().addVectors(frontVector, sideVector);
    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(speed * delta);
      camera.position.add(move);
    }

    // Jump logic trigger
    if (keys.current.space && !isJumping.current) {
      yVelocity.current = 450; // Jump impulse in cm/s
      isJumping.current = true;
    }

    // Gravity and eye height updates
    const gravity = 980; // gravity acceleration in cm/s^2 (9.8m/s^2)
    const crouchLerpSpeed = 10;

    if (!isJumping.current) {
      // Smoothly transition standing/crouching eye height
      currentHeight.current += (targetGroundHeight - currentHeight.current) * crouchLerpSpeed * delta;
      camera.position.y = currentHeight.current;
    } else {
      // Free falling jump simulation
      yVelocity.current -= gravity * delta;
      camera.position.y += yVelocity.current * delta;

      // Update baseline crouch/stand height so we land seamlessly
      currentHeight.current += (targetGroundHeight - currentHeight.current) * crouchLerpSpeed * delta;

      if (camera.position.y <= currentHeight.current) {
        camera.position.y = currentHeight.current;
        yVelocity.current = 0;
        isJumping.current = false;
      }
    }

    // Check if camera moved or looked in a new direction
    const currentDir = new THREE.Vector3();
    camera.getWorldDirection(currentDir);

    const now = performance.now();
    const posChanged = camera.position.distanceToSquared(lastCameraPos.current) > 0.1;
    const dirChanged = currentDir.distanceToSquared(lastCameraDir.current) > 0.001;

    // Sync state back to store (throttled to 100ms for performance)
    if ((posChanged || dirChanged) && now - lastSyncTime.current > 100) {
      updateCameraPos({ x: camera.position.x, y: camera.position.z });
      
      const target = new THREE.Vector3();
      target.copy(currentDir).multiplyScalar(150).add(camera.position);
      updateCameraTarget({ x: target.x, y: target.z });

      lastCameraPos.current.copy(camera.position);
      lastCameraDir.current.copy(currentDir);
      lastSyncTime.current = now;
    }
  });

  return null;
};

// Custom controller component inside the R3F Canvas to sync store coordinates with Three camera/OrbitControls
const CameraObserverController: React.FC<{
  cameraPos: { x: number; y: number };
  cameraTarget: { x: number; y: number };
  lastSyncRef: React.MutableRefObject<{ posX: number; posY: number; targetX: number; targetY: number } | null>;
  isMini: boolean;
}> = ({ cameraPos, cameraTarget, lastSyncRef, isMini }) => {
  const { camera, controls } = useThree();

  useEffect(() => {
    // Check if the store's values are different from the ones we just saved from OrbitControls
    const hasChanged = !lastSyncRef.current || 
      Math.abs(lastSyncRef.current.posX - cameraPos.x) > 1 ||
      Math.abs(lastSyncRef.current.posY - cameraPos.y) > 1 ||
      Math.abs(lastSyncRef.current.targetX - cameraTarget.x) > 1 ||
      Math.abs(lastSyncRef.current.targetY - cameraTarget.y) > 1;

    if (hasChanged) {
      // 2D coordinates map to ThreeJS X and Z axes. Height represents elevation.
      // When 2D shifts, reset target and lookAt to clean eye level (160cm pos, 150cm target)
      camera.position.set(cameraPos.x, 160, cameraPos.y);
      
      if (controls) {
        const ctrl = controls as any;
        ctrl.target.set(cameraTarget.x, 150, cameraTarget.y);
        ctrl.update();
      } else {
        camera.lookAt(new THREE.Vector3(cameraTarget.x, 150, cameraTarget.y));
      }
    }
  }, [cameraPos.x, cameraPos.y, cameraTarget.x, cameraTarget.y, camera, controls, isMini, lastSyncRef]);

  return null;
};

export const Editor3D: React.FC<{ isMini?: boolean }> = ({ isMini = false }) => {
  const {
    points,
    walls,
    openings,
    furniture,
    selectedSkybox,
    cameraPos,
    cameraTarget,
    updateCameraPos,
    updateCameraTarget,
    showFloors,
    showRoofs,
    roofStyle,
  } = useStore();

  const [controlMode, setControlMode] = useState<'orbit' | 'fps'>('orbit');
  const [isPointerLocked, setIsPointerLocked] = useState(false);

  const lastSyncRef = useRef<{ posX: number; posY: number; targetX: number; targetY: number } | null>(null);

  useEffect(() => {
    if (controlMode !== 'fps') {
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
      setIsPointerLocked(false);
      return;
    }

    const handleLockChange = () => {
      setIsPointerLocked(document.pointerLockElement !== null);
    };

    document.addEventListener('pointerlockchange', handleLockChange);
    return () => {
      document.removeEventListener('pointerlockchange', handleLockChange);
    };
  }, [controlMode]);

  // 1. Calculate floor plan bounding box center to align OrbitControls initially if camera is un-panned
  const centerOfScene = useMemo(() => {
    const pointList = Object.values(points);
    if (pointList.length === 0) return new THREE.Vector3(500, 0, 350);

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    pointList.forEach((p) => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });

    return new THREE.Vector3((minX + maxX) / 2, 0, (minY + maxY) / 2);
  }, [points]);

  const handleControlsEnd = (e: any) => {
    const ctrl = e?.target;
    if (ctrl) {
      const target = ctrl.target;
      const cam = ctrl.object;
      
      lastSyncRef.current = {
        posX: cam.position.x,
        posY: cam.position.z,
        targetX: target.x,
        targetY: target.z,
      };
      
      updateCameraPos({ x: cam.position.x, y: cam.position.z });
      updateCameraTarget({ x: target.x, y: target.z });
    }
  };

  const settings = SKYBOX_SETTINGS[selectedSkybox] || SKYBOX_SETTINGS.procedural;

  const detectedRooms = useMemo(() => findRooms(points, walls), [points, walls]);

  return (
    <div className="w-full h-full bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm relative">
      {/* 3D View Helper Overlay */}
      {!isMini && (
        <div className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-lg text-xs font-mono text-slate-100 shadow-md pointer-events-none select-none">
          {controlMode === 'orbit'
            ? '3D Orbit Mode | Left-click drag to rotate, Scroll to zoom, Right-click drag to pan.'
            : isPointerLocked
            ? 'Walk Mode Active | Mouse to look, WASD to walk, Shift to sprint, C to crouch, Space to jump. ESC to unlock mouse.'
            : 'Walk Mode Active | Click screen to lock mouse. WASD to walk, Shift to sprint, C to crouch, Space to jump.'}
        </div>
      )}

      {/* Control Mode Toggle Panel */}
      {!isMini && (
        <div className="absolute top-4 right-4 z-10 flex bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg p-1 shadow-md select-none">
          <button
            onClick={() => setControlMode('orbit')}
            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              controlMode === 'orbit'
                ? 'bg-slate-900 text-white shadow-sm font-extrabold'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            Orbit Cam
          </button>
          <button
            onClick={() => setControlMode('fps')}
            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              controlMode === 'fps'
                ? 'bg-slate-900 text-white shadow-sm font-extrabold'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            First Person
          </button>
        </div>
      )}

      <Canvas
        shadows={!isMini}
        // Initialize camera at the observer position
        camera={{ position: [cameraPos.x, 160, cameraPos.y], fov: 50, far: 15000 }}
        className="w-full h-full"
        onCreated={({ gl }) => {
          gl.setClearColor(settings.fogColor);
        }}
      >
        {isMini || controlMode === 'orbit' ? (
          <>
            <CameraObserverController
              cameraPos={cameraPos}
              cameraTarget={cameraTarget}
              lastSyncRef={lastSyncRef}
              isMini={isMini}
            />
            <OrbitControls
              maxPolarAngle={Math.PI / 2.1} // prevent going below ground
              minDistance={100}
              maxDistance={2500}
              enableZoom={!isMini} // Prevent scroll trapping in right sidebar preview
              enablePan={!isMini}
              onEnd={handleControlsEnd}
            />
          </>
        ) : (
          <>
            <PointerLockControls />
            <FirstPersonControlsImpl
              cameraPos={cameraPos}
              cameraTarget={cameraTarget}
              updateCameraPos={updateCameraPos}
              updateCameraTarget={updateCameraTarget}
            />
          </>
        )}

        {selectedSkybox === 'procedural' ? (
          <Sky
            distance={12000} // Place sky dome inside camera far plane (15000) to render completely
            sunPosition={[500, 800, 600]}
            turbidity={8}
            rayleigh={1.5}
            mieCoefficient={0.005}
            mieDirectionalG={0.8}
          />
        ) : (
          <Skybox type={selectedSkybox} />
        )}
        
        {/* Fog dynamically blends background with ground plane */}
        <fog attach="fog" args={[settings.fogColor, settings.fogNear, settings.fogFar]} />
        
        <ambientLight intensity={settings.ambientIntensity} color={settings.ambientColor} />
        
        {/* Directional Sun lighting with shadows, disabled in mini-preview for maximum performance */}
        <directionalLight
          position={[500, 800, 600]}
          intensity={settings.sunIntensity}
          color={settings.sunColor}
          castShadow={!isMini}
          shadow-mapSize-width={512} // optimized from 1024 for smoother frame rates on all devices
          shadow-mapSize-height={512}
          shadow-camera-far={2500}
          shadow-camera-left={-600}
          shadow-camera-right={600}
          shadow-camera-top={600}
          shadow-camera-bottom={-600}
        />

        {/* Subtle fill light */}
        <directionalLight position={[-400, 200, -300]} intensity={0.5} color="#ffffff" />

        <group>


          {/* B. Grass plot surrounding building */}
          <Suspense fallback={
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerOfScene.x, -3, centerOfScene.z]} receiveShadow>
              <planeGeometry args={[10000, 10000]} />
              <meshStandardMaterial color="#38a169" roughness={0.9} />
            </mesh>
          }>
            <GrassPlot centerOfScene={centerOfScene} />
          </Suspense>

          {/* C. Grid helper overlay on the slab */}
          {isMini && (
            <gridHelper args={[2000, 40, '#475569', '#94a3b8']} position={[centerOfScene.x, -1.9, centerOfScene.z]} />
          )}

          {/* D. Walls Rendering */}
          {walls.map((wall) => (
            <ExtrudedWall
              key={wall.id}
              wall={wall}
              points={points}
              openings={openings}
            />
          ))}

          {/* E. Furniture Rendering */}
          {furniture.map((f) => (
            <ThreeDFurniture key={f.id} furniture={f} />
          ))}

          {/* F. Floor Rendering */}
          {showFloors &&
            detectedRooms.map((room) => (
              <RoomFloor key={`floor-${room.key}`} room={room} />
            ))}

          {/* G. Roof Rendering */}
          {showRoofs &&
            detectedRooms.map((room) => (
              <RoomRoof
                key={`roof-${room.key}`}
                room={room}
                walls={walls}
                roofStyle={roofStyle}
              />
            ))}
        </group>
      </Canvas>
    </div>
  );
};
export default Editor3D;
