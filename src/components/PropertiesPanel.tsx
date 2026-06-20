import React from 'react';
import { useStore } from '../store/useStore';
import { Trash2, HelpCircle, Layers, Paintbrush, RefreshCw, Eye, EyeOff, Folder, Settings } from 'lucide-react';
import { findRooms } from '../utils/roomFinder';
import confetti from 'canvas-confetti';

export const PropertiesPanel: React.FC<{ activePrimary?: string }> = ({ activePrimary }) => {
  const {
    points,
    walls,
    openings,
    furniture,
    selectedElementId,
    selectedElementType,
    roomNames,
    materialsCatalog,
    gridSize,
    showGrid,
    updateWall,
    updateOpening,
    updateFurniture,
    updateRoomName,
    updateMaterialPrice,
    deleteElement,
    setGridSize,
    toggleGrid,
    clearProject,
    loadDemoProject,
    selectedSkybox,
    setSelectedSkybox,
    showFloors,
    showRoofs,
    roofStyle,
    setShowFloors,
    setShowRoofs,
    setRoofStyle,
  } = useStore();

  const handleLoadDemo = () => {
    loadDemoProject();
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#0d9488', '#10b981', '#3b82f6'],
    });
  };

  // --- 1. UNIFIED EMPTY STATE / SETTINGS PANEL ---
  if (!selectedElementType || !selectedElementId) {
    if (activePrimary === 'materials') {
      // Materials Tab Pricing Adjuster
      return (
        <div className="w-full h-full bg-white border border-slate-200 rounded-xl p-4 text-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3 text-teal-600 border-b border-slate-100 pb-2">
              <Paintbrush size={16} />
              <h3 className="font-bold text-xs uppercase tracking-wider">Zambian Materials Rates</h3>
            </div>
            <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
              Adjust retail average prices in Zambian Kwacha (ZMW). All structural quantities and estimates will update instantly.
            </p>
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {Object.values(materialsCatalog).map((mat) => (
                <div key={mat.id} className="bg-slate-50 border border-slate-150 rounded-lg p-2.5 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-700 truncate" title={mat.name}>
                    {mat.name}
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-400 font-mono uppercase">Per {mat.unit}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-slate-400">K</span>
                      <input
                        type="number"
                        value={mat.price}
                        onChange={(e) => updateMaterialPrice(mat.id, Number(e.target.value))}
                        className="w-20 bg-white border border-slate-200 hover:border-teal-500 rounded px-2 py-0.5 text-right font-mono text-xs text-emerald-600 focus:outline-none focus:border-teal-600"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-slate-100 pt-3 mt-3 text-center">
            <span className="text-[9px] text-slate-400 font-mono">Rates loaded from Zambia Hardware Average</span>
          </div>
        </div>
      );
    }

    if (activePrimary === 'studio') {
      return (
        <div className="w-full bg-white border border-slate-200 rounded-xl p-4 text-slate-700 shadow-sm flex flex-col gap-4 select-none">
          <div className="flex items-center gap-2 mb-1 text-teal-600 border-b border-slate-100 pb-2">
            <Settings size={16} />
            <h3 className="font-bold text-xs uppercase tracking-wider">3D Studio Settings</h3>
          </div>

          {/* Skybox Selector */}
          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">
              Studio Environment / Skybox
            </label>
            <select
              value={selectedSkybox}
              onChange={(e) => setSelectedSkybox(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="procedural">Procedural Sky (Dynamic)</option>
              <option value="sunny">Sunny Skybox (Clear Day)</option>
              <option value="sunset">Sunset Gold (Sunset Horizon)</option>
              <option value="cloudy">Cloudy Skies (Overcast)</option>
              <option value="night">Starry Night (Moonlit)</option>
              <option value="mountain">Mountain Panorama</option>
              <option value="city">Urban City Skyline</option>
            </select>
            <div className="block text-[9px] text-slate-400 mt-2.5 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="font-bold text-slate-500 block mb-1">📂 How to add Skybox assets:</span>
              Create a folder in your project directory at:
              <div className="bg-slate-100 p-1.5 rounded font-mono text-[8px] my-1 select-all break-all border border-slate-200">
                public/skyboxes/[name]/
              </div>
              Replace <code className="bg-slate-100 px-0.5 rounded font-mono text-[8.5px] border border-slate-150">[name]</code> with either:
              <div className="font-semibold text-slate-500 my-1">
                sunny, sunset, cloudy, night, mountain, city
              </div>
              Then copy exactly 6 images named:
              <div className="font-mono text-[8px] mt-1 text-slate-500 grid grid-cols-3 gap-1">
                <span>px.jpg (right)</span>
                <span>nx.jpg (left)</span>
                <span>py.jpg (up)</span>
                <span>ny.jpg (down)</span>
                <span>pz.jpg (back)</span>
                <span>nz.jpg (front)</span>
              </div>
            </div>
          </div>

          {/* Ambient controls help */}
          <div className="bg-slate-50 border border-slate-150 rounded-lg p-3">
            <span className="block text-[9px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
              ✨ Ambient Light & Fog Sync
            </span>
            <p className="text-[10px] text-slate-500 leading-relaxed m-0">
              Lighting color tones, ambient brightness, and horizon fog will automatically synchronize to match the selected environment mode.
            </p>
          </div>
        </div>
      );
    }

    if (activePrimary === 'roof') {
      return (
        <div className="w-full bg-white border border-slate-200 rounded-xl p-4 text-slate-700 shadow-sm flex flex-col gap-4 select-none">
          <div className="flex items-center gap-2 mb-1 text-teal-600 border-b border-slate-100 pb-2">
            <Layers size={16} />
            <h3 className="font-bold text-xs uppercase tracking-wider">Floors & Roof Construction</h3>
          </div>

          {/* Toggle Floor Slab */}
          <div className="flex items-center justify-between py-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <label className="text-[11.5px] text-slate-600 font-bold cursor-pointer select-none" htmlFor="toggle-floors-checkbox-sidebar">
              Generate 3D Floor Slabs
            </label>
            <input
              id="toggle-floors-checkbox-sidebar"
              type="checkbox"
              checked={showFloors}
              onChange={(e) => setShowFloors(e.target.checked)}
              className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
            />
          </div>

          {/* Toggle Roof Construction */}
          <div className="flex items-center justify-between py-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <label className="text-[11.5px] text-slate-600 font-bold cursor-pointer select-none" htmlFor="toggle-roofs-checkbox-sidebar">
              Generate 3D Roof Sheets
            </label>
            <input
              id="toggle-roofs-checkbox-sidebar"
              type="checkbox"
              checked={showRoofs}
              onChange={(e) => setShowRoofs(e.target.checked)}
              className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
            />
          </div>

          {/* Roof Style Selector */}
          {showRoofs && (
            <div className="flex flex-col gap-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <label className="block text-[9px] text-slate-500 uppercase font-semibold mb-1">
                Roof Style Selection
              </label>
              <select
                value={roofStyle}
                onChange={(e) => setRoofStyle(e.target.value as 'none' | 'flat' | 'gable')}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="gable">Pitched Gable (Standard Zambian)</option>
                <option value="flat">Flat Concrete Slab</option>
                <option value="none">No Roof Cover</option>
              </select>
            </div>
          )}
          
          <div className="bg-teal-50/50 border border-teal-100 rounded-lg p-3 text-[10.5px] text-slate-500 leading-relaxed">
            <span className="font-bold text-teal-700 block mb-1">🏠 Roof & Floor Mechanics:</span>
            Floors and roofs are automatically calculated and generated to fit any closed room cycles detected on the blueprint plan. Any walls modified, added, or dragged will live-update the structural geometry in real time.
          </div>
        </div>
      );
    }

    // Default Drawing Layout Options & Help
    return (
      <div className="w-full flex flex-col gap-4 select-none">
        
        {/* Quick Help Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-teal-600 border-b border-slate-100 pb-2">
            <HelpCircle size={16} />
            <h3 className="font-bold text-xs uppercase tracking-wider">Quick Instructions</h3>
          </div>
          <ul className="space-y-2 text-[10.5px] text-slate-500 list-disc list-inside leading-relaxed">
            <li>Choose <span className="text-slate-800 font-semibold">Wall Tool</span> to draw walls. Click to define points, double-click or press ESC to finish.</li>
            <li>Connect walls at intersections to form closed rooms.</li>
            <li>Select <span className="text-slate-800 font-semibold">Door</span> or <span className="text-slate-800 font-semibold">Window Tool</span> and hover over a wall to place them.</li>
            <li>Select <span className="text-slate-800 font-semibold">Pointer Tool</span> to select and drag corner points to resize rooms.</li>
            <li>Click on any wall, opening, furniture, or room to edit its properties.</li>
          </ul>
        </div>

        {/* Unified Terrain & Snapping Settings */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-700 shadow-sm flex flex-col gap-3">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <Settings size={13} className="text-teal-600" /> Terrain & Grid Settings
          </span>

          {/* Grid size editor */}
          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">
              Grid Snapping (cm)
            </label>
            <select
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
            >
              <option value={10}>10 cm (Dense Grid)</option>
              <option value={20}>20 cm (Standard)</option>
              <option value={50}>50 cm (Coarse Grid)</option>
            </select>
          </div>

          {/* Toggle grid visibility */}
          <button
            onClick={toggleGrid}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-600 text-xs font-semibold transition-all cursor-pointer"
          >
            {showGrid ? <EyeOff size={13} /> : <Eye size={13} />}
            {showGrid ? 'Hide Grid lines' : 'Show Grid lines'}
          </button>

          {/* Import trace image placeholder (matches screenshot) */}
          <div className="mt-1">
            <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">
              Trace Blueprint Image
            </label>
            <div className="border-2 border-dashed border-slate-200 hover:border-teal-500/50 rounded-xl p-4 text-center cursor-pointer transition-colors group bg-slate-50/50 hover:bg-teal-50/10">
              <div className="flex flex-col items-center justify-center gap-1">
                <Folder className="text-slate-400 group-hover:text-teal-600 transition-colors" size={22} />
                <span className="text-[10px] font-bold text-slate-600 group-hover:text-slate-700">IMPORT YOUR TRACE IMAGE</span>
                <span className="text-[8px] text-slate-400 font-mono tracking-wider">PNG, JPEG, PDF, DXF</span>
              </div>
            </div>
          </div>

          {/* Demo actions */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={handleLoadDemo}
              className="flex items-center justify-center gap-1.5 py-1.5 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-700 rounded text-xs font-bold transition-all cursor-pointer"
              title="Load Demo Project"
            >
              <RefreshCw size={13} /> Load Demo
            </button>
            <button
              onClick={clearProject}
              className="flex items-center justify-center gap-1.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded text-xs font-bold transition-all cursor-pointer"
              title="Reset Project"
            >
              <Trash2 size={13} /> Reset
            </button>
          </div>
        </div>

        {/* Floor & Roof Construction Options */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-700 shadow-sm flex flex-col gap-3">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <Layers size={13} className="text-teal-600" /> Floor & Roof Controls
          </span>

          {/* Toggle Floor Slab */}
          <div className="flex items-center justify-between py-1">
            <label className="text-[11.5px] text-slate-600 font-bold cursor-pointer select-none" htmlFor="toggle-floors-checkbox">
              Generate 3D Floor Slabs
            </label>
            <input
              id="toggle-floors-checkbox"
              type="checkbox"
              checked={showFloors}
              onChange={(e) => setShowFloors(e.target.checked)}
              className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
            />
          </div>

          {/* Toggle Roof Construction */}
          <div className="flex items-center justify-between py-1 border-t border-slate-100 pt-2">
            <label className="text-[11.5px] text-slate-600 font-bold cursor-pointer select-none" htmlFor="toggle-roofs-checkbox">
              Generate 3D Roof Sheets
            </label>
            <input
              id="toggle-roofs-checkbox"
              type="checkbox"
              checked={showRoofs}
              onChange={(e) => setShowRoofs(e.target.checked)}
              className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
            />
          </div>

          {/* Roof Style Selector (only visible if showRoofs is true) */}
          {showRoofs && (
            <div className="flex flex-col gap-1 border-t border-slate-100 pt-2">
              <label className="block text-[9px] text-slate-500 uppercase font-semibold mb-1">
                Roof Style Selection
              </label>
              <select
                value={roofStyle}
                onChange={(e) => setRoofStyle(e.target.value as 'none' | 'flat' | 'gable')}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="gable">Pitched Gable (Standard Zambian)</option>
                <option value="flat">Flat Concrete Slab</option>
                <option value="none">No Roof Cover</option>
              </select>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- 2. WALL PROPERTIES EDITING ---
  if (selectedElementType === 'wall') {
    const wall = walls.find((w) => w.id === selectedElementId);
    if (!wall) return null;

    const p1 = points[wall.p1Id];
    const p2 = points[wall.p2Id];
    const wallLength = p1 && p2 ? (Math.hypot(p2.x - p1.x, p2.y - p1.y) / 100).toFixed(2) : '0';

    return (
      <div className="w-full bg-white border border-slate-200 rounded-xl p-4 text-slate-700 shadow-sm flex flex-col justify-between h-full min-h-[300px]">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <span className="text-xs uppercase tracking-wider font-mono text-slate-400">Selected: Wall</span>
            <button
              onClick={() => deleteElement(wall.id, 'wall')}
              className="p-1 hover:bg-rose-50 text-rose-600 rounded transition-colors"
              title="Delete Wall"
            >
              <Trash2 size={15} />
            </button>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                Wall Thickness (cm)
              </label>
              <select
                value={wall.thickness}
                onChange={(e) => updateWall(wall.id, { thickness: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
              >
                <option value={15}>15 cm (6-inch standard block)</option>
                <option value={10}>10 cm (4-inch internal block)</option>
                <option value={20}>20 cm (8-inch heavy block)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                Wall Height (cm)
              </label>
              <input
                type="number"
                value={wall.height}
                onChange={(e) => updateWall(wall.id, { height: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                Construction Material
              </label>
              <select
                value={wall.materialId}
                onChange={(e) => updateWall(wall.id, { materialId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
              >
                <option value="block_6">6" Concrete Hollow Block</option>
                <option value="block_4">4" Concrete Hollow Block</option>
              </select>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 mt-2">
              <span className="block text-[9px] text-slate-400 uppercase">Estimated Length</span>
              <span className="text-base font-mono font-semibold text-teal-600">{wallLength} meters</span>
            </div>
          </div>
        </div>
        <div className="text-[9px] text-slate-400 font-mono mt-3">ID: {wall.id}</div>
      </div>
    );
  }

  // --- 3. OPENING PROPERTIES EDITING (DOOR/WINDOW) ---
  if (selectedElementType === 'opening') {
    const op = openings.find((o) => o.id === selectedElementId);
    if (!op) return null;

    return (
      <div className="w-full bg-white border border-slate-200 rounded-xl p-4 text-slate-700 shadow-sm flex flex-col justify-between h-full min-h-[300px]">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <span className="text-xs uppercase tracking-wider font-mono text-slate-400">
              Selected: {op.type.toUpperCase()}
            </span>
            <button
              onClick={() => deleteElement(op.id, 'opening')}
              className="p-1 hover:bg-rose-50 text-rose-600 rounded transition-colors"
              title={`Delete ${op.type}`}
            >
              <Trash2 size={15} />
            </button>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                Width (cm)
              </label>
              <input
                type="number"
                value={op.width}
                onChange={(e) => updateOpening(op.id, { width: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                Height (cm)
              </label>
              <input
                type="number"
                value={op.height}
                onChange={(e) => updateOpening(op.id, { height: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                Elevation from Floor (cm)
              </label>
              <input
                type="number"
                value={op.elevation}
                onChange={(e) => updateOpening(op.id, { elevation: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1 flex justify-between">
                <span>Wall Position</span>
                <span className="font-mono text-teal-600">{Math.round(op.positionPercent * 100)}%</span>
              </label>
              <input
                type="range"
                min="0.05"
                max="0.95"
                step="0.01"
                value={op.positionPercent}
                onChange={(e) => updateOpening(op.id, { positionPercent: Number(e.target.value) })}
                className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
            </div>
          </div>
        </div>
        <div className="text-[9px] text-slate-400 font-mono mt-3">ID: {op.id}</div>
      </div>
    );
  }

  // --- 4. FURNITURE PROPERTIES EDITING ---
  if (selectedElementType === 'furniture') {
    const furn = furniture.find((f) => f.id === selectedElementId);
    if (!furn) return null;

    const rotationDeg = Math.round((furn.rotation * 180) / Math.PI);

    return (
      <div className="w-full bg-white border border-slate-200 rounded-xl p-4 text-slate-700 shadow-sm flex flex-col justify-between h-full min-h-[300px]">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <span className="text-xs uppercase tracking-wider font-mono text-slate-400">
              Selected: Furniture ({furn.type.toUpperCase()})
            </span>
            <button
              onClick={() => deleteElement(furn.id, 'furniture')}
              className="p-1 hover:bg-rose-50 text-rose-600 rounded transition-colors"
              title="Delete Furniture"
            >
              <Trash2 size={15} />
            </button>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                Length (cm)
              </label>
              <input
                type="number"
                value={furn.length}
                onChange={(e) => updateFurniture(furn.id, { length: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                Width (cm)
              </label>
              <input
                type="number"
                value={furn.width}
                onChange={(e) => updateFurniture(furn.id, { width: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                Height (cm)
              </label>
              <input
                type="number"
                value={furn.height}
                onChange={(e) => updateFurniture(furn.id, { height: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1 flex justify-between">
                <span>Rotation (Degrees)</span>
                <span className="font-mono text-teal-600">{rotationDeg}°</span>
              </label>
              <input
                type="range"
                min="0"
                max="360"
                value={rotationDeg}
                onChange={(e) => {
                  const rad = (Number(e.target.value) * Math.PI) / 180;
                  updateFurniture(furn.id, { rotation: rad });
                }}
                className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
            </div>
          </div>
        </div>
        <div className="text-[9px] text-slate-400 font-mono mt-3">ID: {furn.id}</div>
      </div>
    );
  }

  // --- 5. ROOM PROPERTIES EDITING ---
  if (selectedElementType === 'room') {
    const roomKey = selectedElementId;
    const currentName = roomKey ? roomNames[roomKey] || 'Unnamed Room' : 'Unnamed Room';

    const detectedRooms = findRooms(points, walls);
    const room = detectedRooms.find((r) => r.key === roomKey);
    const area = room ? room.area.toFixed(2) : '0.00';
    const cornerCount = room ? room.pointIds.length : 0;

    const presetNames = [
      'Living Room, Dining and Kitchen',
      'Bedroom 1',
      'Bedroom 2',
      'Master Bedroom',
      'Bathroom',
      'Lobby',
      'WC',
      'Shr',
      'Kitchen',
      'Veranda',
      'Office',
    ];

    return (
      <div className="w-full bg-white border border-slate-200 rounded-xl p-4 text-slate-700 shadow-sm flex flex-col justify-between h-full min-h-[300px]">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <span className="text-xs uppercase tracking-wider font-mono text-slate-400 flex items-center gap-1.5">
              <Layers size={14} className="text-teal-600" /> Selected: Room
            </span>
            <button
              onClick={() => deleteElement(roomKey, 'room')}
              className="p-1 hover:bg-rose-50 text-rose-600 rounded transition-colors"
              title="Reset Room Name"
            >
              <Trash2 size={15} />
            </button>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                Room Purpose / Type
              </label>
              <select
                value={presetNames.includes(currentName) ? currentName : 'Custom'}
                onChange={(e) => {
                  if (e.target.value !== 'Custom') {
                    updateRoomName(roomKey, e.target.value);
                  }
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
              >
                <option value="" disabled>Select a room type...</option>
                {presetNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
                <option value="Custom">Custom Name...</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                Custom Name
              </label>
              <input
                type="text"
                value={currentName}
                onChange={(e) => updateRoomName(roomKey, e.target.value)}
                placeholder="Enter custom room name..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                <span className="block text-[9px] text-slate-400 uppercase">Calculated Area</span>
                <span className="text-sm font-mono font-semibold text-emerald-600">{area} m²</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                <span className="block text-[9px] text-slate-400 uppercase">Wall Vertices</span>
                <span className="text-sm font-mono font-semibold text-teal-600">{cornerCount} corners</span>
              </div>
            </div>
          </div>
        </div>
        <div className="text-[9px] text-slate-400 font-mono mt-3 truncate animate-fade-in" title={roomKey}>KEY: {roomKey}</div>
      </div>
    );
  }

  return null;
};
export default PropertiesPanel;
