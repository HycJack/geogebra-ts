import { Construction } from '../Construction';
import { GeoPoint } from '../geos/GeoPoint';
import { GeoLine } from '../geos/GeoLine';
import { GeoSegment } from '../geos/GeoSegment';
import { GeoCircle } from '../geos/GeoCircle';
import { GeoPolygon } from '../geos/GeoPolygon';

export class ReflectTool {
  private construction: Construction;
  private selectedObject: any = null;
  private mirrorLine: GeoLine | null = null;

  constructor(construction: Construction) {
    this.construction = construction;
  }

  handleClick(_x: number, _y: number, hitObjects: any[]): any {
    if (this.selectedObject === null) {
      if (hitObjects.length > 0) {
        this.selectedObject = hitObjects[0];
      }
      return null;
    } else if (this.mirrorLine === null) {
      const hitLine = hitObjects.find(obj => obj.type === 'line');
      if (hitLine) {
        this.mirrorLine = hitLine as GeoLine;
        return this.createReflection();
      }
      return null;
    }
    return null;
  }

  private createReflection(): any {
    if (!this.selectedObject || !this.mirrorLine) return null;

    const type = this.selectedObject.type;

    switch (type) {
      case 'point':
        return this.reflectPoint(this.selectedObject as GeoPoint);
      case 'segment':
        return this.reflectSegment(this.selectedObject as GeoSegment);
      case 'circle':
        return this.reflectCircle(this.selectedObject as GeoCircle);
      case 'polygon':
        return this.reflectPolygon(this.selectedObject as GeoPolygon);
      default:
        return null;
    }
  }

  private reflectPoint(point: GeoPoint): GeoPoint {
    const x = point.getX();
    const y = point.getY();

    const a = this.mirrorLine!.getA();
    const b = this.mirrorLine!.getB();
    const c = this.mirrorLine!.getC();

    const denominator = a * a + b * b;
    if (Math.abs(denominator) < 1e-10) {
      return new GeoPoint(this.construction, x, y);
    }

    const reflectedX = x - 2 * a * (a * x + b * y + c) / denominator;
    const reflectedY = y - 2 * b * (a * x + b * y + c) / denominator;

    const reflectedPoint = new GeoPoint(this.construction, reflectedX, reflectedY);
    return reflectedPoint;
  }

  private reflectSegment(segment: GeoSegment): GeoSegment {
    const startPoint = segment.getStartPoint();
    const endPoint = segment.getEndPoint();

    const reflectedStart = this.reflectPoint(startPoint);
    const reflectedEnd = this.reflectPoint(endPoint);

    const reflectedSegment = new GeoSegment(
      this.construction,
      reflectedStart,
      reflectedEnd
    );

    return reflectedSegment;
  }

  private reflectCircle(circle: GeoCircle): GeoCircle {
    const center = circle.getCenter();
    const radius = circle.getRadius();

    const reflectedCenter = this.reflectPoint(center);

    const reflectedCircle = new GeoCircle(
      this.construction,
      reflectedCenter,
      radius
    );

    return reflectedCircle;
  }

  private reflectPolygon(polygon: GeoPolygon): GeoPolygon {
    const vertices = polygon.getVertices();
    const reflectedVertices: GeoPoint[] = [];

    for (const vertex of vertices) {
      const reflectedVertex = this.reflectPoint(vertex);
      reflectedVertices.push(reflectedVertex);
    }

    const reflectedPolygon = new GeoPolygon(
      this.construction,
      reflectedVertices
    );

    return reflectedPolygon;
  }

  getSelectedObject(): any {
    return this.selectedObject;
  }

  getMirrorLine(): GeoLine | null {
    return this.mirrorLine;
  }

  cancel(): void {
    this.reset();
  }

  reset(): void {
    this.selectedObject = null;
    this.mirrorLine = null;
  }
}
