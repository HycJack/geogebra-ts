import { GeoElement, WorldPoint, ScreenPoint } from '../../types';
import {
  SnapManager as ISnapManager,
  SnapTarget,
  SnapConfig,
  DEFAULT_SNAP_CONFIG,
  SnapType,
} from './types';

export class SnapManagerImpl implements ISnapManager {
  private elements: Map<string, GeoElement> = new Map();
  private config: SnapConfig;
  private worldToScreen: (world: WorldPoint) => ScreenPoint;
  private screenToWorld: (screen: ScreenPoint) => WorldPoint;

  constructor(
    worldToScreen: (world: WorldPoint) => ScreenPoint,
    screenToWorld: (screen: ScreenPoint) => WorldPoint,
    config?: Partial<SnapConfig>
  ) {
    this.config = { ...DEFAULT_SNAP_CONFIG, ...config };
    this.worldToScreen = worldToScreen;
    this.screenToWorld = screenToWorld;
  }

  updateElements(elements: Map<string, GeoElement>): void {
    this.elements = elements;
  }

  setConfig(config: Partial<SnapConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): SnapConfig {
    return this.config;
  }

  findSnapTarget(
    screenPoint: ScreenPoint,
    worldPoint: WorldPoint,
    excludeIds?: string[]
  ): SnapTarget | null {
    const targets = this.findSnapTargets(screenPoint, worldPoint, excludeIds);
    
    if (targets.length === 0) return null;
    
    return targets.reduce((best, current) => {
      if (current.priority !== best.priority) {
        return current.priority > best.priority ? current : best;
      }
      return current.distance < best.distance ? current : best;
    });
  }

  findSnapTargets(
    screenPoint: ScreenPoint,
    worldPoint: WorldPoint,
    excludeIds?: string[]
  ): SnapTarget[] {
    if (!this.config.enabled) return [];

    const targets: SnapTarget[] = [];
    const excludeSet = new Set(excludeIds || []);

    if (this.config.snapToPoint) {
      targets.push(...this.findPointSnaps(worldPoint, excludeSet));
    }

    if (this.config.snapToGrid) {
      targets.push(...this.findGridSnaps(worldPoint));
    }

    if (this.config.snapToLine) {
      targets.push(...this.findLineSnaps(worldPoint, excludeSet));
    }

    if (this.config.snapToSegment) {
      targets.push(...this.findSegmentSnaps(worldPoint, excludeSet));
    }

    if (this.config.snapToCircle) {
      targets.push(...this.findCircleSnaps(worldPoint, excludeSet));
    }

    if (this.config.snapToIntersection) {
      targets.push(...this.findIntersectionSnaps(worldPoint, excludeSet));
    }

    if (this.config.snapToMidpoint) {
      targets.push(...this.findMidpointSnaps(worldPoint, excludeSet));
    }

    return targets.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.distance - b.distance;
    });
  }

  private findPointSnaps(worldPoint: WorldPoint, excludeSet: Set<string>): SnapTarget[] {
    const targets: SnapTarget[] = [];

    for (const [id, element] of this.elements) {
      if (excludeSet.has(id)) continue;
      if (element.type !== 'point') continue;
      if (!element.style.visible) continue;

      const dx = worldPoint.x - element.x;
      const dy = worldPoint.y - element.y;
      const worldDistance = Math.sqrt(dx * dx + dy * dy);
      const screenPoint = this.worldToScreen(element);
      const cursorScreen = this.worldToScreen(worldPoint);
      const screenDx = cursorScreen.x - screenPoint.x;
      const screenDy = cursorScreen.y - screenPoint.y;
      const screenDistance = Math.sqrt(screenDx * screenDx + screenDy * screenDy);

      if (screenDistance <= this.config.pointThreshold) {
        targets.push({
          type: 'point',
          elementId: id,
          worldPoint: { x: element.x, y: element.y },
          screenPoint,
          distance: screenDistance,
          priority: 100,
          metadata: { label: element.label },
        });
      }
    }

    return targets;
  }

  private findGridSnaps(worldPoint: WorldPoint): SnapTarget[] {
    const targets: SnapTarget[] = [];
    const spacing = this.config.gridSpacing;

    const nearestX = Math.round(worldPoint.x / spacing) * spacing;
    const nearestY = Math.round(worldPoint.y / spacing) * spacing;

    const gridPoint = { x: nearestX, y: nearestY };
    const screenGridPoint = this.worldToScreen(gridPoint);
    const cursorScreen = this.worldToScreen(worldPoint);
    const screenDx = cursorScreen.x - screenGridPoint.x;
    const screenDy = cursorScreen.y - screenGridPoint.y;
    const screenDistance = Math.sqrt(screenDx * screenDx + screenDy * screenDy);

    if (screenDistance <= this.config.gridThreshold) {
      targets.push({
        type: 'grid',
        worldPoint: gridPoint,
        screenPoint: screenGridPoint,
        distance: screenDistance,
        priority: 10,
      });
    }

    return targets;
  }

  private findLineSnaps(worldPoint: WorldPoint, excludeSet: Set<string>): SnapTarget[] {
    const targets: SnapTarget[] = [];

    for (const [id, element] of this.elements) {
      if (excludeSet.has(id)) continue;
      if (element.type !== 'line') continue;
      if (!element.style.visible) continue;

      const { a, b, c } = element;
      const norm = Math.sqrt(a * a + b * b);
      if (norm === 0) continue;

      const distance = Math.abs(a * worldPoint.x + b * worldPoint.y + c) / norm;
      
      const t = -(a * worldPoint.x + b * worldPoint.y + c) / (a * a + b * b);
      const snapX = worldPoint.x + a * t;
      const snapY = worldPoint.y + b * t;

      const snapWorldPoint = { x: snapX, y: snapY };
      const screenSnapPoint = this.worldToScreen(snapWorldPoint);
      const cursorScreen = this.worldToScreen(worldPoint);
      const screenDx = cursorScreen.x - screenSnapPoint.x;
      const screenDy = cursorScreen.y - screenSnapPoint.y;
      const screenDistance = Math.sqrt(screenDx * screenDx + screenDy * screenDy);

      if (screenDistance <= this.config.lineThreshold) {
        targets.push({
          type: 'line',
          elementId: id,
          worldPoint: snapWorldPoint,
          screenPoint: screenSnapPoint,
          distance: screenDistance,
          priority: 50,
          metadata: { label: element.label },
        });
      }
    }

    return targets;
  }

  private findSegmentSnaps(worldPoint: WorldPoint, excludeSet: Set<string>): SnapTarget[] {
    const targets: SnapTarget[] = [];

    for (const [id, element] of this.elements) {
      if (excludeSet.has(id)) continue;
      if (element.type !== 'segment') continue;
      if (!element.style.visible) continue;

      const startPoint = this.elements.get(element.startPointId);
      const endPoint = this.elements.get(element.endPointId);
      
      if (!startPoint || !endPoint) continue;
      if (startPoint.type !== 'point' || endPoint.type !== 'point') continue;

      const snapPoint = this.projectPointToSegment(
        worldPoint,
        { x: startPoint.x, y: startPoint.y },
        { x: endPoint.x, y: endPoint.y }
      );

      if (!snapPoint) continue;

      const screenSnapPoint = this.worldToScreen(snapPoint);
      const cursorScreen = this.worldToScreen(worldPoint);
      const screenDx = cursorScreen.x - screenSnapPoint.x;
      const screenDy = cursorScreen.y - screenSnapPoint.y;
      const screenDistance = Math.sqrt(screenDx * screenDx + screenDy * screenDy);

      if (screenDistance <= this.config.lineThreshold) {
        targets.push({
          type: 'segment',
          elementId: id,
          worldPoint: snapPoint,
          screenPoint: screenSnapPoint,
          distance: screenDistance,
          priority: 50,
          metadata: { label: element.label },
        });
      }
    }

    return targets;
  }

  private findCircleSnaps(worldPoint: WorldPoint, excludeSet: Set<string>): SnapTarget[] {
    const targets: SnapTarget[] = [];

    for (const [id, element] of this.elements) {
      if (excludeSet.has(id)) continue;
      if (element.type !== 'circle') continue;
      if (!element.style.visible) continue;

      const center = this.elements.get(element.centerId);
      if (!center || center.type !== 'point') continue;

      const dx = worldPoint.x - center.x;
      const dy = worldPoint.y - center.y;
      const distToCenter = Math.sqrt(dx * dx + dy * dy);
      
      if (distToCenter === 0) continue;

      const snapX = center.x + (dx / distToCenter) * element.radius;
      const snapY = center.y + (dy / distToCenter) * element.radius;
      const snapWorldPoint = { x: snapX, y: snapY };

      const screenSnapPoint = this.worldToScreen(snapWorldPoint);
      const cursorScreen = this.worldToScreen(worldPoint);
      const screenDx = cursorScreen.x - screenSnapPoint.x;
      const screenDy = cursorScreen.y - screenSnapPoint.y;
      const screenDistance = Math.sqrt(screenDx * screenDx + screenDy * screenDy);

      if (screenDistance <= this.config.lineThreshold) {
        targets.push({
          type: 'circle',
          elementId: id,
          worldPoint: snapWorldPoint,
          screenPoint: screenSnapPoint,
          distance: screenDistance,
          priority: 50,
          metadata: { label: element.label, radius: element.radius },
        });
      }
    }

    return targets;
  }

  private findIntersectionSnaps(worldPoint: WorldPoint, excludeSet: Set<string>): SnapTarget[] {
    const targets: SnapTarget[] = [];
    const lines: Array<{ id: string; a: number; b: number; c: number }> = [];
    const circles: Array<{ id: string; cx: number; cy: number; r: number }> = [];

    for (const [id, element] of this.elements) {
      if (excludeSet.has(id)) continue;
      if (!element.style.visible) continue;

      if (element.type === 'line') {
        lines.push({ id, a: element.a, b: element.b, c: element.c });
      } else if (element.type === 'circle') {
        const center = this.elements.get(element.centerId);
        if (center && center.type === 'point') {
          circles.push({ id, cx: center.x, cy: center.y, r: element.radius });
        }
      }
    }

    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        const intersection = this.lineLineIntersection(lines[i], lines[j]);
        if (intersection) {
          const screenPoint = this.worldToScreen(intersection);
          const cursorScreen = this.worldToScreen(worldPoint);
          const screenDx = cursorScreen.x - screenPoint.x;
          const screenDy = cursorScreen.y - screenPoint.y;
          const screenDistance = Math.sqrt(screenDx * screenDx + screenDy * screenDy);

          if (screenDistance <= this.config.pointThreshold) {
            targets.push({
              type: 'intersection',
              elementIds: [lines[i].id, lines[j].id],
              worldPoint: intersection,
              screenPoint,
              distance: screenDistance,
              priority: 90,
            });
          }
        }
      }
    }

    for (const line of lines) {
      for (const circle of circles) {
        const intersections = this.lineCircleIntersection(line, circle);
        for (const intersection of intersections) {
          const screenPoint = this.worldToScreen(intersection);
          const cursorScreen = this.worldToScreen(worldPoint);
          const screenDx = cursorScreen.x - screenPoint.x;
          const screenDy = cursorScreen.y - screenPoint.y;
          const screenDistance = Math.sqrt(screenDx * screenDx + screenDy * screenDy);

          if (screenDistance <= this.config.pointThreshold) {
            targets.push({
              type: 'intersection',
              elementIds: [line.id, circle.id],
              worldPoint: intersection,
              screenPoint,
              distance: screenDistance,
              priority: 90,
            });
          }
        }
      }
    }

    return targets;
  }

  private findMidpointSnaps(worldPoint: WorldPoint, excludeSet: Set<string>): SnapTarget[] {
    const targets: SnapTarget[] = [];

    for (const [id, element] of this.elements) {
      if (excludeSet.has(id)) continue;
      if (element.type !== 'segment') continue;
      if (!element.style.visible) continue;

      const startPoint = this.elements.get(element.startPointId);
      const endPoint = this.elements.get(element.endPointId);
      
      if (!startPoint || !endPoint) continue;
      if (startPoint.type !== 'point' || endPoint.type !== 'point') continue;

      const midX = (startPoint.x + endPoint.x) / 2;
      const midY = (startPoint.y + endPoint.y) / 2;
      const midPoint = { x: midX, y: midY };

      const screenMidPoint = this.worldToScreen(midPoint);
      const cursorScreen = this.worldToScreen(worldPoint);
      const screenDx = cursorScreen.x - screenMidPoint.x;
      const screenDy = cursorScreen.y - screenMidPoint.y;
      const screenDistance = Math.sqrt(screenDx * screenDx + screenDy * screenDy);

      if (screenDistance <= this.config.pointThreshold) {
        targets.push({
          type: 'midpoint',
          elementId: id,
          worldPoint: midPoint,
          screenPoint: screenMidPoint,
          distance: screenDistance,
          priority: 80,
        });
      }
    }

    return targets;
  }

  private projectPointToSegment(
    point: WorldPoint,
    start: WorldPoint,
    end: WorldPoint
  ): WorldPoint | null {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len2 = dx * dx + dy * dy;

    if (len2 === 0) return null;

    let t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / len2;
    t = Math.max(0, Math.min(1, t));

    return {
      x: start.x + t * dx,
      y: start.y + t * dy,
    };
  }

  private lineLineIntersection(
    line1: { a: number; b: number; c: number },
    line2: { a: number; b: number; c: number }
  ): WorldPoint | null {
    const det = line1.a * line2.b - line2.a * line1.b;
    
    if (Math.abs(det) < 1e-10) return null;

    const x = (line1.b * line2.c - line2.b * line1.c) / det;
    const y = (line2.a * line1.c - line1.a * line2.c) / det;

    return { x, y };
  }

  private lineCircleIntersection(
    line: { a: number; b: number; c: number },
    circle: { cx: number; cy: number; r: number }
  ): WorldPoint[] {
    const intersections: WorldPoint[] = [];
    const { a, b, c } = line;
    const { cx, cy, r } = circle;

    const norm = Math.sqrt(a * a + b * b);
    if (norm === 0) return intersections;

    const normalizedA = a / norm;
    const normalizedB = b / norm;
    const normalizedC = c / norm;

    const dist = Math.abs(normalizedA * cx + normalizedB * cy + normalizedC);

    if (dist > r) return intersections;

    const t = -(normalizedA * cx + normalizedB * cy + normalizedC);
    const baseX = cx + normalizedA * t;
    const baseY = cy + normalizedB * t;

    if (Math.abs(dist - r) < 1e-10) {
      intersections.push({ x: baseX, y: baseY });
    } else {
      const offset = Math.sqrt(r * r - dist * dist);
      intersections.push(
        { x: baseX - normalizedB * offset, y: baseY + normalizedA * offset },
        { x: baseX + normalizedB * offset, y: baseY - normalizedA * offset }
      );
    }

    return intersections;
  }

  renderIndicators(
    ctx: CanvasRenderingContext2D,
    target: SnapTarget | null
  ): void {
    if (!target || !this.config.showSnapIndicators) return;

    const { screenPoint } = target;
    const size = this.config.snapIndicatorSize;
    const color = this.config.snapIndicatorColor;

    ctx.save();
    
    switch (target.type) {
      case 'point':
        this.drawPointIndicator(ctx, screenPoint, size, color);
        break;
      case 'grid':
        this.drawGridIndicator(ctx, screenPoint, size, color);
        break;
      case 'line':
      case 'segment':
        this.drawLineIndicator(ctx, screenPoint, size, color);
        break;
      case 'circle':
        this.drawCircleIndicator(ctx, screenPoint, size, color);
        break;
      case 'intersection':
        this.drawIntersectionIndicator(ctx, screenPoint, size, color);
        break;
      case 'midpoint':
        this.drawMidpointIndicator(ctx, screenPoint, size, color);
        break;
    }
    
    ctx.restore();
  }

  private drawPointIndicator(
    ctx: CanvasRenderingContext2D,
    point: ScreenPoint,
    size: number,
    color: string
  ): void {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    
    ctx.beginPath();
    ctx.arc(point.x, point.y, size + 4, 0, Math.PI * 2);
    ctx.fillStyle = color + '22';
    ctx.fill();
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
    ctx.fillStyle = color + '44';
    ctx.fill();
  }

  private drawGridIndicator(
    ctx: CanvasRenderingContext2D,
    point: ScreenPoint,
    size: number,
    color: string
  ): void {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    
    ctx.beginPath();
    ctx.moveTo(point.x - size, point.y);
    ctx.lineTo(point.x + size, point.y);
    ctx.moveTo(point.x, point.y - size);
    ctx.lineTo(point.x, point.y + size);
    ctx.stroke();
  }

  private drawLineIndicator(
    ctx: CanvasRenderingContext2D,
    point: ScreenPoint,
    size: number,
    color: string
  ): void {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(point.x - size, point.y - size);
    ctx.lineTo(point.x + size, point.y + size);
    ctx.moveTo(point.x + size, point.y - size);
    ctx.lineTo(point.x - size, point.y + size);
    ctx.stroke();
  }

  private drawCircleIndicator(
    ctx: CanvasRenderingContext2D,
    point: ScreenPoint,
    size: number,
    color: string
  ): void {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(point.x, point.y, size * 0.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  private drawIntersectionIndicator(
    ctx: CanvasRenderingContext2D,
    point: ScreenPoint,
    size: number,
    color: string
  ): void {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.arc(point.x, point.y, size * 1.2, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawMidpointIndicator(
    ctx: CanvasRenderingContext2D,
    point: ScreenPoint,
    size: number,
    color: string
  ): void {
    ctx.fillStyle = color;
    
    ctx.beginPath();
    ctx.moveTo(point.x, point.y - size);
    ctx.lineTo(point.x + size, point.y + size);
    ctx.lineTo(point.x - size, point.y + size);
    ctx.closePath();
    ctx.fill();
  }
}
