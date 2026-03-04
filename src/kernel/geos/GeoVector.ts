import { Construction } from '../Construction';
import { GeoElementBase } from './GeoElements';
import { GeoPoint } from './GeoPoint';

/**
 * 向量类
 */
export class GeoVector extends GeoElementBase {
  private x: number;
  private y: number;

  /**
   * 构造函数
   * @param construction 构造管理器
   * @param x x 分量
   * @param y y 分量
   */
  constructor(construction: Construction, x: number = 0, y: number = 0) {
    super(construction);
    this.x = x;
    this.y = y;
    
    // 自动分配标签
    const label = construction.generateLabel('vector');
    this.setLabel(label);
    construction.addGeoElement(this);
  }

  /**
   * 从两点创建向量
   * @param start 起点
   * @param end 终点
   */
  setFromPoints(start: GeoPoint, end: GeoPoint): void {
    this.x = end.getX() - start.getX();
    this.y = end.getY() - start.getY();
  }

  /**
   * 设置分量
   * @param x x 分量
   * @param y y 分量
   */
  setCoords(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.notifyUpdate();
  }

  /**
   * 获取 x 分量
   * @returns x 分量
   */
  getX(): number {
    return this.x;
  }

  /**
   * 获取 y 分量
   * @returns y 分量
   */
  getY(): number {
    return this.y;
  }

  /**
   * 计算长度
   * @returns 长度
   */
  getLength(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * 计算单位向量
   * @returns 单位向量
   */
  normalize(construction: Construction): GeoVector {
    const length = this.getLength();
    if (length < 1e-10) {
      return new GeoVector(construction, 0, 0);
    }
    return new GeoVector(construction, this.x / length, this.y / length);
  }

  /**
   * 向量加法
   * @param other 另一个向量
   * @returns 和向量
   */
  add(other: GeoVector, construction: Construction): GeoVector {
    return new GeoVector(construction, this.x + other.x, this.y + other.y);
  }

  /**
   * 向量减法
   * @param other 另一个向量
   * @returns 差向量
   */
  subtract(other: GeoVector, construction: Construction): GeoVector {
    return new GeoVector(construction, this.x - other.x, this.y - other.y);
  }

  /**
   * 向量点积
   * @param other 另一个向量
   * @returns 点积
   */
  dot(other: GeoVector): number {
    return this.x * other.x + this.y * other.y;
  }

  /**
   * 向量叉积
   * @param other 另一个向量
   * @returns 叉积
   */
  cross(other: GeoVector): number {
    return this.x * other.y - this.y * other.x;
  }

  /**
   * 向量缩放
   * @param scalar 标量
   * @returns 缩放后的向量
   */
  scale(scalar: number, construction: Construction): GeoVector {
    return new GeoVector(construction, this.x * scalar, this.y * scalar);
  }
}