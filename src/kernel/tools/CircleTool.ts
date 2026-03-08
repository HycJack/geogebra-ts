import { Construction } from '../Construction';
import { GeoPoint } from '../geos/GeoPoint';
import { GeoCircle } from '../geos/GeoCircle';
import { AlgoCircleTwoPoints, AlgoCirclePointRadius, AlgoCircleThreePoints } from '../algos/AlgoCircle';

export enum CircleToolMode {
  CENTER_POINT = 'center_point',
  CENTER_RADIUS = 'center_radius',
  POINT_RADIUS = 'point_radius',
  THREE_POINTS = 'three_points',
}

export class CircleTool {
  private construction: Construction;
  private mode: CircleToolMode;
  private step: number = 0;
  private points: GeoPoint[] = [];
  private radius: number | null = null;
  private isDragging: boolean = false;
  private previewCircle: GeoCircle | null = null;

  constructor(construction: Construction, mode: CircleToolMode = CircleToolMode.CENTER_POINT) {
    this.construction = construction;
    this.mode = mode;
  }

  setMode(mode: CircleToolMode): void {
    this.reset();
    this.mode = mode;
  }

  getMode(): CircleToolMode {
    return this.mode;
  }

  reset(): void {
    this.step = 0;
    this.points = [];
    this.radius = null;
    this.isDragging = false;
    this.previewCircle = null;
  }

  handleClick(x: number, y: number, hitObjects: any[] = []): GeoCircle | null {
    switch (this.mode) {
      case CircleToolMode.CENTER_POINT:
        return this.handleCenterPointMode(x, y, hitObjects);
      case CircleToolMode.CENTER_RADIUS:
        return this.handleCenterRadiusMode(x, y, hitObjects);
      case CircleToolMode.POINT_RADIUS:
        return this.handlePointRadiusMode(x, y, hitObjects);
      case CircleToolMode.THREE_POINTS:
        return this.handleThreePointsMode(x, y, hitObjects);
      default:
        return null;
    }
  }

  handleDrag(x: number, y: number): GeoCircle | null {
    if (this.step === 0) return null;

    this.isDragging = true;

    switch (this.mode) {
      case CircleToolMode.CENTER_POINT:
        return this.handleCenterPointDrag(x, y);
      case CircleToolMode.CENTER_RADIUS:
        return this.handleCenterRadiusDrag(x, y);
      case CircleToolMode.POINT_RADIUS:
        return this.handlePointRadiusDrag(x, y);
      default:
        return null;
    }
  }

  handleDragEnd(): GeoCircle | null {
    if (!this.isDragging || !this.previewCircle) return null;

    const finalCircle = this.previewCircle;
    this.previewCircle = null;
    this.isDragging = false;
    this.reset();
    return finalCircle;
  }

  getPreviewCircle(): GeoCircle | null {
    return this.previewCircle;
  }

  smartHitTest(_x: number, _y: number, hitObjects: any[]): GeoPoint | null {
    if (this.step === 0) {
      const hitPoint = hitObjects.find(obj => obj.type === 'point');
      if (hitPoint) {
        return hitPoint as GeoPoint;
      }
    } else if (this.step === 1) {
      const hitPoint = hitObjects.find(obj => obj.type === 'point');
      if (hitPoint) {
        return hitPoint as GeoPoint;
      }
    }
    return null;
  }

  private handleCenterPointMode(x: number, y: number, hitObjects: any[] = []): GeoCircle | null {
    if (this.step === 0) {
      const hitPoint = this.smartHitTest(x, y, hitObjects);
      
      if (hitPoint) {
        this.points.push(hitPoint);
      } else {
        const center = new GeoPoint(this.construction, x, y);
        this.points.push(center);
      }
      
      this.step = 1;
      return null;
    } else if (this.step === 1) {
      const hitPoint = this.smartHitTest(x, y, hitObjects);
      
      let pointOnCircle: GeoPoint;
      if (hitPoint) {
        pointOnCircle = hitPoint;
      } else {
        pointOnCircle = new GeoPoint(this.construction, x, y);
      }
      
      this.points.push(pointOnCircle);
      
      const result = this.createCircleFromTwoPoints();
      this.reset();
      return result;
    }
    return null;
  }

  private handleCenterPointDrag(x: number, y: number): GeoCircle | null {
    if (this.points.length === 0) return null;

    const center = this.points[0];
    const dx = x - center.getX();
    const dy = y - center.getY();
    const radius = Math.sqrt(dx * dx + dy * dy);

    if (radius < 1e-10) return null;

    this.previewCircle = new GeoCircle(this.construction, center, radius);
    return this.previewCircle;
  }

  private handleCenterRadiusMode(x: number, y: number, hitObjects: any[] = []): GeoCircle | null {
    if (this.step === 0) {
      const hitPoint = this.smartHitTest(x, y, hitObjects);
      
      if (hitPoint) {
        this.points.push(hitPoint);
      } else {
        const center = new GeoPoint(this.construction, x, y);
        this.points.push(center);
      }
      
      this.step = 1;
      return null;
    } else if (this.step === 1) {
      const center = this.points[0];
      const dx = x - center.getX();
      const dy = y - center.getY();
      const radius = Math.sqrt(dx * dx + dy * dy);
      
      const algo = new AlgoCirclePointRadius(
        this.construction,
        { x: center.getX(), y: center.getY() },
        radius
      );
      
      const result = algo.getResult();
      if (result.defined) {
        const newCenter = new GeoPoint(this.construction, result.cx, result.cy);
        const circle = new GeoCircle(this.construction, newCenter, result.r);
        this.reset();
        return circle;
      }
    }
    return null;
  }

  private handleCenterRadiusDrag(x: number, y: number): GeoCircle | null {
    if (this.points.length === 0) return null;

    const center = this.points[0];
    const dx = x - center.getX();
    const dy = y - center.getY();
    const radius = Math.sqrt(dx * dx + dy * dy);

    if (radius < 1e-10) return null;

    this.previewCircle = new GeoCircle(this.construction, center, radius);
    return this.previewCircle;
  }

  setRadius(radius: number): GeoCircle | null {
    if (this.mode === CircleToolMode.CENTER_RADIUS && this.step === 1 && this.points.length > 0) {
      const center = this.points[0];
      
      const algo = new AlgoCirclePointRadius(
        this.construction,
        { x: center.getX(), y: center.getY() },
        radius
      );
      
      const result = algo.getResult();
      if (result.defined) {
        const newCenter = new GeoPoint(this.construction, result.cx, result.cy);
        const circle = new GeoCircle(this.construction, newCenter, result.r);
        this.reset();
        return circle;
      }
    }
    return null;
  }

  private handlePointRadiusMode(x: number, y: number, hitObjects: any[] = []): GeoCircle | null {
    if (this.step === 0) {
      const hitPoint = this.smartHitTest(x, y, hitObjects);
      
      if (hitPoint) {
        this.points.push(hitPoint);
      } else {
        const point = new GeoPoint(this.construction, x, y);
        this.points.push(point);
      }
      
      this.radius = Math.sqrt(x * x + y * y);
      this.step = 1;
      return null;
    } else if (this.step === 1) {
      const hitPoint = this.smartHitTest(x, y, hitObjects);
      
      let center: GeoPoint;
      if (hitPoint) {
        center = hitPoint;
      } else {
        center = new GeoPoint(this.construction, x, y);
      }
      
      this.points.push(center);
      
      if (this.radius !== null) {
        const algo = new AlgoCirclePointRadius(
          this.construction,
          { x: center.getX(), y: center.getY() },
          this.radius
        );
        
        const result = algo.getResult();
        if (result.defined) {
          const newCenter = new GeoPoint(this.construction, result.cx, result.cy);
          const circle = new GeoCircle(this.construction, newCenter, result.r);
          this.reset();
          return circle;
        }
      }
    }
    return null;
  }

  private handlePointRadiusDrag(x: number, y: number): GeoCircle | null {
    if (this.step === 0 || this.points.length === 0) return null;

    const center = this.points[0];
    const dx = x - center.getX();
    const dy = y - center.getY();
    const radius = Math.sqrt(dx * dx + dy * dy);

    if (radius < 1e-10) return null;

    this.previewCircle = new GeoCircle(this.construction, center, radius);
    return this.previewCircle;
  }

  private handleThreePointsMode(x: number, y: number, hitObjects: any[] = []): GeoCircle | null {
    if (this.step < 3) {
      const hitPoint = this.smartHitTest(x, y, hitObjects);
      
      if (hitPoint) {
        this.points.push(hitPoint);
      } else {
        const point = new GeoPoint(this.construction, x, y);
        this.points.push(point);
      }
      
      this.step++;
      
      if (this.step === 3) {
        const result = this.createCircleFromThreePoints();
        this.reset();
        return result;
      }
    }
    return null;
  }

  private createCircleFromTwoPoints(): GeoCircle | null {
    const algo = new AlgoCircleTwoPoints(
      this.construction,
      { x: this.points[0].getX(), y: this.points[0].getY() },
      { x: this.points[1].getX(), y: this.points[1].getY() }
    );
    
    const result = algo.getResult();
    if (result.defined) {
      const center = new GeoPoint(this.construction, result.cx, result.cy);
      const circle = new GeoCircle(this.construction, center, result.r);
      return circle;
    }
    return null;
  }

  private createCircleFromThreePoints(): GeoCircle | null {
    const algo = new AlgoCircleThreePoints(
      this.construction,
      { x: this.points[0].getX(), y: this.points[0].getY() },
      { x: this.points[1].getX(), y: this.points[1].getY() },
      { x: this.points[2].getX(), y: this.points[2].getY() }
    );
    
    const result = algo.getResult();
    if (result.defined) {
      const center = new GeoPoint(this.construction, result.cx, result.cy);
      const circle = new GeoCircle(this.construction, center, result.r);
      return circle;
    }
    return null;
  }

  getStep(): number {
    return this.step;
  }

  getPoints(): GeoPoint[] {
    return [...this.points];
  }

  cancel(): void {
    this.reset();
  }
}
