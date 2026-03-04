/**
 * 具体区域实现
 * 对应 Java 版本中各种 Region 的实现
 */

import { AbstractRegion, Region, RegionWithBoundary } from './Region';
import type { GeoPointElement } from './geos/GeoElement';

export class CircleRegion extends AbstractRegion implements RegionWithBoundary {
  private centerX: number;
  private centerY: number;
  private radius: number;

  constructor(centerX: number, centerY: number, radius: number) {
    super();
    this.centerX = centerX;
    this.centerY = centerY;
    this.radius = radius;
  }

  isInRegion(x: number, y: number): boolean {
    const dx = x - this.centerX;
    const dy = y - this.centerY;
    return dx * dx + dy * dy <= this.radius * this.radius;
  }

  protected projectToRegion(point: GeoPointElement): void {
    const dx = point.x - this.centerX;
    const dy = point.y - this.centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 1e-10) {
      point.x = this.centerX + this.radius;
      point.y = this.centerY;
      return;
    }
    
    const scale = this.radius / dist;
    point.x = this.centerX + dx * scale;
    point.y = this.centerY + dy * scale;
  }

  getRegionBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
    return {
      minX: this.centerX - this.radius,
      maxX: this.centerX + this.radius,
      minY: this.centerY - this.radius,
      maxY: this.centerY + this.radius,
    };
  }

  getBoundaryPoints(numPoints: number = 64): Array<{ x: number; y: number }> {
    const points: Array<{ x: number; y: number }> = [];
    const step = (2 * Math.PI) / numPoints;
    
    for (let i = 0; i < numPoints; i++) {
      const angle = i * step;
      points.push({
        x: this.centerX + this.radius * Math.cos(angle),
        y: this.centerY + this.radius * Math.sin(angle),
      });
    }
    
    return points;
  }

  isOnBoundary(x: number, y: number, tolerance: number = 1e-6): boolean {
    const dx = x - this.centerX;
    const dy = y - this.centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return Math.abs(dist - this.radius) < tolerance;
  }

  getCenter(): { x: number; y: number } {
    return { x: this.centerX, y: this.centerY };
  }

  getRadius(): number {
    return this.radius;
  }
}

export class PolygonRegion extends AbstractRegion implements RegionWithBoundary {
  private vertices: Array<{ x: number; y: number }>;

  constructor(vertices: Array<{ x: number; y: number }>) {
    super();
    this.vertices = vertices;
  }

  isInRegion(x: number, y: number): boolean {
    return this.pointInPolygon(x, y);
  }

  private pointInPolygon(x: number, y: number): boolean {
    let inside = false;
    const n = this.vertices.length;
    
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = this.vertices[i].x;
      const yi = this.vertices[i].y;
      const xj = this.vertices[j].x;
      const yj = this.vertices[j].y;
      
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    
    return inside;
  }

  protected projectToRegion(point: GeoPointElement): void {
    let minDist = Infinity;
    let closestPoint = { x: point.x, y: point.y };
    
    for (let i = 0; i < this.vertices.length; i++) {
      const p1 = this.vertices[i];
      const p2 = this.vertices[(i + 1) % this.vertices.length];
      const projected = this.projectToSegment(point.x, point.y, p1, p2);
      const dist = Math.sqrt((point.x - projected.x) ** 2 + (point.y - projected.y) ** 2);
      
      if (dist < minDist) {
        minDist = dist;
        closestPoint = projected;
      }
    }
    
    point.x = closestPoint.x;
    point.y = closestPoint.y;
  }

  private projectToSegment(
    px: number,
    py: number,
    p1: { x: number; y: number },
    p2: { x: number; y: number }
  ): { x: number; y: number } {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len2 = dx * dx + dy * dy;
    
    if (len2 < 1e-10) {
      return { ...p1 };
    }
    
    let t = ((px - p1.x) * dx + (py - p1.y) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    
    return {
      x: p1.x + t * dx,
      y: p1.y + t * dy,
    };
  }

  getRegionBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    for (const v of this.vertices) {
      minX = Math.min(minX, v.x);
      maxX = Math.max(maxX, v.x);
      minY = Math.min(minY, v.y);
      maxY = Math.max(maxY, v.y);
    }
    
    return { minX, maxX, minY, maxY };
  }

  getBoundaryPoints(): Array<{ x: number; y: number }> {
    return this.vertices.map(v => ({ ...v }));
  }

  isOnBoundary(x: number, y: number, tolerance: number = 1e-6): boolean {
    for (let i = 0; i < this.vertices.length; i++) {
      const p1 = this.vertices[i];
      const p2 = this.vertices[(i + 1) % this.vertices.length];
      
      if (this.pointOnSegment(x, y, p1, p2, tolerance)) {
        return true;
      }
    }
    
    return false;
  }

  private pointOnSegment(
    x: number,
    y: number,
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    tolerance: number
  ): boolean {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    if (len < 1e-10) {
      return Math.sqrt((x - p1.x) ** 2 + (y - p1.y) ** 2) < tolerance;
    }
    
    const cross = (x - p1.x) * dy - (y - p1.y) * dx;
    if (Math.abs(cross) > tolerance * len) {
      return false;
    }
    
    const t = ((x - p1.x) * dx + (y - p1.y) * dy) / (len * len);
    return t >= -tolerance && t <= 1 + tolerance;
  }

  getVertices(): Array<{ x: number; y: number }> {
    return this.vertices.map(v => ({ ...v }));
  }

  getVertexCount(): number {
    return this.vertices.length;
  }
}

export class HalfPlaneRegion extends AbstractRegion implements Region {
  private a: number;
  private b: number;
  private c: number;

  constructor(a: number, b: number, c: number) {
    super();
    this.a = a;
    this.b = b;
    this.c = c;
  }

  isInRegion(x: number, y: number): boolean {
    return this.a * x + this.b * y + this.c >= 0;
  }

  protected projectToRegion(point: GeoPointElement): void {
    const value = this.a * point.x + this.b * point.y + this.c;
    
    if (value >= 0) return;
    
    const norm = this.a * this.a + this.b * this.b;
    if (norm < 1e-10) return;
    
    const dist = -value / Math.sqrt(norm);
    point.x += this.a * dist / Math.sqrt(norm);
    point.y += this.b * dist / Math.sqrt(norm);
  }

  getRegionBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
    return {
      minX: -Infinity,
      maxX: Infinity,
      minY: -Infinity,
      maxY: Infinity,
    };
  }

  getLineCoefficients(): { a: number; b: number; c: number } {
    return { a: this.a, b: this.b, c: this.c };
  }
}

export class InequalityRegion extends AbstractRegion implements Region {
  private regions: Region[];
  private isIntersection: boolean;

  constructor(regions: Region[], isIntersection: boolean = true) {
    super();
    this.regions = regions;
    this.isIntersection = isIntersection;
  }

  isInRegion(x: number, y: number): boolean {
    if (this.regions.length === 0) return true;
    
    if (this.isIntersection) {
      return this.regions.every(r => r.isInRegion(x, y));
    } else {
      return this.regions.some(r => r.isInRegion(x, y));
    }
  }

  protected projectToRegion(point: GeoPointElement): void {
    if (this.isInRegion(point.x, point.y)) return;
    
    const region = this.regions.find(r => !r.isInRegion(point.x, point.y));
    if (region) {
      region.pointChangedForRegion(point);
    }
  }

  getRegionBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
    let minX = -Infinity, maxX = Infinity;
    let minY = -Infinity, maxY = Infinity;
    
    for (const r of this.regions) {
      const bounds = r.getRegionBounds();
      if (this.isIntersection) {
        minX = Math.max(minX, bounds.minX);
        maxX = Math.min(maxX, bounds.maxX);
        minY = Math.max(minY, bounds.minY);
        maxY = Math.min(maxY, bounds.maxY);
      } else {
        minX = Math.min(minX, bounds.minX);
        maxX = Math.max(maxX, bounds.maxX);
        minY = Math.min(minY, bounds.minY);
        maxY = Math.max(maxY, bounds.maxY);
      }
    }
    
    return { minX, maxX, minY, maxY };
  }
}
