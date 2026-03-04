import type { IGeoElement } from './geos/GeoElement';

/**
 * 元素工厂接口
 * 用于创建新的几何元素
 */
export interface ElementFactory<T extends IGeoElement> {
  create(): T;
}

/**
 * 输出处理器
 * 管理算法的动态输出元素
 * 参考 Java 版本的 AlgoElement.OutputHandler
 */
export class OutputHandler<T extends IGeoElement> {
  private factory: ElementFactory<T>;
  private outputList: T[] = [];
  private labels: string[] = [];
  private parentAlgo: {
    setOutputLength: (n: number) => void;
    setOutput: (i: number, geo: IGeoElement) => void;
  };

  /**
   * 构造函数
   * @param factory 元素工厂
   * @param parentAlgo 父算法对象
   * @param labels 可选的标签数组
   */
  constructor(
    factory: ElementFactory<T>,
    parentAlgo: {
      setOutputLength: (n: number) => void;
      setOutput: (i: number, geo: IGeoElement) => void;
    },
    labels?: string[]
  ) {
    this.factory = factory;
    this.parentAlgo = parentAlgo;
    if (labels) {
      this.labels = labels;
      this.adjustOutputSize(labels.length);
    }
  }

  /**
   * 调整输出大小
   * @param size 新的大小
   */
  adjustOutputSize(size: number): void {
    const oldSize = this.outputList.length;

    if (size < oldSize) {
      // 缩小：将多余的元素设为未定义
      for (let i = size; i < oldSize; i++) {
        this.outputList[i].setUndefined();
      }
    } else if (size > oldSize) {
      // 扩大：创建新元素
      for (let i = oldSize; i < size; i++) {
        const newElement = this.factory.create();
        this.outputList.push(newElement);
        this.parentAlgo.setOutput(i, newElement);
      }
    }

    this.parentAlgo.setOutputLength(size);
  }

  /**
   * 获取输出元素
   * @param index 索引
   * @returns 输出元素
   */
  getOutput(index: number): T | undefined {
    return this.outputList[index];
  }

  /**
   * 获取所有输出元素
   * @returns 输出元素数组
   */
  getOutputs(): T[] {
    return [...this.outputList];
  }

  /**
   * 设置标签
   * @param labels 标签数组
   */
  setLabels(labels: string[]): void {
    this.labels = labels;
    this.adjustOutputSize(labels.length);

    // 为元素设置标签
    for (let i = 0; i < labels.length; i++) {
      if (this.outputList[i]) {
        this.outputList[i].setLabel(labels[i]);
      }
    }
  }

  /**
   * 获取标签
   * @returns 标签数组
   */
  getLabels(): string[] {
    return [...this.labels];
  }

  /**
   * 更新标签
   * @param start 起始索引
   */
  updateLabels(start: number = 0): void {
    for (let i = start; i < this.outputList.length; i++) {
      const element = this.outputList[i];
      if (element && this.labels[i]) {
        element.setLabel(this.labels[i]);
      }
    }
  }

  /**
   * 获取输出数量
   * @returns 输出数量
   */
  size(): number {
    return this.outputList.length;
  }

  /**
   * 清理所有输出
   */
  clear(): void {
    for (const element of this.outputList) {
      element.setUndefined();
    }
    this.outputList = [];
    this.labels = [];
  }
}

/**
 * 算法集合
 * 用于存储和管理一组算法
 */
export class AlgorithmSet {
  private algorithms: Set<AlgoElementInterface> = new Set();

  /**
   * 添加算法
   * @param algo 算法
   */
  add(algo: AlgoElementInterface): void {
    this.algorithms.add(algo);
  }

  /**
   * 移除算法
   * @param algo 算法
   */
  remove(algo: AlgoElementInterface): void {
    this.algorithms.delete(algo);
  }

  /**
   * 检查是否包含算法
   * @param algo 算法
   * @returns 是否包含
   */
  has(algo: AlgoElementInterface): boolean {
    return this.algorithms.has(algo);
  }

  /**
   * 获取所有算法
   * @returns 算法数组
   */
  toArray(): AlgoElementInterface[] {
    return Array.from(this.algorithms);
  }

  /**
   * 获取算法数量
   * @returns 数量
   */
  size(): number {
    return this.algorithms.size;
  }

  /**
   * 清空集合
   */
  clear(): void {
    this.algorithms.clear();
  }

  /**
   * 遍历算法
   * @param callback 回调函数
   */
  forEach(callback: (algo: AlgoElementInterface) => void): void {
    this.algorithms.forEach(callback);
  }
}

/**
 * 算法接口（用于循环引用）
 */
interface AlgoElementInterface {
  update(): void;
  compute(): void;
  getInput(): IGeoElement[];
  getOutput(): IGeoElement[];
}
