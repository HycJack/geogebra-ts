import { CoordinateSystem } from '../coordinates/CoordinateSystem';
import { Drawable } from './Drawable';
import { GeoPolygonElement, GeoPointElement, RenderCommand, HitTestResult } from '../types';

/**
 * 多边形绘制对象
 */
export class PolygonDrawable extends Drawable {
  private polygon: GeoPolygonElement;
  private vertices: (GeoPointElement | undefined)[] = [];
  private points: { x: number; y: number }[] = [];

  constructor(
    element: GeoPolygonElement,
    coordSystem: CoordinateSystem,
    getPoint?: (id: string) => GeoPointElement | undefined
  ) {
    super(element, coordSystem);
    this.polygon = element;
    
    if (getPoint) {
      this.vertices = element.vertexIds.map(id => getPoint(id));
    }
  }

  update(): void {
    this.state.isVisible = this.polygon.style.visible;
    
    if (!this.state.isVisible) return;

    // 计算顶点屏幕坐标
    this.points = this.vertices
      .filter((v): v is GeoPointElement => v !== undefined)
      .map(v => ({
        x: this.coordSystem.toScreenX(v.x),
        y: this.coordSystem.toScreenY(v.y),
      }));

    if (this.points.length === 0) return;

    this.state.screenPoints = this.points.map(p => ({ x: p.x, y: p.y }));
    
    // 标签位置放在重心
    const centroid = this.calculateCentroid();
    this.setLabelPosition(centroid.x, centroid.y);
    this.calculateBounds(this.state.screenPoints);
  }

  render(): RenderCommand {
    if (this.points.length < 3) {
      return {
        type: 'group',
        props: { id: this.polygon.id },
        children: [],
      };
    }

    const pathData = this.points.map((p, i) => 
      `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
    ).join(' ') + ' Z';

    const polygonCmd: RenderCommand = {
      type: 'path',
      props: {
        d: pathData,
        fill: this.polygon.filled !== false ? this.polygon.style.fillColor : 'none',
        stroke: this.polygon.style.strokeColor,
        strokeWidth: this.polygon.style.strokeWidth,
        fillOpacity: this.polygon.style.opacity,
        strokeDasharray: this.getStrokeDashArray(),
      },
    };

    const label = this.renderLabel();
    const children: RenderCommand[] = label ? [polygonCmd, label] : [polygonCmd];

    return {
      type: 'group',
      props: {
        id: this.polygon.id,
        className: 'geo-polygon',
      },
      children,
    };
  }

  hitTest(screenX: number, screenY: number, threshold: number): HitTestResult {
    // 检查是否在多边形内部
    const inside = this.isPointInPolygon(screenX, screenY);
    
    // 检查是否靠近边
    let minDistance = Infinity;
    for (let i = 0; i < this.points.length; i++) {
      const p1 = this.points[i];
      const p2 = this.points[(i + 1) % this.points.length];
      const dist = this.distanceToSegment(screenX, screenY, p1.x, p1.y, p2.x, p2.y);
      minDistance = Math.min(minDistance, dist);
    }

    return {
      hit: inside || minDistance <= threshold,
      distance: inside ? 0 : minDistance,
      elementId: this.polygon.id,
    };
  }

  /**
   * 更新顶点引用
   */
  setVertices(vertices: (GeoPointElement | undefined)[]): void {
    this.vertices = vertices;
    this.update();
  }

  /**
   * 计算重心
   */
  private calculateCentroid(): { x: number; y: number } {
    if (this.points.length === 0) return { x: 0, y: 0 };
    
    const sum = this.points.reduce((acc, p) => ({
      x: acc.x + p.x,
      y: acc.y + p.y,
    }), { x: 0, y: 0 });

    return {
      x: sum.x / this.points.length,
      y: sum.y / this.points.length,
    };
  }

  /**
   * 检查点是否在多边形内（射线法）
   */
  private isPointInPolygon(x: number, y: number): boolean {
    let inside = false;
    for (let i = 0, j = this.points.length - 1; i < this.points.length; j = i++) {
      const xi = this.points[i].x, yi = this.points[i].y;
      const xj = this.points[j].x, yj = this.points[j].y;
      
      const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      
      if (intersect) inside = !inside;
    }
    return inside;
  }
}
