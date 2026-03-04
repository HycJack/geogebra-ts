/**
 * 依赖管理器
 * 管理几何元素之间的依赖关系，实现拓扑排序
 * 参考 Java 版本的依赖更新机制
 */
export class DependencyManager {
  private elementDependencies: Map<string, Set<string>> = new Map();
  private algorithmDependencies: Map<string, Set<string>> = new Map();

  /**
   * 添加元素依赖关系
   * @param elementId 元素ID
   * @param dependsOnId 依赖的元素ID
   */
  addElementDependency(elementId: string, dependsOnId: string): void {
    if (!this.elementDependencies.has(elementId)) {
      this.elementDependencies.set(elementId, new Set());
    }
    this.elementDependencies.get(elementId)!.add(dependsOnId);
  }

  /**
   * 移除元素依赖关系
   * @param elementId 元素ID
   * @param dependsOnId 依赖的元素ID
   */
  removeElementDependency(elementId: string, dependsOnId: string): void {
    const deps = this.elementDependencies.get(elementId);
    if (deps) {
      deps.delete(dependsOnId);
      if (deps.size === 0) {
        this.elementDependencies.delete(elementId);
      }
    }
  }

  /**
   * 获取元素的所有依赖
   * @param elementId 元素ID
   * @returns 依赖ID集合
   */
  getElementDependencies(elementId: string): Set<string> {
    return this.elementDependencies.get(elementId) || new Set();
  }

  /**
   * 获取依赖某元素的所有元素（反向依赖）
   * @param elementId 元素ID
   * @returns 反向依赖ID集合
   */
  getReverseDependencies(elementId: string): Set<string> {
    const reverseDeps = new Set<string>();
    for (const [id, deps] of this.elementDependencies) {
      if (deps.has(elementId)) {
        reverseDeps.add(id);
      }
    }
    return reverseDeps;
  }

  /**
   * 拓扑排序
   * 返回按依赖顺序排列的元素ID数组
   * @param elementIds 要排序的元素ID数组
   * @returns 排序后的元素ID数组
   */
  topologicalSort(elementIds: string[]): string[] {
    const visited = new Set<string>();
    const result: string[] = [];
    const visiting = new Set<string>();

    const visit = (id: string): boolean => {
      if (visited.has(id)) return true;
      if (visiting.has(id)) return false; // 检测到循环依赖

      visiting.add(id);
      const deps = this.getElementDependencies(id);
      for (const dep of deps) {
        if (elementIds.includes(dep) && !visit(dep)) {
          return false;
        }
      }
      visiting.delete(id);
      visited.add(id);
      result.push(id);
      return true;
    };

    for (const id of elementIds) {
      if (!visit(id)) {
        throw new Error(`检测到循环依赖: ${id}`);
      }
    }

    return result;
  }

  /**
   * 检测循环依赖
   * @param elementIds 要检测的元素ID数组
   * @returns 是否存在循环依赖
   */
  hasCircularDependency(elementIds: string[]): boolean {
    try {
      this.topologicalSort(elementIds);
      return false;
    } catch {
      return true;
    }
  }

  /**
   * 获取更新顺序
   * 当某个元素改变时，返回需要更新的元素顺序
   * @param changedElementId 改变的元素ID
   * @param allElements 所有元素ID
   * @returns 更新顺序
   */
  getUpdateOrder(changedElementId: string, allElements: string[]): string[] {
    const affected = this.getAllAffectedElements(changedElementId);
    const affectedInScope = affected.filter(id => allElements.includes(id));
    return this.topologicalSort(affectedInScope);
  }

  /**
   * 获取所有受影响的元素
   * @param elementId 起始元素ID
   * @returns 受影响的元素ID集合
   */
  private getAllAffectedElements(elementId: string): string[] {
    const affected = new Set<string>();
    const queue: string[] = [elementId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const reverseDeps = this.getReverseDependencies(current);
      for (const dep of reverseDeps) {
        if (!affected.has(dep)) {
          affected.add(dep);
          queue.push(dep);
        }
      }
    }

    return Array.from(affected);
  }

  /**
   * 清空所有依赖关系
   */
  clear(): void {
    this.elementDependencies.clear();
    this.algorithmDependencies.clear();
  }
}

/**
 * 更新级联管理器
 * 管理元素更新时的级联更新
 */
export class UpdateCascadeManager {
  private updatingElements: Set<string> = new Set();
  private pendingUpdates: Set<string> = new Set();
  private isUpdating: boolean = false;

  constructor(_dependencyManager: DependencyManager) {
    // dependencyManager 预留给未来的依赖更新功能
  }

  /**
   * 开始更新
   * @param elementId 要更新的元素ID
   */
  beginUpdate(elementId: string): void {
    if (this.isUpdating) {
      this.pendingUpdates.add(elementId);
      return;
    }

    this.isUpdating = true;
    this.updatingElements.add(elementId);
  }

  /**
   * 结束更新
   * @param elementId 更新完成的元素ID
   */
  endUpdate(elementId: string): void {
    this.updatingElements.delete(elementId);

    if (this.updatingElements.size === 0) {
      this.isUpdating = false;
      this.processPendingUpdates();
    }
  }

  /**
   * 处理待处理的更新
   */
  private processPendingUpdates(): void {
    if (this.pendingUpdates.size === 0) return;

    const updates = Array.from(this.pendingUpdates);
    this.pendingUpdates.clear();

    for (const id of updates) {
      this.beginUpdate(id);
      // 这里会触发实际的更新
      this.endUpdate(id);
    }
  }

  /**
   * 检查元素是否正在更新
   * @param elementId 元素ID
   * @returns 是否正在更新
   */
  isElementUpdating(elementId: string): boolean {
    return this.updatingElements.has(elementId);
  }

  /**
   * 检查是否有更新正在进行
   * @returns 是否正在更新
   */
  hasActiveUpdates(): boolean {
    return this.isUpdating;
  }

  /**
   * 重置状态
   */
  reset(): void {
    this.updatingElements.clear();
    this.pendingUpdates.clear();
    this.isUpdating = false;
  }
}

/**
 * 构造步骤
 * 记录一个构造操作
 */
export interface ConstructionStep {
  id: string;
  type: 'create' | 'update' | 'delete';
  elementId: string;
  algorithmId?: string;
  timestamp: number;
  data?: any;
}

/**
 * 构造协议
 * 记录所有构造步骤，支持撤销/重做
 */
export class ConstructionProtocol {
  private steps: ConstructionStep[] = [];
  private currentIndex: number = -1;
  private maxSteps: number = 100;

  /**
   * 添加构造步骤
   * @param step 构造步骤
   */
  addStep(step: ConstructionStep): void {
    // 如果当前不在最后，删除后面的步骤
    if (this.currentIndex < this.steps.length - 1) {
      this.steps = this.steps.slice(0, this.currentIndex + 1);
    }

    this.steps.push(step);
    this.currentIndex++;

    // 限制最大步骤数
    if (this.steps.length > this.maxSteps) {
      this.steps.shift();
      this.currentIndex--;
    }
  }

  /**
   * 获取当前步骤
   * @returns 当前步骤或 undefined
   */
  getCurrentStep(): ConstructionStep | undefined {
    if (this.currentIndex >= 0 && this.currentIndex < this.steps.length) {
      return this.steps[this.currentIndex];
    }
    return undefined;
  }

  /**
   * 撤销
   * @returns 被撤销的步骤或 undefined
   */
  undo(): ConstructionStep | undefined {
    if (this.currentIndex >= 0) {
      const step = this.steps[this.currentIndex];
      this.currentIndex--;
      return step;
    }
    return undefined;
  }

  /**
   * 重做
   * @returns 重做的步骤或 undefined
   */
  redo(): ConstructionStep | undefined {
    if (this.currentIndex < this.steps.length - 1) {
      this.currentIndex++;
      return this.steps[this.currentIndex];
    }
    return undefined;
  }

  /**
   * 检查是否可以撤销
   * @returns 是否可以撤销
   */
  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  /**
   * 检查是否可以重做
   * @returns 是否可以重做
   */
  canRedo(): boolean {
    return this.currentIndex < this.steps.length - 1;
  }

  /**
   * 获取所有步骤
   * @returns 步骤数组
   */
  getSteps(): ConstructionStep[] {
    return [...this.steps];
  }

  /**
   * 获取当前索引
   * @returns 当前索引
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * 清空所有步骤
   */
  clear(): void {
    this.steps = [];
    this.currentIndex = -1;
  }

  /**
   * 设置断点
   * @param stepIndex 步骤索引
   */
  setBreakpoint(stepIndex: number): void {
    if (stepIndex >= 0 && stepIndex < this.steps.length) {
      this.steps[stepIndex].data = {
        ...this.steps[stepIndex].data,
        isBreakpoint: true,
      };
    }
  }

  /**
   * 移除断点
   * @param stepIndex 步骤索引
   */
  removeBreakpoint(stepIndex: number): void {
    if (stepIndex >= 0 && stepIndex < this.steps.length) {
      this.steps[stepIndex].data = {
        ...this.steps[stepIndex].data,
        isBreakpoint: false,
      };
    }
  }

  /**
   * 获取所有断点
   * @returns 断点索引数组
   */
  getBreakpoints(): number[] {
    return this.steps
      .map((step, index) => (step.data?.isBreakpoint ? index : -1))
      .filter(index => index >= 0);
  }
}
