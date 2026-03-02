import { CoordinateSystem } from '../coordinates/CoordinateSystem';
import { ScreenPoint } from '../coordinates/types';
import { GeoElement, DrawableStyle, DrawableState, RenderCommand, HitTestResult } from './types';

/**
 * 绘制对象抽象基类
 * 所有可绘制几何元素的基类
 */
export abstract class Drawable {
  protected element: GeoElement;
  protected coordSystem: CoordinateSystem;
  protected state: DrawableState;

  constructor(element: GeoElement, coordSystem: CoordinateSystem) {
    this.element = element;
    this.coordSystem = coordSystem;
    this.state = {
      isVisible: true,
      screenPoints: [],
      labelPosition: { x: 0, y: 0 },
      bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
    };
  }

  /**
   * 获取元素 ID
   */
  getId(): string {
    return this.element.id;
  }

  /**
   * 获取元素类型
   */
  getType(): string {
    return this.element.type;
  }

  /**
   * 获取元素数据
   */
  getElement(): GeoElement {
    return this.element;
  }

  /**
   * 更新元素数据
   */
  setElement(element: GeoElement): void {
    this.element = element;
    this.update();
  }

  /**
   * 获取坐标系统
   */
  getCoordSystem(): CoordinateSystem {
    return this.coordSystem;
  }

  /**
   * 设置坐标系统
   */
  setCoordSystem(coordSystem: CoordinateSystem): void {
    this.coordSystem = coordSystem;
    this.update();
  }

  /**
   * 更新绘制状态
   * 子类必须实现此方法以计算屏幕坐标和边界
   */
  abstract update(): void;

  /**
   * 生成渲染指令
   * 子类必须实现此方法以生成渲染命令
   */
  abstract render(): RenderCommand;

  /**
   * 命中测试
   * @param screenX 屏幕 x 坐标
   * @param screenY 屏幕 y 坐标
   * @param threshold 命中阈值（像素）
   */
  abstract hitTest(screenX: number, screenY: number, threshold: number): HitTestResult;

  /**
   * 获取标签位置
   */
  getLabelPosition(): ScreenPoint {
    return this.state.labelPosition;
  }

  /**
   * 设置标签位置
   */
  protected setLabelPosition(x: number, y: number): void {
    this.state.labelPosition = { x, y };
  }

  /**
   * 获取样式
   */
  protected getStyle(): DrawableStyle {
    return this.element.style;
  }

  /**
   * 检查是否可见
   */
  isVisible(): boolean {
    return this.state.isVisible && this.element.style.visible;
  }

  /**
   * 获取边界框
   */
  getBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
    return this.state.bounds;
  }

  /**
   * 检查是否在视口内
   */
  isInViewport(): boolean {
    const viewBounds = this.coordSystem.getVisibleWorldBounds();
    const bounds = this.state.bounds;

    return !(
      bounds.maxX < viewBounds.minX ||
      bounds.minX > viewBounds.maxX ||
      bounds.maxY < viewBounds.minY ||
      bounds.minY > viewBounds.maxY
    );
  }

  /**
   * 生成标签渲染指令
   */
  protected renderLabel(): RenderCommand | null {
    if (!this.element.style.labelVisible || !this.element.label) {
      return null;
    }

    return {
      type: 'text',
      props: {
        x: this.state.labelPosition.x,
        y: this.state.labelPosition.y,
        fill: this.element.style.strokeColor,
        fontSize: this.element.style.fontSize || 14,
        fontFamily: this.element.style.fontFamily || 'Arial',
        textAnchor: 'start',
        pointerEvents: 'none',
        userSelect: 'none',
      },
      children: [this.element.label],
    };
  }

  /**
   * 计算边界框
   */
  protected calculateBounds(points: ScreenPoint[]): void {
    if (points.length === 0) {
      this.state.bounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
      return;
    }

    let minX = points[0].x;
    let maxX = points[0].x;
    let minY = points[0].y;
    let maxY = points[0].y;

    for (const point of points) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }

    this.state.bounds = { minX, maxX, minY, maxY };
  }

  /**
   * 获取虚线样式
   */
  protected getStrokeDashArray(): string | undefined {
    if (!this.element.style.strokeDashArray) return undefined;
    return this.element.style.strokeDashArray.join(',');
  }

  /**
   * 计算点到线段的距离
   */
  protected distanceToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;

    if (len2 === 0) {
      return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    }

    let t = ((px - x1) * dx + (py - y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));

    const projX = x1 + t * dx;
    const projY = y1 + t * dy;

    return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
  }
}
