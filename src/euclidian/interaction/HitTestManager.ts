import { HitTestResult } from '../drawables/types';
import { HitTestManager as IHitTestManager, SelectionBox } from './types';
import type { Drawable } from '../drawables/Drawable';

/**
 * 命中测试管理器
 * 管理绘制对象的命中测试
 */
export class HitTestManager implements IHitTestManager {
  private drawables: Drawable[] = [];
  private threshold: number = 8;

  constructor(threshold?: number) {
    if (threshold !== undefined) {
      this.threshold = threshold;
    }
  }

  /**
   * 设置绘制对象列表
   */
  setDrawables(drawables: Drawable[]): void {
    this.drawables = drawables;
  }

  /**
   * 添加绘制对象
   */
  addDrawable(drawable: Drawable): void {
    this.drawables.push(drawable);
  }

  /**
   * 移除绘制对象
   */
  removeDrawable(id: string): void {
    this.drawables = this.drawables.filter(d => d.getId() !== id);
  }

  /**
   * 设置默认阈值
   */
  setThreshold(threshold: number): void {
    this.threshold = threshold;
  }

  /**
   * 命中测试 - 返回最近的命中对象
   */
  hitTest(screenX: number, screenY: number, threshold?: number): HitTestResult | null {
    const results = this.hitTestAll(screenX, screenY, threshold);
    
    if (results.length === 0) return null;
    
    // 返回距离最近的
    return results.reduce((closest, current) => 
      current.distance < closest.distance ? current : closest
    );
  }

  /**
   * 命中测试 - 返回所有命中对象
   */
  hitTestAll(screenX: number, screenY: number, threshold?: number): HitTestResult[] {
    const hitThreshold = threshold ?? this.threshold;
    const results: HitTestResult[] = [];

    for (const drawable of this.drawables) {
      if (!drawable.isVisible()) continue;

      const result = drawable.hitTest(screenX, screenY, hitThreshold);
      if (result.hit) {
        results.push(result);
      }
    }

    // 按距离排序
    return results.sort((a, b) => a.distance - b.distance);
  }

  /**
   * 框选测试
   */
  hitTestBox(box: SelectionBox): Drawable[] {
    const minX = Math.min(box.startX, box.endX);
    const maxX = Math.max(box.startX, box.endX);
    const minY = Math.min(box.startY, box.endY);
    const maxY = Math.max(box.startY, box.endY);

    const selected: Drawable[] = [];

    for (const drawable of this.drawables) {
      if (!drawable.isVisible()) continue;

      const bounds = drawable.getBounds();
      
      // 检查边界框是否与选择框相交
      if (bounds.minX <= maxX && bounds.maxX >= minX &&
          bounds.minY <= maxY && bounds.maxY >= minY) {
        selected.push(drawable);
      }
    }

    return selected;
  }

  /**
   * 获取指定点的绘制对象
   */
  getDrawableAt(screenX: number, screenY: number, threshold?: number): Drawable | null {
    const result = this.hitTest(screenX, screenY, threshold);
    if (!result) return null;

    return this.drawables.find(d => d.getId() === result.elementId) || null;
  }

  /**
   * 获取指定区域内的所有绘制对象
   */
  getDrawablesInRegion(x: number, y: number, width: number, height: number): Drawable[] {
    return this.hitTestBox({
      startX: x,
      startY: y,
      endX: x + width,
      endY: y + height,
    });
  }

  /**
   * 清除所有绘制对象
   */
  clear(): void {
    this.drawables = [];
  }

  /**
   * 获取绘制对象数量
   */
  getCount(): number {
    return this.drawables.length;
  }
}
