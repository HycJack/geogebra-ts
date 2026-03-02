import { CoordinateSystem } from '../coordinates/CoordinateSystem';
import { Drawable } from './Drawable';
import { GeoVectorElement, GeoPointElement, RenderCommand, HitTestResult } from './types';

/**
 * 向量绘制对象
 */
export class VectorDrawable extends Drawable {
  private vector: GeoVectorElement;
  private startPoint?: GeoPointElement;
  private endPoint?: GeoPointElement;
  private x1: number = 0;
  private y1: number = 0;
  private x2: number = 0;
  private y2: number = 0;

  constructor(
    element: GeoVectorElement,
    coordSystem: CoordinateSystem,
    getPoint?: (id: string) => GeoPointElement | undefined
  ) {
    super(element, coordSystem);
    this.vector = element;
    
    if (getPoint) {
      this.startPoint = getPoint(element.startId);
      this.endPoint = getPoint(element.endId);
    }
  }

  update(): void {
    this.state.isVisible = this.vector.style.visible;
    
    if (!this.state.isVisible) return;
    if (!this.startPoint || !this.endPoint) return;

    this.x1 = this.coordSystem.toScreenX(this.startPoint.x);
    this.y1 = this.coordSystem.toScreenY(this.startPoint.y);
    this.x2 = this.coordSystem.toScreenX(this.endPoint.x);
    this.y2 = this.coordSystem.toScreenY(this.endPoint.y);

    this.state.screenPoints = [
      { x: this.x1, y: this.y1 },
      { x: this.x2, y: this.y2 },
    ];
    
    // 标签位置放在中点
    this.setLabelPosition((this.x1 + this.x2) / 2, (this.y1 + this.y2) / 2);
    this.calculateBounds(this.state.screenPoints);
  }

  render(): RenderCommand {
    const arrowSize = 10;
    const angle = Math.atan2(this.y2 - this.y1, this.x2 - this.x1);
    
    // 箭头点
    const arrowX1 = this.x2 - arrowSize * Math.cos(angle - Math.PI / 6);
    const arrowY1 = this.y2 - arrowSize * Math.sin(angle - Math.PI / 6);
    const arrowX2 = this.x2 - arrowSize * Math.cos(angle + Math.PI / 6);
    const arrowY2 = this.y2 - arrowSize * Math.sin(angle + Math.PI / 6);

    const children: RenderCommand[] = [
      // 向量线
      {
        type: 'line',
        props: {
          x1: this.x1,
          y1: this.y1,
          x2: this.x2,
          y2: this.y2,
          stroke: this.vector.style.strokeColor,
          strokeWidth: this.vector.style.strokeWidth,
          strokeDasharray: this.getStrokeDashArray(),
        },
      },
      // 箭头
      {
        type: 'polygon',
        props: {
          points: `${this.x2},${this.y2} ${arrowX1},${arrowY1} ${arrowX2},${arrowY2}`,
          fill: this.vector.style.strokeColor,
        },
      },
    ];

    const label = this.renderLabel();
    if (label) children.push(label);

    return {
      type: 'group',
      props: {
        id: this.vector.id,
        className: 'geo-vector',
      },
      children,
    };
  }

  hitTest(screenX: number, screenY: number, threshold: number): HitTestResult {
    const distance = this.distanceToSegment(screenX, screenY, this.x1, this.y1, this.x2, this.y2);

    return {
      hit: distance <= threshold,
      distance,
      elementId: this.vector.id,
    };
  }

  /**
   * 更新端点引用
   */
  setPoints(startPoint?: GeoPointElement, endPoint?: GeoPointElement): void {
    this.startPoint = startPoint;
    this.endPoint = endPoint;
    this.update();
  }
}
