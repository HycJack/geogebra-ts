import { CoordinateSystem } from '../coordinates/CoordinateSystem';
import { Drawable } from './Drawable';
import { GeoLineElement, RenderCommand, HitTestResult } from '../types';

/**
 * 直线绘制对象
 */
export class LineDrawable extends Drawable {
  private line: GeoLineElement;
  private x1: number = 0;
  private y1: number = 0;
  private x2: number = 0;
  private y2: number = 0;

  constructor(element: GeoLineElement, coordSystem: CoordinateSystem) {
    super(element, coordSystem);
    this.line = element;
  }

  update(): void {
    this.state.isVisible = this.line.style.visible;
    
    if (!this.state.isVisible) return;

    // 计算直线与视口边界的交点
    const bounds = this.coordSystem.getVisibleWorldBounds();
    const points = this.getLineEndpoints(bounds);

    if (points) {
      this.x1 = this.coordSystem.toScreenX(points.x1);
      this.y1 = this.coordSystem.toScreenY(points.y1);
      this.x2 = this.coordSystem.toScreenX(points.x2);
      this.y2 = this.coordSystem.toScreenY(points.y2);

      this.state.screenPoints = [
        { x: this.x1, y: this.y1 },
        { x: this.x2, y: this.y2 },
      ];
      
      // 标签位置放在中点
      this.setLabelPosition((this.x1 + this.x2) / 2, (this.y1 + this.y2) / 2);
      this.calculateBounds(this.state.screenPoints);
    }
  }

  render(): RenderCommand {
    const lineCmd: RenderCommand = {
      type: 'line',
      props: {
        x1: this.x1,
        y1: this.y1,
        x2: this.x2,
        y2: this.y2,
        stroke: this.line.style.strokeColor,
        strokeWidth: this.line.style.strokeWidth,
        strokeDasharray: this.getStrokeDashArray(),
      },
    };

    const label = this.renderLabel();
    const children: RenderCommand[] = label ? [lineCmd, label] : [lineCmd];

    return {
      type: 'group',
      props: {
        id: this.line.id,
        className: 'geo-line',
      },
      children,
    };
  }

  hitTest(screenX: number, screenY: number, threshold: number): HitTestResult {
    const distance = this.distanceToSegment(screenX, screenY, this.x1, this.y1, this.x2, this.y2);

    return {
      hit: distance <= threshold,
      distance,
      elementId: this.line.id,
    };
  }

  /**
   * 计算直线与视口边界的交点
   */
  private getLineEndpoints(bounds: { minX: number; maxX: number; minY: number; maxY: number }): { x1: number; y1: number; x2: number; y2: number } | null {
    const { a, b, c } = this.line;
    
    // 处理垂直线 (b = 0)
    if (Math.abs(b) < 1e-10) {
      if (Math.abs(a) < 1e-10) return null;
      const x = -c / a;
      return { x1: x, y1: bounds.minY, x2: x, y2: bounds.maxY };
    }

    // 处理水平线 (a = 0)
    if (Math.abs(a) < 1e-10) {
      const y = -c / b;
      return { x1: bounds.minX, y1: y, x2: bounds.maxX, y2: y };
    }

    // 一般情况：计算与四条边的交点
    const points: { x: number; y: number }[] = [];

    // 左边 x = minX
    let y = (-c - a * bounds.minX) / b;
    if (y >= bounds.minY && y <= bounds.maxY) {
      points.push({ x: bounds.minX, y });
    }

    // 右边 x = maxX
    y = (-c - a * bounds.maxX) / b;
    if (y >= bounds.minY && y <= bounds.maxY) {
      points.push({ x: bounds.maxX, y });
    }

    // 下边 y = minY
    let x = (-c - b * bounds.minY) / a;
    if (x >= bounds.minX && x <= bounds.maxX) {
      points.push({ x, y: bounds.minY });
    }

    // 上边 y = maxY
    x = (-c - b * bounds.maxY) / a;
    if (x >= bounds.minX && x <= bounds.maxX) {
      points.push({ x, y: bounds.maxY });
    }

    if (points.length < 2) return null;

    return {
      x1: points[0].x,
      y1: points[0].y,
      x2: points[1].x,
      y2: points[1].y,
    };
  }
}
