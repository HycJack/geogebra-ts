import { RenderCommand } from '../drawable/types';
import { CoordinateSystem } from '../coordinates/CoordinateSystem';
import type { Drawable } from '../drawable/Drawable';

/**
 * 渲染器类型定义
 */

/** 渲染器接口 */
export interface Renderer {
  /** 初始化渲染器 */
  initialize(container: HTMLElement): void;
  
  /** 销毁渲染器 */
  destroy(): void;
  
  /** 清空画布 */
  clear(): void;
  
  /** 渲染绘制对象 */
  render(drawables: Drawable[]): void;
  
  /** 设置坐标系统 */
  setCoordinateSystem(coordSystem: CoordinateSystem): void;
  
  /** 获取渲染上下文 */
  getContext(): any;
}

/** 渲染选项 */
export interface RenderOptions {
  showGrid: boolean;
  showAxes: boolean;
  antialias: boolean;
  backgroundColor: string;
}

/** 渲染层 */
export interface RenderLayer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  drawables: Drawable[];
}

/** 渲染统计 */
export interface RenderStats {
  drawCallCount: number;
  elementCount: number;
  lastFrameTime: number;
  averageFrameTime: number;
}

/** 渲染命令处理器 */
export interface RenderCommandHandler {
  handle(command: RenderCommand, context: any): void;
}

/** SVG 渲染属性 */
export interface SVGRenderProps {
  width: number;
  height: number;
  viewBox?: string;
  style?: React.CSSProperties;
}
