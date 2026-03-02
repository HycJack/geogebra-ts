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
export { Drawable } from './Drawable';

// 导出具体绘制对象
export { PointDrawable } from './PointDrawable';
export { LineDrawable } from './LineDrawable';
export { SegmentDrawable } from './SegmentDrawable';
export { CircleDrawable } from './CircleDrawable';
export { PolygonDrawable } from './PolygonDrawable';
export { VectorDrawable } from './VectorDrawable';
export { TextDrawable } from './TextDrawable';

// 导出工厂
export { DrawableFactory, createDrawable } from './DrawableFactory';
