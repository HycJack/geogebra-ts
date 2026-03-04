import { ScreenPoint } from '../coordinates/types';

/**
 * 绘制对象类型定义
 */

/** 几何元素类型 */
export type GeoElementType = 
  | 'point' 
  | 'line' 
  | 'segment' 
  | 'circle' 
  | 'polygon' 
  | 'vector' 
  | 'text' 
  | 'angle';

/** 样式配置 */
export interface DrawableStyle {
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  opacity: number;
  visible: boolean;
  labelVisible: boolean;
  fontSize?: number;
  fontFamily?: string;
  strokeDashArray?: number[];
}

/** 几何元素基础接口 */
export interface DrawableGeoElement {
  id: string;
  type: GeoElementType;
  label?: string;
  style: DrawableStyle;
}

/** @deprecated 使用 DrawableGeoElement */
export type GeoElement = DrawableGeoElement;

/** 点元素 */
export interface GeoPointElement extends GeoElement {
  type: 'point';
  x: number;
  y: number;
  pointSize?: number;
  pointStyle?: 'dot' | 'circle' | 'cross' | 'square';
}

/** 直线元素 */
export interface GeoLineElement extends GeoElement {
  type: 'line';
  a: number;  // 直线方程 ax + by + c = 0
  b: number;
  c: number;
}

/** 线段元素 */
export interface GeoSegmentElement extends GeoElement {
  type: 'segment';
  startId: string;
  endId: string;
}

/** 圆元素 */
export interface GeoCircleElement extends GeoElement {
  type: 'circle';
  centerId: string;
  radius: number;
  radiusId?: string;  // 通过点定义半径
}

/** 多边形元素 */
export interface GeoPolygonElement extends GeoElement {
  type: 'polygon';
  vertexIds: string[];
  filled?: boolean;
}

/** 向量元素 */
export interface GeoVectorElement extends GeoElement {
  type: 'vector';
  startId: string;
  endId: string;
}

/** 文本元素 */
export interface GeoTextElement extends GeoElement {
  type: 'text';
  x: number;
  y: number;
  content: string;
  anchor?: 'start' | 'middle' | 'end';
}

/** 角度元素 */
export interface GeoAngleElement extends GeoElement {
  type: 'angle';
  vertexId: string;
  startId: string;
  endId: string;
  radius?: number;
  showArc?: boolean;
  showValue?: boolean;
}

/** 绘制状态 */
export interface DrawableState {
  isVisible: boolean;
  screenPoints: ScreenPoint[];
  labelPosition: ScreenPoint;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
}

/** 渲染指令 */
export interface RenderCommand {
  type: 'path' | 'circle' | 'line' | 'rect' | 'text' | 'group' | 'polygon';
  props: Record<string, any>;
  children?: RenderCommand[] | string[];
}

/** 命中测试结果 */
export interface HitTestResult {
  hit: boolean;
  distance: number;
  elementId: string;
  point?: ScreenPoint;
}
