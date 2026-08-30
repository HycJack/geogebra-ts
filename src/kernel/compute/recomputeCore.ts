/**
 * JSXGraph 式依赖重算闭环
 *
 * 对应优化指南 §3.1「依赖更新冻结」问题。
 *
 * 现状：line.a/b/c、由边缘点定义半径的圆、动态交点等派生几何属性在创建时被算死，
 * 拖动父点后 element 上的值不再更新（视觉上"跟着动"只是视图重新读取父点坐标的伪联动），
 * 导致：
 *   1. element.a/b/c 语义错误（陈旧值）
 *   2. 动态交点这种必须"重新解方程才有意义"的对象不可靠
 *   3. 未来的测量工具（倾角/距离/面积）会读到错值
 *
 * 方案：为每种派生元素登记 parents（依赖的元素 id 字段）与 compute（从父母重算自身的纯函数）。
 * 拖动 updatePointPosition 末尾沿反向依赖图重算整个影响子树 + 脏标记批处理，
 * 一帧内每个元素只计算一次，且父元素先于子元素被重算。
 *
 * 对标：
 *   - GeoGebra: AlgoElement.compute() + constructionIndex 拓扑调度 -> 简化为 registry.compute + 防环 DFS
 *   - JSXGraph: GeometryElement.parents / children + update()
 * 收益：GeoGebra 语义（派生属性永远等于当前几何关系的真解），JSXGraph 成本（无重型调度器）。
 */

import type { GeoElement, GeoPointElement, GeoLineElement, GeoSegmentElement, GeoRayElement, GeoCircleElement } from '../../types';

export interface Point2 {
  x: number;
  y: number;
}

/** 计算上下文：compute 只能读元素，禁止 dispatch 或直接修改状态 */
export type ComputeCtx = {
  get(id: string): GeoElement | undefined;
};

/** 特殊返回值：标记该元素应当被移除（例如交点从 2 解变为 0 解）*/
export const RECOMPUTE_DELETE = Symbol('recompute.delete');

export interface Computed<T extends GeoElement> {
  /** 依赖的父元素字段名；字段值为 string（单个 id）或 string[]（id 数组）*/
  parents: (keyof T & string)[];
  /**
   * 从父元素重算自身的几何属性。
   * 幂等、纯函数；返回要合并到元素上的更新（新对象），不就地修改 el；
   * 返回 RECOMPUTE_DELETE 表示该元素应被删除。
   */
  compute(el: T, ctx: ComputeCtx): Partial<T> | typeof RECOMPUTE_DELETE | undefined;
}

function dist2(a: Point2, b: Point2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

// ============================================================================
// 1. 求交器（纯函数，不依赖 UI 层 —— 避免 kernel -> euclidian 的反向依赖）
// 退化情形单独处理，这是动态交点正确性的关键。
// ============================================================================

type IntersectionKind = 'line-line' | 'line-circle' | 'circle-circle';

function isLineLike(type: string): boolean {
  return type === 'line' || type === 'segment' || type === 'ray';
}

function inferIntersectionType(g1: GeoElement, g2: GeoElement): IntersectionKind {
  const l1 = isLineLike(g1.type);
  const l2 = isLineLike(g2.type);
  const c1 = g1.type === 'circle';
  const c2 = g2.type === 'circle';

  if (l1 && l2) return 'line-line';
  if ((l1 && c2) || (l2 && c1)) return 'line-circle';
  return 'circle-circle';
}

export function solveIntersection(
  g1: GeoElement,
  g2: GeoElement,
  getElement: (id: string) => GeoElement | undefined
): Point2[] {
  const kind = inferIntersectionType(g1, g2);

  if (kind === 'line-line') {
    return intersectLineLine(g1, g2);
  }

  if (kind === 'line-circle') {
    const line = isLineLike(g1.type) ? g1 : g2;
    const circle = g1.type === 'circle' ? g1 : g2;
    return intersectLineCircle(line, circle as GeoCircleElement, getElement);
  }

  return intersectCircles(g1 as GeoCircleElement, g2 as GeoCircleElement, getElement);
}

function intersectLineLine(l1: { a: number; b: number; c: number }, l2: { a: number; b: number; c: number }): Point2[] {
  const det = l1.a * l2.b - l2.a * l1.b;
  if (Math.abs(det) < 1e-12) return []; // 平行/重合：约定返回空（无唯一交点）
  return [{
    x: (l1.b * l2.c - l2.b * l1.c) / det,
    y: (l2.a * l1.c - l1.a * l2.c) / det,
  }];
}

function intersectLineCircle(
  line: { a: number; b: number; c: number },
  circle: GeoCircleElement,
  getElement: (id: string) => GeoElement | undefined
): Point2[] {
  const center = getElement(circle.centerId);
  if (!center || center.type !== 'point') return [];
  const cx = center.x;
  const cy = center.y;
  const r = circle.radius;

  // 归一化直线法向量 (a,b)，投影圆心到直线求垂足
  const denom = line.a * line.a + line.b * line.b;
  if (denom < 1e-14) return [];
  const d = (line.a * cx + line.b * cy + line.c) / denom;
  const px = cx - line.a * d;
  const py = cy - line.b * d;
  const dist2ToLine = d * d * denom;          // 圆心到直线距离的平方
  const gap2 = r * r - dist2ToLine;

  if (gap2 < -1e-12) return [];               // 相离
  if (gap2 < 0) return [{ x: px, y: py }];    // 相切（数值容差内）

  const offset = Math.sqrt(gap2) / Math.sqrt(denom);
  // 直线方向向量 (-b, a)，单位化后乘以 offset
  const hx = -line.b * offset;
  const hy = line.a * offset;
  return [
    { x: px + hx, y: py + hy },
    { x: px - hx, y: py - hy },
  ];
}

function intersectCircles(
  c1: GeoCircleElement,
  c2: GeoCircleElement,
  getElement: (id: string) => GeoElement | undefined
): Point2[] {
  const o1 = getElement(c1.centerId);
  const o2 = getElement(c2.centerId);
  if (!o1 || o1.type !== 'point' || !o2 || o2.type !== 'point') return [];

  const dx = o2.x - o1.x;
  const dy = o2.y - o1.y;
  const d2 = dx * dx + dy * dy;
  const d = Math.sqrt(d2);
  const r1 = c1.radius;
  const r2 = c2.radius;

  if (d > r1 + r2 + 1e-12) return [];              // 外离
  if (d < Math.abs(r1 - r2) - 1e-12) return [];    // 内含
  if (d < 1e-12) return [];                        // 同心

  const a = (r1 * r1 - r2 * r2 + d2) / (2 * d);
  const hRaw = r1 * r1 - a * a;
  const h = hRaw <= 0 ? 0 : Math.sqrt(hRaw);
  const mx = o1.x + (a * dx) / d;
  const my = o1.y + (a * dy) / d;

  if (h < 1e-12) return [{ x: mx, y: my }];        // 内切/外切

  const rx = (-dy * h) / d;
  const ry = (dx * h) / d;
  return [
    { x: mx + rx, y: my + ry },
    { x: mx - rx, y: my - ry },
  ];
}

// ============================================================================
// 2. 计算注册表 —— 新增一种派生类型只需在此登记，Context 自动获得重算能力
// ============================================================================

export const COMPUTE_REGISTRY: Record<string, Computed<any>> = {
  point: {
    parents: ['parentIds'],
    compute(el, ctx) {
      const p = el as GeoPointElement;
      // 只处理由两个几何父元素定义的动态交点（约定：标签以 I 开头）
      if (!(p.label.startsWith('I') && Array.isArray(p.parentIds) && p.parentIds.length === 2)) {
        return;
      }
      const g1 = ctx.get(p.parentIds[0]);
      const g2 = ctx.get(p.parentIds[1]);
      if (!g1 || !g2) return RECOMPUTE_DELETE;

      const sols = solveIntersection(g1, g2, ctx.get);
      if (sols.length === 0) return RECOMPUTE_DELETE;

      // 选最接近原位置的解，避免在两解之间跳变
      let best = sols[0];
      let bestD2 = dist2(best, { x: p.x, y: p.y });
      for (let i = 1; i < sols.length; i++) {
        const dd = dist2(sols[i], { x: p.x, y: p.y });
        if (dd < bestD2) {
          best = sols[i];
          bestD2 = dd;
        }
      }
      return { x: best.x, y: best.y };
    },
  },

  line: {
    parents: ['startPointId', 'endPointId'],
    compute(el, ctx) {
      const line = el as GeoLineElement;
      const p1 = ctx.get(line.startPointId) as GeoPointElement | undefined;
      const p2 = ctx.get(line.endPointId) as GeoPointElement | undefined;
      if (!p1 || !p2) return {};
      return {
        a: p1.y - p2.y,
        b: p2.x - p1.x,
        c: p1.x * p2.y - p2.x * p1.y,
      };
    },
  },

  segment: {
    parents: ['startPointId', 'endPointId'],
    compute(el, ctx) {
      const seg = el as GeoSegmentElement;
      const p1 = ctx.get(seg.startPointId) as GeoPointElement | undefined;
      const p2 = ctx.get(seg.endPointId) as GeoPointElement | undefined;
      if (!p1 || !p2) return {};
      return {
        a: p1.y - p2.y,
        b: p2.x - p1.x,
        c: p1.x * p2.y - p2.x * p1.y,
      };
    },
  },

  ray: {
    parents: ['startPointId', 'throughPointId'],
    compute(el, ctx) {
      const ray = el as GeoRayElement;
      const p1 = ctx.get(ray.startPointId) as GeoPointElement | undefined;
      const p2 = ctx.get(ray.throughPointId) as GeoPointElement | undefined;
      if (!p1 || !p2) return {};
      return {
        a: p1.y - p2.y,
        b: p2.x - p1.x,
        c: p1.x * p2.y - p2.x * p1.y,
      };
    },
  },

  circle: {
    parents: ['centerId'],
    compute(el, ctx) {
      const circle = el as GeoCircleElement;
      const center = ctx.get(circle.centerId) as GeoPointElement | undefined;
      if (!center) return {};
      // radiusId / edgePointId 存在 => 半径由边缘点实时定义（GeoGebra 语义）
      const edgeId = (circle as any).radiusId ?? (circle as any).edgePointId;
      if (edgeId) {
        const edge = ctx.get(edgeId) as GeoPointElement | undefined;
        if (!edge) return {};
        return { radius: Math.hypot(edge.x - center.x, edge.y - center.y) };
      }
      return {};
    },
  },

  polygon: {
    // 渲染直接按 pointIds 查最新坐标连起来即可，无数值字段需要重算
    parents: ['pointIds'],
    compute() {
      return;
    },
  },
};

// ============================================================================
// 3. Context 侧集成：反向依赖索引 + 拓扑安全重算 + 脏标记
// ============================================================================

/** 建反向索引 parent -> children[]；elements 全量变更后重建（O(n)，n 通常很小）*/
export function buildChildrenIndex(elements: Map<string, GeoElement>): Map<string, string[]> {
  const index = new Map<string, string[]>();
  const link = (parentId: string, childId: string) => {
    if (parentId === childId) return; // 忽略自引用
    if (!index.has(parentId)) index.set(parentId, []);
    index.get(parentId)!.push(childId);
  };

  for (const [id, el] of elements) {
    const reg = COMPUTE_REGISTRY[el.type];
    if (!reg) continue;
    for (const field of reg.parents) {
      const parentId = (el as Record<string, unknown>)[field];
      if (Array.isArray(parentId)) {
        for (const pid of parentId as string[]) {
          if (typeof pid === 'string') link(pid, id);
        }
      } else if (typeof parentId === 'string') {
        link(parentId, id);
      }
    }
  }
  return index;
}

/** BFS 收集受影响子孙（含 changedId 自身）*/
export function collectAffected(changedId: string, childrenIndex: Map<string, string[]>): string[] {
  const affected: string[] = [];
  const seen = new Set<string>();
  const queue: string[] = [changedId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    affected.push(id);
    for (const child of childrenIndex.get(id) || []) {
      if (!seen.has(child)) queue.push(child);
    }
  }
  return affected;
}

/**
 * 拓扑安全地重算一批元素：对每个元素先递归重算其所有父母，再执行自身 compute。
 * computing 集合检测并阻断循环依赖（用户构造出 A->B->A 时给出警告而非栈溢出）。
 * dirtyOut 累积脏元素集合供 RAF 渲染层消费；deletedOut 收集应删除的交点 id。
 */
export function recomputeElements(
  ids: string[],
  elements: Map<string, GeoElement>,
  dirtyOut: Set<string>,
  deletedOut: Set<string>
): void {
  const visited = new Set<string>();
  const computing = new Set<string>();
  const getElement = (id: string) => elements.get(id);

  const run = (id: string): void => {
    if (visited.has(id)) return;
    if (computing.has(id)) {
      console.warn(`[recompute] 循环依赖已阻断: ${id}`);
      return;
    }
    const el = elements.get(id);
    if (!el) {
      computing.delete(id);
      return;
    }
    computing.add(id);

    const reg = COMPUTE_REGISTRY[el.type];
    if (reg) {
      // 先递归重算所有父母，保证读取到最新值
      for (const field of reg.parents) {
        const parentId = (el as Record<string, unknown>)[field];
        if (Array.isArray(parentId)) {
          for (const pid of parentId as string[]) run(pid);
        } else if (typeof parentId === 'string') {
          run(parentId);
        }
      }
      const result = reg.compute(el, { get: getElement });
      if (result === RECOMPUTE_DELETE) {
        deletedOut.add(id);
      } else if (result) {
        elements.set(id, { ...el, ...result } as GeoElement);
      }
      dirtyOut.add(id);
    }

    computing.delete(id);
    visited.add(id);
  };

  for (const id of ids) run(id);
}
