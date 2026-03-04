/**
 * 具体路径实现
 * 对应 Java 版本中各种 Path 的实现
 */

import { AbstractPath, Path, PathWithPoints, LimitedPath } from './Path';
import { PathParameter } from './PathParameter';
import { GeoVec3D, CoordUtils } from './arithmetic/GeoVec3D';

export class LinePath extends AbstractPath implements Path {
  private a: number;
  private b: number;
  private c: number;

  constructor(a: number, b: number, c: number) {
    super(-Infinity, Infinity);
    this.a = a;
    this.b = b;
    this.c = c;
  }

  getPathType(): string {
    return 'line';
  }

  static fromTwoPoints(p1: { x: number; y: number }, p2: { x: number; y: number }): LinePath {
    const v1 = new GeoVec3D(p1.x, p1.y, 1);
    const v2 = new GeoVec3D(p2.x, p2.y, 1);
    const line = CoordUtils.lineThroughPoints(v1, v2);
    return new LinePath(line.x, line.y, line.z);
  }

  isOnPath(x: number, y: number, tolerance: number = 1e-6): boolean {
    const dist = Math.abs(this.a * x + this.b * y + this.c) / Math.sqrt(this.a * this.a + this.b * this.b);
    return dist < tolerance;
  }

  pointChanged(point: { getX(): number; getY(): number; setCoords(x: number, y: number): void }): void {
    const t = this.getPathParameterForPoint(point.getX(), point.getY());
    const projected = this.getPointFromPathParameter(t);
    point.setCoords(projected.x, projected.y);
  }

  pathChanged(point: { getX(): number; getY(): number; setCoords(x: number, y: number): void }): void {
    this.pointChanged(point);
  }

  getPathParameterForPoint(x: number, y: number): PathParameter {
    const norm = this.a * this.a + this.b * this.b;
    if (norm < 1e-10) return new PathParameter(0);

    let t: number;
    if (Math.abs(this.a) > Math.abs(this.b)) {
      t = -(this.b * y + this.c) / this.a;
    } else {
      t = -(this.a * x + this.c) / this.b;
    }

    return new PathParameter(t);
  }

  getPointFromPathParameter(param: PathParameter): { x: number; y: number } {
    const t = param.t;
    const norm = this.a * this.a + this.b * this.b;
    if (norm < 1e-10) return { x: 0, y: 0 };

    if (Math.abs(this.a) > Math.abs(this.b)) {
      const x = t;
      const y = -(this.a * t + this.c) / this.b;
      return { x, y };
    } else {
      const y = t;
      const x = -(this.b * y + this.c) / this.a;
      return { x, y };
    }
  }

  getLineCoefficients(): { a: number; b: number; c: number } {
    return { a: this.a, b: this.b, c: this.c };
  }
}

export class SegmentPath extends AbstractPath implements LimitedPath, PathWithPoints {
  private startPoint: { x: number; y: number };
  private endPoint: { x: number; y: number };
  private dx: number;
  private dy: number;
  private length: number;

  constructor(startPoint: { x: number; y: number }, endPoint: { x: number; y: number }) {
    super(0, 1);
    this.startPoint = startPoint;
    this.endPoint = endPoint;
    this.dx = endPoint.x - startPoint.x;
    this.dy = endPoint.y - startPoint.y;
    this.length = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
  }

  getPathType(): string {
    return 'segment';
  }

  isClosedPath(): boolean {
    return false;
  }

  hasStart(): boolean {
    return true;
  }

  hasEnd(): boolean {
    return true;
  }

  getStartParameter(): number {
    return 0;
  }

  getEndParameter(): number {
    return 1;
  }

  getStartPoint(): { x: number; y: number } {
    return { ...this.startPoint };
  }

  getEndPoint(): { x: number; y: number } {
    return { ...this.endPoint };
  }

  isOnPath(x: number, y: number, tolerance: number = 1e-6): boolean {
    const t = this.getPathParameterForPoint(x, y).t;
    if (t < -tolerance || t > 1 + tolerance) return false;

    const projected = this.getPointFromPathParameter(new PathParameter(t));
    const dist = Math.sqrt((x - projected.x) ** 2 + (y - projected.y) ** 2);
    return dist < tolerance;
  }

  pointChanged(point: { getX(): number; getY(): number; setCoords(x: number, y: number): void }): void {
    const t = this.getPathParameterForPoint(point.getX(), point.getY()).t;
    const clampedT = this.clampParameter(t);
    const projected = this.getPointFromPathParameter(new PathParameter(clampedT));
    point.setCoords(projected.x, projected.y);
  }

  pathChanged(point: { getX(): number; getY(): number; setCoords(x: number, y: number): void }): void {
    this.pointChanged(point);
  }

  getPathParameterForPoint(x: number, y: number): PathParameter {
    if (this.length < 1e-10) {
      return new PathParameter(0);
    }

    const t = ((x - this.startPoint.x) * this.dx + (y - this.startPoint.y) * this.dy) / (this.length * this.length);
    return new PathParameter(t);
  }

  getPointFromPathParameter(param: PathParameter): { x: number; y: number } {
    const t = param.t;
    return {
      x: this.startPoint.x + t * this.dx,
      y: this.startPoint.y + t * this.dy,
    };
  }

  getLength(): number {
    return this.length;
  }
}

export class RayPath extends AbstractPath implements LimitedPath, PathWithPoints {
  private startPoint: { x: number; y: number };
  private directionX: number;
  private directionY: number;

  constructor(startPoint: { x: number; y: number }, throughPoint: { x: number; y: number }) {
    super(0, Infinity);
    this.startPoint = startPoint;
    const dx = throughPoint.x - startPoint.x;
    const dy = throughPoint.y - startPoint.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 1e-10) {
      this.directionX = dx / len;
      this.directionY = dy / len;
    } else {
      this.directionX = 1;
      this.directionY = 0;
    }
  }

  getPathType(): string {
    return 'ray';
  }

  isClosedPath(): boolean {
    return false;
  }

  hasStart(): boolean {
    return true;
  }

  hasEnd(): boolean {
    return false;
  }

  getStartParameter(): number {
    return 0;
  }

  getEndParameter(): number {
    return Infinity;
  }

  getStartPoint(): { x: number; y: number } {
    return { ...this.startPoint };
  }

  getEndPoint(): { x: number; y: number } | null {
    return null;
  }

  isOnPath(x: number, y: number, tolerance: number = 1e-6): boolean {
    const t = this.getPathParameterForPoint(x, y).t;
    if (t < -tolerance) return false;

    const projected = this.getPointFromPathParameter(new PathParameter(Math.max(0, t)));
    const dist = Math.sqrt((x - projected.x) ** 2 + (y - projected.y) ** 2);
    return dist < tolerance;
  }

  pointChanged(point: { getX(): number; getY(): number; setCoords(x: number, y: number): void }): void {
    const t = this.getPathParameterForPoint(point.getX(), point.getY()).t;
    const clampedT = Math.max(0, t);
    const projected = this.getPointFromPathParameter(new PathParameter(clampedT));
    point.setCoords(projected.x, projected.y);
  }

  pathChanged(point: { getX(): number; getY(): number; setCoords(x: number, y: number): void }): void {
    this.pointChanged(point);
  }

  getPathParameterForPoint(x: number, y: number): PathParameter {
    const t = (x - this.startPoint.x) * this.directionX + (y - this.startPoint.y) * this.directionY;
    return new PathParameter(t);
  }

  getPointFromPathParameter(param: PathParameter): { x: number; y: number } {
    const t = param.t;
    return {
      x: this.startPoint.x + t * this.directionX,
      y: this.startPoint.y + t * this.directionY,
    };
  }
}

export class CirclePath extends AbstractPath implements Path {
  private centerX: number;
  private centerY: number;
  private radius: number;

  constructor(centerX: number, centerY: number, radius: number) {
    super(0, 2 * Math.PI);
    this.centerX = centerX;
    this.centerY = centerY;
    this.radius = radius;
  }

  getPathType(): string {
    return 'circle';
  }

  isClosedPath(): boolean {
    return true;
  }

  isOnPath(x: number, y: number, tolerance: number = 1e-6): boolean {
    const dist = Math.sqrt((x - this.centerX) ** 2 + (y - this.centerY) ** 2);
    return Math.abs(dist - this.radius) < tolerance;
  }

  pointChanged(point: { getX(): number; getY(): number; setCoords(x: number, y: number): void }): void {
    const t = this.getPathParameterForPoint(point.getX(), point.getY());
    const projected = this.getPointFromPathParameter(t);
    point.setCoords(projected.x, projected.y);
  }

  pathChanged(point: { getX(): number; getY(): number; setCoords(x: number, y: number): void }): void {
    this.pointChanged(point);
  }

  getPathParameterForPoint(x: number, y: number): PathParameter {
    const angle = Math.atan2(y - this.centerY, x - this.centerX);
    const normalizedAngle = angle < 0 ? angle + 2 * Math.PI : angle;
    return new PathParameter(normalizedAngle);
  }

  getPointFromPathParameter(param: PathParameter): { x: number; y: number } {
    const angle = param.t;
    return {
      x: this.centerX + this.radius * Math.cos(angle),
      y: this.centerY + this.radius * Math.sin(angle),
    };
  }

  getCenter(): { x: number; y: number } {
    return { x: this.centerX, y: this.centerY };
  }

  getRadius(): number {
    return this.radius;
  }
}

export class EllipsePath extends AbstractPath implements Path {
  private centerX: number;
  private centerY: number;
  private semiMajorAxis: number;
  private semiMinorAxis: number;
  private rotationAngle: number;

  constructor(
    centerX: number,
    centerY: number,
    semiMajorAxis: number,
    semiMinorAxis: number,
    rotationAngle: number = 0
  ) {
    super(0, 2 * Math.PI);
    this.centerX = centerX;
    this.centerY = centerY;
    this.semiMajorAxis = semiMajorAxis;
    this.semiMinorAxis = semiMinorAxis;
    this.rotationAngle = rotationAngle;
  }

  getPathType(): string {
    return 'ellipse';
  }

  isClosedPath(): boolean {
    return true;
  }

  isOnPath(x: number, y: number, tolerance: number = 1e-6): boolean {
    const cos = Math.cos(-this.rotationAngle);
    const sin = Math.sin(-this.rotationAngle);
    const dx = x - this.centerX;
    const dy = y - this.centerY;
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;
    const value = (rx * rx) / (this.semiMajorAxis * this.semiMajorAxis) +
                  (ry * ry) / (this.semiMinorAxis * this.semiMinorAxis);
    return Math.abs(value - 1) < tolerance;
  }

  pointChanged(point: { getX(): number; getY(): number; setCoords(x: number, y: number): void }): void {
    const t = this.getPathParameterForPoint(point.getX(), point.getY());
    const projected = this.getPointFromPathParameter(t);
    point.setCoords(projected.x, projected.y);
  }

  pathChanged(point: { getX(): number; getY(): number; setCoords(x: number, y: number): void }): void {
    this.pointChanged(point);
  }

  getPathParameterForPoint(x: number, y: number): PathParameter {
    const cos = Math.cos(-this.rotationAngle);
    const sin = Math.sin(-this.rotationAngle);
    const dx = x - this.centerX;
    const dy = y - this.centerY;
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;
    const angle = Math.atan2(ry / this.semiMinorAxis, rx / this.semiMajorAxis);
    const normalizedAngle = angle < 0 ? angle + 2 * Math.PI : angle;
    return new PathParameter(normalizedAngle);
  }

  getPointFromPathParameter(param: PathParameter): { x: number; y: number } {
    const angle = param.t;
    const cosR = Math.cos(this.rotationAngle);
    const sinR = Math.sin(this.rotationAngle);
    const rx = this.semiMajorAxis * Math.cos(angle);
    const ry = this.semiMinorAxis * Math.sin(angle);
    return {
      x: this.centerX + rx * cosR - ry * sinR,
      y: this.centerY + rx * sinR + ry * cosR,
    };
  }
}
