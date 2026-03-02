import { CoordinateSystem } from '../coordinates/CoordinateSystem';
import { RenderCommand } from '../drawable/types';
import { Renderer, RenderOptions } from './types';
import type { Drawable } from '../drawable/Drawable';

/**
 * Canvas 渲染器
 * 将绘制对象渲染为 Canvas 2D 图形
 */
export class CanvasRenderer implements Renderer {
  private container: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private coordSystem: CoordinateSystem;
  private options: RenderOptions;
  private devicePixelRatio: number = 1;

  constructor(coordSystem: CoordinateSystem, options?: Partial<RenderOptions>) {
    this.coordSystem = coordSystem;
    this.options = {
      showGrid: true,
      showAxes: true,
      antialias: true,
      backgroundColor: '#ffffff',
      ...options,
    };
    this.devicePixelRatio = window.devicePixelRatio || 1;
  }

  /**
   * 初始化渲染器
   * @param container 容器元素或 canvas 元素
   */
  initialize(container: HTMLElement | HTMLCanvasElement): void {
    if (container instanceof HTMLCanvasElement) {
      // 使用现有的 canvas 元素
      this.canvas = container;
      this.container = container.parentElement;
      
      // 设置实际像素尺寸
      const rect = container.getBoundingClientRect();
      this.resize(rect.width, rect.height);
    } else {
      // 创建新的 canvas 元素
      this.container = container;
      this.canvas = document.createElement('canvas');
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      this.canvas.style.display = 'block';
      
      // 设置实际像素尺寸
      const rect = container.getBoundingClientRect();
      this.resize(rect.width, rect.height);
      
      container.appendChild(this.canvas);
    }
    
    // 获取 2D 上下文
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法获取 Canvas 2D 上下文');
    }
    this.ctx = ctx;
    
    // 设置抗锯齿
    if (this.options.antialias) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    }
  }

  /**
   * 调整画布大小
   */
  resize(width: number, height: number): void {
    if (!this.canvas) return;
    
    // 设置 CSS 样式大小
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    
    // 设置实际像素尺寸（考虑设备像素比）
    this.canvas.width = width * this.devicePixelRatio;
    this.canvas.height = height * this.devicePixelRatio;
    
    // 更新坐标系统
    this.coordSystem.setViewSize(width, height);
  }

  /**
   * 销毁渲染器
   */
  destroy(): void {
    if (this.canvas && this.container) {
      this.container.removeChild(this.canvas);
    }
    this.canvas = null;
    this.ctx = null;
    this.container = null;
  }

  /**
   * 清空画布
   */
  clear(): void {
    if (!this.ctx || !this.canvas) return;
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 填充背景色
    this.ctx.fillStyle = this.options.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * 渲染绘制对象
   */
  render(drawables: Drawable[]): void {
    if (!this.ctx) return;
    
    this.clear();
    
    // 保存上下文状态
    this.ctx.save();
    
    // 应用设备像素比缩放
    this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
    
    // 绘制网格
    if (this.options.showGrid) {
      this.drawGrid();
    }
    
    // 绘制坐标轴
    if (this.options.showAxes) {
      this.drawAxes();
    }
    
    // 渲染所有绘制对象
    for (const drawable of drawables) {
      if (drawable.isVisible()) {
        const command = drawable.render();
        this.renderCommand(command);
      }
    }
    
    // 恢复上下文状态
    this.ctx.restore();
  }

  /**
   * 渲染单个指令
   */
  private renderCommand(command: RenderCommand): void {
    if (!this.ctx) return;
    
    switch (command.type) {
      case 'circle':
        this.drawCircle(command.props);
        break;
      case 'line':
        this.drawLine(command.props);
        break;
      case 'rect':
        this.drawRect(command.props);
        break;
      case 'path':
        this.drawPath(command.props);
        break;
      case 'text':
        this.drawText(command.props, command.children as string[]);
        break;
      case 'polygon':
        this.drawPolygon(command.props);
        break;
      case 'group':
        this.drawGroup(command.props, command.children as RenderCommand[]);
        break;
    }
  }

  /**
   * 绘制圆形
   */
  private drawCircle(props: any): void {
    if (!this.ctx) return;
    
    this.ctx.beginPath();
    this.ctx.arc(props.cx, props.cy, props.r, 0, Math.PI * 2);
    
    if (props.fill && props.fill !== 'none') {
      this.ctx.fillStyle = props.fill;
      this.ctx.fill();
    }
    
    if (props.stroke && props.stroke !== 'none') {
      this.ctx.strokeStyle = props.stroke;
      this.ctx.lineWidth = props.strokeWidth || 1;
      this.ctx.stroke();
    }
  }

  /**
   * 绘制直线
   */
  private drawLine(props: any): void {
    if (!this.ctx) return;
    
    this.ctx.beginPath();
    this.ctx.moveTo(props.x1, props.y1);
    this.ctx.lineTo(props.x2, props.y2);
    
    if (props.stroke && props.stroke !== 'none') {
      this.ctx.strokeStyle = props.stroke;
      this.ctx.lineWidth = props.strokeWidth || 1;
      
      if (props.strokeDasharray) {
        this.ctx.setLineDash(props.strokeDasharray.split(',').map(Number));
      } else {
        this.ctx.setLineDash([]);
      }
      
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }
  }

  /**
   * 绘制矩形
   */
  private drawRect(props: any): void {
    if (!this.ctx) return;
    
    if (props.fill && props.fill !== 'none') {
      this.ctx.fillStyle = props.fill;
      this.ctx.fillRect(props.x, props.y, props.width, props.height);
    }
    
    if (props.stroke && props.stroke !== 'none') {
      this.ctx.strokeStyle = props.stroke;
      this.ctx.lineWidth = props.strokeWidth || 1;
      this.ctx.strokeRect(props.x, props.y, props.width, props.height);
    }
  }

  /**
   * 绘制路径
   */
  private drawPath(props: any): void {
    if (!this.ctx || !props.d) return;
    
    this.ctx.beginPath();
    
    // 解析 SVG 路径命令
    const pathData = props.d as string;
    const commands = pathData.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g);
    
    if (commands) {
      for (const cmd of commands) {
        const type = cmd[0];
        const args = cmd.slice(1).trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
        
        switch (type) {
          case 'M':
            this.ctx.moveTo(args[0], args[1]);
            break;
          case 'L':
            this.ctx.lineTo(args[0], args[1]);
            break;
          case 'C':
            this.ctx.bezierCurveTo(args[0], args[1], args[2], args[3], args[4], args[5]);
            break;
          case 'Q':
            this.ctx.quadraticCurveTo(args[0], args[1], args[2], args[3]);
            break;
          case 'Z':
          case 'z':
            this.ctx.closePath();
            break;
        }
      }
    }
    
    if (props.fill && props.fill !== 'none') {
      this.ctx.fillStyle = props.fill;
      this.ctx.fill();
    }
    
    if (props.stroke && props.stroke !== 'none') {
      this.ctx.strokeStyle = props.stroke;
      this.ctx.lineWidth = props.strokeWidth || 1;
      this.ctx.stroke();
    }
  }

  /**
   * 绘制文本
   */
  private drawText(props: any, children?: string[]): void {
    if (!this.ctx || !children || children.length === 0) return;
    
    const text = children[0];
    const fontSize = props.fontSize || 14;
    const fontFamily = props.fontFamily || 'Arial';
    
    this.ctx.font = `${fontSize}px ${fontFamily}`;
    this.ctx.fillStyle = props.fill || '#000000';
    this.ctx.textAlign = props.textAnchor === 'middle' ? 'center' : props.textAnchor === 'end' ? 'right' : 'left';
    this.ctx.textBaseline = props.dominantBaseline === 'middle' ? 'middle' : 'alphabetic';
    
    this.ctx.fillText(text, props.x, props.y);
  }

  /**
   * 绘制多边形
   */
  private drawPolygon(props: any): void {
    if (!this.ctx || !props.points) return;
    
    const points = props.points.split(' ').map((pair: string) => {
      const [x, y] = pair.split(',').map(Number);
      return { x, y };
    });
    
    if (points.length < 3) return;
    
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }
    
    this.ctx.closePath();
    
    if (props.fill && props.fill !== 'none') {
      this.ctx.fillStyle = props.fill;
      this.ctx.fill();
    }
    
    if (props.stroke && props.stroke !== 'none') {
      this.ctx.strokeStyle = props.stroke;
      this.ctx.lineWidth = props.strokeWidth || 1;
      this.ctx.stroke();
    }
  }

  /**
   * 绘制组
   */
  private drawGroup(props: any, children?: RenderCommand[]): void {
    if (!this.ctx || !children) return;
    
    this.ctx.save();
    
    // 应用组属性
    if (props.opacity !== undefined) {
      this.ctx.globalAlpha = props.opacity;
    }
    
    // 渲染子元素
    for (const child of children) {
      if (typeof child !== 'string') {
        this.renderCommand(child);
      }
    }
    
    this.ctx.restore();
  }

  /**
   * 绘制网格
   */
  private drawGrid(): void {
    if (!this.ctx) return;
    
    const bounds = this.coordSystem.getVisibleWorldBounds();
    const gridSize = this.coordSystem.getGridSize();
    
    this.ctx.strokeStyle = '#e0e0e0';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([]);
    
    // 垂直线
    const startX = Math.floor(bounds.minX / gridSize) * gridSize;
    for (let x = startX; x <= bounds.maxX; x += gridSize) {
      const screenX = this.coordSystem.worldToScreenX(x);
      this.ctx.beginPath();
      this.ctx.moveTo(screenX, 0);
      this.ctx.lineTo(screenX, this.coordSystem.getViewHeight());
      this.ctx.stroke();
    }
    
    // 水平线
    const startY = Math.floor(bounds.minY / gridSize) * gridSize;
    for (let y = startY; y <= bounds.maxY; y += gridSize) {
      const screenY = this.coordSystem.worldToScreenY(y);
      this.ctx.beginPath();
      this.ctx.moveTo(0, screenY);
      this.ctx.lineTo(this.coordSystem.getViewWidth(), screenY);
      this.ctx.stroke();
    }
  }

  /**
   * 绘制坐标轴
   */
  private drawAxes(): void {
    if (!this.ctx) return;
    
    const width = this.coordSystem.getViewWidth();
    const height = this.coordSystem.getViewHeight();
    const originX = this.coordSystem.worldToScreenX(0);
    const originY = this.coordSystem.worldToScreenY(0);
    
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([]);
    
    // X 轴
    this.ctx.beginPath();
    this.ctx.moveTo(0, originY);
    this.ctx.lineTo(width, originY);
    this.ctx.stroke();
    
    // Y 轴
    this.ctx.beginPath();
    this.ctx.moveTo(originX, 0);
    this.ctx.lineTo(originX, height);
    this.ctx.stroke();
    
    // 绘制箭头
    this.drawArrowHead(width - 10, originY, 0);
    this.drawArrowHead(originX, 10, -Math.PI / 2);
    
    // 标签
    this.ctx.fillStyle = '#000000';
    this.ctx.font = '14px Arial';
    this.ctx.fillText('x', width - 20, originY - 10);
    this.ctx.fillText('y', originX + 10, 20);
  }

  /**
   * 绘制箭头
   */
  private drawArrowHead(x: number, y: number, angle: number): void {
    if (!this.ctx) return;
    
    const size = 8;
    
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(angle);
    
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(-size, -size / 2);
    this.ctx.lineTo(-size, size / 2);
    this.ctx.closePath();
    this.ctx.fill();
    
    this.ctx.restore();
  }

  /**
   * 设置坐标系统
   */
  setCoordinateSystem(coordSystem: CoordinateSystem): void {
    this.coordSystem = coordSystem;
  }

  /**
   * 获取渲染上下文
   */
  getContext(): CanvasRenderingContext2D | null {
    return this.ctx;
  }

  /**
   * 获取 Canvas 元素
   */
  getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }
}
