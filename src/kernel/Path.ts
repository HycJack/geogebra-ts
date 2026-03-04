/**
 * 路径接口
 * 对应 Java 版本的 Path 接口
 * 
 * 路径是可以让点在其上移动的几何对象
 * 如：直线、线段、射线、圆、圆锥曲线、函数曲线等
 */

import { PathParameter } from './PathParameter';

export { PathParameter } from './PathParameter';

/**
 * 可路径化接口
 * 实现此接口的对象可以被约束到路径上
 */
export interface Pathable {
  getPath(): Path | null;
  setPath(path: Path | null): void;
  getPathParameter(): PathParameter;
  setPathParameter(param: PathParameter): void;
  hasPath(): boolean;
  removePath(): void;
  updateCoords(x: number, y: number): void;
}

export interface Path {
  isPath(): true;
  
  getPathType(): string;
  
  isClosedPath(): boolean;
  
  isOnPath(x: number, y: number, tolerance?: number): boolean;
  
  pointChanged(point: { getX(): number; getY(): number; setCoords(x: number, y: number): void }): void;
  
  pathChanged(point: { getX(): number; getY(): number; setCoords(x: number, y: number): void }): void;
  
  getPathParameterForPoint(x: number, y: number): PathParameter;
  
  getPointFromPathParameter(param: PathParameter): { x: number; y: number };
  
  getMinParameter(): number;
  
  getMaxParameter(): number;
}

export interface PathWithPoints extends Path {
  getStartPoint(): { x: number; y: number } | null;
  getEndPoint(): { x: number; y: number } | null;
}

export interface LimitedPath extends Path {
  hasStart(): boolean;
  hasEnd(): boolean;
  getStartParameter(): number;
  getEndParameter(): number;
}

export abstract class AbstractPath implements Path {
  protected minParam: number;
  protected maxParam: number;

  constructor(minParam: number = -Infinity, maxParam: number = Infinity) {
    this.minParam = minParam;
    this.maxParam = maxParam;
  }

  isPath(): true {
    return true;
  }

  abstract getPathType(): string;

  isClosedPath(): boolean {
    return false;
  }

  abstract isOnPath(x: number, y: number, tolerance?: number): boolean;
  abstract pointChanged(point: { getX(): number; getY(): number; setCoords(x: number, y: number): void }): void;
  abstract pathChanged(point: { getX(): number; getY(): number; setCoords(x: number, y: number): void }): void;
  abstract getPathParameterForPoint(x: number, y: number): PathParameter;
  abstract getPointFromPathParameter(param: PathParameter): { x: number; y: number };

  getMinParameter(): number {
    return this.minParam;
  }

  getMaxParameter(): number {
    return this.maxParam;
  }

  protected clampParameter(t: number): number {
    return Math.max(this.minParam, Math.min(this.maxParam, t));
  }
}
