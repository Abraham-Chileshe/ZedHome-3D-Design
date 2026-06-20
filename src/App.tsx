import React, { useState, useMemo } from 'react';
import { useStore } from './store/useStore';
import { calculateCost } from './utils/costEstimator';
import { Editor2D } from './components/Editor2D';
import { Editor3D } from './components/Editor3D';
import { CostEstimatorView } from './components/CostEstimatorView';
import { PropertiesPanel } from './components/PropertiesPanel';
import {
  MousePointer,
  PenTool,
  DoorClosed,
  Bed,
  Eraser,
  Printer,
  Compass,
  FileText,
  Paintbrush,
  Camera,
  Plus,
  Map,
  Hammer,
  Layers,
  LayoutGrid,
  DoorOpen,
  Grid,
  Lock,
  Sofa,
  Utensils,
  Bath,
  Home
} from 'lucide-react';
import { LandingPage } from './components/LandingPage';
import './App.css';

export const App: React.FC = () => {
  const {
    points,
    walls,
    openings,
    selectedTool,
    selectedFurnitureType,
    materialsCatalog,
    setSelectedTool,
    setSelectedFurnitureType,
    setActiveTab,
    showFloors,
    showRoofs,
    roofStyle,
    setShowFloors,
    setShowRoofs,
    setRoofStyle,
  } = useStore();

  // Page routing state ('landing' or 'app')
  const [currentPage, setCurrentPage] = useState<'landing' | 'app'>('landing');

  // Local navigation states matching double-decker toolbars
  const [activePrimary, setActivePrimary] = useState<string>('layout');
  const [activeSecondary, setActiveSecondary] = useState<string>('walls');

  // Compute live subtotal cost
  const totalCost = useMemo(() => {
    const costReport = calculateCost(points, walls, openings, materialsCatalog);
    return costReport.totalCost;
  }, [points, walls, openings, materialsCatalog]);

  const handlePrint = () => {
    setActiveTab('cost');
    setActivePrimary('details');
    setActiveSecondary('boq');
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Synchronize top navigation changes with active tabs in store
  const handlePrimaryChange = (tab: string) => {
    setActivePrimary(tab);
    if (tab === 'layout') {
      setActiveSecondary('walls');
      setSelectedTool('select');
      setActiveTab('2d');
    } else if (tab === 'openings') {
      setActiveSecondary('doors');
      setSelectedTool('door');
      setActiveTab('2d');
    } else if (tab === 'furnishings') {
      setActiveSecondary('living');
      setSelectedTool('furniture');
      setSelectedFurnitureType('sofa');
      setActiveTab('2d');
    } else if (tab === 'materials') {
      setActiveSecondary('pricing');
      setSelectedTool('select');
      setActiveTab('2d');
    } else if (tab === 'roof') {
      setActiveSecondary('style');
      setSelectedTool('select');
      setActiveTab('3d');
    } else if (tab === 'studio') {
      setActiveSecondary('render');
      setSelectedTool('select');
      setActiveTab('3d');
    } else if (tab === 'details') {
      setActiveSecondary('boq');
      setSelectedTool('select');
      setActiveTab('cost');
    }
  };

  const showSidebar = activePrimary !== 'details';

  if (currentPage === 'landing') {
    return <LandingPage onLaunch={() => setCurrentPage('app')} />;
  }

  return (
    <div className="cad-layout font-sans text-slate-600 bg-slate-50">
      
      {/* ========================================================= */}
      {/* LEFT SIDE NAVIGATION BAR                                  */}
      {/* ========================================================= */}
      <aside className="side-nav">
        {/* Top: Logo + Stacked Tabs */}
        <div className="flex flex-col items-center gap-6 w-full">
          <button
            onClick={() => setCurrentPage('landing')}
            className="side-nav-logo hover:bg-teal-500 hover:scale-105 transition-all cursor-pointer flex items-center justify-center font-black text-white border-none"
            title="Return to Landing Page"
          >
            Z
          </button>
          <nav className="side-nav-tabs">
            {[
              { id: 'layout', label: 'Layout', icon: PenTool },
              { id: 'openings', label: 'Openings', icon: DoorClosed },
              { id: 'roof', label: 'Roof', icon: Layers },
              { id: 'furnishings', label: 'Furnishings', icon: Bed },
              { id: 'materials', label: 'Materials', icon: Paintbrush },
              { id: 'studio', label: 'Studio', icon: Camera },
              { id: 'details', label: 'Plan details', icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activePrimary === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handlePrimaryChange(tab.id)}
                  className={`side-nav-button ${isActive ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Version tag */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-[8px] font-mono text-slate-400 tracking-wider uppercase">
            v1.2.0
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MAIN CONTENT AREA CONTAINER                               */}
      {/* ========================================================= */}
      <div className="content-area">
        
        {/* Streamlined Top Header */}
        <header className="flex items-center justify-between px-6 bg-slate-900 border-b border-slate-800 z-20 shadow-sm h-14 select-none">
          {/* Brand & Subtitle */}
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <h1 className="text-xs font-extrabold text-white uppercase tracking-widest leading-none m-0">
                Chile's Flat Plan
              </h1>
              <span className="text-[9px] text-teal-400 font-bold tracking-wide mt-0.5 leading-none">
                Zambian 3D Home Designer
              </span>
            </div>

            {/* Secondary Navigation (Horizontal Pill Tabs) */}
            <nav className="top-nav-container border-l border-slate-800 pl-6 select-none">
              {activePrimary === 'layout' && (
                <>
                  <button className="top-nav-item disabled">
                    <Map size={13} />
                    <span>Land</span>
                  </button>
                  <button
                    onClick={() => setActiveSecondary('walls')}
                    className={`top-nav-item ${activeSecondary === 'walls' ? 'active' : ''}`}
                  >
                    <Hammer size={13} />
                    <span>Walls</span>
                  </button>
                  <button className="top-nav-item disabled">
                    <Grid size={13} />
                    <span>Post & Beams</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveSecondary('room_types');
                      setSelectedTool('select');
                    }}
                    className={`top-nav-item ${activeSecondary === 'room_types' ? 'active' : ''}`}
                  >
                    <LayoutGrid size={13} />
                    <span>Room Types</span>
                  </button>
                  <button className="top-nav-item disabled">
                    <Layers size={13} />
                    <span>Levels</span>
                  </button>
                </>
              )}

              {activePrimary === 'openings' && (
                <>
                  <button
                    onClick={() => {
                      setActiveSecondary('doors');
                      setSelectedTool('door');
                    }}
                    className={`top-nav-item ${activeSecondary === 'doors' ? 'active' : ''}`}
                  >
                    <DoorOpen size={13} />
                    <span>Doors</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveSecondary('windows');
                      setSelectedTool('window');
                    }}
                    className={`top-nav-item ${activeSecondary === 'windows' ? 'active' : ''}`}
                  >
                    <Plus size={13} />
                    <span>Windows</span>
                  </button>
                  <button className="top-nav-item disabled">
                    <Lock size={13} />
                    <span>Shutters</span>
                  </button>
                </>
              )}

              {activePrimary === 'furnishings' && (
                <div className="flex gap-1.5">
                  {[
                    { id: 'living', label: 'Living Room', icon: Sofa },
                    { id: 'bedroom', label: 'Bedroom', icon: Bed },
                    { id: 'kitchen', label: 'Kitchen', icon: Utensils },
                    { id: 'bathroom', label: 'Bathroom', icon: Bath },
                  ].map((sec) => {
                    const Icon = sec.icon;
                    const isActive = activeSecondary === sec.id;
                    return (
                      <button
                        key={sec.id}
                        onClick={() => {
                          setActiveSecondary(sec.id);
                          setSelectedTool('furniture');
                          if (sec.id === 'living') setSelectedFurnitureType('sofa');
                          else if (sec.id === 'bedroom') setSelectedFurnitureType('bed');
                          else if (sec.id === 'kitchen') setSelectedFurnitureType('sink');
                          else if (sec.id === 'bathroom') setSelectedFurnitureType('toilet');
                        }}
                        className={`top-nav-item ${isActive ? 'active' : ''}`}
                      >
                        <Icon size={13} />
                        <span>{sec.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {activePrimary === 'materials' && (
                <span className="top-nav-item active font-bold">
                  <Paintbrush size={13} />
                  <span>Wall Pricing & Materials</span>
                </span>
              )}

              {activePrimary === 'studio' && (
                <span className="top-nav-item active font-bold">
                  <Camera size={13} />
                  <span>3D Render Visualizer</span>
                </span>
              )}

              {activePrimary === 'details' && (
                <span className="top-nav-item active font-bold">
                  <FileText size={13} />
                  <span>Bill of Quantities (BoQ) Estimator</span>
                </span>
              )}
            </nav>
          </div>

          {/* Running Subtotal & Quick Actions */}
          <div className="flex items-center gap-3">
            {/* Live Subtotal Cost */}
            <button
              onClick={() => handlePrimaryChange('details')}
              className="flex flex-col items-end bg-slate-800 px-4 py-1.5 border border-slate-700 hover:border-emerald-500 rounded transition-colors cursor-pointer group"
            >
              <span className="text-[8px] font-mono text-slate-400 uppercase tracking-wider group-hover:text-emerald-400 transition-colors">
                Running Subtotal (ZMW)
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                K {totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </button>

            {/* Quick PDF Print Trigger */}
            <button
              onClick={handlePrint}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Print Estimate Sheet"
            >
              <Printer size={15} />
            </button>

            {/* Exit Editor Button */}
            <button
              onClick={() => setCurrentPage('landing')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-teal-500 rounded text-slate-300 hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              title="Return to Landing Page"
            >
              <Home size={14} />
              <span>Exit</span>
            </button>
          </div>
        </header>

      {/* ========================================================= */}
      {/* DECK 3: SUB-TOOLBAR SELECTORS (Slate-50 Theme)            */}
      {/* ========================================================= */}
      <div className="flex items-center px-6 bg-slate-50 border-b border-slate-200 h-11 select-none text-xs gap-3">
        {/* Draw Walls Submenus */}
        {activePrimary === 'layout' && activeSecondary === 'walls' && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSelectedTool('select')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                selectedTool === 'select'
                  ? 'bg-teal-600 text-white font-bold'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-800'
              }`}
              title="Pointer Selector"
            >
              <MousePointer size={13} /> Pointer / Select
            </button>
            <button
              onClick={() => setSelectedTool('wall')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                selectedTool === 'wall'
                  ? 'bg-teal-600 text-white font-bold'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-800'
              }`}
              title="Draw Exterior Wall (15cm)"
            >
              <PenTool size={13} /> Draw Wall (15cm)
            </button>
            <button
              onClick={() => setSelectedTool('eraser')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                selectedTool === 'eraser'
                  ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-800'
              }`}
              title="Eraser Tool"
            >
              <Eraser size={13} /> Eraser
            </button>
          </div>
        )}

        {/* Room Types helper info */}
        {activePrimary === 'layout' && activeSecondary === 'room_types' && (
          <div className="text-slate-500 font-medium text-[11px] tracking-wide">
            💡 Select the <span className="text-teal-600 font-bold">Pointer</span> tool, then click on any closed room area on the blueprint to edit its name, type, and calculate its area.
          </div>
        )}

        {/* Roof & Floor Construction Submenu */}
        {activePrimary === 'roof' && (
          <div className="flex items-center gap-4 w-full justify-between select-none">
            <div className="flex items-center gap-2">
              {/* Floor Slab Toggle Button */}
              <button
                onClick={() => setShowFloors(!showFloors)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  showFloors
                    ? 'bg-teal-600 text-white font-extrabold shadow-sm'
                    : 'bg-slate-200/50 text-slate-500 hover:bg-slate-200 hover:text-slate-800'
                }`}
              >
                <span>Floor Slabs: {showFloors ? 'ON' : 'OFF'}</span>
              </button>

              {/* Roof Sheets Toggle Button */}
              <button
                onClick={() => setShowRoofs(!showRoofs)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  showRoofs
                    ? 'bg-teal-600 text-white font-extrabold shadow-sm'
                    : 'bg-slate-200/50 text-slate-500 hover:bg-slate-200 hover:text-slate-800'
                }`}
              >
                <span>Roof Cover: {showRoofs ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {showRoofs && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">Style:</span>
                {[
                  { id: 'gable', label: 'Pitched Gable' },
                  { id: 'flat', label: 'Flat Slab' },
                  { id: 'none', label: 'No Cover' }
                ].map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setRoofStyle(style.id as 'none' | 'flat' | 'gable')}
                    className={`px-2.5 py-1.25 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      roofStyle === style.id
                        ? 'bg-slate-800 text-white font-extrabold'
                        : 'text-slate-500 hover:bg-slate-200 hover:text-slate-800 border border-slate-200'
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Wall Openings placement tools */}
        {activePrimary === 'openings' && (
          <div className="flex items-center gap-1.5">
            {activeSecondary === 'doors' ? (
              <button
                onClick={() => setSelectedTool('door')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  selectedTool === 'door'
                    ? 'bg-teal-600 text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-800'
                }`}
              >
                <Plus size={13} /> Standard Internal Door (90cm)
              </button>
            ) : (
              <button
                onClick={() => setSelectedTool('window')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  selectedTool === 'window'
                    ? 'bg-teal-600 text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-800'
                }`}
              >
                <Plus size={13} /> Standard Glass Window (120cm)
              </button>
            )}
          </div>
        )}

        {/* Furnishings tools */}
        {activePrimary === 'furnishings' && (
          <div className="flex items-center gap-1.5">
            {activeSecondary === 'living' && (
              <>
                {['sofa', 'table', 'chair'].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setSelectedTool('furniture');
                      setSelectedFurnitureType(type);
                    }}
                    className={`px-3 py-1.5 rounded text-[11px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                      selectedTool === 'furniture' && selectedFurnitureType === type
                        ? 'bg-teal-600 text-white font-bold'
                        : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-800'
                    }`}
                  >
                    Place {type}
                  </button>
                ))}
              </>
            )}
            {activeSecondary === 'bedroom' && (
              <button
                onClick={() => {
                  setSelectedTool('furniture');
                  setSelectedFurnitureType('bed');
                }}
                className={`px-3 py-1.5 rounded text-[11px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  selectedTool === 'furniture' && selectedFurnitureType === 'bed'
                    ? 'bg-teal-600 text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-800'
                }`}
              >
                Place Bed
              </button>
            )}
            {activeSecondary === 'kitchen' && (
              <button
                onClick={() => {
                  setSelectedTool('furniture');
                  setSelectedFurnitureType('sink');
                }}
                className={`px-3 py-1.5 rounded text-[11px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  selectedTool === 'furniture' && selectedFurnitureType === 'sink'
                    ? 'bg-teal-600 text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-800'
                }`}
              >
                Place Sink
              </button>
            )}
            {activeSecondary === 'bathroom' && (
              <button
                onClick={() => {
                  setSelectedTool('furniture');
                  setSelectedFurnitureType('toilet');
                }}
                className={`px-3 py-1.5 rounded text-[11px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  selectedTool === 'furniture' && selectedFurnitureType === 'toilet'
                    ? 'bg-teal-600 text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-800'
                }`}
              >
                Place Toilet
              </button>
            )}
          </div>
        )}

        {/* Materials Subtoolbar */}
        {activePrimary === 'materials' && (
          <div className="text-slate-500 font-medium text-[11px] tracking-wide">
            🧱 Materials Catalog active. Adjust prices on the right panel or select walls to modify their properties.
          </div>
        )}

        {/* Studio Subtoolbar */}
        {activePrimary === 'studio' && (
          <div className="text-slate-500 font-medium text-[11px] tracking-wide">
            📸 3D Camera active. Left-click drag to rotate, right-click drag to pan, wheel to zoom.
          </div>
        )}

        {/* Cost Sheet Subtoolbar */}
        {activePrimary === 'details' && (
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-100 rounded text-[11px] font-bold cursor-pointer"
          >
            <Printer size={13} /> Print Bill of Quantities / Save PDF
          </button>
        )}
      </div>

      {/* ========================================================= */}
      {/* DECK 4: MAIN CAD CONTAINER GRID LAYOUT                    */}
      {/* ========================================================= */}
      <div className={`cad-container ${showSidebar ? 'has-sidebar' : 'full-width'} bg-slate-100`}>
        
        {/* CENTER VIEWPORT (Workspace) */}
        <main className="p-5 overflow-hidden flex items-center justify-center bg-slate-100">
          {activePrimary === 'details' && <CostEstimatorView />}
          {activePrimary === 'studio' && <Editor3D isMini={false} />}
          {activePrimary !== 'details' && activePrimary !== 'studio' && <Editor2D />}
        </main>

        {/* RIGHT SIDEBAR (3D Mini-Preview & Consolidated Properties) */}
        {showSidebar && (
          <aside className="sidebar-panel-right border-l border-slate-200 bg-white select-none shadow-sm">
            {/* Top Half: Mini 3D Preview (Live sync), hidden in Studio mode to avoid redundant rendering */}
            {activePrimary !== 'studio' && (
              <div className="flex flex-col gap-2 shrink-0">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Compass size={13} className="text-teal-600" /> 3D Mini-Preview
                  </span>
                  <span className="text-[8px] bg-teal-50 text-teal-600 border border-teal-200 px-1 py-0.5 rounded font-mono font-semibold">
                    LIVE
                  </span>
                </div>
                <div className="w-full h-[180px] rounded-lg overflow-hidden border border-slate-200 shadow-inner bg-slate-50 relative shrink-0">
                  <Editor3D isMini={true} />
                </div>
              </div>
            )}

            {/* Bottom Half: Context-Sensitive Properties & Integrated Settings */}
            <div className="custom-scrollable flex flex-col">
              <PropertiesPanel activePrimary={activePrimary} />
            </div>
          </aside>
        )}
      </div>

      </div>
    </div>
  );
};

export default App;
