/**
 * 吸附控制器类
 * 实现点吸附到路径的功能
 */
import { Path } from './Path';
import { Hits } from './Hits';
import { GeoConic } from './geos/GeoConic';

/**
 * 点坐标接口
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * 吸附控制器类
 */
export class SnapController {
  // 吸附阈值，单位为像素
  private static readonly SNAP_THRESHOLD = 10;

  /**
   * 计算点到路径的最短距离
   * @param x 点的x坐标
   * @param y 点的y坐标
   * @param path 路径
   * @returns 最短距离
   */
  static distanceToPath(x: number, y: number, path: Path): number {
    if (path.getPathType() === 'line') {
      // 对于直线，使用直线距离公式
      const line = path as unknown as any;
      if (typeof line.getA === 'function' && typeof line.getB === 'function' && typeof line.getC === 'function') {
        const a = line.getA();
        const b = line.getB();
        const c = line.getC();
        return Math.abs(a * x + b * y + c) / Math.sqrt(a * a + b * b);
      }
    } else if (path.getPathType() === 'circle') {
      // 对于圆，计算点到圆心的距离减去半径
      const circle = path as unknown as any;
      if (typeof circle.getCenter === 'function' && typeof circle.getRadius === 'function') {
        const center = circle.getCenter();
        if (center && typeof center.getX === 'function' && typeof center.getY === 'function') {
          const radius = circle.getRadius();
          const dx = x - center.getX();
          const dy = y - center.getY();
          return Math.abs(Math.sqrt(dx * dx + dy * dy) - radius);
        }
      }
    } else if (path.getPathType() === 'conic') {
      // 对于圆锥曲线，计算点到曲线的距离
      const conic = path as unknown as any;
      if (typeof conic.matrix === 'function' && typeof conic.classifyConic === 'function') {
        const matrix = conic.matrix();
        if (matrix) {
          // 使用evaluate方法计算点到圆锥曲线的距离
          const value = GeoConic.evaluate(matrix, x, y);
          return Math.abs(value);
        }
      }
    }
    return Infinity;
  }

  /**
   * 找到距离点最近的路径
   * @param x 点的x坐标
   * @param y 点的y坐标
   * @param hits 命中对象列表
   * @returns 最近的路径或null
   */
  static findNearestPath(x: number, y: number, hits: Hits): Path | null {
    const pathHits = hits.getPathHits();
    if (pathHits.length === 0) {
      return null;
    }

    let nearestPath: Path | null = null;
    let minDistance = Infinity;

    for (const geo of pathHits) {
      // 检查geo是否实现了Path接口
      if (geo && typeof (geo as unknown as any).isPath === 'function' && (geo as unknown as any).isPath() === true) {
        const path = geo as unknown as Path;
        const distance = this.distanceToPath(x, y, path);
        if (distance < minDistance) {
          minDistance = distance;
          nearestPath = path;
        }
      }
    }

    return minDistance < this.SNAP_THRESHOLD ? nearestPath : null;
  }

  /**
   * 吸附点到路径
   * @param x 点的x坐标
   * @param y 点的y坐标
   * @param path 路径
   * @returns 吸附后的点坐标
   */
  static snapToPath(x: number, y: number, path: Path): Point {
    if (path.getPathType() === 'line') {
      // 对于直线，计算垂足
      const line = path as unknown as any;
      if (typeof line.getA === 'function' && typeof line.getB === 'function' && typeof line.getC === 'function') {
        const a = line.getA();
        const b = line.getB();
        const c = line.getC();
        const denom = a * a + b * b;
        
        if (denom < 1e-10) {
          return { x, y };
        }
        
        const xProj = (b * (b * x - a * y) - a * c) / denom;
        const yProj = (a * (-b * x + a * y) - b * c) / denom;
        return { x: xProj, y: yProj };
      }
    } else if (path.getPathType() === 'circle') {
      // 对于圆，将点投影到圆周上
      const circle = path as unknown as any;
      if (typeof circle.getCenter === 'function' && typeof circle.getRadius === 'function') {
        const center = circle.getCenter();
        if (center && typeof center.getX === 'function' && typeof center.getY === 'function') {
          const radius = circle.getRadius();
          
          const dx = x - center.getX();
          const dy = y - center.getY();
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 1e-10) {
            // 如果点在圆心，默认放到右侧
            return {
              x: center.getX() + radius,
              y: center.getY()
            };
          }
          
          const scale = radius / distance;
          return {
            x: center.getX() + dx * scale,
            y: center.getY() + dy * scale
          };
        }
      }
    } else if (path.getPathType() === 'conic') {
      // 对于圆锥曲线，使用GeoConic的pointChanged方法
      const conic = path as unknown as any;
      if (typeof conic.matrix === 'function' && typeof conic.pointChanged === 'function') {
        const matrix = conic.matrix();
        if (matrix) {
          // 创建一个能够被约束的临时点对象
          let constrainedX = x;
          let constrainedY = y;
          
          const tempPoint = {
            getX: () => constrainedX,
            getY: () => constrainedY,
            setCoords: (newX: number, newY: number) => {
              // 当GeoConic.pointChanged调用setCoords时，更新约束后的坐标
              constrainedX = newX;
              constrainedY = newY;
            }
          };
          
          // 使用GeoConic的pointChanged方法将点约束到圆锥曲线上
          GeoConic.pointChanged(matrix, tempPoint);
          
          // 返回约束后的坐标
          return { x: constrainedX, y: constrainedY };
        }
      }
    }
    return { x, y };
  }

  /**
   * 处理点的吸附
   * @param x 点的x坐标
   * @param y 点的y坐标
   * @param hits 命中对象列表
   * @returns 吸附后的点坐标和路径
   */
  static processSnap(x: number, y: number, hits: Hits): { point: Point; path: Path | null } {
    const nearestPath = this.findNearestPath(x, y, hits);
    if (nearestPath) {
      const snappedPoint = this.snapToPath(x, y, nearestPath);
      return { point: snappedPoint, path: nearestPath };
    }
    return { point: { x, y }, path: null };
  }
}
