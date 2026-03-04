import { AlgoElement } from './AlgoElement';
import type { IGeoElement } from '../geos/GeoElement';
import type { Construction } from '../Construction';

export interface PointLike {
  getX(): number;
  getY(): number;
  setCoords(x: number, y: number, z?: number): void;
}

export interface SegmentLike {
  setStartPoint(point: PointLike): void;
  setEndPoint(point: PointLike): void;
  setCoords(a: number, b: number, c: number): void;
  getStartPoint(): PointLike;
  getEndPoint(): PointLike;
}

export class AlgoJoinPointsSegment extends AlgoElement {
  private pointA: PointLike & IGeoElement;
  private pointB: PointLike & IGeoElement;
  private segment: SegmentLike & IGeoElement;

  constructor(
    construction: Construction,
    pointA: PointLike & IGeoElement,
    pointB: PointLike & IGeoElement,
    segment?: SegmentLike & IGeoElement
  ) {
    super(construction, true);

    this.pointA = pointA;
    this.pointB = pointB;

    if (segment) {
      this.segment = segment;
    } else {
      throw new Error('Segment must be provided');
    }

    this.setInputOutput();
    this.compute();
  }

  protected setInputOutput(): void {
    this.input = [this.pointA as IGeoElement, this.pointB as IGeoElement];
    this.output = [this.segment as IGeoElement];

    this.setDependencies();

    this.segment.setParentAlgorithm(this);
  }

  compute(): void {
    const x1 = this.pointA.getX();
    const y1 = this.pointA.getY();
    const x2 = this.pointB.getX();
    const y2 = this.pointB.getY();

    const a = y1 - y2;
    const b = x2 - x1;
    const c = x1 * y2 - x2 * y1;

    this.segment.setCoords(a, b, c);
  }

  getSegment(): SegmentLike & IGeoElement {
    return this.segment;
  }

  getPointA(): PointLike & IGeoElement {
    return this.pointA;
  }

  getPointB(): PointLike & IGeoElement {
    return this.pointB;
  }
}

export class AlgoJoinPointsLine extends AlgoElement {
  private pointA: PointLike & IGeoElement;
  private pointB: PointLike & IGeoElement;
  private line: { setCoords(a: number, b: number, c: number): void } & IGeoElement;

  constructor(
    construction: Construction,
    pointA: PointLike & IGeoElement,
    pointB: PointLike & IGeoElement,
    line: { setCoords(a: number, b: number, c: number): void } & IGeoElement
  ) {
    super(construction, true);

    this.pointA = pointA;
    this.pointB = pointB;
    this.line = line;

    this.setInputOutput();
    this.compute();
  }

  protected setInputOutput(): void {
    this.input = [this.pointA as IGeoElement, this.pointB as IGeoElement];
    this.output = [this.line as IGeoElement];

    this.setDependencies();

    this.line.setParentAlgorithm(this);
  }

  compute(): void {
    const x1 = this.pointA.getX();
    const y1 = this.pointA.getY();
    const x2 = this.pointB.getX();
    const y2 = this.pointB.getY();

    const a = y1 - y2;
    const b = x2 - x1;
    const c = x1 * y2 - x2 * y1;

    this.line.setCoords(a, b, c);
  }

  getLine(): { setCoords(a: number, b: number, c: number): void } & IGeoElement {
    return this.line;
  }
}

export class AlgoCircleTwoPoints extends AlgoElement {
  private center: PointLike & IGeoElement;
  private pointOnCircle: PointLike & IGeoElement;
  private circle: { setCenter(center: PointLike): void; setRadius(r: number): void } & IGeoElement;

  constructor(
    construction: Construction,
    center: PointLike & IGeoElement,
    pointOnCircle: PointLike & IGeoElement,
    circle: { setCenter(center: PointLike): void; setRadius(r: number): void } & IGeoElement
  ) {
    super(construction, true);

    this.center = center;
    this.pointOnCircle = pointOnCircle;
    this.circle = circle;

    this.setInputOutput();
    this.compute();
  }

  protected setInputOutput(): void {
    this.input = [this.center as IGeoElement, this.pointOnCircle as IGeoElement];
    this.output = [this.circle as IGeoElement];

    this.setDependencies();

    this.circle.setParentAlgorithm(this);
  }

  compute(): void {
    const cx = this.center.getX();
    const cy = this.center.getY();
    const px = this.pointOnCircle.getX();
    const py = this.pointOnCircle.getY();

    const radius = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);

    this.circle.setCenter(this.center);
    this.circle.setRadius(radius);
  }

  getCircle(): { setCenter(center: PointLike): void; setRadius(r: number): void } & IGeoElement {
    return this.circle;
  }
}

export class AlgoMidpoint extends AlgoElement {
  private pointA: PointLike & IGeoElement;
  private pointB: PointLike & IGeoElement;
  private midpoint: PointLike & IGeoElement;

  constructor(
    construction: Construction,
    pointA: PointLike & IGeoElement,
    pointB: PointLike & IGeoElement,
    midpoint: PointLike & IGeoElement
  ) {
    super(construction, true);

    this.pointA = pointA;
    this.pointB = pointB;
    this.midpoint = midpoint;

    this.setInputOutput();
    this.compute();
  }

  protected setInputOutput(): void {
    this.input = [this.pointA as IGeoElement, this.pointB as IGeoElement];
    this.output = [this.midpoint as IGeoElement];

    this.setDependencies();

    this.midpoint.setParentAlgorithm(this);
  }

  compute(): void {
    const x1 = this.pointA.getX();
    const y1 = this.pointA.getY();
    const x2 = this.pointB.getX();
    const y2 = this.pointB.getY();

    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;

    this.midpoint.setCoords(mx, my, 1);
  }

  getMidpoint(): PointLike & IGeoElement {
    return this.midpoint;
  }
}
