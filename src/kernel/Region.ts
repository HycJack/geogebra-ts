/**
 * 区域接口
 * 对应 Java 版本的 Region 接口
 * 
 * 区域是可以包含点的几何对象
 * 如：多边形、圆、不等式区域等
 */

import type { GeoPointElement } from './geos/GeoElement';

export interface Region {
  isRegion(): true;
  
  isInRegion(x: number, y: number): boolean;
  
  isInRegionPoint(point: GeoPointElement): boolean;
  
  pointChangedForRegion(point: GeoPointElement): void;
  
  regionChanged(point: GeoPointElement): void;
  
  getRegionBounds(): { minX: number; maxX: number; minY: number; maxY: number };
}

export abstract class AbstractRegion implements Region {
  isRegion(): true {
    return true;
  }

  isInRegionPoint(point: GeoPointElement): boolean {
    return this.isInRegion(point.x, point.y);
  }

  abstract isInRegion(x: number, y: number): boolean;

  pointChangedForRegion(point: GeoPointElement): void {
    if (!this.isInRegion(point.x, point.y)) {
      this.projectToRegion(point);
    }
  }

  regionChanged(point: GeoPointElement): void {
    if (!this.isInRegion(point.x, point.y)) {
      this.projectToRegion(point);
    }
  }

  protected abstract projectToRegion(point: GeoPointElement): void;

  abstract getRegionBounds(): { minX: number; maxX: number; minY: number; maxY: number };
}

export interface RegionWithBoundary extends Region {
  getBoundaryPoints(): Array<{ x: number; y: number }>;
  isOnBoundary(x: number, y: number, tolerance?: number): boolean;
}
