import type { Point } from '../types';

export const snapToGrid = (val: number, gridSize: number): number => {
  if (gridSize <= 0) return val;
  return Math.round(val / gridSize) * gridSize;
};

export const getDistance = (p1: Point, p2: Point): number => {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
};

export const getAngle = (p1: Point, p2: Point): number => {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
};

// Project point P onto line segment AB. Returns the projected point and its projection factor t (0 to 1)
export const projectPointOnSegment = (
  p: { x: number; y: number },
  a: Point,
  b: Point
): { x: number; y: number; t: number; distance: number } => {
  const abX = b.x - a.x;
  const abY = b.y - a.y;
  const apX = p.x - a.x;
  const apY = p.y - a.y;

  const abLenSq = abX * abX + abY * abY;
  if (abLenSq === 0) {
    const dist = Math.hypot(apX, apY);
    return { x: a.x, y: a.y, t: 0, distance: dist };
  }

  // Projection factor t
  let t = (apX * abX + apY * abY) / abLenSq;
  t = Math.max(0, Math.min(1, t)); // clamp to segment

  const projX = a.x + t * abX;
  const projY = a.y + t * abY;
  const distance = Math.hypot(p.x - projX, p.y - projY);

  return { x: projX, y: projY, t, distance };
};

// Check if a point is within standard mouse-click threshold of a line segment
export const isPointNearSegment = (
  p: { x: number; y: number },
  a: Point,
  b: Point,
  threshold = 10 // default 10cm
): boolean => {
  const proj = projectPointOnSegment(p, a, b);
  return proj.distance <= threshold;
};
