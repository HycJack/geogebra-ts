import { CoreGeoElement, AlgoElement as AlgoElementInterface } from '../../types';
import { Construction } from './Construction';

/**
 * 算法基类，所有具体算法的父类
 * 管理输入输出对象，实现更新逻辑
 */
export abstract class AlgoElement implements AlgoElementInterface {
  protected input: CoreGeoElement[] = [];
  protected output: CoreGeoElement[] = [];
  protected construction: Construction;
  private updateAfterAlgo: AlgoElement | null = null;
  private id: number;
  private constructionIndex: number;

  /**
   * 构造函数
   * @param construction 构造管理器
   * @param addToConstructionList 是否添加到构造列表
   */
  constructor(construction: Construction, addToConstructionList: boolean = true) {
    this.construction = construction;
    this.id = Math.floor(Math.random() * 1000000); // 简单的 ID 生成
    this.constructionIndex = this.calculateConstructionIndex();

    if (addToConstructionList) {
      construction.addToConstructionList(this, false);
    }
  }

  /**
   * 获取输入对象
   * @returns 输入对象数组
   */
  getInput(): CoreGeoElement[] {
    return this.input;
  }

  /**
   * 获取输出对象
   * @returns 输出对象数组
   */
  getOutput(): CoreGeoElement[] {
    return this.output;
  }

  /**
   * 设置输入对象
   * @param input 输入对象数组
   */
  protected setInput(input: CoreGeoElement[]): void {
    this.input = input;
    this.constructionIndex = this.calculateConstructionIndex();
  }

  /**
   * 设置输出对象
   * @param output 输出对象数组
   */
  protected setOutput(output: CoreGeoElement[]): void {
    this.output = output;
  }

  /**
   * 设置单个输出对象
   * @param output 输出对象
   */
  protected setOnlyOutput(output: CoreGeoElement): void {
    this.output = [output];
  }

  /**
   * 设置在此算法后更新的算法
   * @param algo 算法
   */
  protected setUpdateAfterAlgo(algo: AlgoElement): void {
    this.updateAfterAlgo = algo;
  }

  /**
   * 获取在此算法后更新的算法
   * @returns 算法或 null
   */
  getUpdateAfterAlgo(): AlgoElement | null {
    return this.updateAfterAlgo;
  }

  /**
   * 抽象方法：计算输出
   */
  abstract compute(): void;

  /**
   * 更新算法
   * 先更新输入，再计算输出，最后更新输出对象
   */
  update(): void {
    // 更新输入对象的父算法
    for (const inputElement of this.input) {
      const parentAlgo = inputElement.getParentAlgorithm();
      if (parentAlgo) {
        parentAlgo.compute();
      }
    }

    // 执行计算
    this.compute();

    // 更新输出对象
    for (const outputElement of this.output) {
      outputElement.update();
    }
  }

  /**
   * 设置依赖关系
   */
  setDependencies(): void {
    // 子类可以重写此方法来设置特定的依赖关系
  }

  /**
   * 获取构造索引，用于拓扑排序
   * @returns 构造索引
   */
  getConstructionIndex(): number {
    return this.constructionIndex;
  }

  /**
   * 获取算法 ID
   * @returns ID
   */
  getID(): number {
    return this.id;
  }

  /**
   * 计算构造索引
   * 基于输入对象的最大索引
   */
  private calculateConstructionIndex(): number {
    let maxIndex = 0;
    for (const inputElement of this.input) {
      maxIndex = Math.max(maxIndex, inputElement.getConstructionIndex());
    }
    return maxIndex + 1;
  }

  /**
   * 清理方法
   */
  dispose(): void {
    // 清理依赖关系
    for (const inputElement of this.input) {
      inputElement.removeDependent(this);
    }
    
    // 清理输出对象
    this.input = [];
    this.output = [];
    this.updateAfterAlgo = null;
  }
}

/**
 * 构造元素基类
 */
export class ConstructionElement {
  protected construction: Construction;
  private constructionIndex: number;

  constructor(construction: Construction) {
    this.construction = construction;
    this.constructionIndex = Math.floor(Math.random() * 1000000); // 简单的索引生成
  }

  /**
   * 获取构造索引
   * @returns 构造索引
   */
  getConstructionIndex(): number {
    return this.constructionIndex;
  }

  /**
   * 更新方法
   */
  update(): void {
    // 子类可以重写此方法
  }
}