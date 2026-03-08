import { findIntersections } from '@/euclidian/interaction';
import { Construction } from '../Construction';
import { GeoPoint } from '../geos/GeoPoint';
import { Path, Pathable } from '../Path';

export enum PointToolMode {
  FREE = 'free',
  ON_OBJECT = 'on_object',
  INTERSECTION = 'intersection',
}

export interface PointToolOptions {
  mode?: PointToolMode;
  allowAutoIntersection?: boolean;
  snapToObjects?: boolean;
}

export class PointTool {
  private construction: Construction;
  private mode: PointToolMode;
  private allowAutoIntersection: boolean;
  private snapToObjects: boolean;
  private selectedObjects: any[] = [];

  constructor(construction: Construction, options: PointToolOptions = {}) {
    this.construction = construction;
    this.mode = options.mode || PointToolMode.FREE;
    this.allowAutoIntersection = options.allowAutoIntersection ?? true;
    this.snapToObjects = options.snapToObjects ?? true;
  }

  setMode(mode: PointToolMode): void {
    this.mode = mode;
    this.selectedObjects = [];
  }

  getMode(): PointToolMode {
    return this.mode;
  }

  handleClick(x: number, y: number, hitObjects: any[]): GeoPoint | null {
    switch (this.mode) {
      case PointToolMode.FREE:
        return this.handleFreePoint(x, y, hitObjects);
      case PointToolMode.ON_OBJECT:
        return this.handlePointOnObject(x, y, hitObjects);
      case PointToolMode.INTERSECTION:
        return this.handleIntersectionPoint(x, y, hitObjects);
      default:
        return null;
    }
  }

  private handleFreePoint(x: number, y: number, hitObjects: any[]): GeoPoint | null {
    if (this.allowAutoIntersection && hitObjects.length >= 2) {
      const intersection = this.tryCreateIntersection(x, y, hitObjects);
      if (intersection) {
        return intersection;
      }
    }

    if (this.snapToObjects && hitObjects.length === 1) {
      return this.handlePointOnObject(x, y, hitObjects);
    }

    const point = new GeoPoint(this.construction, x, y);
    return point;
  }

  private handlePointOnObject(x: number, y: number, hitObjects: any[]): GeoPoint | null {
    if (hitObjects.length === 0) {
      return new GeoPoint(this.construction, x, y);
    }

    const obj = hitObjects[0];
    const point = new GeoPoint(this.construction, x, y);

    if (this.isPathable(obj)) {
      const path = obj as Path;
      const parameter = path.getPathParameterForPoint(x, y);
      const pathable = point as unknown as Pathable;
      if (pathable) {
        pathable.setPath(path);
        pathable.setPathParameter(parameter);
      }
    }

    return point;
  }

  private handleIntersectionPoint(_x: number, _y: number, hitObjects: any[]): GeoPoint | null {
    if (this.selectedObjects.length === 0) {
      if (hitObjects.length > 0) {
        this.selectedObjects.push(hitObjects[0]);
      }
      return null;
    } else if (this.selectedObjects.length === 1) {
      if (hitObjects.length > 0) {
        this.selectedObjects.push(hitObjects[0]);
        return this.createIntersection();
      }
      return null;
    }
    return null;
  }

  private tryCreateIntersection(x: number, y: number, hitObjects: any[]): GeoPoint | null {
    if (hitObjects.length < 2) return null;

    const obj1 = hitObjects[0];
    const obj2 = hitObjects[1];

    const getElement = (id: string) => {
      return hitObjects.find(obj => obj.id === id);
    };

    const intersections = findIntersections(obj1, obj2, getElement);

    if (intersections.length === 0) return null;

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
      return point;
    }

    return null;
  }

  private createIntersection(): GeoPoint | null {
    if (this.selectedObjects.length !== 2) return null;

    const obj1 = this.selectedObjects[0];
    const obj2 = this.selectedObjects[1];

    const getElement = (id: string) => {
      if (obj1.id === id) return obj1;
      if (obj2.id === id) return obj2;
      return undefined;
    };

    const intersections = findIntersections(obj1, obj2, getElement);

    if (intersections.length === 0) return null;

    const intersection = intersections[0];
    const point = new GeoPoint(this.construction, intersection.x, intersection.y);

    this.selectedObjects = [];
    return point;
  }

  private isPathable(obj: any): boolean {
    return obj && typeof obj.isPath === 'function' && obj.isPath();
  }

  cancel(): void {
    this.selectedObjects = [];
  }

  reset(): void {
    this.selectedObjects = [];
    this.mode = PointToolMode.FREE;
  }
}
