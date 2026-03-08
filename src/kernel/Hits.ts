import { GeoElementBase } from './geos/GeoElements';
import { GeoPoint } from './geos/GeoPoint';

/**
 * 命中检测类
 * 管理鼠标点击位置附近的几何对象
 * 对应Java版本的Hits类
 */
export class Hits {
  private hits: GeoElementBase[] = [];
  private tempArrayList: GeoElementBase[] = [];

  /**
   * 添加几何对象到命中列表
   * @param geo 几何对象
   */
  add(geo: GeoElementBase): void {
    if (!this.hits.includes(geo)) {
      this.hits.push(geo);
    }
  }

  /**
   * 移除几何对象
   * @param geo 几何对象
   */
  remove(geo: GeoElementBase): void {
    const index = this.hits.indexOf(geo);
    if (index > -1) {
      this.hits.splice(index, 1);
    }
  }

  /**
   * 移除所有几何对象
   */
  clear(): void {
    this.hits = [];
  }

  /**
   * 检查是否为空
   * @returns 是否为空
   */
  isEmpty(): boolean {
    return this.hits.length === 0;
  }

  /**
   * 获取命中的几何对象数量
   * @returns 数量
   */
  size(): number {
    return this.hits.length;
  }

  /**
   * 获取指定索引的几何对象
   * @param index 索引
   * @returns 几何对象
   */
  get(index: number): GeoElementBase {
    return this.hits[index];
  }

  /**
   * 检查是否包含点
   * @returns 是否包含点
   */
  containsGeoPoint(): boolean {
    return this.hits.some(geo => geo instanceof GeoPoint);
  }

  /**
   * 检查是否包含指定几何对象
   * @param geo 几何对象
   * @returns 是否包含
   */
  contains(geo: GeoElementBase): boolean {
    return this.hits.includes(geo);
  }

  /**
   * 获取路径对象
   * @returns 路径对象数组
   */
  getPathHits(): GeoElementBase[] {
    this.tempArrayList = this.hits.filter(geo => {
      return (geo as any).isPath && (geo as any).isPath() === true;
    });
    return this.tempArrayList;
  }

  /**
   * 移除滑块对象
   */
  removeSliders(): void {
    // 这里简化处理，实际实现需要根据具体的滑块类型进行判断
    this.hits = this.hits.filter(geo => {
      return !(geo as any).isSlider;
    });
  }

  /**
   * 只保留点模式下的命中对象
   */
  keepOnlyHitsForNewPointMode(): void {
    // 这里简化处理，实际实现需要根据具体的模式进行判断
    this.hits = this.hits.filter(geo => {
      return geo instanceof GeoPoint || (geo as any).isPath;
    });
  }

  /**
   * 获取第一个命中的点
   * @returns 点对象或null
   */
  getFirstGeoPoint(): GeoPoint | null {
    for (const geo of this.hits) {
      if (geo instanceof GeoPoint) {
        return geo;
      }
    }
    return null;
  }

  /**
   * 获取命中的点列表
   * @returns 点对象数组
   */
  getGeoPoints(): GeoPoint[] {
    this.tempArrayList = this.hits.filter(geo => geo instanceof GeoPoint);
    return this.tempArrayList as GeoPoint[];
  }
}
