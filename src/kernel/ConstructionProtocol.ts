/**
 * 构造协议
 * 管理构造步骤的历史记录，支持撤销/重做
 * 参考 Java 版本的 ConstructionProtocol
 */

import type { AlgoElement } from './algos/AlgoElement';
import type { IGeoElement } from './geos/GeoElement';

/**
 * 构造步骤类型
 */
export type ConstructionStepType =
  | 'point'
  | 'line'
  | 'segment'
  | 'ray'
  | 'circle'
  | 'polygon'
  | 'vector'
  | 'text'
  | 'intersection'
  | 'midpoint'
  | 'perpendicular'
  | 'parallel'
  | 'other';

/**
 * 构造步骤
 */
export interface ConstructionStep {
  /** 步骤唯一标识 */
  id: number;
  /** 步骤索引 */
  index: number;
  /** 步骤类型 */
  type: ConstructionStepType;
  /** 关联的算法 */
  algorithm: AlgoElement;
  /** 输入元素ID列表 */
  inputIds: string[];
  /** 输出元素ID列表 */
  outputIds: string[];
  /** 步骤描述 */
  description: string;
  /** 时间戳 */
  timestamp: number;
  /** 是否已执行 */
  executed: boolean;
}

/**
 * 构造步骤监听器
 */
export type ConstructionStepListener = (step: ConstructionStep, action: 'add' | 'remove' | 'update') => void;

/**
 * 构造协议管理器
 * 管理构造步骤的历史记录
 */
export class ConstructionProtocol {
  private steps: ConstructionStep[] = [];
  private currentStepIndex: number = -1;
  private nextStepId: number = 1;
  private listeners: ConstructionStepListener[] = [];

  /**
   * 构造函数
   * @param _construction 构造管理器（预留给未来扩展）
   */
  constructor(_construction: {
    getAllAlgorithms: () => AlgoElement[];
    getAllGeoElements: () => IGeoElement[];
  }) {
    // construction 预留给未来的扩展功能
  }

  /**
   * 添加构造步骤
   * @param algorithm 算法
   * @param type 步骤类型
   * @param description 描述
   * @returns 构造步骤
   */
  addStep(algorithm: AlgoElement, type: ConstructionStepType, description: string): ConstructionStep {
    // 如果当前不在最后一步，删除后面的步骤
    if (this.currentStepIndex < this.steps.length - 1) {
      this.steps.splice(this.currentStepIndex + 1);
    }

    const step: ConstructionStep = {
      id: this.nextStepId++,
      index: this.steps.length,
      type,
      algorithm,
      inputIds: algorithm.getInput().map((el: IGeoElement) => el.getLabel()),
      outputIds: algorithm.getOutput().map((el: IGeoElement) => el.getLabel()),
      description,
      timestamp: Date.now(),
      executed: true,
    };

    this.steps.push(step);
    this.currentStepIndex = this.steps.length - 1;

    this.notifyListeners(step, 'add');
    return step;
  }

  /**
   * 移除最后一个构造步骤
   * @returns 被移除的步骤
   */
  removeLastStep(): ConstructionStep | null {
    if (this.steps.length === 0) return null;

    const step = this.steps.pop()!;
    this.currentStepIndex = this.steps.length - 1;

    this.notifyListeners(step, 'remove');
    return step;
  }

  /**
   * 获取当前步骤
   * @returns 当前步骤
   */
  getCurrentStep(): ConstructionStep | null {
    if (this.currentStepIndex < 0 || this.currentStepIndex >= this.steps.length) {
      return null;
    }
    return this.steps[this.currentStepIndex];
  }

  /**
   * 获取步骤数量
   * @returns 步骤数量
   */
  getStepCount(): number {
    return this.steps.length;
  }

  /**
   * 获取所有步骤
   * @returns 步骤数组
   */
  getAllSteps(): ConstructionStep[] {
    return [...this.steps];
  }

  /**
   * 根据索引获取步骤
   * @param index 索引
   * @returns 步骤
   */
  getStep(index: number): ConstructionStep | null {
    if (index < 0 || index >= this.steps.length) {
      return null;
    }
    return this.steps[index];
  }

  /**
   * 根据ID获取步骤
   * @param id 步骤ID
   * @returns 步骤
   */
  getStepById(id: number): ConstructionStep | null {
    return this.steps.find(step => step.id === id) || null;
  }

  /**
   * 撤销到指定步骤
   * @param stepIndex 目标步骤索引
   */
  undoToStep(stepIndex: number): void {
    if (stepIndex < 0 || stepIndex >= this.steps.length) {
      return;
    }

    // 从后向前撤销步骤
    for (let i = this.steps.length - 1; i > stepIndex; i--) {
      const step = this.steps[i];
      step.executed = false;
      // 撤销算法
      const outputs = step.algorithm.getOutput();
      for (const output of outputs) {
        output.setUndefined();
      }
    }

    this.currentStepIndex = stepIndex;
  }

  /**
   * 重做到指定步骤
   * @param stepIndex 目标步骤索引
   */
  redoToStep(stepIndex: number): void {
    if (stepIndex < 0 || stepIndex >= this.steps.length) {
      return;
    }

    // 从前向后重做步骤
    for (let i = this.currentStepIndex + 1; i <= stepIndex; i++) {
      const step = this.steps[i];
      step.executed = true;
      // 重新执行算法
      step.algorithm.update();
    }

    this.currentStepIndex = stepIndex;
  }

  /**
   * 撤销一步
   * @returns 是否成功
   */
  undo(): boolean {
    if (this.currentStepIndex < 0) {
      return false;
    }

    this.undoToStep(this.currentStepIndex - 1);
    return true;
  }

  /**
   * 重做一步
   * @returns 是否成功
   */
  redo(): boolean {
    if (this.currentStepIndex >= this.steps.length - 1) {
      return false;
    }

    this.redoToStep(this.currentStepIndex + 1);
    return true;
  }

  /**
   * 是否可以撤销
   * @returns 是否可以撤销
   */
  canUndo(): boolean {
    return this.currentStepIndex >= 0;
  }

  /**
   * 是否可以重做
   * @returns 是否可以重做
   */
  canRedo(): boolean {
    return this.currentStepIndex < this.steps.length - 1;
  }

  /**
   * 清空所有步骤
   */
  clear(): void {
    this.steps = [];
    this.currentStepIndex = -1;
    this.nextStepId = 1;
  }

  /**
   * 添加监听器
   * @param listener 监听器
   */
  addListener(listener: ConstructionStepListener): void {
    this.listeners.push(listener);
  }

  /**
   * 移除监听器
   * @param listener 监听器
   */
  removeListener(listener: ConstructionStepListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 通知监听器
   * @param step 步骤
   * @param action 动作
   */
  private notifyListeners(step: ConstructionStep, action: 'add' | 'remove' | 'update'): void {
    for (const listener of this.listeners) {
      listener(step, action);
    }
  }

  /**
   * 导出为JSON
   * @returns JSON字符串
   */
  toJSON(): string {
    return JSON.stringify({
      steps: this.steps.map(step => ({
        id: step.id,
        index: step.index,
        type: step.type,
        inputIds: step.inputIds,
        outputIds: step.outputIds,
        description: step.description,
        timestamp: step.timestamp,
        executed: step.executed,
      })),
      currentStepIndex: this.currentStepIndex,
    });
  }

  /**
   * 从JSON导入
   * @param json JSON字符串
   */
  fromJSON(json: string): void {
    const data = JSON.parse(json);
    this.steps = data.steps.map((stepData: any) => ({
      ...stepData,
      algorithm: null as any, // 算法需要重新关联
    }));
    this.currentStepIndex = data.currentStepIndex;
    this.nextStepId = Math.max(...this.steps.map(s => s.id)) + 1;
  }

  /**
   * 获取步骤描述
   * @param step 步骤
   * @returns 描述字符串
   */
  getStepDescription(step: ConstructionStep): string {
    const typeNames: Record<ConstructionStepType, string> = {
      point: '点',
      line: '直线',
      segment: '线段',
      ray: '射线',
      circle: '圆',
      polygon: '多边形',
      vector: '向量',
      text: '文本',
      intersection: '交点',
      midpoint: '中点',
      perpendicular: '垂线',
      parallel: '平行线',
      other: '其他',
    };

    const typeName = typeNames[step.type] || step.type;
    return `${step.index + 1}. ${typeName}: ${step.description}`;
  }

  /**
   * 获取构造历史摘要
   * @returns 摘要字符串数组
   */
  getSummary(): string[] {
    return this.steps.map(step => this.getStepDescription(step));
  }
}

/**
 * 构造协议步骤构建器
 * 用于创建构造步骤
 */
export class ConstructionStepBuilder {
  private type: ConstructionStepType = 'other';
  private description: string = '';
  private algorithm: AlgoElement | null = null;

  /**
   * 设置步骤类型
   * @param type 类型
   * @returns 构建器
   */
  setType(type: ConstructionStepType): this {
    this.type = type;
    return this;
  }

  /**
   * 设置描述
   * @param description 描述
   * @returns 构建器
   */
  setDescription(description: string): this {
    this.description = description;
    return this;
  }

  /**
   * 设置算法
   * @param algorithm 算法
   * @returns 构建器
   */
  setAlgorithm(algorithm: AlgoElement): this {
    this.algorithm = algorithm;
    return this;
  }

  /**
   * 构建步骤
   * @param protocol 构造协议
   * @returns 构造步骤
   */
  build(protocol: ConstructionProtocol): ConstructionStep | null {
    if (!this.algorithm) {
      return null;
    }
    return protocol.addStep(this.algorithm, this.type, this.description);
  }
}
