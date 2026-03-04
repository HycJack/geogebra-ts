/**
 * 路径相关接口和实现
 * 对应 Java 版本的 kernel/geos/path 包
 */

/**
 * 路径参数接口
 * 表示点在路径上的位置参数
 */
export interface PathParameter {
  /** 参数值，通常在[0, 1]范围内 */
  t: number;
  /** 是否超出路径范围 */
  outOfBounds?: boolean;
}

/**
 * 路径接口
 * 定义可以被点约束到的几何对象（直线、圆、线段等）
 */
export interface Path {
  /**
   * 获取路径上的点
   * @param t 路径参数，通常在[0, 1]范围内
   * @returns 路径上的点坐标
   */
  getPointOnPath(t: number): { x: number; y: number };

  /**
   * 获取点在路径上的参数
   * @param x 点的x坐标
   * @param y 点的y坐标
   * @returns 路径参数
   */
  getPathParameter(x: number, y: number): PathParameter;

  /**
   * 当点被拖动时，限制其在路径上
   * 将点的坐标更新为路径上的最近点
   * @param point 需要约束的点
   */
  pointChanged(point: { getX(): number; getY(): number; setCoords(x: number, y: number): void }): void;

  /**
   * 判断路径是否闭合
   * @returns 是否闭合（圆是闭合的，直线不是）
   */
  isClosedPath(): boolean;

  /**
   * 获取路径的长度
   * @returns 路径长度
   */
  getPathLength(): number;

  /**
   * 获取路径上某点的切线方向
   * @param t 路径参数
   * @returns 切线向量
   */
  getTangentDirection(t: number): { x: number; y: number };
}

/**
 * 路径移动器接口
 * 用于沿路径移动点
 */
export interface PathMover {
  /**
   * 设置路径
   * @param path 目标路径
   */
  setPath(path: Path): void;

  /**
   * 获取当前路径参数
   * @returns 路径参数
   */
  getCurrentParameter(): number;

  /**
   * 设置当前路径参数
   * @param t 路径参数
   */
  setCurrentParameter(t: number): void;

  /**
   * 沿路径移动指定距离
   * @param distance 移动距离（正数向前，负数向后）
   * @returns 新的路径参数
   */
  move(distance: number): number;

  /**
   * 获取当前位置的点坐标
   * @returns 点坐标
   */
  getCurrentPoint(): { x: number; y: number };

  /**
   * 判断是否到达路径终点
   * @returns 是否到达终点
   */
  hasReachedEnd(): boolean;

  /**
   * 判断是否到达路径起点
   * @returns 是否到达起点
   */
  hasReachedStart(): boolean;
}

/**
 * 路径移动器实现
 */
export class PathMoverImpl implements PathMover {
  private path: Path | null = null;
  private currentT: number = 0;

  setPath(path: Path): void {
    this.path = path;
    this.currentT = 0;
  }

  getCurrentParameter(): number {
    return this.currentT;
  }

  setCurrentParameter(t: number): void {
    this.currentT = this.clamp(t, 0, 1);
  }

  move(distance: number): number {
    if (!this.path) return this.currentT;

    const pathLength = this.path.getPathLength();
    const deltaT = distance / pathLength;

    if (this.path.isClosedPath()) {
      // 闭合路径循环移动
      this.currentT = (this.currentT + deltaT) % 1;
      if (this.currentT < 0) this.currentT += 1;
    } else {
      // 非闭合路径限制在范围内
      this.currentT = this.clamp(this.currentT + deltaT, 0, 1);
    }

    return this.currentT;
  }

  getCurrentPoint(): { x: number; y: number } {
    if (!this.path) return { x: 0, y: 0 };
    return this.path.getPointOnPath(this.currentT);
  }

  hasReachedEnd(): boolean {
    if (!this.path || this.path.isClosedPath()) return false;
    return this.currentT >= 1;
  }

  hasReachedStart(): boolean {
    if (!this.path || this.path.isClosedPath()) return false;
    return this.currentT <= 0;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}

/**
 * 路径限制类型
 */
export type PathRestrictionType =
  | 'none'      // 无限制
  | 'onPath'    // 在路径上
  | 'inside'    // 在内部（如圆内）
  | 'outside';  // 在外部

/**
 * 可路径化的接口
 * 表示可以被约束到路径上的对象
 */
export interface Pathable {
  /**
   * 获取路径
   * @returns 当前约束的路径或null
   */
  getPath(): Path | null;

  /**
   * 设置路径
   * @param path 要约束到的路径
   */
  setPath(path: Path | null): void;

  /**
   * 获取路径参数
   * @returns 路径参数
   */
  getPathParameter(): PathParameter;

  /**
   * 设置路径参数
   * @param param 路径参数
   */
  setPathParameter(param: PathParameter): void;

  /**
   * 是否被约束到路径
   * @returns 是否有路径约束
   */
  hasPath(): boolean;

  /**
   * 移除路径约束
   */
  removePath(): void;

  /**
   * 当点被拖动时更新坐标
   * 如果有路径约束，会限制在路径上
   * @param x 目标x坐标
   * @param y 目标y坐标
   */
  updateCoords(x: number, y: number): void;
}