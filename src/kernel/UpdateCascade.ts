/**
 * 级联更新机制
 * 参考 Java 版本的 Kernel.updateCascade()
 * 当几何元素改变时，自动更新所有依赖的元素
 */

import { AlgoElement } from './algos/AlgoElement';
import type { IGeoElement } from './geos/GeoElement';

/**
 * 依赖图节点
 */
interface DependencyNode {
  id: string;
  element: IGeoElement;
  algorithm: AlgoElement | null;
  dependencies: Set<string>;
  dependents: Set<string>;
  visited: boolean;
  inStack: boolean;
}

/**
 * 更新优先级
 */
enum UpdatePriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  IMMEDIATE = 3,
}

/**
 * 更新请求
 */
interface UpdateRequest {
  elementId: string;
  priority: UpdatePriority;
  timestamp: number;
}

/**
 * 级联更新管理器
 * 管理几何元素之间的依赖关系，实现拓扑排序更新
 */
export class UpdateCascadeManager {
  private nodes: Map<string, DependencyNode> = new Map();
  private updateQueue: UpdateRequest[] = [];
  private isUpdating: boolean = false;
  private updateCount: number = 0;
  private maxUpdates: number = 1000;

  /**
   * 注册元素
   */
  registerElement(element: IGeoElement, algorithm?: AlgoElement): void {
    const id = (element as any).id || element.getLabel() || `elem_${Date.now()}`;
    
    if (!this.nodes.has(id)) {
      this.nodes.set(id, {
        id,
        element,
        algorithm: algorithm || null,
        dependencies: new Set(),
        dependents: new Set(),
        visited: false,
        inStack: false,
      });
    } else {
      const node = this.nodes.get(id)!;
      node.element = element;
      if (algorithm) {
        node.algorithm = algorithm;
      }
    }
  }

  /**
   * 注销元素
   */
  unregisterElement(elementId: string): void {
    const node = this.nodes.get(elementId);
    if (!node) return;

    for (const depId of node.dependencies) {
      const depNode = this.nodes.get(depId);
      if (depNode) {
        depNode.dependents.delete(elementId);
      }
    }

    for (const dependentId of node.dependents) {
      const dependentNode = this.nodes.get(dependentId);
      if (dependentNode) {
        dependentNode.dependencies.delete(elementId);
      }
    }

    this.nodes.delete(elementId);
  }

  /**
   * 添加依赖关系
   * @param elementId 元素ID
   * @param dependsOnId 依赖的元素ID
   */
  addDependency(elementId: string, dependsOnId: string): void {
    const elementNode = this.nodes.get(elementId);
    const dependsOnNode = this.nodes.get(dependsOnId);

    if (!elementNode || !dependsOnNode) return;

    elementNode.dependencies.add(dependsOnId);
    dependsOnNode.dependents.add(elementId);
  }

  /**
   * 移除依赖关系
   */
  removeDependency(elementId: string, dependsOnId: string): void {
    const elementNode = this.nodes.get(elementId);
    const dependsOnNode = this.nodes.get(dependsOnId);

    if (!elementNode || !dependsOnNode) return;

    elementNode.dependencies.delete(dependsOnId);
    dependsOnNode.dependents.delete(elementId);
  }

  /**
   * 获取元素的直接依赖
   */
  getDependencies(elementId: string): string[] {
    const node = this.nodes.get(elementId);
    return node ? Array.from(node.dependencies) : [];
  }

  /**
   * 获取依赖该元素的元素
   */
  getDependents(elementId: string): string[] {
    const node = this.nodes.get(elementId);
    return node ? Array.from(node.dependents) : [];
  }

  /**
   * 拓扑排序
   * 返回按依赖顺序排列的元素ID列表
   */
  topologicalSort(startId: string): string[] {
    this.resetVisitedFlags();
    
    const result: string[] = [];
    const stack: string[] = [startId];
    
    while (stack.length > 0) {
      const currentId = stack[stack.length - 1];
      const node = this.nodes.get(currentId);
      
      if (!node) {
        stack.pop();
        continue;
      }

      if (node.visited) {
        stack.pop();
        if (!node.inStack) {
          result.push(currentId);
        }
        continue;
      }

      node.visited = true;
      node.inStack = true;

      for (const depId of node.dependents) {
        const depNode = this.nodes.get(depId);
        if (depNode && !depNode.visited) {
          stack.push(depId);
        }
      }
    }

    return result.reverse();
  }

  /**
   * 检测循环依赖
   */
  hasCircularDependency(startId: string): boolean {
    this.resetVisitedFlags();
    return this.detectCycle(startId);
  }

  private detectCycle(nodeId: string, path: Set<string> = new Set()): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    if (path.has(nodeId)) return true;
    if (node.visited) return false;

    node.visited = true;
    path.add(nodeId);

    for (const depId of node.dependents) {
      if (this.detectCycle(depId, path)) {
        return true;
      }
    }

    path.delete(nodeId);
    return false;
  }

  /**
   * 级联更新
   * 当元素改变时，更新所有依赖的元素
   */
  updateCascade(elementId: string): void {
    if (this.isUpdating) {
      this.updateQueue.push({
        elementId,
        priority: UpdatePriority.NORMAL,
        timestamp: Date.now(),
      });
      return;
    }

    this.isUpdating = true;
    this.updateCount = 0;

    try {
      this.performUpdate(elementId);
      
      while (this.updateQueue.length > 0 && this.updateCount < this.maxUpdates) {
        const request = this.updateQueue.shift()!;
        this.performUpdate(request.elementId);
      }
    } finally {
      this.isUpdating = false;
      this.updateQueue = [];
    }
  }

  private performUpdate(elementId: string): void {
    this.updateCount++;
    
    if (this.updateCount > this.maxUpdates) {
      console.warn('Update cascade exceeded maximum iterations');
      return;
    }

    const sortedIds = this.topologicalSort(elementId);

    for (const id of sortedIds) {
      const node = this.nodes.get(id);
      if (node && node.algorithm) {
        try {
          node.algorithm.update();
        } catch (error) {
          console.error(`Error updating element ${id}:`, error);
        }
      }
    }
  }

  /**
   * 请求更新
   */
  requestUpdate(elementId: string, priority: UpdatePriority = UpdatePriority.NORMAL): void {
    if (this.isUpdating) {
      this.updateQueue.push({
        elementId,
        priority,
        timestamp: Date.now(),
      });
      
      this.updateQueue.sort((a, b) => b.priority - a.priority);
    } else {
      this.updateCascade(elementId);
    }
  }

  /**
   * 批量更新
   */
  batchUpdate(elementIds: string[]): void {
    const allDependents = new Set<string>();
    
    for (const id of elementIds) {
      const sorted = this.topologicalSort(id);
      sorted.forEach(depId => allDependents.add(depId));
    }

    const sortedAll = this.sortByDependencies(Array.from(allDependents));
    
    for (const id of sortedAll) {
      const node = this.nodes.get(id);
      if (node && node.algorithm) {
        node.algorithm.update();
      }
    }
  }

  /**
   * 按依赖关系排序
   */
  private sortByDependencies(ids: string[]): string[] {
    const inDegree: Map<string, number> = new Map();
    const graph: Map<string, string[]> = new Map();

    for (const id of ids) {
      inDegree.set(id, 0);
      graph.set(id, []);
    }

    for (const id of ids) {
      const node = this.nodes.get(id);
      if (node) {
        for (const depId of node.dependencies) {
          if (ids.includes(depId)) {
            graph.get(depId)?.push(id);
            inDegree.set(id, (inDegree.get(id) || 0) + 1);
          }
        }
      }
    }

    const queue: string[] = [];
    const result: string[] = [];

    for (const [id, degree] of inDegree) {
      if (degree === 0) {
        queue.push(id);
      }
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      for (const next of graph.get(current) || []) {
        const newDegree = (inDegree.get(next) || 0) - 1;
        inDegree.set(next, newDegree);
        if (newDegree === 0) {
          queue.push(next);
        }
      }
    }

    return result;
  }

  /**
   * 重置访问标志
   */
  private resetVisitedFlags(): void {
    for (const node of this.nodes.values()) {
      node.visited = false;
      node.inStack = false;
    }
  }

  /**
   * 清除所有数据
   */
  clear(): void {
    this.nodes.clear();
    this.updateQueue = [];
    this.isUpdating = false;
    this.updateCount = 0;
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalElements: number;
    totalDependencies: number;
    queueLength: number;
    isUpdating: boolean;
  } {
    let totalDeps = 0;
    for (const node of this.nodes.values()) {
      totalDeps += node.dependencies.size;
    }

    return {
      totalElements: this.nodes.size,
      totalDependencies: totalDeps,
      queueLength: this.updateQueue.length,
      isUpdating: this.isUpdating,
    };
  }

  /**
   * 导出依赖图
   */
  exportDependencyGraph(): { nodes: string[]; edges: [string, string][] } {
    const nodes: string[] = [];
    const edges: [string, string][] = [];

    for (const [id, node] of this.nodes) {
      nodes.push(id);
      for (const depId of node.dependencies) {
        edges.push([id, depId]);
      }
    }

    return { nodes, edges };
  }
}

export const updateCascadeManager = new UpdateCascadeManager();
export { UpdatePriority };
