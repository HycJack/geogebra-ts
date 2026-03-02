import { CoordinateSystem } from '../coordinates/CoordinateSystem';
import { HitTestManager } from './HitTestManager';
import type { Drawable } from '../drawable/Drawable';
import {
  InteractionState,
  ToolMode,
  PointerEventData,
  DragState,
  InteractionEvent,
  InteractionEventType,
  InteractionEventListener,
  InteractionHandler,
} from './types';

/**
 * 交互管理器
 * 管理用户交互状态、事件分发和工具模式
 */
export class InteractionManager {
  private coordSystem: CoordinateSystem;
  private hitTestManager: HitTestManager;
  private state: InteractionState;
  private dragState: DragState;
  private handlers: Map<ToolMode, InteractionHandler> = new Map();
  private listeners: Map<InteractionEventType, Set<InteractionEventListener>> = new Map();

  constructor(coordSystem: CoordinateSystem) {
    this.coordSystem = coordSystem;
    this.hitTestManager = new HitTestManager();
    
    this.state = {
      mode: 'move',
      selectedIds: [],
      hoveredId: null,
      isDragging: false,
      dragStartPoint: null,
      dragStartWorld: null,
      pendingPoints: [],
    };

    this.dragState = {
      isDragging: false,
      elementId: null,
      startScreen: { x: 0, y: 0 },
      startWorld: { x: 0, y: 0 },
      currentScreen: { x: 0, y: 0 },
      currentWorld: { x: 0, y: 0 },
      deltaScreen: { x: 0, y: 0 },
      deltaWorld: { x: 0, y: 0 },
    };
  }

  /**
   * 设置坐标系统
   */
  setCoordinateSystem(coordSystem: CoordinateSystem): void {
    this.coordSystem = coordSystem;
  }

  /**
   * 设置绘制对象
   */
  setDrawables(drawables: Drawable[]): void {
    this.hitTestManager.setDrawables(drawables);
  }

  /**
   * 注册工具处理器
   */
  registerHandler(mode: ToolMode, handler: InteractionHandler): void {
    this.handlers.set(mode, handler);
  }

  /**
   * 注销工具处理器
   */
  unregisterHandler(mode: ToolMode): void {
    this.handlers.delete(mode);
  }

  /**
   * 添加事件监听器
   */
  addEventListener(type: InteractionEventType, listener: InteractionEventListener): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(type: InteractionEventType, listener: InteractionEventListener): void {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * 分发事件
   */
  private emit(event: InteractionEvent): void {
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => listener(event));
    }
  }

  /**
   * 设置工具模式
   */
  setMode(mode: ToolMode): void {
    this.state.mode = mode;
    this.state.pendingPoints = []; // 清除待定点
  }

  /**
   * 获取当前模式
   */
  getMode(): ToolMode {
    return this.state.mode;
  }

  /**
   * 获取当前状态
   */
  getState(): InteractionState {
    return { ...this.state };
  }

  /**
   * 选择元素
   */
  select(ids: string[]): void {
    this.state.selectedIds = ids;
    this.emit({ type: 'select', elementIds: ids });
  }

  /**
   * 添加选择
   */
  addToSelection(id: string): void {
    if (!this.state.selectedIds.includes(id)) {
      this.state.selectedIds.push(id);
      this.emit({ type: 'select', elementIds: [...this.state.selectedIds] });
    }
  }

  /**
   * 清除选择
   */
  clearSelection(): void {
    this.state.selectedIds = [];
    this.emit({ type: 'deselect' });
  }

  /**
   * 设置悬停元素
   */
  setHovered(id: string | null): void {
    if (this.state.hoveredId !== id) {
      if (this.state.hoveredId) {
        this.emit({ type: 'unhover', elementId: this.state.hoveredId });
      }
      this.state.hoveredId = id;
      if (id) {
        this.emit({ type: 'hover', elementId: id });
      }
    }
  }

  /**
   * 指针按下
   */
  onPointerDown(event: PointerEventData): void {
    const hitResult = this.hitTestManager.hitTest(
      event.screenPoint.x,
      event.screenPoint.y
    );

    // 初始化拖拽状态
    this.dragState.startScreen = { ...event.screenPoint };
    this.dragState.startWorld = { ...event.worldPoint };
    this.dragState.currentScreen = { ...event.screenPoint };
    this.dragState.currentWorld = { ...event.worldPoint };
    this.dragState.deltaScreen = { x: 0, y: 0 };
    this.dragState.deltaWorld = { x: 0, y: 0 };

    // 分发给当前模式的处理器
    const handler = this.handlers.get(this.state.mode);
    if (handler) {
      const handled = handler.onPointerDown(event, hitResult);
      if (handled) return;
    }

    // 默认行为：选择或拖拽
    if (hitResult) {
      const id = hitResult.elementId;
      
      if (event.ctrlKey || event.shiftKey) {
        // 多选
        if (this.state.selectedIds.includes(id)) {
          this.select(this.state.selectedIds.filter(i => i !== id));
        } else {
          this.addToSelection(id);
        }
      } else {
        // 单选
        if (!this.state.selectedIds.includes(id)) {
          this.select([id]);
        }
      }

      // 开始拖拽
      this.startDrag(id);
    } else {
      // 点击空白处
      if (!event.ctrlKey && !event.shiftKey) {
        this.clearSelection();
      }
    }
  }

  /**
   * 指针移动
   */
  onPointerMove(event: PointerEventData): void {
    // 更新拖拽状态
    this.dragState.currentScreen = { ...event.screenPoint };
    this.dragState.currentWorld = { ...event.worldPoint };
    this.dragState.deltaScreen = {
      x: event.screenPoint.x - this.dragState.startScreen.x,
      y: event.screenPoint.y - this.dragState.startScreen.y,
    };
    this.dragState.deltaWorld = {
      x: event.worldPoint.x - this.dragState.startWorld.x,
      y: event.worldPoint.y - this.dragState.startWorld.y,
    };

    // 命中测试
    const hitResult = this.hitTestManager.hitTest(
      event.screenPoint.x,
      event.screenPoint.y
    );

    // 更新悬停
    this.setHovered(hitResult?.elementId || null);

    // 处理拖拽
    if (this.state.isDragging) {
      this.emit({
        type: 'drag',
        elementId: this.dragState.elementId || undefined,
        screenPoint: event.screenPoint,
        worldPoint: event.worldPoint,
        data: { ...this.dragState },
      });
    }

    // 分发给当前模式的处理器
    const handler = this.handlers.get(this.state.mode);
    if (handler) {
      handler.onPointerMove(event, hitResult);
    }
  }

  /**
   * 指针释放
   */
  onPointerUp(event: PointerEventData): void {
    // 结束拖拽
    if (this.state.isDragging) {
      this.endDrag();
    }

    // 分发给当前模式的处理器
    const handler = this.handlers.get(this.state.mode);
    if (handler) {
      handler.onPointerUp(event);
    }

    // 触发点击事件
    const dragDistance = Math.sqrt(
      this.dragState.deltaScreen.x ** 2 + this.dragState.deltaScreen.y ** 2
    );
    if (dragDistance < 5) {
      const hitResult = this.hitTestManager.hitTest(
        event.screenPoint.x,
        event.screenPoint.y
      );
      this.emit({
        type: 'click',
        elementId: hitResult?.elementId,
        screenPoint: event.screenPoint,
        worldPoint: event.worldPoint,
      });
    }
  }

  /**
   * 滚轮事件
   */
  onWheel(event: { deltaX: number; deltaY: number; screenPoint: { x: number; y: number } }): void {
    // 缩放
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    this.coordSystem.zoom(zoomFactor, event.screenPoint);

    // 分发给当前模式的处理器
    const handler = this.handlers.get(this.state.mode);
    if (handler && handler.onWheel) {
      handler.onWheel(event);
    }
  }

  /**
   * 开始拖拽
   */
  private startDrag(elementId: string): void {
    this.state.isDragging = true;
    this.dragState.isDragging = true;
    this.dragState.elementId = elementId;
    
    this.emit({
      type: 'dragstart',
      elementId,
      screenPoint: this.dragState.startScreen,
      worldPoint: this.dragState.startWorld,
    });
  }

  /**
   * 结束拖拽
   */
  private endDrag(): void {
    this.emit({
      type: 'dragend',
      elementId: this.dragState.elementId || undefined,
      screenPoint: this.dragState.currentScreen,
      worldPoint: this.dragState.currentWorld,
    });

    this.state.isDragging = false;
    this.dragState.isDragging = false;
    this.dragState.elementId = null;
  }

  /**
   * 添加待定点
   */
  addPendingPoint(worldPoint: { x: number; y: number }): void {
    this.state.pendingPoints.push(worldPoint);
  }

  /**
   * 清除待定点
   */
  clearPendingPoints(): void {
    this.state.pendingPoints = [];
  }

  /**
   * 获取待定点
   */
  getPendingPoints(): { x: number; y: number }[] {
    return [...this.state.pendingPoints];
  }

  /**
   * 获取拖拽状态
   */
  getDragState(): DragState {
    return { ...this.dragState };
  }

  /**
   * 获取命中测试管理器
   */
  getHitTestManager(): HitTestManager {
    return this.hitTestManager;
  }
}
