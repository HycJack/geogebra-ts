import { CoordinateSystem } from '../coordinates/CoordinateSystem';
import { Drawable } from './Drawable';
import { GeoSegmentElement, GeoPointElement, RenderCommand, HitTestResult } from '../types';

/**
 * 线段绘制对象
 */
export class SegmentDrawable extends Drawable {
  private segment: GeoSegmentElement;
  private startPoint?: GeoPointElement;
  private endPoint?: GeoPointElement;
  private x1: number = 0;
  private y1: number = 0;
  private x2: number = 0;
  private y2: number = 0;

  constructor(
    element: GeoSegmentElement,
    coordSystem: CoordinateSystem,
    getPoint?: (id: string) => GeoPointElement | undefined
  ) {
    super(element, coordSystem);
    this.segment = element;
    
    if (getPoint) {
      this.startPoint = getPoint(element.startId);
      this.endPoint = getPoint(element.endId);
    }
  }

  update(): void {
    this.state.isVisible = this.segment.style.visible;
    
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
    const lineCmd: RenderCommand = {
      type: 'line',
      props: {
        x1: this.x1,
        y1: this.y1,
        x2: this.x2,
        y2: this.y2,
        stroke: this.segment.style.strokeColor,
        strokeWidth: this.segment.style.strokeWidth,
        strokeDasharray: this.getStrokeDashArray(),
      },
    };

    const label = this.renderLabel();
    const children: RenderCommand[] = label ? [lineCmd, label] : [lineCmd];

    return {
      type: 'group',
      props: {
        id: this.segment.id,
        className: 'geo-segment',
      },
      children,
    };
  }

  hitTest(screenX: number, screenY: number, threshold: number): HitTestResult {
    const distance = this.distanceToSegment(screenX, screenY, this.x1, this.y1, this.x2, this.y2);

    return {
      hit: distance <= threshold,
      distance,
      elementId: this.segment.id,
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
