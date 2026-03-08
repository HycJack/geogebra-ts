import { findIntersections } from '@/euclidian/interaction';
import { Construction } from '../Construction';
import { GeoPoint } from '../geos/GeoPoint';

export enum IntersectToolMode {
  SELECT_OBJECTS = 'select_objects',
  CLICK_POINT = 'click_point',
}

export interface IntersectToolOptions {
  mode?: IntersectToolMode;
  showTrimmedLines?: boolean;
  allowOutlyingIntersections?: boolean;
}

export class IntersectTool {
  private construction: Construction;
  private mode: IntersectToolMode;
  private showTrimmedLines: boolean;
  private allowOutlyingIntersections: boolean;
  private selectedObjects: any[] = [];

  constructor(construction: Construction, options: IntersectToolOptions = {}) {
    this.construction = construction;
    this.mode = options.mode || IntersectToolMode.SELECT_OBJECTS;
    this.showTrimmedLines = options.showTrimmedLines ?? false;
    this.allowOutlyingIntersections = options.allowOutlyingIntersections ?? true;
  }

  setMode(mode: IntersectToolMode): void {
    this.reset();
    this.mode = mode;
  }

  getMode(): IntersectToolMode {
    return this.mode;
  }

  setShowTrimmedLines(show: boolean): void {
    this.showTrimmedLines = show;
  }

  getShowTrimmedLines(): boolean {
    return this.showTrimmedLines;
  }

  setAllowOutlyingIntersections(allow: boolean): void {
    this.allowOutlyingIntersections = allow;
  }

  getAllowOutlyingIntersections(): boolean {
    return this.allowOutlyingIntersections;
  }

  handleClick(x: number, y: number, hitObjects: any[]): GeoPoint[] {
    switch (this.mode) {
      case IntersectToolMode.SELECT_OBJECTS:
        return this.handleSelectObjectsMode(x, y, hitObjects);
      case IntersectToolMode.CLICK_POINT:
        return this.handleClickPointMode(x, y, hitObjects);
      default:
        return [];
    }
  }

  private handleSelectObjectsMode(_x: number, _y: number, hitObjects: any[]): GeoPoint[] {
    if (this.selectedObjects.length === 0) {
      if (hitObjects.length > 0) {
        this.selectedObjects.push(hitObjects[0]);
      }
      return [];
    } else if (this.selectedObjects.length === 1) {
      if (hitObjects.length > 0) {
        this.selectedObjects.push(hitObjects[0]);
        return this.createAllIntersections();
      }
      return [];
    }
    return [];
  }

  private handleClickPointMode(x: number, y: number, hitObjects: any[]): GeoPoint[] {
    if (hitObjects.length >= 2) {
      const obj1 = hitObjects[0];
      const obj2 = hitObjects[1];

      const getElement = (id: string) => {
        if (obj1.id === id) return obj1;
        if (obj2.id === id) return obj2;
        return undefined;
      };

      const intersections = findIntersections(obj1, obj2, getElement);

      if (intersections.length === 0) return [];

      let closestIntersection = intersections[0];
      let minDistance = Infinity;

      for (const intersection of intersections) {
        const dx = intersection.x - x;
        const dy = intersection.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance) {
          minDistance = distance;
          closestIntersection = intersection;
        }
      }

      if (minDistance < 10) {
        const point = new GeoPoint(this.construction, closestIntersection.x, closestIntersection.y);
        return [point];
      }
    }

    return [];
  }

  private createAllIntersections(): GeoPoint[] {
    if (this.selectedObjects.length !== 2) return [];

    const obj1 = this.selectedObjects[0];
    const obj2 = this.selectedObjects[1];

    const getElement = (id: string) => {
      if (obj1.id === id) return obj1;
      if (obj2.id === id) return obj2;
      return undefined;
    };

    const intersections = findIntersections(obj1, obj2, getElement);

    const points: GeoPoint[] = [];

    for (const intersection of intersections) {
      const point = new GeoPoint(this.construction, intersection.x, intersection.y);
      points.push(point);
    }

    this.selectedObjects = [];
    return points;
  }

  getSelectedObjects(): any[] {
    return [...this.selectedObjects];
  }

  cancel(): void {
    this.selectedObjects = [];
  }

  reset(): void {
    this.selectedObjects = [];
    this.mode = IntersectToolMode.SELECT_OBJECTS;
  }
}
