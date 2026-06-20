/* eslint-disable react-hooks/set-state-in-effect, @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { ZoomIn, ZoomOut, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { snapToGrid, projectPointOnSegment, getDistance } from '../utils/geometry';
import { findRooms } from '../utils/roomFinder';

export const Editor2D: React.FC = () => {
  const {
    points,
    walls,
    openings,
    furniture,
    selectedTool,
    selectedElementId,
    selectedElementType,
    selectedFurnitureType,
    gridSize,
    showGrid,
    roomNames,
    addPoint,
    addWall,
    addOpening,
    addFurniture,
    updatePoint,
    updateFurniture,
    selectElement,
    deleteElement,
    setSelectedTool,
    cameraPos,
    cameraTarget,
    updateCameraPos,
    updateCameraTarget,
  } = useStore();

  const svgRef = useRef<SVGSVGElement>(null);
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });
  const [drawingStartId, setDrawingStartId] = useState<string | null>(null);
  const [draggingPointId, setDraggingPointId] = useState<string | null>(null);
  
  // Drag states for furniture dragging
  const [draggingFurnitureId, setDraggingFurnitureId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Alignment snapping guidelines
  const [activeGuideX, setActiveGuideX] = useState<number | null>(null);
  const [activeGuideY, setActiveGuideY] = useState<number | null>(null);
  
  // Room hover states
  const [hoverRoomKey, setHoverRoomKey] = useState<string | null>(null);
  
  // Hover states for insertions (doors/windows)
  const [hoverWall, setHoverWall] = useState<{ id: string; t: number; x: number; y: number } | null>(null);

  // Zoom and Pan states
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [spacePressed, setSpacePressed] = useState(false);

  // Drag states for camera observer
  const [draggingCamera, setDraggingCamera] = useState(false);
  const [draggingTarget, setDraggingTarget] = useState(false);

  // Handle spacebar events for panning cursor/mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const activeEl = document.activeElement;
        const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT' || activeEl.tagName === 'TEXTAREA');
        if (!isInput) {
          e.preventDefault();
          setSpacePressed(true);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handle arrow keys and WASD for grid panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'SELECT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.getAttribute('contenteditable') === 'true'
      );
      if (isInput) return;

      const step = 40; // pan step size in pixels
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          setPan((prev) => ({ ...prev, y: prev.y + step }));
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          setPan((prev) => ({ ...prev, y: prev.y - step }));
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          setPan((prev) => ({ ...prev, x: prev.x + step }));
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          setPan((prev) => ({ ...prev, x: prev.x - step }));
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  // Zoom to cursor wheel event handler
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const zoomFactor = 1.1;
      setZoom((prevZoom) => {
        const nextZoom = e.deltaY < 0 ? prevZoom * zoomFactor : prevZoom / zoomFactor;
        const newZoom = Math.max(0.15, Math.min(nextZoom, 8));
        
        setPan((prevPan) => {
          const newPanX = mouseX - (mouseX - prevPan.x) * (newZoom / prevZoom);
          const newPanY = mouseY - (mouseY - prevPan.y) * (newZoom / prevZoom);
          return { x: newPanX, y: newPanY };
        });
        
        return newZoom;
      });
    };
    
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      svg.removeEventListener('wheel', onWheel);
    };
  }, [zoom]);

  // Clear states if tool changes
  useEffect(() => {
    setDrawingStartId(null);
    setHoverWall(null);
    setActiveGuideX(null);
    setActiveGuideY(null);
  }, [selectedTool]);

  // Handle keyboard Escape to cancel drawing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawingStartId(null);
        setHoverWall(null);
        setActiveGuideX(null);
        setActiveGuideY(null);
        setSelectedTool('select');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSelectedTool]);

  // Convert client coordinates to SVG user coordinates, taking pan and zoom into account using SVG transform matrix
  const getSVGCoords = (e: React.MouseEvent<any>): { x: number; y: number } => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    
    const point = svg.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;
    
    const group = svg.querySelector('#transformed-group') as SVGGraphicsElement | null;
    if (group) {
      const ctm = group.getScreenCTM();
      if (ctm) {
        const transformedPoint = point.matrixTransform(ctm.inverse());
        return { x: transformedPoint.x, y: transformedPoint.y };
      }
    }
    
    const ctm = svg.getScreenCTM();
    if (ctm) {
      const transformedPoint = point.matrixTransform(ctm.inverse());
      return { x: transformedPoint.x, y: transformedPoint.y };
    }
    
    return { x: 0, y: 0 };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    const coords = getSVGCoords(e);
    
    // 1. Calculate Grid Snapping
    let snappedX = snapToGrid(coords.x, gridSize);
    let snappedY = snapToGrid(coords.y, gridSize);

    // Handle camera dragging
    if (draggingCamera) {
      updateCameraPos({ x: snappedX, y: snappedY });
      return;
    }
    if (draggingTarget) {
      updateCameraTarget({ x: snappedX, y: snappedY });
      return;
    }

    // 2. Handle Ortho-Lock (Hold Shift key during drawing)
    if (e.shiftKey && drawingStartId && selectedTool === 'wall') {
      const startPt = points[drawingStartId];
      if (startPt) {
        const dx = Math.abs(coords.x - startPt.x);
        const dy = Math.abs(coords.y - startPt.y);
        if (dx > dy) {
          snappedY = startPt.y;
          snappedX = snapToGrid(coords.x, gridSize);
        } else {
          snappedX = startPt.x;
          snappedY = snapToGrid(coords.y, gridSize);
        }
      }
    }

    // 3. Handle Alignment Guidelines Snapping (to other points)
    let guideX: number | null = null;
    let guideY: number | null = null;
    const alignThreshold = 10; // snap to matching lines within 10px

    Object.values(points).forEach((pt) => {
      // Don't align to the point currently being dragged
      if (draggingPointId && pt.id === draggingPointId) return;

      if (Math.abs(snappedX - pt.x) <= alignThreshold) {
        snappedX = pt.x;
        guideX = pt.x;
      }
      if (Math.abs(snappedY - pt.y) <= alignThreshold) {
        snappedY = pt.y;
        guideY = pt.y;
      }
    });

    setMouseCoords({ x: snappedX, y: snappedY });
    setActiveGuideX(guideX);
    setActiveGuideY(guideY);

    // 4. Update Point Dragging
    if (draggingPointId) {
      updatePoint(draggingPointId, snappedX, snappedY);
      return;
    }

    // 5. Update Furniture Dragging
    if (draggingFurnitureId) {
      updateFurniture(draggingFurnitureId, {
        x: snappedX - dragOffset.x,
        y: snappedY - dragOffset.y,
      });
      return;
    }

    // 6. Handle Opening (Door/Window) placement previews
    if (selectedTool === 'door' || selectedTool === 'window') {
      let closestWall: { id: string; t: number; x: number; y: number; dist: number } | null = null;

      walls.forEach((wall) => {
        const p1 = points[wall.p1Id];
        const p2 = points[wall.p2Id];
        if (!p1 || !p2) return;

        const proj = projectPointOnSegment(coords, p1, p2);
        if (proj.distance < 25) { // within 25px threshold
          if (!closestWall || proj.distance < closestWall.dist) {
            closestWall = {
              id: wall.id,
              t: proj.t,
              x: proj.x,
              y: proj.y,
              dist: proj.distance,
            };
          }
        }
      });

      setHoverWall(closestWall);
    } else {
      if (hoverWall) setHoverWall(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button === 1 || spacePressed) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    const coords = getSVGCoords(e);
    
    // Snapping & Snapping alignment checks
    let snappedX = snapToGrid(coords.x, gridSize);
    let snappedY = snapToGrid(coords.y, gridSize);

    if (e.shiftKey && drawingStartId && selectedTool === 'wall') {
      const startPt = points[drawingStartId];
      if (startPt) {
        const dx = Math.abs(coords.x - startPt.x);
        const dy = Math.abs(coords.y - startPt.y);
        if (dx > dy) {
          snappedY = startPt.y;
        } else {
          snappedX = startPt.x;
        }
      }
    }

    // Snapping guidelines matching check
    Object.values(points).forEach((pt) => {
      if (Math.abs(snappedX - pt.x) <= 10) snappedX = pt.x;
      if (Math.abs(snappedY - pt.y) <= 10) snappedY = pt.y;
    });

    // Eraser Tool click logic
    if (selectedTool === 'eraser') {
      return; // Handled directly in element onClick events
    }

    // Wall Tool click logic
    if (selectedTool === 'wall') {
      // Find if we clicked on or near an existing point
      let clickedPtId: string | null = null;
      Object.values(points).forEach((pt) => {
        if (Math.hypot(pt.x - coords.x, pt.y - coords.y) < 15) {
          clickedPtId = pt.id;
        }
      });

      // If no point was clicked, create one
      if (!clickedPtId) {
        clickedPtId = addPoint(snappedX, snappedY);
      }

      if (drawingStartId === null) {
        // Start drawing wall
        setDrawingStartId(clickedPtId);
      } else {
        // End wall draw segment
        if (drawingStartId !== clickedPtId) {
          addWall(drawingStartId, clickedPtId);
          // Chain drawing (set new start point to clicked point)
          setDrawingStartId(clickedPtId);
        }
      }
      return;
    }

    // Door / Window Tool placement logic
    if ((selectedTool === 'door' || selectedTool === 'window') && hoverWall) {
      addOpening(hoverWall.id, selectedTool, hoverWall.t);
      setHoverWall(null);
      setSelectedTool('select');
      return;
    }

    // Furniture Tool placement logic
    if (selectedTool === 'furniture') {
      addFurniture(selectedFurnitureType, snappedX, snappedY);
      return;
    }
    
    // Clear selection if we click empty grid space
    if (selectedTool === 'select') {
      selectElement(null, null);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingCamera(false);
    setDraggingTarget(false);
    setDraggingPointId(null);
    setDraggingFurnitureId(null);
    setActiveGuideX(null);
    setActiveGuideY(null);
  };


  // Reset Zoom and Pan to defaults
  const resetZoomPan = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Zoom centered on canvas viewport midpoint
  const handleZoomButton = (inward: boolean) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const zoomFactor = 1.25;
    setZoom((prevZoom) => {
      const nextZoom = inward ? prevZoom * zoomFactor : prevZoom / zoomFactor;
      const newZoom = Math.max(0.15, Math.min(nextZoom, 8));
      
      setPan((prevPan) => {
        const newPanX = centerX - (centerX - prevPan.x) * (newZoom / prevZoom);
        const newPanY = centerY - (centerY - prevPan.y) * (newZoom / prevZoom);
        return { x: newPanX, y: newPanY };
      });
      return newZoom;
    });
  };

  // Helper for cursor styling depending on tool / pan state
  const getCursorStyle = () => {
    if (isPanning) return 'grabbing';
    if (spacePressed) return 'grab';
    if (selectedTool === 'eraser') return 'pointer';
    if (selectedTool === 'wall') return 'crosshair';
    if (selectedTool === 'door' || selectedTool === 'window') return 'cell';
    return 'default';
  };


  // Render SVG Grid Patterns (Light Mode)
  const renderGrid = () => {
    if (!showGrid) return null;
    const lines = [];
    const minX = -3000;
    const maxX = 5000;
    const minY = -3000;
    const maxY = 5000;

    for (let x = minX; x <= maxX; x += gridSize) {
      lines.push(
        <line
          key={`x-${x}`}
          x1={x}
          y1={minY}
          x2={x}
          y2={maxY}
          stroke="#f1f5f9" // very light slate-100
          strokeWidth={x % (gridSize * 5) === 0 ? 1.2 : 0.6}
        />
      );
    }
    for (let y = minY; y <= maxY; y += gridSize) {
      lines.push(
        <line
          key={`y-${y}`}
          x1={minX}
          y1={y}
          x2={maxX}
          y2={y}
          stroke="#f1f5f9" // very light slate-100
          strokeWidth={y % (gridSize * 5) === 0 ? 1.2 : 0.6}
        />
      );
    }
    return <g className="select-none pointer-events-none">{lines}</g>;
  };

  // Automatically detect rooms
  const rooms = findRooms(points, walls);

  return (
    <div className="relative w-full h-full bg-[#f8fafc] border border-slate-200 rounded-xl overflow-hidden shadow-xl flex items-center justify-center select-none">
      {/* CAD Canvas Status Overlay */}
      <div className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-lg text-xs font-mono text-slate-100 shadow-md pointer-events-none select-none">
        {selectedTool === 'wall' && drawingStartId
          ? 'Drawing Wall... (Hold SHIFT for Ortho-Lock, Press ESC to finish)'
          : selectedTool === 'wall'
          ? 'Click to start drawing wall'
          : selectedTool === 'door'
          ? 'Hover over a wall to place door'
          : selectedTool === 'window'
          ? 'Hover over a wall to place window'
          : `Tool: ${selectedTool.toUpperCase()}`}
      </div>

      <svg
        ref={svgRef}
        className="w-full h-full bg-white"
        style={{ cursor: getCursorStyle() }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        <g id="transformed-group" transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* 1. Grid Background */}
          {renderGrid()}


        {/* 1.5. Rooms rendering (Rendered first as layout floor background) */}
        {rooms.map((room) => {
          const isSelected = selectedElementId === room.key && selectedElementType === 'room';
          const isHovered = hoverRoomKey === room.key;
          const roomName = roomNames[room.key] || 'Unnamed Room';

          // Calculate centroid of the polygon
          let sumX = 0, sumY = 0;
          room.points.forEach((pt) => {
            sumX += pt.x;
            sumY += pt.y;
          });
          const cx = sumX / room.points.length;
          const cy = sumY / room.points.length;

          // Points string format for polygon
          const ptsString = room.points.map((pt) => `${pt.x},${pt.y}`).join(' ');

          return (
            <g key={room.key}>
              <polygon
                points={ptsString}
                fill={isSelected ? 'rgba(249, 115, 22, 0.14)' : isHovered ? 'rgba(249, 115, 22, 0.07)' : 'rgba(249, 115, 22, 0.03)'}
                stroke={isSelected ? '#f97316' : isHovered ? 'rgba(249, 115, 22, 0.5)' : 'rgba(249, 115, 22, 0.2)'}
                strokeWidth="1.5"
                strokeDasharray={isSelected ? 'none' : '4 4'}
                className="cursor-pointer transition-colors duration-150"
                onMouseEnter={() => {
                  if (selectedTool === 'select') setHoverRoomKey(room.key);
                }}
                onMouseLeave={() => setHoverRoomKey(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (selectedTool === 'select') {
                    selectElement(room.key, 'room');
                  } else if (selectedTool === 'eraser') {
                    deleteElement(room.key, 'room');
                  }
                }}
              />
              
              {/* Room name & Area display */}
              <g transform={`translate(${cx}, ${cy})`} className="select-none pointer-events-none">
                <text
                  textAnchor="middle"
                  fill="#1e293b" // slate-800
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  {roomName}
                </text>
                <text
                  y="14"
                  textAnchor="middle"
                  fill="#ea580c" // orange-600
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  LA: {room.area.toFixed(2)} m²
                </text>
              </g>
            </g>
          );
        })}

        {/* 2. Walls Rendering */}
        {walls.map((wall) => {
          const p1 = points[wall.p1Id];
          const p2 = points[wall.p2Id];
          if (!p1 || !p2) return null;

          const isSelected = selectedElementId === wall.id && selectedElementType === 'wall';
          const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
          const length = getDistance(p1, p2);
          
          return (
            <g
              key={wall.id}
              onClick={(e) => {
                e.stopPropagation();
                if (selectedTool === 'eraser') {
                  deleteElement(wall.id, 'wall');
                } else if (selectedTool === 'select') {
                  selectElement(wall.id, 'wall');
                }
              }}
            >
              {/* Thick interactive hit box for walls */}
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="transparent"
                strokeWidth={Math.max(wall.thickness, 25)}
                className="cursor-pointer"
              />
              {/* Visual Wall */}
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={isSelected ? '#2563eb' : wall.materialId === 'block_4' ? '#64748b' : '#334155'}
                strokeWidth={wall.thickness}
                strokeLinecap="square"
                className="transition-colors duration-150"
              />
              {/* Wall dimensions label */}
              <text
                x={(p1.x + p2.x) / 2}
                y={(p1.y + p2.y) / 2 - 12}
                transform={`rotate(${(angle * 180) / Math.PI}, ${(p1.x + p2.x) / 2}, ${(p1.y + p2.y) / 2})`}
                fill="#475569" // slate-600
                fontSize="10"
                fontFamily="monospace"
                fontWeight="600"
                textAnchor="middle"
                className="select-none pointer-events-none"
              >
                {(length / 100).toFixed(2)}m
              </text>
            </g>
          );
        })}

        {/* 3. Openings (Doors & Windows) Rendering */}
        {openings.map((op) => {
          const wall = walls.find((w) => w.id === op.wallId);
          if (!wall) return null;
          const p1 = points[wall.p1Id];
          const p2 = points[wall.p2Id];
          if (!p1 || !p2) return null;

          const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
          const opX = p1.x + op.positionPercent * (p2.x - p1.x);
          const opY = p1.y + op.positionPercent * (p2.y - p1.y);

          const isSelected = selectedElementId === op.id && selectedElementType === 'opening';
          const halfW = op.width / 2;

          return (
            <g
              key={op.id}
              transform={`translate(${opX}, ${opY}) rotate(${(angle * 180) / Math.PI})`}
              onClick={(e) => {
                e.stopPropagation();
                if (selectedTool === 'eraser') {
                  deleteElement(op.id, 'opening');
                } else if (selectedTool === 'select') {
                  selectElement(op.id, 'opening');
                }
              }}
              className="cursor-pointer"
            >
              {/* Hover selection zone */}
              <rect x={-halfW} y={-12} width={op.width} height={24} fill="transparent" />
              
              {op.type === 'door' ? (
                // Door symbol
                <g>
                  {/* Door panel line */}
                  <line
                    x1={-halfW}
                    y1={0}
                    x2={-halfW}
                    y2={-op.width}
                    stroke={isSelected ? '#2563eb' : '#d97706'}
                    strokeWidth="2.5"
                  />
                  {/* Swing arc */}
                  <path
                    d={`M ${-halfW} ${-op.width} A ${op.width} ${op.width} 0 0 1 ${halfW} 0`}
                    fill="none"
                    stroke={isSelected ? '#3b82f6' : '#ea580c'}
                    strokeWidth="1"
                    strokeDasharray="4 3"
                  />
                  {/* Threshold */}
                  <line
                    x1={-halfW}
                    y1={0}
                    x2={halfW}
                    y2={0}
                    stroke="#cbd5e1"
                    strokeWidth={wall.thickness + 2}
                  />
                </g>
              ) : (
                // Window symbol
                <g>
                  <rect
                    x={-halfW}
                    y={-wall.thickness / 2}
                    width={op.width}
                    height={wall.thickness}
                    fill="#e2e8f0"
                    stroke={isSelected ? '#2563eb' : '#0891b2'}
                    strokeWidth="2"
                  />
                  {/* Glass pane visual lines */}
                  <line x1={-halfW} y1={-2} x2={halfW} y2={-2} stroke="#22d3ee" strokeWidth="1" />
                  <line x1={-halfW} y1={2} x2={halfW} y2={2} stroke="#22d3ee" strokeWidth="1" />
                </g>
              )}
            </g>
          );
        })}

        {/* 4. Opening Placement Preview (Hover) */}
        {(selectedTool === 'door' || selectedTool === 'window') && hoverWall && (
          <g
            transform={`translate(${hoverWall.x}, ${hoverWall.y}) rotate(${(Math.atan2(
              points[walls.find((w) => w.id === hoverWall.id)!.p2Id].y -
                points[walls.find((w) => w.id === hoverWall.id)!.p1Id].y,
              points[walls.find((w) => w.id === hoverWall.id)!.p2Id].x -
                points[walls.find((w) => w.id === hoverWall.id)!.p1Id].x
            ) *
              180) /
              Math.PI})`}
            className="opacity-60 pointer-events-none select-none animate-pulse"
          >
            {selectedTool === 'door' ? (
              <g>
                <line x1={-45} y1={0} x2={-45} y2={-90} stroke="#d97706" strokeWidth="2.5" />
                <path d="M -45 -90 A 90 90 0 0 1 45 0" fill="none" stroke="#ea580c" strokeWidth="1" strokeDasharray="3 3" />
              </g>
            ) : (
              <rect x={-60} y={-7.5} width={120} height={15} fill="#e2e8f0" stroke="#0891b2" strokeWidth="2" />
            )}
          </g>
        )}

        {/* 5. Furniture Rendering */}
        {furniture.map((f) => {
          const isSelected = selectedElementId === f.id && selectedElementType === 'furniture';
          const halfW = f.width / 2;
          const halfL = f.length / 2;

          return (
            <g
              key={f.id}
              transform={`translate(${f.x}, ${f.y}) rotate(${(f.rotation * 180) / Math.PI})`}
              className="cursor-move"
              onMouseDown={(e) => {
                e.stopPropagation();
                if (selectedTool === 'eraser') {
                  deleteElement(f.id, 'furniture');
                } else if (selectedTool === 'select') {
                  selectElement(f.id, 'furniture');
                  setDraggingFurnitureId(f.id);
                  const svgCoords = getSVGCoords(e);
                  // Track difference between drag point and center of furniture
                  setDragOffset({ x: svgCoords.x - f.x, y: svgCoords.y - f.y });
                }
              }}
            >
              {/* Furniture bounding box */}
              <rect
                x={-halfL}
                y={-halfW}
                width={f.length}
                height={f.width}
                fill={isSelected ? '#bfdbfe' : '#f1f5f9'}
                stroke={isSelected ? '#2563eb' : '#64748b'}
                strokeWidth="1.5"
                rx="4"
              />
              {/* Internal details styling */}
              {f.type === 'bed' && (
                <g className="opacity-50 stroke-slate-500 fill-none" strokeWidth="1">
                  <rect x={-halfL + 8} y={-halfW + 8} width={25} height={f.width - 16} rx="2" />
                  <line x1={-halfL + 40} y1={-halfW} x2={-halfL + 40} y2={halfW} />
                </g>
              )}
              {f.type === 'sofa' && (
                <g className="opacity-50 stroke-slate-500 fill-none" strokeWidth="1">
                  <rect x={-halfL + 8} y={-halfW + 8} width={f.length - 16} height={f.width - 16} rx="2" />
                  <line x1={-halfL + 12} y1={-halfW + 12} x2={f.length / 2 - 12} y2={-halfW + 12} />
                </g>
              )}
              {/* Furniture text label */}
              <text
                x="0"
                y="3"
                fill={isSelected ? '#1e40af' : '#475569'}
                fontSize="9"
                fontFamily="sans-serif"
                fontWeight="bold"
                textAnchor="middle"
                className="select-none pointer-events-none"
              >
                {f.type.toUpperCase()}
              </text>
            </g>
          );
        })}

        {/* 6. Furniture Placement Preview (Hover) */}
        {selectedTool === 'furniture' && (
          <g
            transform={`translate(${mouseCoords.x}, ${mouseCoords.y})`}
            className="opacity-50 pointer-events-none select-none"
          >
            {/* Standard 80x80 preview */}
            <rect x={-40} y={-40} width={80} height={80} fill="#f1f5f9" stroke="#3b82f6" strokeWidth="1.5" rx="3" strokeDasharray="3 3" />
            <text x="0" y="4" fill="#2563eb" fontSize="8" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">
              {selectedFurnitureType.toUpperCase()}
            </text>
          </g>
        )}

        {/* 7. Wall Drawing Preview (Hover/Dashed line) */}
        {selectedTool === 'wall' && drawingStartId && points[drawingStartId] && (
          <g className="pointer-events-none select-none">
            <line
              x1={points[drawingStartId].x}
              y1={points[drawingStartId].y}
              x2={mouseCoords.x}
              y2={mouseCoords.y}
              stroke="#3b82f6"
              strokeWidth="6"
              strokeDasharray="5 5"
              className="opacity-70"
            />
            <circle cx={mouseCoords.x} cy={mouseCoords.y} r="5" fill="#3b82f6" />
            <rect
              x={mouseCoords.x + 12}
              y={mouseCoords.y - 25}
              width={60}
              height={18}
              rx="4"
              fill="#1e293b"
              stroke="#0f172a"
              strokeWidth="1"
            />
            <text
              x={mouseCoords.x + 42}
              y={mouseCoords.y - 13}
              fill="#ffffff"
              fontSize="10"
              fontFamily="monospace"
              textAnchor="middle"
              fontWeight="bold"
            >
              {(Math.hypot(mouseCoords.x - points[drawingStartId].x, mouseCoords.y - points[drawingStartId].y) / 100).toFixed(2)}m
            </text>
          </g>
        )}

        {/* 7.5 Alignment snapping guidelines (orange dotted lines) */}
        {activeGuideX !== null && (
          <line
            x1={activeGuideX}
            y1={-3000}
            x2={activeGuideX}
            y2={5000}
            stroke="#f97316"
            strokeWidth="0.8"
            strokeDasharray="4 4"
            className="pointer-events-none select-none opacity-80"
          />
        )}
        {activeGuideY !== null && (
          <line
            x1={-3000}
            y1={activeGuideY}
            x2={5000}
            y2={activeGuideY}
            stroke="#f97316"
            strokeWidth="0.8"
            strokeDasharray="4 4"
            className="pointer-events-none select-none opacity-80"
          />
        )}

        {/* 7.6. Draggable Camera Observer ("Eye/Person Viewer") */}
        {(() => {
          const dx = cameraTarget.x - cameraPos.x;
          const dy = cameraTarget.y - cameraPos.y;
          const cameraAngle = Math.atan2(dy, dx);
          const cameraAngleDeg = (cameraAngle * 180) / Math.PI;
          
          const fovDeg = 50;
          const fovRad = (fovDeg * Math.PI) / 180;
          const coneRadius = 180;
          const angle1 = cameraAngle - fovRad / 2;
          const angle2 = cameraAngle + fovRad / 2;
          
          const x1 = cameraPos.x + coneRadius * Math.cos(angle1);
          const y1 = cameraPos.y + coneRadius * Math.sin(angle1);
          const x2 = cameraPos.x + coneRadius * Math.cos(angle2);
          const y2 = cameraPos.y + coneRadius * Math.sin(angle2);
          
          const fovPathD = `M ${cameraPos.x} ${cameraPos.y} L ${x1} ${y1} A ${coneRadius} ${coneRadius} 0 0 1 ${x2} ${y2} Z`;
          
          return (
            <g>
              {/* Field-of-View (FOV) Cone Sector */}
              <path
                d={fovPathD}
                fill="rgba(45, 212, 191, 0.12)"
                stroke="rgba(45, 212, 191, 0.35)"
                strokeWidth="1.2"
                className="pointer-events-none"
              />
              
              {/* Dashed Target Connection Line */}
              <line
                x1={cameraPos.x}
                y1={cameraPos.y}
                x2={cameraTarget.x}
                y2={cameraTarget.y}
                stroke="#64748b"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                className="pointer-events-none"
              />
              
              {/* Draggable Target Node (Crosshair) */}
              <g
                transform={`translate(${cameraTarget.x}, ${cameraTarget.y})`}
                className="cursor-move group"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  if (selectedTool === 'select') {
                    setDraggingTarget(true);
                  }
                }}
              >
                <circle r="16" fill="transparent" />
                <circle
                  r="8"
                  fill="#ffffff"
                  stroke="#475569"
                  strokeWidth="2.5"
                  className="group-hover:stroke-teal-500 group-hover:scale-110 transition-all duration-150 shadow-sm"
                />
                <circle r="3.5" fill="#475569" className="group-hover:fill-teal-500 transition-colors" />
                <line x1="-12" y1="0" x2="12" y2="0" stroke="#475569" strokeWidth="1.2" className="group-hover:stroke-teal-500 opacity-60" />
                <line x1="0" y1="-12" x2="0" y2="12" stroke="#475569" strokeWidth="1.2" className="group-hover:stroke-teal-500 opacity-60" />
              </g>
              
              {/* Draggable Camera Observer Node */}
              <g
                transform={`translate(${cameraPos.x}, ${cameraPos.y}) rotate(${cameraAngleDeg})`}
                className="cursor-move group"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  if (selectedTool === 'select') {
                    setDraggingCamera(true);
                  }
                }}
              >
                <circle r="20" fill="transparent" />
                
                {/* Camera body box */}
                <rect
                  x="-13"
                  y="-10"
                  width="20"
                  height="20"
                  rx="3"
                  fill="#1e293b"
                  stroke="#0f172a"
                  strokeWidth="1.5"
                  className="group-hover:fill-teal-600 group-hover:stroke-teal-700 transition-all duration-150 shadow-md"
                />
                
                {/* Camera lens piece */}
                <path
                  d="M 7 -6 L 14 -10 L 14 10 L 7 6 Z"
                  fill="#475569"
                  stroke="#0f172a"
                  strokeWidth="1.5"
                  className="group-hover:fill-teal-500 group-hover:stroke-teal-700 transition-all duration-150"
                />
                
                {/* Lens glass flare highlight */}
                <circle
                  cx="-3"
                  cy="0"
                  r="3.5"
                  fill="#06b6d4"
                  className="group-hover:fill-teal-300 transition-colors"
                />
                
                {/* Camera flash / indicator dot */}
                <circle
                  cx="-7"
                  cy="-5"
                  r="1.2"
                  fill="#ef4444"
                  className="animate-pulse"
                />
              </g>
            </g>
          );
        })()}

        {/* 8. Interactive Corner Point Circles */}
        {Object.values(points).map((pt) => {
          const isSelected = selectedElementId === pt.id && selectedElementType === 'point';
          
          return (
            <circle
              key={pt.id}
              cx={pt.x}
              cy={pt.y}
              r="6.5"
              fill={isSelected ? '#2563eb' : '#ffffff'}
              stroke={isSelected ? '#60a5fa' : '#3b82f6'}
              strokeWidth="2"
              className="hover:scale-125 cursor-move transition-transform duration-100"
              onMouseDown={(e) => {
                e.stopPropagation();
                if (selectedTool === 'eraser') {
                  deleteElement(pt.id, 'point');
                } else if (selectedTool === 'select') {
                  selectElement(pt.id, 'point');
                  setDraggingPointId(pt.id);
                }
              }}
            />
          );
        })}
        </g>
      </svg>

      {/* 2D Nav overlay controls */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end gap-3 pointer-events-none">
        {/* D-Pad Panel */}
        <div className="pointer-events-auto flex flex-col items-center bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 shadow-xl select-none">
          <div className="relative w-24 h-24 flex items-center justify-center bg-slate-950/60 rounded-full border border-slate-800 shadow-inner">
            {/* Up arrow */}
            <button
              onClick={() => setPan(prev => ({ ...prev, y: prev.y + 60 }))}
              className="absolute top-0.5 text-slate-400 hover:text-teal-400 active:scale-90 transition-all p-1 cursor-pointer"
              title="Pan Up"
            >
              <ChevronUp size={20} />
            </button>
            
            {/* Left arrow */}
            <button
              onClick={() => setPan(prev => ({ ...prev, x: prev.x + 60 }))}
              className="absolute left-0.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-400 active:scale-90 transition-all p-1 cursor-pointer"
              title="Pan Left"
            >
              <ChevronLeft size={20} />
            </button>
            
            {/* Right arrow */}
            <button
              onClick={() => setPan(prev => ({ ...prev, x: prev.x - 60 }))}
              className="absolute right-0.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-400 active:scale-90 transition-all p-1 cursor-pointer"
              title="Pan Right"
            >
              <ChevronRight size={20} />
            </button>
            
            {/* Down arrow */}
            <button
              onClick={() => setPan(prev => ({ ...prev, y: prev.y - 60 }))}
              className="absolute bottom-0.5 text-slate-400 hover:text-teal-400 active:scale-90 transition-all p-1 cursor-pointer"
              title="Pan Down"
            >
              <ChevronDown size={20} />
            </button>
            
            {/* Center Target / Reset */}
            <button
              onClick={resetZoomPan}
              className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-teal-500 text-slate-400 hover:text-white active:scale-90 transition-all flex items-center justify-center shadow cursor-pointer"
              title="Reset View"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>

        {/* Zoom bar */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-1.5 shadow-xl text-slate-300 pointer-events-auto">
          <button
            onClick={() => handleZoomButton(true)}
            className="p-1 hover:text-teal-400 hover:bg-slate-800 rounded active:scale-95 transition-all cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <span className="w-px h-3.5 bg-slate-800 mx-1.5"></span>
          <span className="text-[10px] font-mono px-1 min-w-[36px] text-center text-slate-400 font-semibold select-none">
            {Math.round(zoom * 100)}%
          </span>
          <span className="w-px h-3.5 bg-slate-800 mx-1.5"></span>
          <button
            onClick={() => handleZoomButton(false)}
            className="p-1 hover:text-teal-400 hover:bg-slate-800 rounded active:scale-95 transition-all cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
        </div>
      </div>
    </div>

  );
};
export default Editor2D;
