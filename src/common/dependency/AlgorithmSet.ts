import { AlgoElement } from '../types';

/**
 * 算法集合，用于存储和管理需要更新的算法
 * 维护拓扑排序顺序，确保按正确的依赖顺序更新
 */
export class AlgorithmSetImpl implements Iterable<AlgoElement> {
  private set: Set<AlgoElement> = new Set();
  private head: Link | null = null;
  private tail: Link | null = null;
  private size: number = 0;

  /**
   * 添加算法到集合
   * @param algo 要添加的算法
   * @returns 是否成功添加（如果已存在则返回 false）
   */
  add(algo: AlgoElement): boolean {
    if (this.contains(algo)) {
      return false;
    }

    if (this.addToEmpty(algo)) {
      return true;
    }

    // 检查是否需要在特定父算法后插入
    const parentAlgo = algo.getUpdateAfterAlgo();

    // 标准情况：插入到链表末尾
    if (!parentAlgo || parentAlgo === this.tail?.algo || !this.contains(parentAlgo)) {
      this.addToEnd(algo);
    } else {
      // 特殊情况：在父算法后插入
      this.insertAfterParentAlgo(algo, parentAlgo);
    }

    this.set.add(algo);
    this.size++;

    return true;
  }

  /**
   * 从集合中移除算法
   * @param algo 要移除的算法
   * @returns 是否成功移除
   */
  remove(algo: AlgoElement): boolean {
    if (!this.set.has(algo)) {
      return false;
    }

    this.set.delete(algo);

    let prev: Link | null = null;
    let cur = this.head;
    while (cur) {
      if (cur.algo === algo) {
        if (!prev) {
          // 移除头节点
          this.head = cur.next;
          if (!this.head) {
            this.tail = null;
          }
        } else {
          // 标准情况
          prev.next = cur.next;
          if (!prev.next) {
            this.tail = prev;
          }
        }
        this.size--;
        return true;
      }
      prev = cur;
      cur = cur.next;
    }

    return false;
  }

  /**
   * 检查集合是否包含指定算法
   * @param algo 要检查的算法
   * @returns 是否包含
   */
  contains(algo: AlgoElement): boolean {
    return this.set.has(algo);
  }

  /**
   * 按拓扑顺序更新所有算法
   */
  updateAll(): void {
    let cur = this.head;
    while (cur) {
      cur.algo.update();
      cur = cur.next;
    }
  }

  /**
   * 检查集合是否为空
   * @returns 是否为空
   */
  isEmpty(): boolean {
    return this.size === 0;
  }

  /**
   * 获取集合大小
   * @returns 算法数量
   */
  getSize(): number {
    return this.size;
  }

  /**
   * 迭代器实现
   */
  [Symbol.iterator](): Iterator<AlgoElement> {
    let cur = this.head;
    return {
      next(): IteratorResult<AlgoElement> {
        if (!cur) {
          return { done: true, value: undefined };
        }
        const value = cur.algo;
        cur = cur.next;
        return { done: false, value };
      }
    };
  }

  /**
   * 向空集合添加算法
   */
  private addToEmpty(algo: AlgoElement): boolean {
    if (!this.head) {
      this.head = new Link(algo, null);
      this.tail = this.head;
      this.set.add(algo);
      this.size++;
      return true;
    }
    return false;
  }

  /**
   * 添加到链表末尾
   */
  private addToEnd(algo: AlgoElement): void {
    if (this.tail) {
      this.tail.next = new Link(algo, null);
      this.tail = this.tail.next;
    }
  }

  /**
   * 在父算法后插入
   */
  private insertAfterParentAlgo(algo: AlgoElement, parentAlgo: AlgoElement): void {
    let cur = this.head;
    while (cur && cur.algo !== parentAlgo) {
      cur = cur.next;
    }

    if (cur) {
      cur.next = new Link(algo, cur.next);
    }
  }
}

/**
 * 链表节点
 */
class Link {
  constructor(public algo: AlgoElement, public next: Link | null) {}
}