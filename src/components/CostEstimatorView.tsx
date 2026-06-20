import React, { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { calculateCost } from '../utils/costEstimator';
import { Landmark, HardHat, FileText, RefreshCw } from 'lucide-react';

export const CostEstimatorView: React.FC = () => {
  const { points, walls, openings, materialsCatalog, updateMaterialPrice, loadDemoProject } = useStore();
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');

  // Calculate full Bill of Quantities
  const costReport = useMemo(() => {
    return calculateCost(points, walls, openings, materialsCatalog);
  }, [points, walls, openings, materialsCatalog]);

  const hasItems = costReport.items.length > 0;

  // Group items by category for summary cards
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {
      foundation: 0,
      walls: 0,
      roof: 0,
      finishing: 0,
      labor: 0,
    };
    costReport.items.forEach((item) => {
      if (totals[item.category] !== undefined) {
        totals[item.category] += item.totalCost;
      }
    });
    return totals;
  }, [costReport.items]);

  const handleStartEdit = (matId: string, currentPrice: number) => {
    setEditingMaterialId(matId);
    setTempPrice(currentPrice.toString());
  };

  const handleSavePrice = (matId: string) => {
    const parsed = parseFloat(tempPrice);
    if (!isNaN(parsed) && parsed >= 0) {
      updateMaterialPrice(matId, parsed);
    }
    setEditingMaterialId(null);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'foundation': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'walls': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'roof': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'finishing': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'labor': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="w-full h-full bg-white border border-slate-200 rounded-xl p-6 text-slate-700 overflow-y-auto max-h-[680px] shadow-sm select-none">
      
      {/* 1. Header & Summary banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-5 mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-teal-600" size={20} />
            Bill of Quantities (BoQ)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time quantity estimates and building costs based on Zambian retail averages.
          </p>
        </div>
        <div className="bg-teal-50 border border-teal-100 rounded-xl px-5 py-3 text-right shrink-0">
          <span className="block text-[9px] text-slate-500 font-mono uppercase tracking-wider">Total Building Cost Estimate</span>
          <span className="text-xl font-mono font-bold text-teal-700">
            K {costReport.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {!hasItems ? (
        <div className="text-center py-16 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <Landmark size={44} className="mx-auto text-slate-400 mb-3" />
          <p className="text-slate-400 text-xs font-semibold">Your canvas is empty. Start drawing walls to compute construction cost.</p>
          <button
            onClick={loadDemoProject}
            className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-slate-100 text-xs font-semibold rounded shadow transition-all flex items-center gap-1.5 mx-auto cursor-pointer"
          >
            <RefreshCw size={13} /> Load Demo 2-Room Layout
          </button>
        </div>
      ) : (
        <div className="space-y-5 animate-fade-in">
          {/* 2. Category Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(categoryTotals).map(([cat, total]) => (
              <div
                key={cat}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                    {cat}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] border font-mono font-bold uppercase ${getCategoryColor(cat)}`}>
                    ZMW
                  </span>
                </div>
                <span className="text-sm font-mono font-bold text-slate-800">
                  K {total.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              </div>
            ))}
          </div>

          {/* 3. Detailed Itemized Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[9.5px] font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">Material / Service</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Required Qty</th>
                    <th className="py-3 px-4 text-right">Unit Rate (ZMW)</th>
                    <th className="py-3 px-4 text-right">Estimated Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                  {costReport.items.map((item) => (
                    <tr key={item.materialId} className="hover:bg-slate-50/50 group transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        <div>{item.name}</div>
                        <div className="text-[9.5px] text-slate-400 mt-0.5 font-normal">
                          {item.calculationMethod}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[8.5px] uppercase border font-bold ${getCategoryColor(item.category)}`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {item.requiredQuantity.toLocaleString()} <span className="text-slate-400 font-sans font-normal">{item.unit}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {editingMaterialId === item.materialId ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <input
                              type="text"
                              value={tempPrice}
                              onChange={(e) => setTempPrice(e.target.value)}
                              className="w-16 bg-white border border-teal-500 rounded px-1.5 py-0.5 text-right font-mono text-slate-800 text-xs focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSavePrice(item.materialId)}
                              className="px-2 py-0.5 bg-teal-600 hover:bg-teal-500 text-slate-100 font-sans font-bold rounded text-[9.5px] cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5 group/rate">
                            <span>K {item.unitPrice.toFixed(2)}</span>
                            <button
                              onClick={() => handleStartEdit(item.materialId, item.unitPrice)}
                              className="opacity-0 group-hover/rate:opacity-100 px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[9.5px] text-slate-500 transition-opacity cursor-pointer"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-teal-600">
                        K {item.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Quantity Surveyor Stamp / Local Warning */}
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
            <HardHat className="text-amber-600 shrink-0 mt-0.5" size={16} />
            <div className="text-[11px] text-slate-600 leading-relaxed">
              <strong className="text-amber-800 font-bold block mb-0.5">Zambian Construction Notice:</strong>
              These quantities are calculated according to Zambian structural standards (1:2:4 base mix ratios, 12.5 blocks/m²). Real construction requirements can fluctuate depending on ground soil conditions, roof design complexity, and regional supplier differences in Lusaka, Copperbelt, or provincial districts. Always double check with your site contractor.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CostEstimatorView;
