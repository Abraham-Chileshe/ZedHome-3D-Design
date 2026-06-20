import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  Clock,
  Coins,
  TrendingUp,
  Settings,
  TrendingDown,
  Image as ImageIcon,
  Play,
  ArrowRight,
  ChevronDown,
  Check,
  Compass
} from 'lucide-react';

interface LandingPageProps {
  onLaunch: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunch }) => {
  const { clearProject, loadDemoProject } = useStore();
  const [activeTab, setActiveTab] = useState<number>(0);

  const handleStartScratch = () => {
    clearProject();
    onLaunch();
  };

  const handleStartDemo = () => {
    loadDemoProject();
    onLaunch();
  };

  return (
    <div className="w-full h-screen overflow-y-auto bg-white text-slate-850 select-text font-sans scroll-smooth">
      
      {/* 1. DARK HEADER & HERO WRAPPER */}
      <div className="bg-[#0C1E26] text-white relative overflow-hidden">
        {/* Glow overlay elements */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[150px] pointer-events-none" />

        {/* HEADER / NAVIGATION */}
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between border-b border-white/5 relative z-10">
          <div className="flex items-center gap-10">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-teal-400 flex items-center justify-center text-teal-400 font-extrabold text-sm shadow-[0_0_15px_rgba(45,212,191,0.2)]">
                Z
              </div>
              <span className="text-lg font-black tracking-wider text-white uppercase font-mono">
                Zed<span className="text-teal-400">Home</span>
              </span>
            </div>

            {/* Menu Items with Dropdowns */}
            <div className="hidden lg:flex items-center gap-6 text-[13px] font-semibold text-slate-300">
              <button className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer">
                Solutions <ChevronDown size={14} className="text-slate-400" />
              </button>
              <button className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer">
                Product <ChevronDown size={14} className="text-slate-400" />
              </button>
              <a href="#gallery" className="hover:text-white transition-colors">Gallery</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <button className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer">
                Resources <ChevronDown size={14} className="text-slate-400" />
              </button>
              <button className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer">
                Company <ChevronDown size={14} className="text-slate-400" />
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleStartDemo}
              className="text-[13px] font-bold text-slate-350 hover:text-white transition-colors cursor-pointer"
            >
              Log In / Demo
            </button>
            <button
              onClick={handleStartScratch}
              className="px-5 py-2.5 bg-[#C80064] hover:bg-[#b00058] text-white text-[13px] font-extrabold rounded transition-all shadow-md shadow-pink-900/20 cursor-pointer"
            >
              Get Started Free
            </button>
          </div>
        </nav>

        {/* HERO CONTENT */}
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-24 md:py-28 lg:py-32 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Left Text */}
          <div className="lg:col-span-7 text-left flex flex-col items-start">
            <h1 className="text-4xl sm:text-5xl md:text-[52px] font-extrabold text-white tracking-tight leading-[1.1] mb-6">
              The Only 3D Home Design Software to Draw a Complete House in Just 2 Hours
            </h1>
            <p className="text-base text-slate-300 font-medium mb-8 max-w-xl leading-relaxed">
              Give Yourself an Edge in Selling, Costing, and Visualizing Home Building and Remodeling Projects. Draft exact local structures with centimeter accuracy and get ZMW estimates instantly.
            </p>
            <button
              onClick={handleStartScratch}
              className="px-8 py-3.5 bg-[#C80064] hover:bg-[#b00058] text-white font-extrabold rounded-md text-sm transition-all shadow-lg shadow-pink-900/40 cursor-pointer"
            >
              Get Started Free
            </button>
          </div>

          {/* Right Laptop Mockup Collage */}
          <div className="lg:col-span-5 relative flex justify-center w-full mt-6 lg:mt-0 select-none">
            
            {/* Laptop Body Base */}
            <div className="relative w-full max-w-[460px] aspect-[1.6/1]">
              
              {/* Laptop Screen Frame (Outer Bezel) */}
              <div className="w-full h-full bg-[#080f13] border-4 border-[#1c2b33] rounded-t-xl shadow-2xl relative overflow-hidden p-2 flex flex-col gap-2">
                
                {/* CAD Drawing Interface Background */}
                <div className="flex-1 bg-[#121c22] rounded border border-[#1b2b34] relative overflow-hidden flex items-center justify-center p-2">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1b2b34_1px,transparent_1px),linear-gradient(to_bottom,#1b2b34_1px,transparent_1px)] bg-[size:12px_12px] opacity-25" />
                  
                  {/* Vector House blueprint inside mockup */}
                  <svg className="w-4/5 h-4/5 stroke-teal-500/40 fill-none stroke-2" viewBox="0 0 200 200">
                    <rect x="20" y="20" width="160" height="160" rx="3" className="stroke-teal-500/60 stroke-[3]" />
                    <line x1="100" y1="20" x2="100" y2="180" className="stroke-teal-400/80 stroke-2" />
                    <rect x="40" y="40" width="40" height="40" className="stroke-slate-500/50 stroke-1" />
                    <rect x="120" y="40" width="40" height="80" className="stroke-slate-500/50 stroke-1" />
                    <text x="35" y="150" className="fill-teal-300 text-[10px] tracking-wider font-bold" stroke="none">DRAFT_15CM</text>
                  </svg>

                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-900/80 border border-slate-700/60 rounded text-[9px] font-mono text-teal-400">
                    GRID: 20cm
                  </div>
                </div>
              </div>

              {/* Laptop Keyboard base mockup */}
              <div className="absolute bottom-[-10px] left-[-5%] right-[-5%] h-[12px] bg-gradient-to-b from-[#2a383f] to-[#121c22] border-t border-[#465963] rounded-b-xl shadow-2xl" />
              <div className="absolute bottom-[-14px] left-[40%] right-[40%] h-[4px] bg-[#0c151c] rounded-b-md" />

              {/* Stacked Overlay 1: 3D Render block with round play button */}
              <div className="absolute bottom-4 left-[-15px] w-[200px] h-[140px] bg-slate-900 border border-slate-700/60 rounded-lg overflow-hidden shadow-2xl flex flex-col transform hover:scale-105 transition-all">
                <div className="bg-[#091115] px-2.5 py-1 border-b border-slate-800 flex items-center justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>3D Rendering</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>
                <div className="flex-1 bg-gradient-to-tr from-teal-950/80 to-slate-900 flex items-center justify-center relative">
                  {/* Mock wireframe house */}
                  <div className="w-20 h-14 border border-teal-400/35 border-b-4 rounded transform rotate-6 flex items-center justify-center bg-teal-500/5">
                    <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 cursor-pointer hover:bg-teal-500/35 transition-colors">
                      <Play size={16} className="fill-teal-400 ml-0.5 text-teal-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Stacked Overlay 2: Elevation card overlay on right */}
              <div className="absolute top-12 right-[-20px] w-[180px] h-[130px] bg-white border border-slate-200 rounded-lg shadow-2xl p-2.5 flex flex-col justify-between transform hover:scale-105 transition-all">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                  <span className="text-[9px] font-extrabold text-[#0C1E26] uppercase">Facade Section</span>
                  <span className="text-[8px] text-slate-400">Scale: 1:50</span>
                </div>
                <div className="flex-1 flex items-center justify-center py-2">
                  {/* SVG structure representing clean architectural line drawing */}
                  <svg className="w-full h-full stroke-slate-700 fill-none stroke-1" viewBox="0 0 100 60">
                    <path d="M 10 50 L 90 50 L 90 25 L 50 10 L 10 25 Z" className="stroke-slate-900 stroke-2" />
                    <line x1="50" y1="10" x2="50" y2="50" className="stroke-slate-300" />
                    <rect x="25" y="30" width="12" height="12" />
                    <rect x="63" y="30" width="12" height="12" />
                  </svg>
                </div>
                <div className="text-[7px] text-slate-400 font-bold tracking-wider uppercase text-right">
                  Elevation Plan View
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* 2. THREE PERCENTAGE STATS */}
      <section className="bg-white border-b border-slate-100 py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 bg-teal-50 border border-teal-100 rounded-full flex items-center justify-center text-[#009688] mb-4">
              <Clock size={26} />
            </div>
            <h3 className="text-4xl font-extrabold text-slate-900">50%</h3>
            <p className="text-[14px] text-slate-500 font-medium mt-1">Close sales and finalize layouts in half the time</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-14 h-14 bg-teal-50 border border-teal-100 rounded-full flex items-center justify-center text-[#009688] mb-4">
              <Coins size={26} />
            </div>
            <h3 className="text-4xl font-extrabold text-slate-900">60%</h3>
            <p className="text-[14px] text-slate-500 font-medium mt-1">Cost estimation time reduction in the pre-sales stage</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-14 h-14 bg-teal-50 border border-teal-100 rounded-full flex items-center justify-center text-[#009688] mb-4">
              <TrendingUp size={26} />
            </div>
            <h3 className="text-4xl font-extrabold text-slate-900">40%</h3>
            <p className="text-[14px] text-slate-500 font-medium mt-1">Increase in new project approvals and conversions</p>
          </div>

        </div>
      </section>

      {/* 3. WHY YOU NEED ZEDHOME */}
      <section className="bg-slate-50/50 py-24 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Collage of images on the left */}
            <div className="lg:col-span-6 relative w-full aspect-[4/3] flex items-center justify-center select-none">
              
              {/* Overlapping Image 1 (Lower / Left) */}
              <div className="absolute left-4 bottom-4 w-4/5 aspect-[4/3] bg-white rounded-xl shadow-xl overflow-hidden border border-slate-100 transform -rotate-2">
                <img
                  src="/house_builders.png"
                  alt="Modern House design"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Overlapping Image 2 (Upper / Right) */}
              <div className="absolute right-4 top-4 w-3/5 aspect-[4/3] bg-white rounded-xl shadow-2xl overflow-hidden border-2 border-white transform rotate-3 z-10">
                <img
                  src="/house_contractors.png"
                  alt="Contemporary barn cabin house render"
                  className="w-full h-full object-cover"
                />
              </div>

            </div>

            {/* Content on the right */}
            <div className="lg:col-span-6 text-left">
              <h2 className="text-3xl font-extrabold text-[#0C1E26] tracking-tight mb-6">
                Why You Need ZedHome
              </h2>
              <p className="text-base text-slate-600 leading-relaxed font-medium mb-8">
                Reduce the time needed for drawing and present your contractors or prospective customers with a complete layout as quickly as possible. Gain efficiency, avoid building material waste, and control project costs in the planning phase.
              </p>

              {/* Three detailed text columns inside feature list */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col items-start">
                  <div className="text-[#009688] mb-2"><Settings size={20} /></div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">Streamline Process</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">Design house blueprints and estimate quantities in one fluid tool.</p>
                </div>
                <div className="flex flex-col items-start">
                  <div className="text-[#009688] mb-2"><TrendingDown size={20} /></div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">Reduce Costs</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">Stop paying expensive design firms for early draft iterations.</p>
                </div>
                <div className="flex flex-col items-start">
                  <div className="text-[#009688] mb-2"><ImageIcon size={20} /></div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">3D Renderings</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">Present clients with realistic interior and exterior renderings.</p>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 4. DESIGN YOUR PROJECTS FASTER THAN EVER (TABBED SHOWCASE) */}
      <section className="py-24 border-b border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          
          <h2 className="text-3xl font-extrabold text-[#0C1E26] tracking-tight mb-4">
            Design Your Home Projects Faster Than Ever
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto text-sm leading-relaxed mb-12">
            ZedHome brings together all the elements you need to design your home projects. From drawings to photorealistic 3D visuals and estimate sheets, it's quick and easy.
          </p>

          {/* Horizontal Tabs selector */}
          <div className="flex flex-wrap justify-center gap-1 sm:gap-6 border-b border-slate-100 pb-4 mb-12">
            {[
              { num: '1', name: 'Home Design' },
              { num: '2', name: '3D Visualization' },
              { num: '3', name: 'ZMW Cost Sheets' },
              { num: '4', name: 'Local Materials' },
            ].map((tab, idx) => {
              const isActive = activeTab === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'border-[#009688] text-[#009688]'
                      : 'border-transparent text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                    isActive ? 'bg-[#009688] text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {tab.num}
                  </span>
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>

          {/* Tabs Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center text-left">
            
            {/* Left side checklist */}
            <div className="lg:col-span-5 flex flex-col items-start">
              
              <h3 className="text-xl font-extrabold text-slate-900 mb-6">
                {activeTab === 0 && 'Draw and store all plan files in one place:'}
                {activeTab === 1 && 'Instantly visualize your blueprint details in live 3D:'}
                {activeTab === 2 && 'Generate immediate Bill of Quantities (BoQ) estimates:'}
                {activeTab === 3 && 'Use pre-calibrated local market material prices:'}
              </h3>

              <ul className="flex flex-col gap-4 mb-8">
                {activeTab === 0 && [
                  'Centimeter-accurate external 6-inch hollow block walls',
                  'Internal partition 4-inch block layout',
                  'Site and property land boundary layouts',
                  'Predefined door and window opening sizes',
                  'Square footage and room area auto-calculations',
                  'Standard furniture placement spacing guidelines',
                  'Export blueprint views ready to print on paper'
                ].map((txt, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-slate-600 font-medium">
                    <span className="w-4 h-4 bg-teal-50 border border-teal-100 rounded-full flex items-center justify-center text-[#009688] shrink-0 mt-0.5">
                      <Check size={10} className="stroke-[3]" />
                    </span>
                    <span>{txt}</span>
                  </li>
                ))}

                {activeTab === 1 && [
                  'WebGL real-time interactive render engine integration',
                  'Camera Orbit controls: left-drag to rotate, right-drag to pan',
                  'Mouse scroll wheel to zoom into interior details',
                  'Adjustable lighting and daytime skybox presets',
                  'Realistic camera projection heights matching builders eye levels',
                  'Pre-mapped materials: concrete slabs, paint finishes, and tiles'
                ].map((txt, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-slate-600 font-medium">
                    <span className="w-4 h-4 bg-teal-50 border border-teal-100 rounded-full flex items-center justify-center text-[#009688] shrink-0 mt-0.5">
                      <Check size={10} className="stroke-[3]" />
                    </span>
                    <span>{txt}</span>
                  </li>
                ))}

                {activeTab === 2 && [
                  'Instant Bill of Quantities (BoQ) sheet auto-updates',
                  'Concrete mortar volume and cement bag ratios (1:3 or 1:4 mix)',
                  'Hollow block counts based on wall length and thickness',
                  'Pine timber structural purlin and tie beam requirements',
                  'Galvanized IBR roof sheets linear length calculator',
                  'Skilled and helper builder labor costs calculator'
                ].map((txt, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-slate-600 font-medium">
                    <span className="w-4 h-4 bg-teal-50 border border-teal-100 rounded-full flex items-center justify-center text-[#009688] shrink-0 mt-0.5">
                      <Check size={10} className="stroke-[3]" />
                    </span>
                    <span>{txt}</span>
                  </li>
                ))}

                {activeTab === 3 && [
                  'Pre-calibrated local market base pricing for Zambia',
                  'Dangote and Chilanga cement specs (50kg, 42.5R) price tracking',
                  '6-inch (150mm) concrete hollow block piece price sync',
                  '4-inch (100mm) block pricing for interior walls',
                  'Fine river sand and crushed aggregates tonnage prices',
                  'Hourly builder labor rate customization fields'
                ].map((txt, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-slate-600 font-medium">
                    <span className="w-4 h-4 bg-teal-50 border border-teal-100 rounded-full flex items-center justify-center text-[#009688] shrink-0 mt-0.5">
                      <Check size={10} className="stroke-[3]" />
                    </span>
                    <span>{txt}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={handleStartScratch}
                className="text-xs font-bold text-[#009688] hover:underline flex items-center gap-1 cursor-pointer"
              >
                Learn more <ArrowRight size={13} />
              </button>

            </div>

            {/* Right side Stack layout */}
            <div className="lg:col-span-7 relative w-full flex justify-center bg-slate-50/50 p-6 rounded-xl border border-slate-100 min-h-[300px]">
              
              {activeTab === 0 && (
                <div className="w-full max-w-[480px] bg-white rounded-lg shadow-lg border border-slate-200 p-4 flex flex-col gap-4">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                    <span>blueprint_draft_elevation.pdf</span>
                    <span>SCALE: 1:100</span>
                  </div>
                  <div className="flex-1 border-2 border-dashed border-slate-200 rounded p-4 flex items-center justify-center bg-slate-50/40 select-none">
                    <svg className="w-full max-h-[220px] stroke-slate-800 fill-none stroke-2" viewBox="0 0 200 120">
                      <path d="M 20 100 L 180 100 L 180 60 L 140 30 L 60 30 L 20 60 Z" />
                      <line x1="60" y1="30" x2="60" y2="100" className="stroke-slate-300 stroke-1" />
                      <line x1="140" y1="30" x2="140" y2="100" className="stroke-slate-300 stroke-1" />
                      <rect x="85" y="65" width="30" height="35" className="stroke-teal-500 fill-teal-50" />
                      <rect x="35" y="55" width="15" height="15" />
                      <rect x="150" y="55" width="15" height="15" />
                    </svg>
                  </div>
                </div>
              )}

              {activeTab === 1 && (
                <div className="w-full max-w-[480px] bg-slate-900 rounded-lg shadow-lg border border-slate-800 p-4 flex flex-col gap-4 text-white">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                    <span>3D_PREVIEW_STUDIO.WEBP</span>
                    <span className="flex items-center gap-1"><Compass size={10} /> ORBIT CAMERA</span>
                  </div>
                  <div className="flex-1 bg-gradient-to-b from-[#121c22] to-[#091115] rounded p-6 flex flex-col items-center justify-center gap-3 relative select-none">
                    <div className="w-24 h-16 border-2 border-teal-400/40 rounded bg-teal-400/5 transform rotate-6 border-b-8 relative flex items-center justify-center">
                      <div className="absolute top-[-10px] left-0 right-0 h-4 border-l border-r border-t border-teal-400/20 transform skew-x-12" />
                    </div>
                    <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">Active WebGL Scene</span>
                  </div>
                </div>
              )}

              {activeTab === 2 && (
                <div className="w-full max-w-[480px] bg-white rounded-lg shadow-lg border border-slate-200 p-4 flex flex-col gap-4">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                    <span>BILL_OF_QUANTITIES_ESTIMATE.CSV</span>
                    <span className="text-emerald-500">ZMW PRICING</span>
                  </div>
                  <div className="flex-1 overflow-x-auto select-none">
                    <table className="w-full text-left text-[11px] text-slate-600">
                      <thead>
                        <tr className="border-b border-slate-250 bg-slate-50 text-slate-800 font-bold">
                          <th className="py-2 px-3">Material Spec</th>
                          <th className="py-2 px-3 text-right">Quantity</th>
                          <th className="py-2 px-3 text-right">ZMW Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-100">
                          <td className="py-2 px-3 font-semibold">Chilanga Cement (50kg)</td>
                          <td className="py-2 px-3 text-right">85 bags</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">K 14,875.00</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-2 px-3 font-semibold">6-Inch Concrete Hollow Block</td>
                          <td className="py-2 px-3 text-right">1,250 pcs</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">K 10,625.00</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-2 px-3 font-semibold">Timber Pine 2x4 purlins</td>
                          <td className="py-2 px-3 text-right">45 pcs</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">K 3,600.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 3 && (
                <div className="w-full max-w-[480px] bg-white rounded-lg shadow-lg border border-slate-200 p-4 flex flex-col gap-4">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                    <span>MATERIALS_CATALOG_SYNC.ZED</span>
                    <span className="text-teal-500 font-semibold">SYNC ACTIVE</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 select-none">
                    {[
                      { name: 'Dangote Cement', price: 'K 175.00 / bag' },
                      { name: '6" Concrete Block', price: 'K 8.50 / pc' },
                      { name: '4" Hollow Block', price: 'K 6.50 / pc' },
                      { name: 'River Sand (clean)', price: 'K 150.00 / ton' },
                    ].map((item, i) => (
                      <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex flex-col gap-1 text-left">
                        <span className="text-[10px] font-bold text-slate-550">{item.name}</span>
                        <span className="text-xs font-mono font-black text-emerald-500">{item.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      </section>

      {/* 5. A POWERFUL SALES TOOL FOR HOUSING PROFESSIONALS */}
      <section className="py-24 border-b border-slate-100 bg-slate-50/20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          
          <h2 className="text-3xl font-extrabold text-[#0C1E26] tracking-tight mb-4">
            A Powerful Sales Tool for Housing Professionals
          </h2>
          <p className="text-slate-550 max-w-2xl mx-auto text-sm leading-relaxed mb-16">
            ZedHome is more than a 3D home design tool. It helps home builders, contractors and remodelers shorten the sales cycle and improve close rates.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card 1 */}
            <div className="bg-white border border-slate-150 rounded-xl overflow-hidden shadow-md flex flex-col text-left hover:shadow-xl transition-all">
              <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 border-b border-slate-100">
                <img
                  src="/house_builders.png"
                  alt="Home Builders house template"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 flex flex-col items-start">
                <h3 className="text-lg font-bold text-slate-900 mb-3">Home Builders</h3>
                <p className="text-xs text-slate-550 leading-relaxed font-medium">
                  Design house plans, site plans, and photorealistic 3D renderings and build the full client presentation, all without leaving ZedHome.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white border border-slate-150 rounded-xl overflow-hidden shadow-md flex flex-col text-left hover:shadow-xl transition-all">
              <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 border-b border-slate-100">
                <img
                  src="/house_contractors.png"
                  alt="Contractors custom house template"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 flex flex-col items-start">
                <h3 className="text-lg font-bold text-slate-900 mb-3">Contractors</h3>
                <p className="text-xs text-slate-550 leading-relaxed font-medium">
                  From residential to light commercial projects, create every plan, 3D visuals, and proposal document needed to close the job in one platform.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white border border-slate-150 rounded-xl overflow-hidden shadow-md flex flex-col text-left hover:shadow-xl transition-all">
              <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 border-b border-slate-100">
                <img
                  src="/kitchen_remodel.png"
                  alt="Kitchen interior design template"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 flex flex-col items-start">
                <h3 className="text-lg font-bold text-slate-900 mb-3">Home Remodelers</h3>
                <p className="text-xs text-slate-550 leading-relaxed font-medium">
                  Design kitchen upgrades, bathroom refreshes, home additions... and present before-and-after visuals that close deals.
                </p>
              </div>
            </div>

          </div>

          {/* bottom action button to start free */}
          <div className="mt-16">
            <button
              onClick={handleStartScratch}
              className="px-8 py-4 bg-[#C80064] hover:bg-[#b00058] text-white font-extrabold text-sm rounded shadow-lg shadow-pink-900/30 cursor-pointer"
            >
              Get Started Free
            </button>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0C1E26] text-slate-400 py-16">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full border border-teal-400/50 flex items-center justify-center text-teal-400 font-extrabold text-sm">
              Z
            </div>
            <span className="text-sm font-black text-white uppercase tracking-wider font-mono">
              Zed<span className="text-teal-400">Home</span>
            </span>
          </div>

          <div className="flex flex-wrap gap-8 text-xs font-semibold text-slate-350">
            <a href="#features" className="hover:text-white transition-colors">Solutions</a>
            <a href="#features" className="hover:text-white transition-colors">Products</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">Pricing</a>
            <a href="#pricing" className="hover:text-white transition-colors">Resources</a>
            <a href="#pricing" className="hover:text-white transition-colors">Company</a>
          </div>

          <span className="text-[11px] text-slate-500 font-bold tracking-wide">
            © {new Date().getFullYear()} ZedHome. All rights reserved. Created with ❤️ for Zambian housing professionals.
          </span>
        </div>
      </footer>

    </div>
  );
};
