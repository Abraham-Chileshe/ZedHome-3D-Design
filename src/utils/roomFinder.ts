import type { Point, Wall } from '../types';

export interface DetectedRoom {
  key: string; // Unique key representing the room, e.g., sorted point IDs
  points: { x: number; y: number }[];
  area: number; // In square meters
  pointIds: string[];
}

/**
 * Planar graph face finding algorithm. Traces minimal cycles (counter-clockwise faces)
 * in the wall connectivity graph to discover closed rooms and calculate their areas.
 */
export const findRooms = (points: Record<string, Point>, walls: Wall[]): DetectedRoom[] => {
  // 1. Build Adjacency List: mapping each point ID to its neighbors
  const adj: Record<string, string[]> = {};
  
  walls.forEach((wall) => {
    const { p1Id, p2Id } = wall;
    if (!points[p1Id] || !points[p2Id]) return;
    
    if (!adj[p1Id]) adj[p1Id] = [];
    if (!adj[p2Id]) adj[p2Id] = [];
    
    if (!adj[p1Id].includes(p2Id)) adj[p1Id].push(p2Id);
    if (!adj[p2Id].includes(p1Id)) adj[p2Id].push(p1Id);
  });
  
  const pointIds = Object.keys(adj);
  if (pointIds.length < 3) return [];

  // 2. Sort neighbors counter-clockwise around each vertex
  const sortedAdj: Record<string, string[]> = {};
  pointIds.forEach((uId) => {
    const u = points[uId];
    const neighbors = adj[uId];
    
    // Sort neighbors by the angle of vector (v - u)
    sortedAdj[uId] = [...neighbors].sort((aId, bId) => {
      const a = points[aId];
      const b = points[bId];
      const angleA = Math.atan2(a.y - u.y, a.x - u.x);
      const angleB = Math.atan2(b.y - u.y, b.x - u.x);
      return angleA - angleB;
    });
  });

  const visited = new Set<string>();
  const rooms: DetectedRoom[] = [];

  // Helper to calculate signed polygon area (shoelace formula)
  const getSignedArea = (polyPoints: { x: number; y: number }[]): number => {
    let area = 0;
    const n = polyPoints.length;
    for (let i = 0; i < n; i++) {
      const curr = polyPoints[i];
      const next = polyPoints[(i + 1) % n];
      area += curr.x * next.y - next.x * curr.y;
    }
    return area / 2;
  };

  // 3. Traverse all directed edges
  pointIds.forEach((uId) => {
    const neighbors = sortedAdj[uId];
    if (!neighbors) return;

    neighbors.forEach((vId) => {
      const edgeKey = `${uId}->${vId}`;
      if (visited.has(edgeKey)) return;

      // Start tracing a face
      visited.add(edgeKey);
      const path: string[] = [uId];
      let prev = uId;
      let curr = vId;

      let steps = 0;
      // Safeguard against infinite loops in degenerate or non-planar setups
      while (curr !== uId && steps < 100) {
        path.push(curr);
        steps++;
        
        const currNeighbors = sortedAdj[curr];
        if (!currNeighbors || currNeighbors.length === 0) break;
        
        const prevIdx = currNeighbors.indexOf(prev);
        if (prevIdx === -1) break;
        
        // Leftmost turn: grab neighbor immediately counter-clockwise (prevIdx - 1)
        const nextIdx = (prevIdx - 1 + currNeighbors.length) % currNeighbors.length;
        const next = currNeighbors[nextIdx];
        
        const nextEdgeKey = `${curr}->${next}`;
        if (visited.has(nextEdgeKey)) break;
        
        visited.add(nextEdgeKey);
        prev = curr;
        curr = next;
      }

      if (curr === uId && path.length >= 3) {
        const polyPoints = path.map((id) => ({
          x: points[id].x,
          y: points[id].y,
        }));
        
        const signedArea = getSignedArea(polyPoints);
        
        // Scale area from cm^2 to m^2: divide by 10000
        const areaSqm = signedArea / 10000;
        
        // Positive area represents a counter-clockwise traversed interior face (a room).
        // Negative area represents clockwise traversal (the outer boundary cycle of the whole model).
        if (areaSqm > 0.05) {
          const sortedIds = [...path].sort();
          const key = sortedIds.join(',');
          
          if (!rooms.some((r) => r.key === key)) {
            rooms.push({
              key,
              points: polyPoints,
              area: areaSqm,
              pointIds: path,
            });
          }
        }
      }
    });
  });

  return rooms;
};
