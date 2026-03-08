import { CoordinateSystem } from '../coordinates/CoordinateSystem';
import { Drawable } from '../drawables/Drawable';
import { GeoCircleElement, GeoPointElement, RenderCommand, HitTestResult } from './types';

/**
 * 圆绘制对象
 */
export class CircleDrawable extends Drawable {
  private circle: GeoCircleElement;
  private centerPoint?: GeoPointElement;
  private cx: number = 0;
  private cy: number = 0;
  private screenRadius: number = 0;

  constructor(
    element: GeoCircleElement,
    coordSystem: CoordinateSystem,
    getPoint?: (id: string) => GeoPointElement | undefined
  ) {
    super(element, coordSystem);
    this.circle = element;
    
    if (getPoint) {
      this.centerPoint = getPoint(element.centerId);
    }
  }

  update(): void {
    this.state.isVisible = this.circle.style.visible;
    
    if (!this.state.isVisible) return;

    // 计算圆心屏幕坐标
    if (this.centerPoint) {
      this.cx = this.coordSystem.toScreenX(this.centerPoint.x);
      this.cy = this.coordSystem.toScreenY(this.centerPoint.y);
    }

    // 计算屏幕半径（使用 x 方向缩放）
    this.screenRadius = this.circle.radius * this.coordSystem.getConfig().xScale;

    // 计算边界框
    this.state.screenPoints = [
      { x: this.cx - this.screenRadius, y: this.cy - this.screenRadius },
      { x: this.cx + this.screenRadius, y: this.cy + this.screenRadius },
    ];
    
    // 标签位置放在圆右侧
    this.setLabelPosition(this.cx + this.screenRadius, this.cy);
    this.calculateBounds(this.state.screenPoints);
  }

  render(): RenderCommand {
    const circleCmd: RenderCommand = {
      type: 'circle',
      props: {
        cx: this.cx,
        cy: this.cy,
        r: this.screenRadius,
        fill: 'none',
        stroke: this.circle.style.strokeColor,
        strokeWidth: this.circle.style.strokeWidth,
        fillOpacity: this.circle.style.opacity,
        strokeDasharray: this.getStrokeDashArray(),
      },
    };

    const label = this.renderLabel();
    const children: RenderCommand[] = label ? [circleCmd, label] : [circleCmd];

    return {
      type: 'group',
      props: {
        id: this.circle.id,
        className: 'geo-circle',
      },
      children,
    };
  }

  hitTest(screenX: number, screenY: number, threshold: number): HitTestResult {
    const dx = screenX - this.cx;
    const dy = screenY - this.cy;
    const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
    
    // 检测是否在圆边缘附近
    const distance = Math.abs(distanceFromCenter - this.screenRadius);

    return {
      hit: distance <= threshold,
      distance,
      elementId: this.circle.id,
    };
  }

  /**
   * 更新圆心引用
   */
  setCenterPoint(centerPoint?: GeoPointElement): void {
    this.centerPoint = centerPoint;
    this.update();
  }
}
