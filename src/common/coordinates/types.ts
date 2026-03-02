/**
 * 坐标系统类型定义
 */

/** 屏幕坐标点 (像素) */
export interface ScreenPoint {
  x: number;
  y: number;
}

/** 世界坐标点 (数学坐标) */
export interface WorldPoint {
  x: number;
  y: number;
}

/** 视口配置 */
export interface ViewPortConfig {
  width: number;
  height: number;
  xZero: number;      // 原点 x 屏幕坐标
  yZero: number;      // 原点 y 屏幕坐标
  xScale: number;     // x 方向像素/单位
  yScale: number;     // y 方向像素/单位
}

/** 坐标变换矩阵 */
export interface TransformMatrix {
  a: number;  // 缩放 x
  b: number;  // 旋转
  c: number;  // 旋转
  d: number;  // 缩放 y
  e: number;  // 平移 x
  f: number;  // 平移 y
}

/** 网格配置 */
export interface GridConfig {
  visible: boolean;
  interval: number;
  subDivisions: number;
  color: string;
  lineWidth: number;
}

/** 坐标轴配置 */
export interface AxisConfig {
  visible: boolean;
  color: string;
  lineWidth: number;
  arrowSize: number;
  labelInterval: number;
}
