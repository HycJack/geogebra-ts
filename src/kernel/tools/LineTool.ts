/**
 * 线工具
 * 支持垂线、平行线、中垂线、角平分线
 */

import { Construction } from '../Construction';
import { GeoPoint } from '../geos/GeoPoint';
import { GeoLine } from '../geos/GeoLine';
import { AlgoParallelLine, AlgoPerpendicularLine } from '../algos/AlgoLineTools';
import { AlgoPerpendicularBisector, AlgoAngularBisectorPoints } from '../algos/AlgoAngularBisector';

/**
 * 线工具模式枚举
 */
export enum LineToolMode {
  PERPENDICULAR = 'perpendicular',
  PARALLEL = 'parallel',
  PERPENDICULAR_BISECTOR = 'perpendicular_bisector',
  ANGULAR_BISECTOR = 'angular_bisector',
}

/**
 * 线工具类
 */
export class LineTool {
  private construction: Construction;
  private mode: LineToolMode;
  private step: number = 0;
  private points: GeoPoint[] = [];
  private selectedLine: GeoLine | null = null;

  constructor(construction: Construction, mode: LineToolMode = LineToolMode.PERPENDICULAR) {
    this.construction = construction;
    this.mode = mode;
  }

  /**
   * 设置线工具模式
   * @param mode 线工具模式
   */
  setMode(mode: LineToolMode): void {
    this.reset();
    this.mode = mode;
  }

  /**
   * 获取当前模式
   * @returns 当前模式
   */
  getMode(): LineToolMode {
    return this.mode;
  }

  /**
   * 重置工具状态
   */
  reset(): void {
    this.step = 0;
    this.points = [];
    this.selectedLine = null;
  }

  /**
   * 处理点击事件
   * @param x x坐标
   * @param y y坐标
   * @param line 选中的直线（可选）
   * @returns 创建的直线或null
   */
  handleClick(x: number, y: number, line?: GeoLine): GeoLine | null {
    switch (this.mode) {
      case LineToolMode.PERPENDICULAR:
        return this.handlePerpendicularMode(x, y, line);
      case LineToolMode.PARALLEL:
        return this.handleParallelMode(x, y, line);
      case LineToolMode.PERPENDICULAR_BISECTOR:
        return this.handlePerpendicularBisectorMode(x, y);
      case LineToolMode.ANGULAR_BISECTOR:
        return this.handleAngularBisectorMode(x, y);
      default:
        return null;
    }
  }

  /**
   * 处理垂线模式
   * @param x x坐标
   * @param y y坐标
   * @param line 选中的直线
   * @returns 创建的直线或null
   */
  private handlePerpendicularMode(x: number, y: number, line?: GeoLine): GeoLine | null {
    if (this.step === 0) {
      if (line) {
        this.selectedLine = line;
        this.step = 1;
        return null;
      } else {
        const point = new GeoPoint(this.construction, x, y);
        this.points.push(point);
        this.step = 1;
        return null;
      }
    } else if (this.step === 1) {
      if (this.selectedLine) {
        const point = new GeoPoint(this.construction, x, y);
        this.points.push(point);
        
        const algo = new AlgoPerpendicularLine(
          this.construction,
          { x: point.getX(), y: point.getY() },
          { a: this.selectedLine.getA(), b: this.selectedLine.getB(), c: this.selectedLine.getC() }
        );
        
        const result = algo.getResult();
        if (result.defined) {
          const newLine = new GeoLine(this.construction, result.a, result.b, result.c);
          this.reset();
          return newLine;
        }
      } else if (this.points.length >= 1) {
        const point2 = new GeoPoint(this.construction, x, y);
        this.points.push(point2);
        
        const dx = this.points[1].getX() - this.points[0].getX();
        const dy = this.points[1].getY() - this.points[0].getY();
        
        const algo = new AlgoPerpendicularLine(
          this.construction,
          { x: this.points[0].getX(), y: this.points[0].getY() },
          { a: dy, b: -dx, c: dx * this.points[0].getY() - dy * this.points[0].getX() }
        );
        
        const result = algo.getResult();
        if (result.defined) {
          const newLine = new GeoLine(this.construction, result.a, result.b, result.c);
          this.reset();
          return newLine;
        }
      }
    }
    return null;
  }

  /**
   * 处理平行线模式
   * @param x x坐标
   * @param y y坐标
   * @param line 选中的直线
   * @returns 创建的直线或null
   */
  private handleParallelMode(x: number, y: number, line?: GeoLine): GeoLine | null {
    if (this.step === 0) {
      if (line) {
        this.selectedLine = line;
        this.step = 1;
        return null;
      } else {
        const point = new GeoPoint(this.construction, x, y);
        this.points.push(point);
        this.step = 1;
        return null;
      }
    } else if (this.step === 1) {
      if (this.selectedLine) {
        const point = new GeoPoint(this.construction, x, y);
        this.points.push(point);
        
        const algo = new AlgoParallelLine(
          this.construction,
          { x: point.getX(), y: point.getY() },
          { a: this.selectedLine.getA(), b: this.selectedLine.getB(), c: this.selectedLine.getC() }
        );
        
        const result = algo.getResult();
        if (result.defined) {
          const newLine = new GeoLine(this.construction, result.a, result.b, result.c);
          this.reset();
          return newLine;
        }
      } else if (this.points.length >= 1) {
        const point2 = new GeoPoint(this.construction, x, y);
        this.points.push(point2);
        
        const dx = this.points[1].getX() - this.points[0].getX();
        const dy = this.points[1].getY() - this.points[0].getY();
        
        const algo = new AlgoParallelLine(
          this.construction,
          { x: this.points[0].getX(), y: this.points[0].getY() },
          { a: dy, b: -dx, c: dx * this.points[0].getY() - dy * this.points[0].getX() }
        );
        
        const result = algo.getResult();
        if (result.defined) {
          const newLine = new GeoLine(this.construction, result.a, result.b, result.c);
          this.reset();
          return newLine;
        }
      }
    }
    return null;
  }

  /**
   * 处理中垂线模式
   * @param x x坐标
   * @param y y坐标
   * @returns 创建的直线或null
   */
  private handlePerpendicularBisectorMode(x: number, y: number): GeoLine | null {
    if (this.step < 2) {
      const point = new GeoPoint(this.construction, x, y);
      this.points.push(point);
      this.step++;
      
      if (this.step === 2) {
        const algo = new AlgoPerpendicularBisector(
          this.construction,
          { x: this.points[0].getX(), y: this.points[0].getY() },
          { x: this.points[1].getX(), y: this.points[1].getY() }
        );
        
        const result = algo.getBisector();
        if (result.defined) {
          const newLine = new GeoLine(this.construction, result.a, result.b, result.c);
          this.reset();
          return newLine;
        }
      }
    }
    return null;
  }

  /**
   * 处理角平分线模式
   * @param x x坐标
   * @param y y坐标
   * @returns 创建的直线或null
   */
  private handleAngularBisectorMode(x: number, y: number): GeoLine | null {
    if (this.step < 3) {
      const point = new GeoPoint(this.construction, x, y);
      this.points.push(point);
      this.step++;
      
      if (this.step === 3) {
        const algo = new AlgoAngularBisectorPoints(
          this.construction,
          { x: this.points[1].getX(), y: this.points[1].getY() },
          { x: this.points[0].getX(), y: this.points[0].getY() },
          { x: this.points[2].getX(), y: this.points[2].getY() }
        );
        
        const result = algo.getBisector();
        if (result.defined) {
          const newLine = new GeoLine(this.construction, result.a, result.b, result.c);
          this.reset();
          return newLine;
        }
      }
    }
    return null;
  }

  /**
   * 获取当前步骤
   * @returns 当前步骤
   */
  getStep(): number {
    return this.step;
  }

  /**
   * 获取已创建的点
   * @returns 点数组
   */
  getPoints(): GeoPoint[] {
    return [...this.points];
  }

  /**
   * 获取选中的直线
   * @returns 选中的直线
   */
  getSelectedLine(): GeoLine | null {
    return this.selectedLine;
  }

  /**
   * 取消当前操作
   */
  cancel(): void {
    this.reset();
  }
}
