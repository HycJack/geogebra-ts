import { CoordinateSystem } from '../coordinates/CoordinateSystem';
import { Drawable } from './Drawable';
import { GeoTextElement, RenderCommand, HitTestResult } from '../types';

/**
 * 文本绘制对象
 */
export class TextDrawable extends Drawable {
  private text: GeoTextElement;
  private screenX: number = 0;
  private screenY: number = 0;

  constructor(element: GeoTextElement, coordSystem: CoordinateSystem) {
    super(element, coordSystem);
    this.text = element;
  }

  update(): void {
    this.state.isVisible = this.text.style.visible;
    
    if (!this.state.isVisible) return;

    this.screenX = this.coordSystem.toScreenX(this.text.x);
    this.screenY = this.coordSystem.toScreenY(this.text.y);

    this.state.screenPoints = [{ x: this.screenX, y: this.screenY }];
    this.setLabelPosition(this.screenX, this.screenY);
    this.calculateBounds(this.state.screenPoints);
  }

  render(): RenderCommand {
    const anchor = this.text.anchor || 'start';
    let textAnchor = 'start';
    
    switch (anchor) {
      case 'middle':
        textAnchor = 'middle';
        break;
      case 'end':
        textAnchor = 'end';
        break;
      default:
        textAnchor = 'start';
    }

    return {
      type: 'text',
      props: {
        id: this.text.id,
        x: this.screenX,
        y: this.screenY,
        fill: this.text.style.strokeColor,
        fontSize: this.text.style.fontSize || 14,
        fontFamily: this.text.style.fontFamily || 'Arial',
        textAnchor: textAnchor,
        dominantBaseline: 'middle',
        pointerEvents: 'none',
        userSelect: 'none',
        className: 'geo-text',
      },
      children: [this.text.content],
    };
  }

  hitTest(screenX: number, screenY: number, threshold: number): HitTestResult {
    // 文本命中测试使用近似矩形
    const fontSize = this.text.style.fontSize || 14;
    const textWidth = this.text.content.length * fontSize * 0.6;
    const textHeight = fontSize;

    const dx = screenX - this.screenX;
    const dy = screenY - this.screenY;

    // 根据锚点调整检测区域
    let offsetX = 0;
    switch (this.text.anchor) {
      case 'middle':
        offsetX = -textWidth / 2;
        break;
      case 'end':
        offsetX = -textWidth;
        break;
    }

    const inX = dx >= offsetX - threshold && dx <= offsetX + textWidth + threshold;
    const inY = dy >= -textHeight / 2 - threshold && dy <= textHeight / 2 + threshold;

    return {
      hit: inX && inY,
      distance: Math.sqrt(dx * dx + dy * dy),
      elementId: this.text.id,
    };
  }
}
