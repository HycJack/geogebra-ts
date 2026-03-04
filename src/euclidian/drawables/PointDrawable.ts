import { CoordinateSystem } from '../coordinates/CoordinateSystem';
import { Drawable } from './Drawable';
import { GeoPointElement, RenderCommand, HitTestResult } from '../types';

/**
 * 点绘制对象
 */
export class PointDrawable extends Drawable {
  private point: GeoPointElement;
  private screenX: number = 0;
  private screenY: number = 0;

  constructor(element: GeoPointElement, coordSystem: CoordinateSystem) {
    super(element, coordSystem);
    this.point = element;
  }

  update(): void {
    this.state.isVisible = this.point.style.visible;
    
    if (!this.state.isVisible) return;

    this.screenX = this.coordSystem.toScreenX(this.point.x);
    this.screenY = this.coordSystem.toScreenY(this.point.y);

    this.state.screenPoints = [{ x: this.screenX, y: this.screenY }];
    this.setLabelPosition(this.screenX, this.screenY);
    this.calculateBounds(this.state.screenPoints);
  }

  render(): RenderCommand {
    const size = this.point.pointSize || 5;
    const style = this.point.pointStyle || 'dot';
    const { strokeColor, fillColor } = this.point.style;

    let shape: RenderCommand;

    switch (style) {
      case 'cross':
        shape = {
          type: 'group',
          props: {},
          children: [
            {
              type: 'line',
              props: {
                x1: this.screenX - size,
                y1: this.screenY - size,
                x2: this.screenX + size,
                y2: this.screenY + size,
                stroke: strokeColor,
                strokeWidth: 2,
              },
            },
            {
              type: 'line',
              props: {
                x1: this.screenX + size,
                y1: this.screenY - size,
                x2: this.screenX - size,
                y2: this.screenY + size,
                stroke: strokeColor,
                strokeWidth: 2,
              },
            },
          ],
        };
        break;

      case 'circle':
        shape = {
          type: 'circle',
          props: {
            cx: this.screenX,
            cy: this.screenY,
            r: size,
            fill: 'none',
            stroke: strokeColor,
            strokeWidth: 2,
          },
        };
        break;

      case 'square':
        shape = {
          type: 'rect',
          props: {
            x: this.screenX - size,
            y: this.screenY - size,
            width: size * 2,
            height: size * 2,
            fill: fillColor,
            stroke: strokeColor,
            strokeWidth: 2,
          },
        };
        break;

      case 'dot':
      default:
        shape = {
          type: 'circle',
          props: {
            cx: this.screenX,
            cy: this.screenY,
            r: size,
            fill: fillColor,
            stroke: strokeColor,
            strokeWidth: 2,
          },
        };
        break;
    }

    const label = this.renderLabel();
    const children: RenderCommand[] = label ? [shape, label] : [shape];

    return {
      type: 'group',
      props: {
        id: this.point.id,
        className: 'geo-point',
      },
      children,
    };
  }

  hitTest(screenX: number, screenY: number, threshold: number): HitTestResult {
    const size = this.point.pointSize || 5;
    const hitThreshold = Math.max(threshold, size + 2);
    
    const dx = screenX - this.screenX;
    const dy = screenY - this.screenY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return {
      hit: distance <= hitThreshold,
      distance,
      elementId: this.point.id,
    };
  }
}
