/**
 * 路径参数
 * 对应 Java 版本的 PathParameter
 */

export class PathParameter {
  private _t: number = NaN;
  private _pathType: number = -1;

  constructor(t?: number) {
    if (t !== undefined) {
      this._t = t;
    }
  }

  get t(): number {
    return this._t;
  }

  set t(value: number) {
    if (!isNaN(value)) {
      this._t = value;
    }
  }

  get pathType(): number {
    return this._pathType;
  }

  set pathType(value: number) {
    this._pathType = value;
  }

  set(other: PathParameter): void {
    this._t = other._t;
    this._pathType = other._pathType;
  }

  copy(): PathParameter {
    const pp = new PathParameter();
    pp.set(this);
    return pp;
  }

  isDefined(): boolean {
    return !isNaN(this._t);
  }

  setUndefined(): void {
    this._t = NaN;
  }
}

export const PathType = {
  LINE: 0,
  SEGMENT: 1,
  RAY: 2,
  CIRCLE: 3,
  ELLIPSE: 4,
  HYPERBOLA: 5,
  PARABOLA: 6,
  POLYGON: 7,
  FUNCTION: 8,
  CURVE: 9,
  CONIC: 10,
} as const;

export type PathTypeValue = typeof PathType[keyof typeof PathType];
