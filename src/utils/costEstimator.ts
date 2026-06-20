import type { Point, Wall, Opening, Material, CostBreakdownItem, CostSummary } from '../types';

export const calculateCost = (
  points: Record<string, Point>,
  walls: Wall[],
  openings: Opening[],
  materialsCatalog: Record<string, Material>
): CostSummary => {
  const items: CostBreakdownItem[] = [];

  const pointList = Object.values(points);
  if (pointList.length === 0) {
    return { items: [], totalCost: 0 };
  }

  // 1. Calculate Bounding Box of the Floor Plan
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  pointList.forEach((p) => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });

  const widthM = (maxX - minX) / 100; // in meters
  const lengthM = (maxY - minY) / 100; // in meters
  const floorAreaSqm = widthM * lengthM; // in sqm

  // 2. Concrete Slab (Foundation & Floor)
  const slabThicknessM = 0.12; // 12cm thick slab
  const slabVolumeCum = floorAreaSqm * slabThicknessM;

  // Standard 1:2:4 concrete mix per cubic meter:
  // Cement: 6.4 bags, Sand: 0.45 tons, Stone: 0.9 tons, Steel: 1 bar (Y12) per 1.5m perimeter
  const cementForSlab = slabVolumeCum * 6.4;
  const sandForSlab = slabVolumeCum * 0.45;
  const stoneForSlab = slabVolumeCum * 0.9;

  const perimeterM = 2 * (widthM + lengthM);
  const steelRebarForSlab = (perimeterM * 4) / 6; // 4 reinforcing bars along perimeter, 6m each

  // 3. Walls & Openings Calculations
  let total6InchBlocks = 0;
  let total4InchBlocks = 0;
  let totalPlasterAreaSqm = 0; // double-sided plaster

  walls.forEach((wall) => {
    const p1 = points[wall.p1Id];
    const p2 = points[wall.p2Id];
    if (!p1 || !p2) return;

    const wallLengthM = Math.hypot(p2.x - p1.x, p2.y - p1.y) / 100;
    const wallHeightM = wall.height / 100;
    const grossArea = wallLengthM * wallHeightM;

    // Openings in this wall
    const wallOpenings = openings.filter((op) => op.wallId === wall.id);
    const openingsArea = wallOpenings.reduce((sum, op) => {
      return sum + (op.width / 100) * (op.height / 100);
    }, 0);

    const netArea = Math.max(0, grossArea - openingsArea);
    totalPlasterAreaSqm += netArea * 2; // two sides of the wall

    // Blocks: standard hollow block size is 40x20cm, 12.5 blocks per sqm
    const blocksCount = netArea * 12.5 * 1.05; // 5% wastage

    if (wall.materialId === 'block_6') {
      total6InchBlocks += blocksCount;
    } else if (wall.materialId === 'block_4') {
      total4InchBlocks += blocksCount;
    }
  });

  total6InchBlocks = Math.ceil(total6InchBlocks);
  total4InchBlocks = Math.ceil(total4InchBlocks);

  // Mortar for laying blocks:
  // 1 bag cement + 0.15 tons sand lays ~100 blocks
  const cementForMortar = (total6InchBlocks + total4InchBlocks) * 0.01;
  const sandForMortar = (total6InchBlocks + total4InchBlocks) * 0.0015;

  // Plastering:
  // 1 bag cement + 0.12 tons sand covers ~8 sqm (15mm thickness)
  const cementForPlaster = totalPlasterAreaSqm * (1 / 8);
  const sandForPlaster = totalPlasterAreaSqm * (0.12 / 8);

  // Totals for Masonry
  const totalCementBags = Math.ceil(cementForSlab + cementForMortar + cementForPlaster);
  const totalSandTons = Math.ceil(sandForSlab + sandForMortar + sandForPlaster);
  const totalStoneTons = Math.ceil(stoneForSlab);
  const totalSteelBars = Math.ceil(steelRebarForSlab);

  // 4. Roofing
  // Pitch multiplier for 20 deg pitch is ~1.06. Add 10% overhangs = 1.15
  const roofAreaSqm = floorAreaSqm * 1.15;
  const roofingSheetsNetCoverM = 0.686; // standard IBR sheet width
  // Total running meters of IBR sheet needed:
  const totalRoofingMeters = Math.ceil(roofAreaSqm / roofingSheetsNetCoverM);

  // Timber estimate:
  // 2x6 trusses spaced 1.5m apart. Truss length is ~3 times width of building
  const trussCount = Math.ceil(lengthM / 1.5) + 1;
  const timber2x6Length = trussCount * (widthM * 3);
  const timber2x6Pcs = Math.ceil(timber2x6Length / 6); // 6m pieces

  // 2x4 purlins spaced every 0.9m along slope
  const slopeLengthM = (widthM / 2) * 1.06; // half width times pitch factor
  const purlinRows = Math.ceil(slopeLengthM / 0.9) * 2;
  const timber2x4Length = purlinRows * lengthM;
  const timber2x4Pcs = Math.ceil(timber2x4Length / 6); // 6m pieces

  // 5. Finishing
  // Paint: 1 drum (20L) covers ~100 sqm (two coats)
  // We paint both sides of the walls (plaster area)
  const paintDrums = Math.ceil(totalPlasterAreaSqm / 100);

  // Tiles: cover the floor area. Add 10% cutting waste
  const tilesSqm = Math.ceil(floorAreaSqm * 1.1);

  // 6. Labor
  // Mason labor: 1 mason lays ~150 blocks/day, slabs take ~1 day per 15sqm, roofing takes ~5 days
  const blockLaborDays = (total6InchBlocks + total4InchBlocks) / 120; // 120 blocks/day average
  const foundationLaborDays = floorAreaSqm / 12; // 12sqm/day
  const roofingLaborDays = 4;
  const totalProjectDays = Math.ceil(blockLaborDays + foundationLaborDays + roofingLaborDays + 5); // 5 days finishing

  const helperDaysCount = totalProjectDays * 2; // 2 helpers per mason

  // --- Push items to Bill of Quantities ---
  const addBoQItem = (matId: string, qty: number, calcMethod: string) => {
    const material = materialsCatalog[matId];
    if (!material || qty <= 0) return;
    const totalCost = qty * material.price;
    items.push({
      materialId: matId,
      name: material.name,
      category: material.category,
      requiredQuantity: qty,
      unit: material.unit,
      unitPrice: material.price,
      totalCost,
      calculationMethod: calcMethod,
    });
  };

  // Foundation & Base Concrete
  addBoQItem(
    'crushed_stone_ton',
    totalStoneTons,
    `Concrete Mix: 0.9 tons aggregate per m³ of slab concrete. Volume: ${slabVolumeCum.toFixed(1)}m³.`
  );
  addBoQItem(
    'steel_rebar_y12',
    totalSteelBars,
    `Reinforcement: 4 runs of Y12 steel bars around the ${perimeterM.toFixed(1)}m foundation perimeter.`
  );

  // Masonry & Plaster
  addBoQItem(
    'block_6',
    total6InchBlocks,
    `External Walls: ${total6InchBlocks} blocks computed from wall area with 5% waste margin.`
  );
  addBoQItem(
    'block_4',
    total4InchBlocks,
    `Internal Walls: ${total4InchBlocks} blocks computed from partition length with 5% waste margin.`
  );
  addBoQItem(
    'cement_bag',
    totalCementBags,
    `Slab Concrete: ${cementForSlab.toFixed(1)} bags. Wall Mortar: ${cementForMortar.toFixed(1)} bags. Plaster: ${cementForPlaster.toFixed(1)} bags.`
  );
  addBoQItem(
    'river_sand_ton',
    totalSandTons,
    `Slab: ${sandForSlab.toFixed(1)} tons. Mortar: ${sandForMortar.toFixed(1)} tons. Plaster: ${sandForPlaster.toFixed(1)} tons.`
  );

  // Roofing Truss & Sheets
  addBoQItem(
    'roofing_sheet_ibr',
    totalRoofingMeters,
    `Roof Sheets: IBR sheets to cover ${roofAreaSqm.toFixed(1)}m² pitched roof surface area.`
  );
  addBoQItem(
    'timber_2x6_6m',
    timber2x6Pcs,
    `Trusses: 2x6 Pine structural timbers based on ${trussCount} trusses for building width.`
  );
  addBoQItem(
    'timber_2x4_6m',
    timber2x4Pcs,
    `Purlins: 2x4 Pine batten support timbers spaced every 90cm along the roof slope.`
  );

  // Finishes
  addBoQItem(
    'plaster_paint_20l',
    paintDrums,
    `Painting: 20L paint drums based on coverage of 100m² per drum for ${totalPlasterAreaSqm.toFixed(1)}m² wall area.`
  );
  addBoQItem(
    'tiles_porcelain_sqm',
    tilesSqm,
    `Flooring: Porcelain tiles covering floor area of ${floorAreaSqm.toFixed(1)}m² (includes 10% waste).`
  );

  // Labor
  addBoQItem(
    'labor_mason_day',
    totalProjectDays,
    `Skilled Labor: ${totalProjectDays} builder days estimated for foundation, wall laying, roof framing, and finishes.`
  );
  addBoQItem(
    'labor_helper_day',
    helperDaysCount,
    `General Labor: ${helperDaysCount} helper days (2 assistants supporting the builders throughout project).`
  );

  const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0);

  return { items, totalCost };
};
