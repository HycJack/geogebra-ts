import { CoordinateSystem } from '../coordinates/CoordinateSystem';
import { Drawable } from './Drawable';
import { PointDrawable } from './PointDrawable';
import { LineDrawable } from './LineDrawable';
import { SegmentDrawable } from './SegmentDrawable';
import { CircleDrawable } from './CircleDrawable';
import { PolygonDrawable } from './PolygonDrawable';
import { VectorDrawable } from './VectorDrawable';
import { TextDrawable } from './TextDrawable';
import { 
  GeoElement, 
  GeoPointElement, 
  GeoLineElement, 
  GeoSegmentElement,
  GeoCircleElement,
  GeoPolygonElement,
  GeoVectorElement,
  GeoTextElement,
} from './types';

/**
 * 绘制对象工厂
 * 用于创建各种类型的绘制对象
 */
export class DrawableFactory {
  private coordSystem: CoordinateSystem;
  private elementCache: Map<string, GeoElement> = new Map();

  constructor(coordSystem: CoordinateSystem) {
    this.coordSystem = coordSystem;
  }

  /**
   * 设置坐标系统
   */
  setCoordSystem(coordSystem: CoordinateSystem): void {
    this.coordSystem = coordSystem;
  }

  /**
   * 缓存元素以便依赖查找
   */
  cacheElement(element: GeoElement): void {
    this.elementCache.set(element.id, element);
  }

  /**
   * 移除缓存的元素
   */
  removeCachedElement(id: string): void {
    this.elementCache.delete(id);
  }

  /**
   * 获取缓存的元素
   */
  getElement(id: string): GeoElement | undefined {
    return this.elementCache.get(id);
  }

  /**
   * 获取点元素
   */
  getPoint(id: string): GeoPointElement | undefined {
    const element = this.elementCache.get(id);
    if (element && element.type === 'point') {
      return element as GeoPointElement;
    }
    return undefined;
  }

  /**
   * 创建绘制对象
   */
  create(element: GeoElement): Drawable | null {
    // 缓存元素
    this.cacheElement(element);

    switch (element.type) {
      case 'point':
        return new PointDrawable(element as GeoPointElement, this.coordSystem);

      case 'line':
        return new LineDrawable(element as GeoLineElement, this.coordSystem);

      case 'segment':
        return new SegmentDrawable(
          element as GeoSegmentElement, 
          this.coordSystem,
          (id) => this.getPoint(id)
        );

      case 'circle':
        return new CircleDrawable(
          element as GeoCircleElement,
          this.coordSystem,
          (id) => this.getPoint(id)
        );

      case 'polygon':
        return new PolygonDrawable(
          element as GeoPolygonElement,
          this.coordSystem,
          (id) => this.getPoint(id)
        );

      case 'vector':
        return new VectorDrawable(
          element as GeoVectorElement,
          this.coordSystem,
          (id) => this.getPoint(id)
        );

      case 'text':
        return new TextDrawable(element as GeoTextElement, this.coordSystem);

      default:
        console.warn(`Unknown element type: ${(element as any).type}`);
        return null;
    }
  }

  /**
   * 批量创建绘制对象
   */
  createMany(elements: GeoElement[]): Drawable[] {
    // 首先缓存所有元素
    elements.forEach(el => this.cacheElement(el));
    
    // 然后创建绘制对象
    return elements
      .map(el => this.create(el))
      .filter((d): d is Drawable => d !== null);
  }

  /**
   * 更新绘制对象的依赖
   */
  updateDependencies(drawable: Drawable): void {
    const element = drawable.getElement();

    switch (element.type) {
      case 'segment': {
        const seg = element as GeoSegmentElement;
        const startPoint = this.getPoint(seg.startId);
        const endPoint = this.getPoint(seg.endId);
        if (drawable instanceof SegmentDrawable) {
          drawable.setPoints(startPoint, endPoint);
        }
        break;
      }

      case 'circle': {
        const circle = element as GeoCircleElement;
        const centerPoint = this.getPoint(circle.centerId);
        if (drawable instanceof CircleDrawable) {
          drawable.setCenterPoint(centerPoint);
        }
        break;
      }

      case 'polygon': {
        const polygon = element as GeoPolygonElement;
        const vertices = polygon.vertexIds.map(id => this.getPoint(id));
        if (drawable instanceof PolygonDrawable) {
          drawable.setVertices(vertices);
        }
        break;
      }

      case 'vector': {
        const vector = element as GeoVectorElement;
        const startPoint = this.getPoint(vector.startId);
        const endPoint = this.getPoint(vector.endId);
        if (drawable instanceof VectorDrawable) {
          drawable.setPoints(startPoint, endPoint);
        }
        break;
      }
    }
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.elementCache.clear();
  }
}

// 导出便捷函数
export function createDrawable(
  element: GeoElement,
  coordSystem: CoordinateSystem,
  factory?: DrawableFactory
): Drawable | null {
  if (factory) {
    return factory.create(element);
  }
  const newFactory = new DrawableFactory(coordSystem);
  return newFactory.create(element);
}
