/**
 * RAF 渲染循环 + revision 驱动
 *
 * 对应优化指南 §3.3「重绘触发链脆弱」问题。
 *
 * 现状：EuclidianView 靠 `useEffect(() => { renderElements(); }, [renderElements])`
 * 驱动重绘 —— effect 的依赖数组包含 effect 回调自身，属于无限循环隐患（当前安全纯属
 * 回调内不 dispatch 的巧合）；且 hover/selectedIds 等纯表现态变化也触发 React re-render
 * + 全 canvas 清屏重绘；pointermove 高频 dispatch 无节流。
 *
 * 方案：
 *   1. Context 内每次有效 mutation 只递增 revision（不再把 elements Map 引用变化当信号）
 *   2. EuclidianView 订阅 revision -> 预约下一帧绘制，同帧多次变更只画一次
 *   3. hover/选中态可下沉到次级 canvas/DOM 层，与主场景解耦（Phase 1 完成）
 *
 * 对标 JSXGraph：board.update() + dirty 标记 + requestAnimationFrame 合并同帧更新。
 */

import { useEffect, useRef } from 'react';

export interface UseRenderLoopReturn {
  /** 预约下一帧绘制（幂等：同帧多次调用只触发一次）*/
  schedule: () => void;
  /** 立刻绘制一次（不受节流保护，仅在调试/初始化等场景使用）*/
  drawNow: () => void;
  /** 取消已预约的绘制 */
  cancel: () => void;
}

/**
 * @param drawFn 实际绘制函数（应只读外部 ref，不要闭包捕获易变 state）
 * @param deps 触发重绘的依赖数组 —— 实践中只传 [revision]，不要传 renderElements 自身
 */
export function useRenderLoop(
  drawFn: () => void,
  deps: unknown[]
): UseRenderLoopReturn {
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef(false);
  const callbackRef = useRef(drawFn);

  // 保持 drawFn 始终最新，但不动 RAF 循环本身
  useEffect(() => {
    callbackRef.current = drawFn;
  }, [drawFn]);

  const schedule = () => {
    if (pendingRef.current) return; // 本帧已预约，跳过（帧级节流）
    pendingRef.current = true;
    rafRef.current = requestAnimationFrame(() => {
      pendingRef.current = false;
      callbackRef.current();
    });
  };

  const drawNow = () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    pendingRef.current = false;
    callbackRef.current();
  };

  const cancel = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      pendingRef.current = false;
    }
  };

  // deps 变化时预约下一帧 —— 调用 schedule() 而非直接 drawNow()，保持节流
  useEffect(() => {
    schedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(
    () => () => {
      cancel();
    },
    []
  );

  return { schedule, drawNow, cancel };
}
