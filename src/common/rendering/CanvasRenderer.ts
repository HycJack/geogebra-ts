import type { Drawable } from '../drawable/Drawable';

export interface RendererOptions {
  showGrid?: boolean;
  showAxes?: boolean;
  backgroundColor?: string;
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private width: number = 800;
  private height: number = 600;
  private centerX: number = 400;
  private centerY: number = 300;
  private scale: number = 50;
  private offsetX: number = 0;
  private offsetY: number = 0;
  private devicePixelRatio: number = 1;
  
  private options: Required<RendererOptions>;

  constructor(options?: RendererOptions) {
    this.options = {
      showGrid: options?.showGrid ?? true,
      showAxes: options?.showAxes ?? true,
      backgroundColor: options?.backgroundColor ?? '#ffffff',
    };
    this.devicePixelRatio = window.devicePixelRatio || 1;
  }

  initialize(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法获取 Canvas 2D 上下文');
    }
    this.ctx = ctx;
    this.resize();
  }

  resize(): void {
    if (!this.canvas) return;
    
    const rect = this.canvas.getBoundingClientRect();
    
    if (rect.width === 0 || rect.height === 0) {
      return;
    }
    
    this.width = rect.width;
    this.height = rect.height;
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
    
    this.canvas.width = rect.width * this.devicePixelRatio;
    this.canvas.height = rect.height * this.devicePixelRatio;
    
    this.ctx = this.canvas.getContext('2d');
    if (this.ctx) {
      this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
    }
  }

  worldToScreen(x: number, y: number): { x: number; y: number } {
    return {
      x: this.centerX + x * this.scale + this.offsetX,
      y: this.centerY - y * this.scale + this.offsetY
    };
  }

  screenToWorld(x: number, y: number): { x: number; y: number } {
    return {
      x: (x - this.centerX - this.offsetX) / this.scale,
      y: -(y - this.centerY - this.offsetY) / this.scale
    };
  }

  clear(): void {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  drawGrid(): void {
    if (!this.ctx || !this.options.showGrid) return;

    const mainGridStep = this.calculateAxisStep();
    const subGridStep = mainGridStep / 2;
    
    const startX = Math.floor((-this.centerX - this.offsetX) / (subGridStep * this.scale)) * subGridStep;
    const endX = Math.ceil((this.width - this.centerX - this.offsetX) / (subGridStep * this.scale)) * subGridStep;
    const startY = Math.floor((-(this.height - this.centerY - this.offsetY)) / (subGridStep * this.scale)) * subGridStep;
    const endY = Math.ceil((this.centerY + this.offsetY) / (subGridStep * this.scale)) * subGridStep;

    for (let x = startX; x <= endX; x += subGridStep) {
      const screenX = this.worldToScreen(x, 0).x;
      const isMainGrid = Math.abs(x) % mainGridStep < 0.01;
      
      this.ctx.beginPath();
      this.ctx.moveTo(screenX, 0);
      this.ctx.lineTo(screenX, this.height);
      
      if (isMainGrid) {
        this.ctx.strokeStyle = '#d1d5db';
        this.ctx.lineWidth = 1;
      } else {
        this.ctx.strokeStyle = '#f3f4f6';
        this.ctx.lineWidth = 0.5;
      }
      this.ctx.stroke();
    }

    for (let y = startY; y <= endY; y += subGridStep) {
      const screenY = this.worldToScreen(0, y).y;
      const isMainGrid = Math.abs(y) % mainGridStep < 0.01;
      
      this.ctx.beginPath();
      this.ctx.moveTo(0, screenY);
      this.ctx.lineTo(this.width, screenY);
      
      if (isMainGrid) {
        this.ctx.strokeStyle = '#d1d5db';
        this.ctx.lineWidth = 1;
      } else {
        this.ctx.strokeStyle = '#f3f4f6';
        this.ctx.lineWidth = 0.5;
      }
      this.ctx.stroke();
    }
  }

  drawAxes(): void {
    if (!this.ctx || !this.options.showAxes) return;

    const origin = this.worldToScreen(0, 0);

    this.ctx.strokeStyle = '#1f2937';
    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.beginPath();
    this.ctx.moveTo(0, origin.y);
    this.ctx.lineTo(this.width, origin.y);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(origin.x, 0);
    this.ctx.lineTo(origin.x, this.height);
    this.ctx.stroke();

    const arrowLength = 14;
    const arrowWidth = 8;
    
    this.ctx.fillStyle = '#1f2937';
    
    const xArrowX = this.width - 1;
    if (xArrowX > arrowLength && origin.y > arrowWidth && origin.y < this.height - arrowWidth) {
      this.ctx.beginPath();
      this.ctx.moveTo(xArrowX, origin.y);
      this.ctx.lineTo(xArrowX - arrowLength, origin.y - arrowWidth);
      this.ctx.lineTo(xArrowX - arrowLength, origin.y + arrowWidth);
      this.ctx.closePath();
      this.ctx.fill();
    }

    const yArrowY = 1;
    if (yArrowY < this.height - arrowLength && origin.x > arrowWidth && origin.x < this.width - arrowWidth) {
      this.ctx.beginPath();
      this.ctx.moveTo(origin.x, yArrowY);
      this.ctx.lineTo(origin.x - arrowWidth, yArrowY + arrowLength);
      this.ctx.lineTo(origin.x + arrowWidth, yArrowY + arrowLength);
      this.ctx.closePath();
      this.ctx.fill();
    }

    this.ctx.font = 'bold 15px Roboto, sans-serif';
    this.ctx.fillStyle = '#1f2937';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('O', origin.x + 10, origin.y + 20);

    const axisStep = this.calculateAxisStep();
    const startX = Math.floor((-this.centerX - this.offsetX) / (axisStep * this.scale)) * axisStep;
    const endX = Math.ceil((this.width - this.centerX - this.offsetX) / (axisStep * this.scale)) * axisStep;
    const startY = Math.floor((-(this.height - this.centerY - this.offsetY)) / (axisStep * this.scale)) * axisStep;
    const endY = Math.ceil((this.centerY + this.offsetY) / (axisStep * this.scale)) * axisStep;

    this.ctx.font = '12px Roboto, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';

    for (let x = startX; x <= endX; x += axisStep) {
      if (x === 0) continue;
      const screenX = this.worldToScreen(x, 0).x;
      
      this.ctx.strokeStyle = '#6b7280';
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.moveTo(screenX, origin.y - 5);
      this.ctx.lineTo(screenX, origin.y + 5);
      this.ctx.stroke();
      
      this.ctx.fillStyle = '#4b5563';
      this.ctx.fillText(x.toString(), screenX, origin.y + 12);
    }

    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';
    for (let y = startY; y <= endY; y += axisStep) {
      if (y === 0) continue;
      const screenY = this.worldToScreen(0, y).y;
      
      this.ctx.strokeStyle = '#6b7280';
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.moveTo(origin.x - 5, screenY);
      this.ctx.lineTo(origin.x + 5, screenY);
      this.ctx.stroke();
      
      this.ctx.fillStyle = '#4b5563';
      this.ctx.fillText(y.toString(), origin.x - 14, screenY);
    }

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'bottom';
    this.ctx.font = 'bold 16px Roboto, sans-serif';
    this.ctx.fillStyle = '#1f2937';
    this.ctx.fillText('x', this.width - 18, origin.y - 18);
    this.ctx.fillText('y', origin.x + 28, 18);
  }

  calculateAxisStep(): number {
    const minPixelDistance = 60;
    const baseSteps = [1, 2, 5, 10, 20, 50, 100];
    
    for (const step of baseSteps) {
      const pixelDistance = step * this.scale;
      if (pixelDistance >= minPixelDistance) {
        return step;
      }
    }
    
    return baseSteps[baseSteps.length - 1];
  }

  drawPoint(x: number, y: number, color: string = '#3366ff', radius: number = 5, label?: string): void {
    if (!this.ctx) return;

    const screen = this.worldToScreen(x, y);

    this.ctx.beginPath();
    this.ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    this.ctx.fill();

    if (label) {
      this.ctx.fillStyle = '#1f2937';
      this.ctx.font = 'bold 12px sans-serif';
      this.ctx.textAlign = 'left';
      this.ctx.textBaseline = 'bottom';
      this.ctx.fillText(label, screen.x + 8, screen.y - 8);
    }
  }

  drawSegment(x1: number, y1: number, x2: number, y2: number, color: string = '#000000', lineWidth: number = 2): void {
    if (!this.ctx) return;

    const screenStart = this.worldToScreen(x1, y1);
    const screenEnd = this.worldToScreen(x2, y2);

    this.ctx.beginPath();
    this.ctx.moveTo(screenStart.x, screenStart.y);
    this.ctx.lineTo(screenEnd.x, screenEnd.y);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.stroke();
  }

  drawLine(a: number, b: number, c: number, color: string = '#000000', lineWidth: number = 2): void {
    if (!this.ctx) return;

    const scale = Math.max(this.width, this.height) / this.scale * 2;
    
    let p1: { x: number; y: number };
    let p2: { x: number; y: number };
    
    if (Math.abs(a) < 0.0001) {
      p1 = { x: -scale, y: -c / b };
      p2 = { x: scale, y: -c / b };
    } else if (Math.abs(b) < 0.0001) {
      p1 = { x: -c / a, y: -scale };
      p2 = { x: -c / a, y: scale };
    } else {
      p1 = { x: -scale, y: -(a * -scale + c) / b };
      p2 = { x: scale, y: -(a * scale + c) / b };
    }

    const screenStart = this.worldToScreen(p1.x, p1.y);
    const screenEnd = this.worldToScreen(p2.x, p2.y);

    this.ctx.beginPath();
    this.ctx.moveTo(screenStart.x, screenStart.y);
    this.ctx.lineTo(screenEnd.x, screenEnd.y);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.stroke();
  }

  drawCircle(centerX: number, centerY: number, radius: number, color: string = '#000000', lineWidth: number = 2, fillColor?: string): void {
    if (!this.ctx) return;

    const screenCenter = this.worldToScreen(centerX, centerY);
    const screenRadius = radius * this.scale;

    this.ctx.beginPath();
    this.ctx.arc(screenCenter.x, screenCenter.y, screenRadius, 0, Math.PI * 2);
    
    if (fillColor) {
      this.ctx.fillStyle = fillColor;
      this.ctx.fill();
    }
    
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.stroke();
  }

  drawPolygon(points: Array<{ x: number; y: number }>, color: string = '#000000', lineWidth: number = 2, fillColor?: string): void {
    if (!this.ctx || points.length < 3) return;

    const screenPoints = points.map(p => this.worldToScreen(p.x, p.y));

    this.ctx.beginPath();
    this.ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
    for (let i = 1; i < screenPoints.length; i++) {
      this.ctx.lineTo(screenPoints[i].x, screenPoints[i].y);
    }
    this.ctx.closePath();

    if (fillColor) {
      this.ctx.fillStyle = fillColor;
      this.ctx.fill();
    }

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.stroke();
  }

  render(drawables: Drawable[]): void {
    this.clear();
    this.drawGrid();
    this.drawAxes();

    for (const drawable of drawables) {
      if (drawable.isVisible()) {
        this.drawDrawable(drawable);
      }
    }
  }

  private drawDrawable(drawable: Drawable): void {
    if (!this.ctx) return;
    
    const command = drawable.render();
    if (!command) return;
    
    switch (command.type) {
      case 'circle':
        this.drawCircle(
          command.props.cx,
          command.props.cy,
          command.props.r,
          command.props.stroke || '#000000',
          command.props.strokeWidth || 2,
          command.props.fill
        );
        break;
      case 'line':
        this.drawLine(
          command.props.a || 0,
          command.props.b || 1,
          command.props.c || 0,
          command.props.stroke || '#000000',
          command.props.strokeWidth || 2
        );
        break;
      case 'polygon':
        if (command.props.points) {
          const points = command.props.points.split(' ').map((pair: string) => {
            const [x, y] = pair.split(',').map(Number);
            return { x, y };
          });
          this.drawPolygon(
            points,
            command.props.stroke || '#000000',
            command.props.strokeWidth || 2,
            command.props.fill
          );
        }
        break;
    }
  }

  setScale(scale: number): void {
    this.scale = Math.max(1, Math.min(200, scale));
  }

  setOffset(offsetX: number, offsetY: number): void {
    this.offsetX = offsetX;
    this.offsetY = offsetY;
  }

  zoom(factor: number, centerX: number, centerY: number): void {
    const worldPoint = this.screenToWorld(centerX, centerY);
    this.scale *= factor;
    this.scale = Math.max(1, Math.min(200, this.scale));
    const newScreenPoint = this.worldToScreen(worldPoint.x, worldPoint.y);
    this.offsetX += centerX - newScreenPoint.x;
    this.offsetY += centerY - newScreenPoint.y;
  }

  destroy(): void {
    this.canvas = null;
    this.ctx = null;
  }

  getContext(): CanvasRenderingContext2D | null {
    return this.ctx;
  }

  getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }

  getScale(): number {
    return this.scale;
  }

  getOffset(): { x: number; y: number } {
    return { x: this.offsetX, y: this.offsetY };
  }
}
