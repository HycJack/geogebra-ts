import { Point } from '../types';

export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function distancePointToLine(point: Point, line: { a: number; b: number; c: number }): number {
  const { a, b, c } = line;
  return Math.abs(a * point.x + b * point.y + c) / Math.sqrt(a * a + b * b);
}

export function projectPointOnLine(
  point: Point,
  line: { a: number; b: number; c: number }
): Point {
  const { a, b, c } = line;
  const denominator = a * a + b * b;
  const x = (b * (b * point.x - a * point.y) - a * c) / denominator;
  const y = (a * (-b * point.x + a * point.y) - b * c) / denominator;
  return { x, y };
}

export function lineThroughPoints(p1: Point, p2: Point): { a: number; b: number; c: number } {
  const a = p2.y - p1.y;
  const b = p1.x - p2.x;
  const c = p2.x * p1.y - p1.x * p2.y;
  const length = Math.sqrt(a * a + b * b);
  return { a: a / length, b: b / length, c: c / length };
}

export function perpendicularLine(
  line: { a: number; b: number; c: number },
  point: Point
): { a: number; b: number; c: number } {
  const a = -line.b;
  const b = line.a;
  const c = -(a * point.x + b * point.y);
  return { a, b, c };
}

export function parallelLine(
  line: { a: number; b: number; c: number },
  point: Point
): { a: number; b: number; c: number } {
  const { a, b } = line;
  const c = -(a * point.x + b * point.y);
  return { a, b, c };
}

export function intersectLines(
  line1: { a: number; b: number; c: number },
  line2: { a: number; b: number; c: number }
): Point | null {
  const det = line1.a * line2.b - line2.a * line1.b;
  if (Math.abs(det) < 1e-10) return null;
  const x = (line1.b * line2.c - line2.b * line1.c) / det;
  const y = (line2.a * line1.c - line1.a * line2.c) / det;
  return { x, y };
}

export function intersectLineCircle(
  line: { a: number; b: number; c: number },
  center: Point,
  radius: number
): Point[] {
  const { a, b, c } = line;
  const cx = center.x;
  const cy = center.y;
  const r = radius;

  const denominator = a * a + b * b;
  const x0 = -(a * c) / denominator;
  const y0 = -(b * c) / denominator;

  const distToCenter = Math.sqrt((x0 - cx) * (x0 - cx) + (y0 - cy) * (y0 - cy));

  if (distToCenter > r + 1e-10) return [];

  if (Math.abs(distToCenter - r) < 1e-10) {
    return [{ x: x0, y: y0 }];
  }

  const dt = Math.sqrt(r * r - distToCenter * distToCenter);
  const scale = dt / Math.sqrt(denominator);

  return [
    { x: x0 + b * scale, y: y0 - a * scale },
    { x: x0 - b * scale, y: y0 + a * scale },
  ];
}

export function intersectCircles(
  center1: Point,
  radius1: number,
  center2: Point,
  radius2: number
): Point[] {
  const dx = center2.x - center1.x;
  const dy = center2.y - center1.y;
  const d = Math.sqrt(dx * dx + dy * dy);

  if (d > radius1 + radius2 + 1e-10 || d < Math.abs(radius1 - radius2) - 1e-10) {
    return [];
  }

  if (d < 1e-10 && Math.abs(radius1 - radius2) < 1e-10) {
    return [];
  }

  if (Math.abs(d - (radius1 + radius2)) < 1e-10 || Math.abs(d - Math.abs(radius1 - radius2)) < 1e-10) {
    const t = radius1 / d;
    return [{ x: center1.x + t * dx, y: center1.y + t * dy }];
  }

  const a = (radius1 * radius1 - radius2 * radius2 + d * d) / (2 * d);
  const h = Math.sqrt(radius1 * radius1 - a * a);

  const px = center1.x + (a * dx) / d;
  const py = center1.y + (a * dy) / d;

  return [
    { x: px + (h * dy) / d, y: py - (h * dx) / d },
    { x: px - (h * dy) / d, y: py + (h * dx) / d },
  ];
}

export function midpoint(p1: Point, p2: Point): Point {
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
}

export function angleBisector(
  p1: Point,
  vertex: Point,
  p2: Point
): { a: number; b: number; c: number } | null {
  const v1x = p1.x - vertex.x;
  const v1y = p1.y - vertex.y;
  const v2x = p2.x - vertex.x;
  const v2y = p2.y - vertex.y;

  const len1 = Math.sqrt(v1x * v1x + v1y * v1y);
  const len2 = Math.sqrt(v2x * v2x + v2y * v2y);

  if (len1 < 1e-10 || len2 < 1e-10) return null;

  const ux = v1x / len1 + v2x / len2;
  const uy = v1y / len1 + v2y / len2;

  const endPoint = { x: vertex.x + ux, y: vertex.y + uy };
  return lineThroughPoints(vertex, endPoint);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
