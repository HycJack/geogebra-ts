import { AlgoElement } from '../dependency/AlgoElement';
import { GeoPoint, GeoSegment } from '../types/GeoElements';
import { Construction } from '../dependency/Construction';

/**
 * 两点连线算法
 * 创建连接两个点的线段
 */
export class AlgoJoinPointsSegment extends AlgoElement {
  private startPoint: GeoPoint;
  private endPoint: GeoPoint;
  private segment: GeoSegment;

  /**
   * 构造函数
   * @param construction 构造管理器
   * @param startPoint 起点
   * @param endPoint 终点
   */
  constructor(construction: Construction, startPoint: GeoPoint, endPoint: GeoPoint) {
    super(construction);
    this.startPoint = startPoint;
    this.endPoint = endPoint;

    // 创建输出线段
    this.segment = new GeoSegment(construction, startPoint, endPoint);
    this.segment.setParentAlgorithm(this);

    // 设置输入输出
    this.setInput([startPoint, endPoint]);
    this.setOnlyOutput(this.segment);
    this.setDependencies();

    // 计算初始值
    this.compute();
  }

  /**
   * 计算线段
   */
  compute(): void {
    if (!this.startPoint.isDefined() || !this.endPoint.isDefined()) {
      this.segment.setUndefined();
      return;
    }

    // 更新线段的端点
    this.segment.setCoord(this.startPoint, this.endPoint);
  }

  /**
   * 设置依赖关系
   */
  setDependencies(): void {
    // 线段依赖于两个端点
    this.startPoint.updateDependentObjects();
    this.endPoint.updateDependentObjects();
  }

  /**
   * 获取线段
   * @returns 线段
   */
  getSegment(): GeoSegment {
    return this.segment;
  }

  /**
   * 获取起点
   * @returns 起点
   */
  getStartPoint(): GeoPoint {
    return this.startPoint;
  }

  /**
   * 获取终点
   * @returns 终点
   */
  getEndPoint(): GeoPoint {
    return this.endPoint;
  }
}

/**
 * 中点算法
 * 计算线段的中点
 */
export class AlgoMidpoint extends AlgoElement {
  private segment: GeoSegment;
  private midpoint: GeoPoint;

  /**
   * 构造函数
   * @param construction 构造管理器
   * @param segment 线段
   */
  constructor(construction: Construction, segment: GeoSegment) {
    super(construction);
    this.segment = segment;

    // 创建输出中点
    this.midpoint = new GeoPoint(construction);
    this.midpoint.setParentAlgorithm(this);

    // 设置输入输出
    this.setInput([segment]);
    this.setOnlyOutput(this.midpoint);
    this.setDependencies();

    // 计算初始值
    this.compute();
  }

  /**
   * 计算中点
   */
  compute(): void {
    if (!this.segment.isDefined()) {
      this.midpoint.setUndefined();
      return;
    }

    const start = this.segment.getStartPoint();
    const end = this.segment.getEndPoint();

    if (!start.isDefined() || !end.isDefined()) {
      this.midpoint.setUndefined();
      return;
    }

    // 计算中点坐标
    const x = (start.getX() + end.getX()) / 2;
    const y = (start.getY() + end.getY()) / 2;
    this.midpoint.setCoords(x, y);
  }

  /**
   * 设置依赖关系
   */
  setDependencies(): void {
    // 中点依赖于线段
    this.segment.updateDependentObjects();
  }

  /**
   * 获取中点
   * @returns 中点
   */
  getMidpoint(): GeoPoint {
    return this.midpoint;
  }

  /**
   * 获取线段
   * @returns 线段
   */
  getSegment(): GeoSegment {
    return this.segment;
  }
}