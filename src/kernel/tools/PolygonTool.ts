import { Construction } from '../Construction';
import { GeoPoint } from '../geos/GeoPoint';
import { GeoPolygon } from '../geos/GeoPolygon';

export interface PolygonToolOptions {
  enableAngleSnap?: boolean;
  snapAngle?: number;
}

export class PolygonTool {
  private construction: Construction;
  private points: GeoPoint[] = [];
  private enableAngleSnap: boolean;
  private snapAngle: number;
  private previewPolygon: GeoPolygon | null = null;

  constructor(construction: Construction, options: PolygonToolOptions = {}) {
    this.construction = construction;
    this.enableAngleSnap = options.enableAngleSnap ?? true;
    this.snapAngle = options.snapAngle ?? 15;
  }

  handleClick(x: number, y: number, hitObjects: any[] = [], altKey: boolean = false): GeoPolygon | null {
    const hitPoint = hitObjects.find(obj => obj.type === 'point');
    
    let point: GeoPoint;
    if (hitPoint) {
      point = hitPoint as GeoPoint;
    } else {
      let finalX = x;
      let finalY = y;

      if (altKey && this.points.length > 0) {
        const snapped = this.snapToAngle(x, y);
        finalX = snapped.x;
        finalY = snapped.y;
      }

      point = new GeoPoint(this.construction, finalX, finalY);
    }

    this.points.push(point);

    if (this.points.length >= 3) {
      const firstPoint = this.points[0];
      const dx = x - firstPoint.getX();
      const dy = y - firstPoint.getY();
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 10) {
        return this.closePolygon();
      }
    }

    return null;
  }

  handleMouseMove(x: number, y: number, altKey: boolean = false): GeoPolygon | null {
    if (this.points.length < 2) return null;

    let finalX = x;
    let finalY = y;

    if (altKey && this.points.length > 0) {
      const snapped = this.snapToAngle(x, y);
      finalX = snapped.x;
      finalY = snapped.y;
    }

    const previewPoints = [...this.points];
    const tempPoint = new GeoPoint(this.construction, finalX, finalY);
    previewPoints.push(tempPoint);

    this.previewPolygon = new GeoPolygon(this.construction, previewPoints);
    return this.previewPolygon;
  }

  private snapToAngle(x: number, y: number): { x: number; y: number } {
    if (this.points.length === 0) {
      return { x, y };
    }

    const lastPoint = this.points[this.points.length - 1];
    const dx = x - lastPoint.getX();
    const dy = y - lastPoint.getY();
    
    const angle = Math.atan2(dy, dx);
    const angleDegrees = angle * (180 / Math.PI);
    
    const snappedAngleDegrees = Math.round(angleDegrees / this.snapAngle) * this.snapAngle;
    const snappedAngle = snappedAngleDegrees * (Math.PI / 180);
    
    const length = Math.sqrt(dx * dx + dy * dy);
    
    return {
      x: lastPoint.getX() + length * Math.cos(snappedAngle),
      y: lastPoint.getY() + length * Math.sin(snappedAngle)
    };
  }

  closePolygon(): GeoPolygon | null {
    if (this.points.length < 3) return null;

    const polygon = new GeoPolygon(this.construction, this.points);
    this.reset();
    return polygon;
  }

  getPreviewPolygon(): GeoPolygon | null {
    return this.previewPolygon;
  }

  getPoints(): GeoPoint[] {
    return [...this.points];
  }

  getPointCount(): number {
    return this.points.length;
  }

  canClose(): boolean {
    if (this.points.length < 3) return false;

    const firstPoint = this.points[0];
    const lastPoint = this.points[this.points.length - 1];
    
    const dx = lastPoint.getX() - firstPoint.getX();
    const dy = lastPoint.getY() - firstPoint.getY();
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < 10;
  }

  setEnableAngleSnap(enable: boolean): void {
    this.enableAngleSnap = enable;
  }

  getEnableAngleSnap(): boolean {
    return this.enableAngleSnap;
  }

  setSnapAngle(angle: number): void {
    this.snapAngle = angle;
  }

  getSnapAngle(): number {
    return this.snapAngle;
  }

  cancel(): void {
    this.reset();
  }

  reset(): void {
    this.points = [];
    this.previewPolygon = null;
  }
}
