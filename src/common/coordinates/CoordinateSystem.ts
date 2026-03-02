import { ScreenPoint, WorldPoint, ViewPortConfig, TransformMatrix, GridConfig, AxisConfig } from './types';

/**
 * 坐标系统类
 * 管理世界坐标和屏幕坐标之间的转换
 */
export class CoordinateSystem {
  private config: ViewPortConfig;
  private gridConfig: GridConfig;
  private axisConfig: AxisConfig;

  constructor();
  constructor(config?: Partial<ViewPortConfig>);
  constructor(width: number, height: number, xZero?: number, yZero?: number, xScale?: number, yScale?: number);
  constructor(
    arg1?: Partial<ViewPortConfig> | number,
    arg2?: number,
    arg3?: number,
    arg4?: number,
    arg5?: number,
    arg6?: number
  ) {
    // 处理旧版构造函数调用: new CoordinateSystem(width, height, xZero, yZero, xScale, yScale)
    if (typeof arg1 === 'number' && typeof arg2 === 'number') {
      this.config = {
        width: arg1,
        height: arg2,
        xZero: arg3 ?? arg1 / 2,
        yZero: arg4 ?? arg2 / 2,
        xScale: arg5 ?? 50,
        yScale: arg6 ?? 50,
      };
    } else {
      // 新版构造函数调用: new CoordinateSystem(config?)
      this.config = {
        width: 800,
        height: 600,
        xZero: 400,
        yZero: 300,
        xScale: 50,
        yScale: 50,
        ...(arg1 as Partial<ViewPortConfig>),
      };
    }

    this.gridConfig = {
      visible: true,
      interval: 1,
      subDivisions: 5,
      color: '#e0e0e0',
      lineWidth: 1,
    };

    this.axisConfig = {
      visible: true,
      color: '#000000',
      lineWidth: 2,
      arrowSize: 10,
      labelInterval: 1,
    };
  }

  /**
   * 获取当前配置
   */
  getConfig(): ViewPortConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  setConfig(config: Partial<ViewPortConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 世界坐标转屏幕坐标
   */
  toScreenPoint(world: WorldPoint): ScreenPoint {
    return {
      x: this.config.xZero + world.x * this.config.xScale,
      y: this.config.yZero - world.y * this.config.yScale, // y 轴翻转
    };
  }

  /**
   * 屏幕坐标转世界坐标
   */
  toWorldPoint(screen: ScreenPoint): WorldPoint {
    return {
      x: (screen.x - this.config.xZero) / this.config.xScale,
      y: (this.config.yZero - screen.y) / this.config.yScale, // y 轴翻转
    };
  }

  /**
   * 转换 x 坐标（世界到屏幕）
   */
  toScreenX(worldX: number): number {
    return this.config.xZero + worldX * this.config.xScale;
  }

  /**
   * 转换 y 坐标（世界到屏幕）
   */
  toScreenY(worldY: number): number {
    return this.config.yZero - worldY * this.config.yScale;
  }

  /**
   * 转换 x 坐标（屏幕到世界）
   */
  toWorldX(screenX: number): number {
    return (screenX - this.config.xZero) / this.config.xScale;
  }

  /**
   * 转换 y 坐标（屏幕到世界）
   */
  toWorldY(screenY: number): number {
    return (this.config.yZero - screenY) / this.config.yScale;
  }

  /**
   * 缩放坐标系
   */
  zoom(factor: number, centerScreen?: ScreenPoint): void {
    const center = centerScreen || {
      x: this.config.width / 2,
      y: this.config.height / 2,
    };

    const worldCenter = this.toWorldPoint(center);

    this.config.xScale *= factor;
    this.config.yScale *= factor;

    // 保持缩放中心不变
    const newScreenCenter = this.toScreenPoint(worldCenter);
    this.config.xZero += center.x - newScreenCenter.x;
    this.config.yZero += center.y - newScreenCenter.y;
  }

  /**
   * 平移坐标系
   */
  pan(deltaX: number, deltaY: number): void {
    this.config.xZero += deltaX;
    this.config.yZero += deltaY;
  }

  /**
   * 设置网格配置
   */
  setGridConfig(config: Partial<GridConfig>): void {
    this.gridConfig = { ...this.gridConfig, ...config };
  }

  /**
   * 获取网格配置
   */
  getGridConfig(): GridConfig {
    return { ...this.gridConfig };
  }

  /**
   * 设置坐标轴配置
   */
  setAxisConfig(config: Partial<AxisConfig>): void {
    this.axisConfig = { ...this.axisConfig, ...config };
  }

  /**
   * 获取坐标轴配置
   */
  getAxisConfig(): AxisConfig {
    return { ...this.axisConfig };
  }

  /**
   * 获取变换矩阵
   */
  getTransformMatrix(): TransformMatrix {
    return {
      a: this.config.xScale,
      b: 0,
      c: 0,
      d: -this.config.yScale, // y 轴翻转
      e: this.config.xZero,
      f: this.config.yZero,
    };
  }

  /**
   * 计算距离（世界坐标）
   */
  distanceInWorld(p1: WorldPoint, p2: WorldPoint): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 计算距离（屏幕坐标）
   */
  distanceInScreen(p1: ScreenPoint, p2: ScreenPoint): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 获取可视区域的世界坐标范围
   */
  getVisibleWorldBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
    const topLeft = this.toWorldPoint({ x: 0, y: 0 });
    const bottomRight = this.toWorldPoint({ x: this.config.width, y: this.config.height });

    return {
      minX: topLeft.x,
      maxX: bottomRight.x,
      minY: bottomRight.y,
      maxY: topLeft.y,
    };
  }

  /**
   * 克隆坐标系统
   */
  clone(): CoordinateSystem {
    const clone = new CoordinateSystem(this.config);
    clone.setGridConfig(this.gridConfig);
    clone.setAxisConfig(this.axisConfig);
    return clone;
  }

  // ==================== 兼容 utils/coordinates.ts API ====================

  /**
   * 获取变换参数（兼容旧 API）
   */
  getTransform(): { xZero: number; yZero: number; xScale: number; yScale: number } {
    return {
      xZero: this.config.xZero,
      yZero: this.config.yZero,
      xScale: this.config.xScale,
      yScale: this.config.yScale,
    };
  }

  /**
   * 设置变换参数（兼容旧 API）
   */
  setTransform(transform: { xZero?: number; yZero?: number; xScale?: number; yScale?: number }): void {
    if (transform.xZero !== undefined) this.config.xZero = transform.xZero;
    if (transform.yZero !== undefined) this.config.yZero = transform.yZero;
    if (transform.xScale !== undefined) this.config.xScale = transform.xScale;
    if (transform.yScale !== undefined) this.config.yScale = transform.yScale;
  }

  /**
   * 设置视图大小（兼容旧 API）
   */
  setSize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;
  }

  /**
   * 设置视图大小（别名）
   */
  setViewSize(width: number, height: number): void {
    this.setSize(width, height);
  }

  /**
   * 获取视图宽度
   */
  getViewWidth(): number {
    return this.config.width;
  }

  /**
   * 获取视图高度
   */
  getViewHeight(): number {
    return this.config.height;
  }

  /**
   * 获取网格大小
   */
  getGridSize(): number {
    return this.gridConfig.interval;
  }

  /**
   * 缩放屏幕距离到世界距离
   */
  scaleScreenDistance(screenDistance: number): number {
    return screenDistance / this.config.xScale;
  }

  /**
   * 获取世界边界（兼容旧 API）
   */
  getWorldBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
    return this.getVisibleWorldBounds();
  }

  /**
   * 获取 xZero
   */
  get xZero(): number {
    return this.config.xZero;
  }

  /**
   * 获取 yZero
   */
  get yZero(): number {
    return this.config.yZero;
  }

  /**
   * 获取 xScale
   */
  get xScale(): number {
    return this.config.xScale;
  }

  /**
   * 获取 yScale
   */
  get yScale(): number {
    return this.config.yScale;
  }

  /**
   * 世界坐标转屏幕坐标 X（别名）
   */
  worldToScreenX(worldX: number): number {
    return this.toScreenX(worldX);
  }

  /**
   * 世界坐标转屏幕坐标 Y（别名）
   */
  worldToScreenY(worldY: number): number {
    return this.toScreenY(worldY);
  }
}
