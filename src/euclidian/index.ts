// 导出类型（排除与 types/index.ts 冲突的 GeoElement）
export type {
  GeoElementType,
  DrawableStyle,
  DrawableState,
  RenderCommand,
  HitTestResult,
  GeoPointElement,
  GeoLineElement,
  GeoSegmentElement,
  GeoCircleElement,
  GeoPolygonElement,
  GeoVectorElement,
  GeoTextElement,
  GeoAngleElement,
  DrawableGeoElement,
} from './types';

// 导出基类
export { Drawable } from './drawables/Drawable';

// 导出具体绘制对象
export { PointDrawable } from './drawables/PointDrawable';
export { LineDrawable } from './drawables/LineDrawable';
export { SegmentDrawable } from './drawables/SegmentDrawable';
export { CircleDrawable } from './drawables/CircleDrawable';
export { PolygonDrawable } from './drawables/PolygonDrawable';
export { VectorDrawable } from './drawables/VectorDrawable';
export { TextDrawable } from './drawables/TextDrawable';

// 导出工厂
export { DrawableFactory, createDrawable } from './drawables/DrawableFactory';

export { EuclidianView } from './EuclidianView';
export type { EuclidianViewRef } from './EuclidianView';