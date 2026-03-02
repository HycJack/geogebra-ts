import { HitTestResult } from '../drawable/types';
import { ScreenPoint, WorldPoint } from '../coordinates/types';
import type { Drawable } from '../drawable/Drawable';

/**
 * 交互系统类型定义
 */

/** 工具模式 */
export type ToolMode = 
  | 'move'      // 移动/选择
  | 'point'     // 创建点
  | 'line'      // 创建直线
  | 'segment'   // 创建线段
  | 'circle'    // 创建圆
  | 'polygon'   // 创建多边形
  | 'vector'    // 创建向量
  | 'text'      // 创建文本
  | 'delete';   // 删除

/** 交互状态 */
export interface InteractionState {
  mode: ToolMode;
  selectedIds: string[];
  hoveredId: string | null;
  isDragging: boolean;
  dragStartPoint: ScreenPoint | null;
  dragStartWorld: WorldPoint | null;
  pendingPoints: WorldPoint[];
}

/** 鼠标/指针事件数据 */
export interface PointerEventData {
  screenPoint: ScreenPoint;
  worldPoint: WorldPoint;
  button: number;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
}

/** 拖拽状态 */
export interface DragState {
  isDragging: boolean;
  elementId: string | null;
  startScreen: ScreenPoint;
  startWorld: WorldPoint;
  currentScreen: ScreenPoint;
  currentWorld: WorldPoint;
  deltaScreen: { x: number; y: number };
  deltaWorld: { x: number; y: number };
}

/** 选择框 */
export interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

/** 交互处理器接口 */
export interface InteractionHandler {
  onPointerDown(event: PointerEventData, hitResult: HitTestResult | null): boolean;
  onPointerMove(event: PointerEventData, hitResult: HitTestResult | null): boolean;
  onPointerUp(event: PointerEventData): boolean;
  onPointerEnter?(event: PointerEventData, hitResult: HitTestResult): boolean;
  onPointerLeave?(event: PointerEventData): boolean;
  onWheel?(event: { deltaX: number; deltaY: number; screenPoint: ScreenPoint }): boolean;
}

/** 命中测试管理器接口 */
export interface HitTestManager {
  hitTest(screenX: number, screenY: number, threshold: number): HitTestResult | null;
  hitTestAll(screenX: number, screenY: number, threshold: number): HitTestResult[];
  hitTestBox(box: SelectionBox): Drawable[];
}

/** 交互事件类型 */
export type InteractionEventType = 
  | 'select'
  | 'deselect'
  | 'hover'
  | 'unhover'
  | 'dragstart'
  | 'drag'
  | 'dragend'
  | 'click'
  | 'dblclick'
  | 'create'
  | 'delete';

/** 交互事件 */
export interface InteractionEvent {
  type: InteractionEventType;
  elementId?: string;
  elementIds?: string[];
  screenPoint?: ScreenPoint;
  worldPoint?: WorldPoint;
  data?: any;
}

/** 交互事件监听器 */
export type InteractionEventListener = (event: InteractionEvent) => void;
