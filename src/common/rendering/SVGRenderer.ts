import { CoordinateSystem } from '../coordinates/CoordinateSystem';
import { RenderCommand } from '../drawable/types';
import { Renderer, RenderOptions } from './types';
import type { Drawable } from '../drawable/Drawable';

/**
 * SVG 渲染器
 * 将绘制对象渲染为 SVG 元素
 */
export class SVGRenderer implements Renderer {
  private container: HTMLElement | null = null;
  private svgElement: SVGSVGElement | null = null;
  private coordSystem: CoordinateSystem;
  private options: RenderOptions;
  private gridGroup: SVGGElement | null = null;
  private axesGroup: SVGGElement | null = null;
  private elementsGroup: SVGGElement | null = null;
  private labelsGroup: SVGGElement | null = null;

  constructor(coordSystem: CoordinateSystem, options?: Partial<RenderOptions>) {
    this.coordSystem = coordSystem;
    this.options = {
      showGrid: true,
      showAxes: true,
      antialias: true,
      backgroundColor: '#ffffff',
      ...options,
    };
  }

  initialize(container: HTMLElement): void {
    this.container = container;
    
    // 创建 SVG 元素
    this.svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svgElement.style.width = '100%';
    this.svgElement.style.height = '100%';
    this.svgElement.style.backgroundColor = this.options.backgroundColor;
    
    if (this.options.antialias) {
      this.svgElement.style.shapeRendering = 'geometricPrecision';
    }

    // 创建图层组
    this.gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.gridGroup.setAttribute('class', 'grid-layer');
    
    this.axesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.axesGroup.setAttribute('class', 'axes-layer');
    
    this.elementsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.elementsGroup.setAttribute('class', 'elements-layer');
    
    this.labelsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.labelsGroup.setAttribute('class', 'labels-layer');

    // 按顺序添加组
    this.svgElement.appendChild(this.gridGroup);
    this.svgElement.appendChild(this.axesGroup);
    this.svgElement.appendChild(this.elementsGroup);
    this.svgElement.appendChild(this.labelsGroup);

    container.appendChild(this.svgElement);

    // 初始渲染网格和坐标轴
    this.renderGrid();
    this.renderAxes();
  }

  destroy(): void {
    if (this.svgElement && this.container) {
      this.container.removeChild(this.svgElement);
    }
    this.svgElement = null;
    this.gridGroup = null;
    this.axesGroup = null;
    this.elementsGroup = null;
    this.labelsGroup = null;
    this.container = null;
  }

  clear(): void {
    if (this.elementsGroup) {
      while (this.elementsGroup.firstChild) {
        this.elementsGroup.removeChild(this.elementsGroup.firstChild);
      }
    }
    if (this.labelsGroup) {
      while (this.labelsGroup.firstChild) {
        this.labelsGroup.removeChild(this.labelsGroup.firstChild);
      }
    }
  }

  render(drawables: Drawable[]): void {
    if (!this.elementsGroup || !this.labelsGroup) return;

    // 清空现有元素
    this.clear();

    // 重新渲染网格和坐标轴（如果配置改变）
    if (this.options.showGrid) {
      this.renderGrid();
    } else {
      this.clearGroup(this.gridGroup);
    }

    if (this.options.showAxes) {
      this.renderAxes();
    } else {
      this.clearGroup(this.axesGroup);
    }

    // 渲染绘制对象
    for (const drawable of drawables) {
      if (!drawable.isVisible()) continue;
      if (!drawable.isInViewport()) continue;

      const command = drawable.render();
      const element = this.createSVGElement(command);
      
      if (element) {
        this.elementsGroup.appendChild(element);
      }

      // 渲染标签
      const labelCommand = this.extractLabelCommand(command);
      if (labelCommand) {
        const labelElement = this.createSVGElement(labelCommand);
        if (labelElement) {
          this.labelsGroup.appendChild(labelElement);
        }
      }
    }
  }

  setCoordinateSystem(coordSystem: CoordinateSystem): void {
    this.coordSystem = coordSystem;
    // 重新渲染网格和坐标轴
    this.renderGrid();
    this.renderAxes();
  }

  getContext(): SVGSVGElement | null {
    return this.svgElement;
  }

  setOptions(options: Partial<RenderOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * 渲染网格
   */
  private renderGrid(): void {
    if (!this.gridGroup || !this.options.showGrid) return;

    this.clearGroup(this.gridGroup);

    const config = this.coordSystem.getConfig();
    const gridConfig = this.coordSystem.getGridConfig();
    const bounds = this.coordSystem.getVisibleWorldBounds();

    // 计算网格间隔
    const interval = gridConfig.interval;
    const subInterval = interval / gridConfig.subDivisions;

    // 主网格线
    const mainGridPath = this.createGridPath(bounds, interval, config);
    const mainGrid = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    mainGrid.setAttribute('d', mainGridPath);
    mainGrid.setAttribute('stroke', gridConfig.color);
    mainGrid.setAttribute('stroke-width', String(gridConfig.lineWidth));
    mainGrid.setAttribute('fill', 'none');
    this.gridGroup.appendChild(mainGrid);

    // 次网格线
    if (gridConfig.subDivisions > 1) {
      const subGridPath = this.createGridPath(bounds, subInterval, config);
      const subGrid = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      subGrid.setAttribute('d', subGridPath);
      subGrid.setAttribute('stroke', gridConfig.color);
      subGrid.setAttribute('stroke-width', String(gridConfig.lineWidth * 0.5));
      subGrid.setAttribute('stroke-opacity', '0.5');
      subGrid.setAttribute('fill', 'none');
      this.gridGroup.appendChild(subGrid);
    }
  }

  /**
   * 创建网格路径
   */
  private createGridPath(bounds: any, interval: number, config: any): string {
    let path = '';

    // 垂直线
    const startX = Math.floor(bounds.minX / interval) * interval;
    for (let x = startX; x <= bounds.maxX; x += interval) {
      const screenX = config.xZero + x * config.xScale;
      path += `M ${screenX} 0 L ${screenX} ${config.height} `;
    }

    // 水平线
    const startY = Math.floor(bounds.minY / interval) * interval;
    for (let y = startY; y <= bounds.maxY; y += interval) {
      const screenY = config.yZero - y * config.yScale;
      path += `M 0 ${screenY} L ${config.width} ${screenY} `;
    }

    return path;
  }

  /**
   * 渲染坐标轴
   */
  private renderAxes(): void {
    if (!this.axesGroup || !this.options.showAxes) return;

    this.clearGroup(this.axesGroup);

    const config = this.coordSystem.getConfig();
    const axisConfig = this.coordSystem.getAxisConfig();

    // X 轴
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', '0');
    xAxis.setAttribute('y1', String(config.yZero));
    xAxis.setAttribute('x2', String(config.width));
    xAxis.setAttribute('y2', String(config.yZero));
    xAxis.setAttribute('stroke', axisConfig.color);
    xAxis.setAttribute('stroke-width', String(axisConfig.lineWidth));
    this.axesGroup.appendChild(xAxis);

    // Y 轴
    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', String(config.xZero));
    yAxis.setAttribute('y1', '0');
    yAxis.setAttribute('x2', String(config.xZero));
    yAxis.setAttribute('y2', String(config.height));
    yAxis.setAttribute('stroke', axisConfig.color);
    yAxis.setAttribute('stroke-width', String(axisConfig.lineWidth));
    this.axesGroup.appendChild(yAxis);

    // 箭头
    this.renderAxisArrows(config, axisConfig);
  }

  /**
   * 渲染坐标轴箭头
   */
  private renderAxisArrows(config: any, axisConfig: any): void {
    const arrowSize = axisConfig.arrowSize;

    // X 轴箭头
    const xArrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    xArrow.setAttribute('points', `${config.width - arrowSize},${config.yZero - arrowSize/2} ${config.width},${config.yZero} ${config.width - arrowSize},${config.yZero + arrowSize/2}`);
    xArrow.setAttribute('fill', axisConfig.color);
    this.axesGroup!.appendChild(xArrow);

    // Y 轴箭头
    const yArrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    yArrow.setAttribute('points', `${config.xZero - arrowSize/2},${arrowSize} ${config.xZero},0 ${config.xZero + arrowSize/2},${arrowSize}`);
    yArrow.setAttribute('fill', axisConfig.color);
    this.axesGroup!.appendChild(yArrow);
  }

  /**
   * 创建 SVG 元素
   */
  private createSVGElement(command: RenderCommand): SVGElement | null {
    switch (command.type) {
      case 'circle':
        return this.createCircleElement(command.props);
      case 'line':
        return this.createLineElement(command.props);
      case 'rect':
        return this.createRectElement(command.props);
      case 'path':
        return this.createPathElement(command.props);
      case 'text':
        return this.createTextElement(command.props, command.children as string[]);
      case 'polygon':
        return this.createPolygonElement(command.props);
      case 'group':
        return this.createGroupElement(command.props, command.children);
      default:
        return null;
    }
  }

  private createCircleElement(props: any): SVGCircleElement {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.setAttributes(circle, props);
    return circle;
  }

  private createLineElement(props: any): SVGLineElement {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    this.setAttributes(line, props);
    return line;
  }

  private createRectElement(props: any): SVGRectElement {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    this.setAttributes(rect, props);
    return rect;
  }

  private createPathElement(props: any): SVGPathElement {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    this.setAttributes(path, props);
    return path;
  }

  private createTextElement(props: any, children?: string[]): SVGTextElement {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    this.setAttributes(text, props);
    if (children && children.length > 0) {
      text.textContent = children[0];
    }
    return text;
  }

  private createPolygonElement(props: any): SVGPolygonElement {
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    this.setAttributes(polygon, props);
    return polygon;
  }

  private createGroupElement(props: any, children?: RenderCommand[] | string[]): SVGGElement {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.setAttributes(group, props);
    
    if (children && typeof children[0] !== 'string') {
      for (const child of children as RenderCommand[]) {
        const childElement = this.createSVGElement(child);
        if (childElement) {
          group.appendChild(childElement);
        }
      }
    }
    
    return group;
  }

  private setAttributes(element: SVGElement, props: any): void {
    for (const [key, value] of Object.entries(props)) {
      if (value !== undefined && value !== null) {
        element.setAttribute(key, String(value));
      }
    }
  }

  private extractLabelCommand(command: RenderCommand): RenderCommand | null {
    if (command.type === 'group' && command.children) {
      for (const child of command.children as RenderCommand[]) {
        if (typeof child !== 'string' && child.type === 'text') {
          return child;
        }
      }
    }
    return null;
  }

  private clearGroup(group: SVGGElement | null): void {
    if (!group) return;
    while (group.firstChild) {
      group.removeChild(group.firstChild);
    }
  }
}
