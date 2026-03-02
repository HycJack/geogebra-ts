import { AlgoElement } from '../dependency/AlgoElement';
import { GeoPoint, GeoLine, GeoSegment, GeoCircle, GeoVector } from '../types/GeoElements';
import { Construction } from '../dependency/Construction';

/**
 * 通过两点创建线段的算法
 */
export class AlgoJoinPointsSegment extends AlgoElement {
  private startPoint: GeoPoint;
  private endPoint: GeoPoint;
  private segment: GeoSegment;

  constructor(construction: Construction, startPoint: GeoPoint, endPoint: GeoPoint) {
    super(construction);
    this.startPoint = startPoint;
    this.endPoint = endPoint;

    // 创建线段（不自动通知更新）
    this.segment = new GeoSegment(construction, startPoint, endPoint);
    
    // 设置输入输出（会自动建立依赖关系）
    this.setInput([startPoint, endPoint]);
    this.setOnlyOutput(this.segment);

    // 初始计算
    this.compute();
  }

  compute(): void {
    if (!this.startPoint.isDefined() || !this.endPoint.isDefined()) {
      this.segment.setUndefined();
      return;
    }
    // 直接更新内部状态，不触发通知
    this.segment.setCoord(this.startPoint, this.endPoint);
  }

  getSegment(): GeoSegment {
    return this.segment;
  }

  getStartPoint(): GeoPoint {
    return this.startPoint;
  }

  getEndPoint(): GeoPoint {
    return this.endPoint;
  }
}

/**
 * 创建线段中点的算法
 */
export class AlgoMidpoint extends AlgoElement {
  private inputSegment: GeoSegment | null = null;
  private inputPoint1: GeoPoint | null = null;
  private inputPoint2: GeoPoint | null = null;
  private midpoint: GeoPoint;

  constructor(construction: Construction, segment: GeoSegment);
  constructor(construction: Construction, point1: GeoPoint, point2: GeoPoint);
  constructor(construction: Construction, segmentOrPoint1: GeoSegment | GeoPoint, point2?: GeoPoint) {
    super(construction);
    
    // 创建中点（不自动分配标签，因为它是派生对象）
    this.midpoint = new GeoPoint(construction);
    
    if (segmentOrPoint1 instanceof GeoSegment) {
      this.inputSegment = segmentOrPoint1;
      this.setInput([segmentOrPoint1]);
    } else {
      this.inputPoint1 = segmentOrPoint1;
      this.inputPoint2 = point2!;
      this.setInput([segmentOrPoint1, point2!]);
    }
    
    this.setOnlyOutput(this.midpoint);
    this.compute();
  }

  compute(): void {
    let start: GeoPoint, end: GeoPoint;
    
    if (this.inputSegment) {
      if (!this.inputSegment.isDefined()) {
        this.midpoint.setUndefined();
        return;
      }
      start = this.inputSegment.getStartPoint();
      end = this.inputSegment.getEndPoint();
    } else {
      start = this.inputPoint1!;
      end = this.inputPoint2!;
    }

    if (!start?.isDefined() || !end?.isDefined()) {
      this.midpoint.setUndefined();
      return;
    }

    const x = (start.getX() + end.getX()) / 2;
    const y = (start.getY() + end.getY()) / 2;
    this.midpoint.setCoords(x, y);
  }

  getMidpoint(): GeoPoint {
    return this.midpoint;
  }
}

/**
 * 创建过点的垂线的算法
 */
export class AlgoPerpendicularLine extends AlgoElement {
  private point: GeoPoint;
  private line: GeoLine;
  private resultLine: GeoLine;

  constructor(construction: Construction, point: GeoPoint, line: GeoLine) {
    super(construction);
    this.point = point;
    this.line = line;

    this.resultLine = new GeoLine(construction);
    
    this.setInput([point, line]);
    this.setOnlyOutput(this.resultLine);
    this.compute();
  }

  compute(): void {
    if (!this.point.isDefined() || !this.line.isDefined()) {
      this.resultLine.setUndefined();
      return;
    }

    const a = this.line.getA();
    const b = this.line.getB();
    
    if (a === undefined || b === undefined) {
      this.resultLine.setUndefined();
      return;
    }

    const px = this.point.getX();
    const py = this.point.getY();
    const c = -(b * px - a * py);

    this.resultLine.setCoords(-b, a, c);
  }

  getResultLine(): GeoLine {
    return this.resultLine;
  }
}

/**
 * 创建过点的平行线的算法
 */
export class AlgoParallelLine extends AlgoElement {
  private point: GeoPoint;
  private line: GeoLine;
  private resultLine: GeoLine;

  constructor(construction: Construction, point: GeoPoint, line: GeoLine) {
    super(construction);
    this.point = point;
    this.line = line;

    this.resultLine = new GeoLine(construction);
    
    this.setInput([point, line]);
    this.setOnlyOutput(this.resultLine);
    this.compute();
  }

  compute(): void {
    if (!this.point.isDefined() || !this.line.isDefined()) {
      this.resultLine.setUndefined();
      return;
    }

    const a = this.line.getA();
    const b = this.line.getB();
    
    if (a === undefined || b === undefined) {
      this.resultLine.setUndefined();
      return;
    }

    const px = this.point.getX();
    const py = this.point.getY();
    const c = -(a * px + b * py);

    this.resultLine.setCoords(a, b, c);
  }

  getResultLine(): GeoLine {
    return this.resultLine;
  }
}

/**
 * 通过两点创建直线的算法
 */
export class AlgoLineThroughPoints extends AlgoElement {
  private point1: GeoPoint;
  private point2: GeoPoint;
  private line: GeoLine;

  constructor(construction: Construction, point1: GeoPoint, point2: GeoPoint) {
    super(construction);
    this.point1 = point1;
    this.point2 = point2;

    this.line = new GeoLine(construction);
    
    this.setInput([point1, point2]);
    this.setOnlyOutput(this.line);
    this.compute();
  }

  compute(): void {
    if (!this.point1.isDefined() || !this.point2.isDefined()) {
      this.line.setUndefined();
      return;
    }

    const x1 = this.point1.getX();
    const y1 = this.point1.getY();
    const x2 = this.point2.getX();
    const y2 = this.point2.getY();

    const a = y2 - y1;
    const b = x1 - x2;
    const c = x2 * y1 - x1 * y2;

    if (Math.abs(a) < 1e-10 && Math.abs(b) < 1e-10) {
      this.line.setUndefined();
      return;
    }

    this.line.setCoords(a, b, c);
  }

  getLine(): GeoLine {
    return this.line;
  }
}

/**
 * 通过圆心和圆上一点创建圆的算法
 */
export class AlgoCircleByCenterPoint extends AlgoElement {
  private center: GeoPoint;
  private boundaryPoint: GeoPoint;
  private circle: GeoCircle;

  constructor(construction: Construction, center: GeoPoint, boundaryPoint: GeoPoint) {
    super(construction);
    this.center = center;
    this.boundaryPoint = boundaryPoint;

    // 创建圆，初始半径为1
    const tempCenter = new GeoPoint(construction, center.getX(), center.getY());
    this.circle = new GeoCircle(construction, tempCenter, 1);
    
    this.setInput([center, boundaryPoint]);
    this.setOnlyOutput(this.circle);
    this.compute();
  }

  compute(): void {
    if (!this.center.isDefined() || !this.boundaryPoint.isDefined()) {
      this.circle.setUndefined();
      return;
    }

    const cx = this.center.getX();
    const cy = this.center.getY();
    const px = this.boundaryPoint.getX();
    const py = this.boundaryPoint.getY();

    const radius = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
    
    // 更新圆心和半径
    const centerPoint = new GeoPoint(this.construction, cx, cy);
    this.circle.setCoords(centerPoint, radius);
  }

  getCircle(): GeoCircle {
    return this.circle;
  }
}

/**
 * 通过两点创建向量的算法
 */
export class AlgoVector extends AlgoElement {
  private startPoint: GeoPoint;
  private endPoint: GeoPoint;
  private vector: GeoVector;

  constructor(construction: Construction, startPoint: GeoPoint, endPoint: GeoPoint) {
    super(construction);
    this.startPoint = startPoint;
    this.endPoint = endPoint;

    const vx = endPoint.getX() - startPoint.getX();
    const vy = endPoint.getY() - startPoint.getY();
    this.vector = new GeoVector(construction, vx, vy);
    
    this.setInput([startPoint, endPoint]);
    this.setOnlyOutput(this.vector);
    this.compute();
  }

  compute(): void {
    if (!this.startPoint.isDefined() || !this.endPoint.isDefined()) {
      this.vector.setUndefined();
      return;
    }

    const vx = this.endPoint.getX() - this.startPoint.getX();
    const vy = this.endPoint.getY() - this.startPoint.getY();
    this.vector.setCoords(vx, vy);
  }

  getVector(): GeoVector {
    return this.vector;
  }
}

/**
 * 直线上投影点的算法
 */
export class AlgoPointOnLine extends AlgoElement {
  private point: GeoPoint;
  private line: GeoLine;
  private projectedPoint: GeoPoint;

  constructor(construction: Construction, point: GeoPoint, line: GeoLine) {
    super(construction);
    this.point = point;
    this.line = line;

    this.projectedPoint = new GeoPoint(construction);
    
    this.setInput([point, line]);
    this.setOnlyOutput(this.projectedPoint);
    this.compute();
  }

  compute(): void {
    if (!this.point.isDefined() || !this.line.isDefined()) {
      this.projectedPoint.setUndefined();
      return;
    }

    const px = this.point.getX();
    const py = this.point.getY();
    const a = this.line.getA();
    const b = this.line.getB();
    const c = this.line.getC();

    if (a === undefined || b === undefined) {
      this.projectedPoint.setUndefined();
      return;
    }

    const denom = a * a + b * b;
    const x = (b * (b * px - a * py) - a * c) / denom;
    const y = (a * (-b * px + a * py) - b * c) / denom;

    this.projectedPoint.setCoords(x, y);
  }

  getProjectedPoint(): GeoPoint {
    return this.projectedPoint;
  }
}

/**
 * 两直线交点的算法
 */
export class AlgoIntersectLines extends AlgoElement {
  private line1: GeoLine;
  private line2: GeoLine;
  private intersectionPoint: GeoPoint;

  constructor(construction: Construction, line1: GeoLine, line2: GeoLine) {
    super(construction);
    this.line1 = line1;
    this.line2 = line2;

    this.intersectionPoint = new GeoPoint(construction);
    
    this.setInput([line1, line2]);
    this.setOnlyOutput(this.intersectionPoint);
    this.compute();
  }

  compute(): void {
    if (!this.line1.isDefined() || !this.line2.isDefined()) {
      this.intersectionPoint.setUndefined();
      return;
    }

    const a1 = this.line1.getA();
    const b1 = this.line1.getB();
    const c1 = this.line1.getC();
    const a2 = this.line2.getA();
    const b2 = this.line2.getB();
    const c2 = this.line2.getC();

    if (a1 === undefined || b1 === undefined || a2 === undefined || b2 === undefined) {
      this.intersectionPoint.setUndefined();
      return;
    }

    const det = a1 * b2 - a2 * b1;
    if (Math.abs(det) < 1e-10) {
      // 平行或重合
      this.intersectionPoint.setUndefined();
      return;
    }

    const x = (b1 * c2 - b2 * c1) / det;
    const y = (a2 * c1 - a1 * c2) / det;

    this.intersectionPoint.setCoords(x, y);
  }

  getIntersectionPoint(): GeoPoint {
    return this.intersectionPoint;
  }
}
