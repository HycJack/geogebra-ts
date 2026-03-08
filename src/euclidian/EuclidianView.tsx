import React, { useRef, useEffect, useCallback, useState, useImperativeHandle, forwardRef } from 'react';
import { useGeoGebra } from '../core/GeoGebraContext';
import { ScreenPoint, WorldPoint } from '../types';
import { CanvasRenderer } from './CanvasRenderer';
import { SnapManagerImpl, SnapTarget, DEFAULT_SNAP_CONFIG } from './snapping';
import { findIntersections } from './interaction';
import { ZoomIn, ZoomOut, Undo2, Redo2 } from 'lucide-react';

interface PreviewData {
  type: 'segment' | 'line' | 'circle' | 'polygon' | 'perpendicular' | 'parallel' | 'bisector' | 'angular' | 'point';
  startPoint?: WorldPoint;
  endPoint?: WorldPoint;
  center?: WorldPoint;
  radius?: number;
  points?: WorldPoint[];
  lineParams?: { a: number; b: number; c: number };
  sourceLineParams?: { a: number; b: number; c: number };
}

interface EuclidianViewProps {
  width?: number;
  height?: number;
  showAxes?: boolean;
  showGrid?: boolean;
  enableSnap?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export interface EuclidianViewRef {
  zoomIn: () => void;
  zoomOut: () => void;
  getRenderer: () => CanvasRenderer | null;
}

export const EuclidianView = forwardRef<EuclidianViewRef, EuclidianViewProps>(function EuclidianView(
  {
    width = 800,
    height = 600,
    showAxes = true,
    showGrid = true,
    enableSnap = true,
    className,
    style,
  },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const snapManagerRef = useRef<SnapManagerImpl | null>(null);
  const snapTargetRef = useRef<SnapTarget | null>(null);
  const panStartRef = useRef<ScreenPoint | null>(null);
  const isPanningRef = useRef(false);
  const dragStateRef = useRef<{
    elementId: string | null;
    pointIds: string[];
    initialPositions: Map<string, { x: number; y: number }>;
    startWorld: { x: number; y: number };
  } | null>(null);
  const { state, dispatch, updatePointPosition, selectElements, setHovered, startDrag, endDrag, setPreview, addPoint, addIntersectionPoint, addLineFromPointIds, addSegment, addCircle, addPolygon, addVector, deleteElement, addLine, undo, redo, canUndo, canRedo } = useGeoGebra();

  const [pendingPoints, setPendingPoints] = useState<WorldPoint[]>([]);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [boxSelection, setBoxSelection] = useState<{ start: ScreenPoint; end: ScreenPoint } | null>(null);

  useEffect(() => {
    dispatch({ type: 'SET_VIEW', view: { width, height } });
  }, [width, height, dispatch]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const renderer = new CanvasRenderer({
      showGrid, 
      showAxes,
      backgroundColor: '#ffffff',
    });

    renderer.initialize(canvasRef.current);
    rendererRef.current = renderer;

    const snapManager = new SnapManagerImpl(
      (world) => renderer.worldToScreen(world.x, world.y),
      (screen) => renderer.screenToWorld(screen.x, screen.y),
      { ...DEFAULT_SNAP_CONFIG, enabled: enableSnap }
    );
    snapManagerRef.current = snapManager;

    const initSize = () => {
      if (canvasRef.current) {
        renderer.resize();
        renderElements();
      }
    };

    initSize();

    requestAnimationFrame(() => {
      renderElements();
    });

    return () => {
      renderer.destroy();
      rendererRef.current = null;
      snapManagerRef.current = null;
    };
  }, [showGrid, showAxes, enableSnap]);

  // 当view状态变化时更新renderer配置
  useEffect(() => {
    const renderer = rendererRef.current;
    if (renderer) {
      renderer.options.showGrid = state.view.showGrid;
      renderer.options.showAxes = state.view.showAxes;
      renderElements();
    }
  }, [state.view.showGrid, state.view.showAxes]);

  useEffect(() => {
    if (snapManagerRef.current) {
      snapManagerRef.current.updateElements(state.construction.elements);
    }
  }, [state.construction.elements]);

  const applyMirrorTransform = useCallback((element: any, mirrorAxis: any) => {
    const { a, b, c } = mirrorAxis.type === 'line' 
      ? { a: mirrorAxis.a, b: mirrorAxis.b, c: mirrorAxis.c }
      : (() => {
          const start = state.construction.elements.get(mirrorAxis.startPointId);
          const end = state.construction.elements.get(mirrorAxis.endPointId);
          if (start && end && start.type === 'point' && end.type === 'point') {
            return { 
              a: start.y - end.y, 
              b: end.x - start.x, 
              c: start.x * end.y - end.x * start.y 
            };
          }
          return { a: 0, b: 1, c: 0 };
        })();
    
    if (element.type === 'point') {
      const x = element.x;
      const y = element.y;
      const d = (a * x + b * y + c) / (a * a + b * b);
      const newX = x - 2 * a * d;
      const newY = y - 2 * b * d;
      
      addPoint(newX, newY, `${element.label}'`);
    } else if (element.type === 'segment') {
      const start = state.construction.elements.get(element.startPointId);
      const end = state.construction.elements.get(element.endPointId);
      if (start && end && start.type === 'point' && end.type === 'point') {
        const x1 = start.x, y1 = start.y;
        const x2 = end.x, y2 = end.y;
        const d1 = (a * x1 + b * y1 + c) / (a * a + b * b);
        const d2 = (a * x2 + b * y2 + c) / (a * a + b * b);
        const newP1 = addPoint(x1 - 2 * a * d1, y1 - 2 * b * d1, `${start.label}'`);
        const newP2 = addPoint(x2 - 2 * a * d2, y2 - 2 * b * d2, `${end.label}'`);
        addSegment(newP1.id, newP2.id, `${element.label}'`);
      }
    }
  }, [state.construction.elements, addPoint, addSegment]);

  const applyRotateTransform = useCallback((element: any, centerX: number, centerY: number, angle: number) => {
    if (element.type === 'point') {
      const x = element.x;
      const y = element.y;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const newX = centerX + (x - centerX) * cos - (y - centerY) * sin;
      const newY = centerY + (x - centerX) * sin + (y - centerY) * cos;
      updatePointPosition(element.id, newX, newY);
    }
  }, [updatePointPosition]);

  const applyScaleTransform = useCallback((element: any, centerX: number, centerY: number, scale: number) => {
    if (element.type === 'point') {
      const x = element.x;
      const y = element.y;
      const newX = centerX + (x - centerX) * scale;
      const newY = centerY + (y - centerY) * scale;
      updatePointPosition(element.id, newX, newY);
    }
  }, [updatePointPosition]);

  const renderElements = useCallback(() => {
    if (!rendererRef.current) return;
    
    const renderer = rendererRef.current;
    
    renderer.clear();
    renderer.drawGrid();
    renderer.drawAxes();

    const elements = Array.from(state.construction.elements.values());
    const points: typeof elements = [];
    const nonPoints: typeof elements = [];
    
    for (const element of elements) {
      if (!element.style.visible) continue;
      if (element.type === 'point') {
        points.push(element);
      } else {
        nonPoints.push(element);
      }
    }
    
    for (const element of nonPoints) {
      const isSelected = state.interaction.selectedIds.includes(element.id);
      const isPendingIntersect = state.interaction.mode === 'intersect' && pendingPoints.length > 0 && pendingPoints[0].id === element.id;
      const highlightColor = isPendingIntersect ? '#22c55e' : (isSelected ? '#3b82f6' : null);
      
      switch (element.type) {
        case 'segment': {
          const startPoint = state.construction.elements.get(element.startPointId);
          const endPoint = state.construction.elements.get(element.endPointId);
          if (startPoint && endPoint && startPoint.type === 'point' && endPoint.type === 'point') {
            if (highlightColor) {
              renderer.drawSegment(
                startPoint.x,
                startPoint.y,
                endPoint.x,
                endPoint.y,
                highlightColor,
                element.style.strokeWidth + 2
              );
            }
            renderer.drawSegment(
              startPoint.x,
              startPoint.y,
              endPoint.x,
              endPoint.y,
              element.style.strokeColor,
              element.style.strokeWidth
            );
          }
          break;
        }
        
        case 'line':
          if (highlightColor) {
            renderer.drawLine(
              element.a,
              element.b,
              element.c,
              highlightColor,
              element.style.strokeWidth + 2
            );
          }
          renderer.drawLine(
            element.a,
            element.b,
            element.c,
            element.style.strokeColor,
            element.style.strokeWidth
          );
          break;
          
        case 'circle': {
          const center = state.construction.elements.get(element.centerId);
          if (center && center.type === 'point') {
            if (highlightColor) {
              renderer.drawCircle(
                center.x,
                center.y,
                element.radius,
                highlightColor,
                element.style.strokeWidth + 2,
                'transparent'
              );
            }
            renderer.drawCircle(
              center.x,
              center.y,
              element.radius,
              element.style.strokeColor,
              element.style.strokeWidth,
              element.style.fillColor + '33'
            );
          }
          break;
        }
        
        case 'polygon': {
          const pts: Array<{ x: number; y: number }> = [];
          for (const pointId of element.pointIds) {
            const point = state.construction.elements.get(pointId);
            if (point && point.type === 'point') {
              pts.push({ x: point.x, y: point.y });
            }
          }
          if (pts.length >= 3) {
            renderer.drawPolygon(
              pts,
              element.style.strokeColor,
              element.style.strokeWidth,
              element.style.fillColor + '33'
            );
          }
          break;
        }
      }
    }
    
    for (const element of points) {
      if (element.type === 'point') {
        const isSelected = state.interaction.selectedIds.includes(element.id);
        const isHovered = state.interaction.hoveredId === element.id;
        const isPendingIntersect = state.interaction.mode === 'intersect' && pendingPoints.length > 0 && pendingPoints[0].id === element.id;
        
        if (isSelected || isHovered || isPendingIntersect) {
          const ctx = renderer.getContext();
          if (ctx) {
            const screen = renderer.worldToScreen(element.x, element.y);
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, (element.pointSize || 5) + 4, 0, Math.PI * 2);
            ctx.strokeStyle = isPendingIntersect ? '#22c55e' : (isSelected ? '#3b82f6' : '#9ca3af');
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
        
        renderer.drawPoint(
          element.x,
          element.y,
          element.style.fillColor,
          element.pointSize,
          element.label
        );
      }
    }

    if (pendingPoints.length > 0) {
      for (const point of pendingPoints) {
        renderer.drawPoint(point.x, point.y, '#ff6600', 5);
      }
    }

    if (previewData) {
      if (previewData.type === 'segment' && previewData.startPoint && previewData.endPoint) {
        renderer.drawSegment(
          previewData.startPoint.x,
          previewData.startPoint.y,
          previewData.endPoint.x,
          previewData.endPoint.y,
          '#999999',
          1
        );
      }

      if (previewData.type === 'line' && previewData.lineParams) {
        renderer.drawLine(
          previewData.lineParams.a,
          previewData.lineParams.b,
          previewData.lineParams.c,
          '#999999',
          1
        );
      }

      if (previewData.type === 'circle' && previewData.center && previewData.radius !== undefined) {
        renderer.drawCircle(
          previewData.center.x,
          previewData.center.y,
          previewData.radius,
          '#999999',
          1,
          'rgba(153, 153, 153, 0.15)'
        );
      }
      
      if (previewData.type === 'polygon' && previewData.points && previewData.points.length >= 2) {
        renderer.drawPolygon(
          previewData.points,
          '#999999',
          1,
          'rgba(153, 153, 153, 0.15)'
        );
        
        if (pendingPoints.length >= 3) {
          const firstPoint = pendingPoints[0];
          const lastPoint = previewData.points[previewData.points.length - 1];
          const dist = Math.sqrt(
            Math.pow(lastPoint.x - firstPoint.x, 2) + Math.pow(lastPoint.y - firstPoint.y, 2)
          );
          
          if (dist < 0.3) {
            const ctx = renderer.getContext();
            if (ctx) {
              const screen = renderer.worldToScreen(firstPoint.x, firstPoint.y);
              ctx.beginPath();
              ctx.arc(screen.x, screen.y, 12, 0, Math.PI * 2);
              ctx.strokeStyle = '#22c55e';
              ctx.lineWidth = 2;
              ctx.stroke();
              ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
              ctx.fill();
            }
          }
        }
      }

      if ((previewData.type === 'perpendicular' || previewData.type === 'parallel' || previewData.type === 'bisector' || previewData.type === 'angular') && previewData.lineParams) {
        renderer.drawLine(
          previewData.lineParams.a,
          previewData.lineParams.b,
          previewData.lineParams.c,
          '#999999',
          1
        );
      }
    }

    if (snapManagerRef.current && snapTargetRef.current && state.interaction.mode !== 'pan') {
      const ctx = renderer.getContext();
      if (ctx) {
        snapManagerRef.current.renderIndicators(ctx, snapTargetRef.current);
      }
    }
    
    if (boxSelection) {
      const ctx = renderer.getContext();
      if (ctx) {
        const minX = Math.min(boxSelection.start.x, boxSelection.end.x);
        const maxX = Math.max(boxSelection.start.x, boxSelection.end.x);
        const minY = Math.min(boxSelection.start.y, boxSelection.end.y);
        const maxY = Math.max(boxSelection.start.y, boxSelection.end.y);
        
        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
        ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
        
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
        ctx.setLineDash([]);
      }
    }
  }, [state.construction.elements, pendingPoints, previewData, state.interaction.mode, state.interaction.selectedIds, state.interaction.hoveredId, boxSelection]);

  useEffect(() => {
    renderElements();
  }, [renderElements]);

  useEffect(() => {
    if (rendererRef.current && canvasRef.current) {
      rendererRef.current.resize();
      renderElements();
    }
  }, [width, height, renderElements]);

  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      if (rendererRef.current) {
        const canvas = rendererRef.current.getCanvas();
        if (canvas) {
          rendererRef.current.zoom(1.2, canvas.width / 2, canvas.height / 2);
          renderElements();
        }
      }
    },
    zoomOut: () => {
      if (rendererRef.current) {
        const canvas = rendererRef.current.getCanvas();
        if (canvas) {
          rendererRef.current.zoom(0.8, canvas.width / 2, canvas.height / 2);
          renderElements();
        }
      }
    },
    getRenderer: () => rendererRef.current,
  }), [renderElements]);

  const clearPendingState = useCallback(() => {
    setPendingPoints([]);
    setPreviewData(null);
    setPreview([]);
    snapTargetRef.current = null;
  }, [setPreview]);

  useEffect(() => {
    if (canvasRef.current) {
      if (state.interaction.mode === 'pan') {
        canvasRef.current.style.cursor = 'grab';
        setHovered(null);
      } else {
        canvasRef.current.style.cursor = 'default';
      }
    }
  }, [state.interaction.mode, setHovered]);

  useEffect(() => {
    clearPendingState();
  }, [state.interaction.mode, clearPendingState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearPendingState();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearPendingState]);

  const screenToWorld = useCallback(
    (screenX: number, screenY: number): WorldPoint => {
      if (!rendererRef.current) {
        return { x: 0, y: 0 };
      }
      const world = rendererRef.current.screenToWorld(screenX, screenY);
      return { x: world.x, y: world.y };
    },
    []
  );

  const getMousePosition = useCallback(
    (e: React.PointerEvent): ScreenPoint => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },
    []
  );

  const isPointInPolygon = useCallback(
    (x: number, y: number, points: { x: number; y: number }[]): boolean => {
      let inside = false;
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const xi = points[i].x, yi = points[i].y;
        const xj = points[j].x, yj = points[j].y;
        
        const intersect = ((yi > y) !== (yj > y)) &&
          (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        
        if (intersect) inside = !inside;
      }
      return inside;
    },
    []
  );

  const distanceToSegment = useCallback(
    (px: number, py: number, x1: number, y1: number, x2: number, y2: number): number => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const lengthSq = dx * dx + dy * dy;
      
      if (lengthSq === 0) {
        return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
      }
      
      let t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSq));
      const closestX = x1 + t * dx;
      const closestY = y1 + t * dy;
      
      return Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);
    },
    []
  );

  const hitTest = useCallback(
    (screenX: number, screenY: number): string | null => {
      const threshold = 8;

      const points: Array<{ id: string; element: any }> = [];
      const nonPoints: Array<{ id: string; element: any }> = [];
      
      for (const [id, element] of state.construction.elements) {
        if (!element.style.visible) continue;
        if (element.type === 'point') {
          points.push({ id, element });
        } else {
          nonPoints.push({ id, element });
        }
      }
      
      for (const { id, element } of points) {
        if (!rendererRef.current) continue;
        const screen = rendererRef.current.worldToScreen(element.x, element.y);
        const dx = screenX - screen.x;
        const dy = screenY - screen.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= Math.max(threshold, (element.pointSize || 5) + 2)) {
          return id;
        }
      }

      for (const { id, element } of nonPoints) {
        if (!rendererRef.current) continue;
        
        if (element.type === 'line') {
          const a = element.a;
          const b = element.b;
          const c = element.c;
          
          const world = rendererRef.current.screenToWorld(screenX, screenY);
          const numerator = Math.abs(a * world.x + b * world.y + c);
          const denominator = Math.sqrt(a * a + b * b);
          
          if (denominator > 0) {
            const worldDistance = numerator / denominator;
            const worldThreshold = threshold / rendererRef.current.getScale();
            if (worldDistance <= worldThreshold + (element.style.strokeWidth || 1) / 2 / rendererRef.current.getScale()) {
              return id;
            }
          }
        } else if (element.type === 'segment') {
          const startPoint = state.construction.elements.get(element.startPointId);
          const endPoint = state.construction.elements.get(element.endPointId);
          if (startPoint && endPoint && startPoint.type === 'point' && endPoint.type === 'point') {
            if (!rendererRef.current) continue;
            
            const p1 = rendererRef.current.worldToScreen(startPoint.x, startPoint.y);
            const p2 = rendererRef.current.worldToScreen(endPoint.x, endPoint.y);
            
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const lengthSq = dx * dx + dy * dy;
            
            let t = Math.max(0, Math.min(1, ((screenX - p1.x) * dx + (screenY - p1.y) * dy) / lengthSq));
            const closestX = p1.x + t * dx;
            const closestY = p1.y + t * dy;
            
            const distSq = (screenX - closestX) ** 2 + (screenY - closestY) ** 2;
            const thresholdSq = (threshold + (element.style.strokeWidth || 1) / 2) ** 2;
            
            if (distSq <= thresholdSq) {
              return id;
            }
          }
        } else if (element.type === 'circle') {
          const center = state.construction.elements.get(element.centerId);
          if (center && center.type === 'point') {
            if (!rendererRef.current) continue;
            
            const screen = rendererRef.current.worldToScreen(center.x, center.y);
            const dx = screenX - screen.x;
            const dy = screenY - screen.y;
            const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
            const screenRadius = element.radius * rendererRef.current.getScale();
            
            // 检测是否在圆边缘附近
            const distance = Math.abs(distanceFromCenter - screenRadius);
            if (distance <= threshold + (element.style.strokeWidth || 1) / 2) {
              return id;
            }
          }
        } else if (element.type === 'polygon') {
          const polygon = element as any;
          if (polygon.pointIds && polygon.pointIds.length >= 3) {
            if (!rendererRef.current) continue;
            
            // 获取所有顶点的屏幕坐标
            const screenPoints: { x: number; y: number }[] = [];
            for (const pointId of polygon.pointIds) {
              const point = state.construction.elements.get(pointId);
              if (point && point.type === 'point') {
                const screen = rendererRef.current.worldToScreen(point.x, point.y);
                screenPoints.push({ x: screen.x, y: screen.y });
              }
            }
            
            if (screenPoints.length >= 3) {
              // 检测是否在多边形内部
              if (isPointInPolygon(screenX, screenY, screenPoints)) {
                return id;
              }
              
              // 检测是否靠近边
              let minDistance = Infinity;
              for (let i = 0; i < screenPoints.length; i++) {
                const p1 = screenPoints[i];
                const p2 = screenPoints[(i + 1) % screenPoints.length];
                const dist = distanceToSegment(screenX, screenY, p1.x, p1.y, p2.x, p2.y);
                minDistance = Math.min(minDistance, dist);
              }
              
              if (minDistance <= threshold + (polygon.style.strokeWidth || 1) / 2) {
                return id;
              }
            }
          }
        }
      }

      return null;
    },
    [state.construction.elements]
  );

  const getSnappedPosition = useCallback(
    (screenPos: ScreenPoint, worldPos: WorldPoint): WorldPoint => {
      if (!snapManagerRef.current || !enableSnap) {
        return worldPos;
      }

      const snapTarget = snapManagerRef.current.findSnapTarget(screenPos, worldPos);
      
      if (snapTarget) {
        snapTargetRef.current = snapTarget;
        return snapTarget.worldPoint;
      }
      
      snapTargetRef.current = null;
      return worldPos;
    },
    [enableSnap]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const screenPos = getMousePosition(e);
      let worldPos = screenToWorld(screenPos.x, screenPos.y);
      
      worldPos = getSnappedPosition(screenPos, worldPos);
      const snapTarget = snapTargetRef.current;

      switch (state.interaction.mode) {
        case 'move': {
          const hitId = hitTest(screenPos.x, screenPos.y);
          if (hitId) {
            const element = state.construction.elements.get(hitId);
            
            // 检查是否是交点，如果是交点则不允许直接移动
            if (element && element.type === 'point' && !element.isIndependent && element.label && element.label.startsWith('I')) {
              // 交点不能直接移动，忽略点击
              break;
            }
            
            selectElements([hitId]);
            startDrag(screenPos);
            setBoxSelection(null);
            
            if (element) {
              const pointIds: string[] = [];
              const initialPositions = new Map<string, { x: number; y: number }>();
              
              if (element.type === 'segment') {
                const segment = element as any;
                pointIds.push(segment.startPointId, segment.endPointId);
              } else if (element.type === 'line') {
                const line = element as any;
                if (line.parentIds && line.parentIds.length === 2) {
                  pointIds.push(...line.parentIds);
                }
              } else if (element.type === 'circle') {
                const circle = element as any;
                pointIds.push(circle.centerId);
              } else if (element.type === 'polygon') {
                const polygon = element as any;
                if (polygon.pointIds) {
                  pointIds.push(...polygon.pointIds);
                }
              }
              
              for (const pointId of pointIds) {
                const point = state.construction.elements.get(pointId);
                if (point && point.type === 'point') {
                  initialPositions.set(pointId, { x: point.x, y: point.y });
                }
              }
              
              dragStateRef.current = {
                elementId: hitId,
                pointIds,
                initialPositions,
                startWorld: worldPos
              };
            }
          } else {
            selectElements([]);
            dragStateRef.current = null;
            setBoxSelection({ start: screenPos, end: screenPos });
            startDrag(screenPos);
          }
          break;
        }

        case 'point': {
          if (snapTarget?.type === 'point' && snapTarget.elementId) {
            selectElements([snapTarget.elementId]);
          } else {
            addPoint(worldPos.x, worldPos.y);
          }
          break;
        }

        case 'segment': {
          if (pendingPoints.length === 0) {
            if (snapTarget?.type === 'point' && snapTarget.elementId) {
              const existingPoint = state.construction.elements.get(snapTarget.elementId);
              if (existingPoint && existingPoint.type === 'point') {
                setPendingPoints([{ x: existingPoint.x, y: existingPoint.y, id: existingPoint.id }]);
              }
            } else {
              setPendingPoints([worldPos]);
            }
          } else {
            let p1Id: string;
            let p2Id: string;
            
            if (pendingPoints[0].id) {
              p1Id = pendingPoints[0].id;
            } else {
              const p1 = addPoint(pendingPoints[0].x, pendingPoints[0].y);
              p1Id = p1.id;
            }
            
            if (snapTarget?.type === 'point' && snapTarget.elementId) {
              p2Id = snapTarget.elementId;
            } else {
              const p2 = addPoint(worldPos.x, worldPos.y);
              p2Id = p2.id;
            }
            
            addSegment(p1Id, p2Id);
            setPendingPoints([]);
            setPreviewData(null);
          }
          break;
        }

        case 'line': {
          if (pendingPoints.length === 0) {
            if (snapTarget?.type === 'point' && snapTarget.elementId) {
              const existingPoint = state.construction.elements.get(snapTarget.elementId);
              if (existingPoint && existingPoint.type === 'point') {
                setPendingPoints([{ x: existingPoint.x, y: existingPoint.y, id: existingPoint.id }]);
              }
            } else {
              setPendingPoints([worldPos]);
            }
          } else {
            let p1Id: string;
            let p2Id: string;
            
            if (pendingPoints[0].id) {
              p1Id = pendingPoints[0].id;
            } else {
              const p1 = addPoint(pendingPoints[0].x, pendingPoints[0].y);
              p1Id = p1.id;
            }
            
            if (snapTarget?.type === 'point' && snapTarget.elementId) {
              p2Id = snapTarget.elementId;
            } else {
              const p2 = addPoint(worldPos.x, worldPos.y);
              p2Id = p2.id;
            }
            
            addLineFromPointIds(p1Id, p2Id);
            setPendingPoints([]);
            setPreviewData(null);
          }
          break;
        }

        case 'circle':
        case 'circle_center_point': {
          if (pendingPoints.length === 0) {
            if (snapTarget?.type === 'point' && snapTarget.elementId) {
              const existingPoint = state.construction.elements.get(snapTarget.elementId);
              if (existingPoint && existingPoint.type === 'point') {
                setPendingPoints([{ x: existingPoint.x, y: existingPoint.y, id: existingPoint.id }]);
              }
            } else {
              setPendingPoints([worldPos]);
            }
          } else {
            let centerId: string;
            
            if (pendingPoints[0].id) {
              centerId = pendingPoints[0].id;
            } else {
              const center = addPoint(pendingPoints[0].x, pendingPoints[0].y);
              centerId = center.id;
            }
            
            let edgePoint = worldPos;
            if (snapTarget?.type === 'point' && snapTarget.elementId) {
              const existingPoint = state.construction.elements.get(snapTarget.elementId);
              if (existingPoint && existingPoint.type === 'point') {
                edgePoint = { x: existingPoint.x, y: existingPoint.y };
              }
            }
            
            const centerElement = state.construction.elements.get(centerId);
            const cx = centerElement && centerElement.type === 'point' ? centerElement.x : pendingPoints[0].x;
            const cy = centerElement && centerElement.type === 'point' ? centerElement.y : pendingPoints[0].y;
            
            const radius = Math.sqrt(
              Math.pow(edgePoint.x - cx, 2) + Math.pow(edgePoint.y - cy, 2)
            );
            addCircle(centerId, radius, undefined, undefined, true);
            setPendingPoints([]);
            setPreviewData(null);
          }
          break;
        }

        case 'circle_center_radius': {
          if (pendingPoints.length === 0) {
            if (snapTarget?.type === 'point' && snapTarget.elementId) {
              const existingPoint = state.construction.elements.get(snapTarget.elementId);
              if (existingPoint && existingPoint.type === 'point') {
                setPendingPoints([{ x: existingPoint.x, y: existingPoint.y, id: existingPoint.id }]);
              }
            } else {
              setPendingPoints([worldPos]);
            }
          } else {
            let centerId: string = '';
            
            if (pendingPoints[0].id) {
              centerId = pendingPoints[0].id;
            } else {
              const center = addPoint(pendingPoints[0].x, pendingPoints[0].y);
              centerId = center.id;
            }
            
            const radiusInput = prompt('请输入半径:', '1');
            const radius = radiusInput ? parseFloat(radiusInput) : NaN;
            if (!isNaN(radius) && radius > 0 && centerId) {
              addCircle(centerId, radius);
            }
            setPendingPoints([]);
            setPreviewData(null);
          }
          break;
        }

        case 'circle_point_radius': {
          if (pendingPoints.length === 0) {
            setPendingPoints([worldPos]);
          } else {
            const radius = Math.sqrt(
              Math.pow(worldPos.x - pendingPoints[0].x, 2) + Math.pow(worldPos.y - pendingPoints[0].y, 2)
            );
            
            let centerId: string;
            if (snapTarget?.type === 'point' && snapTarget.elementId) {
              centerId = snapTarget.elementId;
            } else {
              const center = addPoint(worldPos.x, worldPos.y);
              centerId = center.id;
            }
            
            addCircle(centerId, radius, undefined, undefined, false);
            setPendingPoints([]);
            setPreviewData(null);
          }
          break;
        }

        case 'circle_three_points': {
          if (pendingPoints.length < 3) {
            if (snapTarget?.type === 'point' && snapTarget.elementId) {
              const existingPoint = state.construction.elements.get(snapTarget.elementId);
              if (existingPoint && existingPoint.type === 'point') {
                setPendingPoints([...pendingPoints, { x: existingPoint.x, y: existingPoint.y, id: existingPoint.id }]);
              }
            } else {
              setPendingPoints([...pendingPoints, worldPos]);
            }
          } else if (pendingPoints.length === 3) {
            const p1 = pendingPoints[0];
            const p2 = pendingPoints[1];
            const p3 = pendingPoints[2];
            
            // 计算过三点的圆
            const A = p2.x - p1.x;
            const B = p2.y - p1.y;
            const C = p3.x - p1.x;
            const D = p3.y - p1.y;
            const E = A * (p1.x + p2.x) + B * (p1.y + p2.y);
            const F = C * (p1.x + p3.x) + D * (p1.y + p3.y);
            const G = 2 * (A * (p3.y - p2.y) - B * (p3.x - p2.x));
            
            if (Math.abs(G) > 1e-10) {
              const cx = (D * E - B * F) / G;
              const cy = (A * F - C * E) / G;
              
              let centerId: string;
              if (snapTarget?.type === 'point' && snapTarget.elementId) {
                centerId = snapTarget.elementId;
              } else {
                const center = addPoint(cx, cy);
                centerId = center.id;
              }
              
              const radius = Math.sqrt(
                Math.pow(cx - p1.x, 2) + Math.pow(cy - p1.y, 2)
              );
              addCircle(centerId, radius, undefined, undefined, false);
            }
            
            setPendingPoints([]);
            setPreviewData(null);
          }
          break;
        }

        case 'polygon': {
          if (pendingPoints.length === 0) {
            if (snapTarget?.type === 'point' && snapTarget.elementId) {
              const existingPoint = state.construction.elements.get(snapTarget.elementId);
              if (existingPoint && existingPoint.type === 'point') {
                setPendingPoints([{ x: existingPoint.x, y: existingPoint.y, id: existingPoint.id }]);
              }
            } else {
              setPendingPoints([worldPos]);
            }
          } else {
            const firstPoint = pendingPoints[0];
            const dist = Math.sqrt(
              Math.pow(worldPos.x - firstPoint.x, 2) + Math.pow(worldPos.y - firstPoint.y, 2)
            );

            if (dist < 0.2 && pendingPoints.length >= 3) {
              const pointIds: string[] = [];
              for (const p of pendingPoints) {
                if (p.id) {
                  pointIds.push(p.id);
                } else {
                  const newPoint = addPoint(p.x, p.y);
                  pointIds.push(newPoint.id);
                }
              }
              addPolygon(pointIds);
              setPendingPoints([]);
              setPreviewData(null);
            } else {
              if (snapTarget?.type === 'point' && snapTarget.elementId) {
                const existingPoint = state.construction.elements.get(snapTarget.elementId);
                if (existingPoint && existingPoint.type === 'point') {
                  setPendingPoints([...pendingPoints, { x: existingPoint.x, y: existingPoint.y, id: existingPoint.id }]);
                }
              } else {
                setPendingPoints([...pendingPoints, worldPos]);
              }
            }
          }
          break;
        }

        case 'vector': {
          if (pendingPoints.length === 0) {
            if (snapTarget?.type === 'point' && snapTarget.elementId) {
              const existingPoint = state.construction.elements.get(snapTarget.elementId);
              if (existingPoint && existingPoint.type === 'point') {
                setPendingPoints([{ x: existingPoint.x, y: existingPoint.y, id: existingPoint.id }]);
              }
            } else {
              setPendingPoints([worldPos]);
            }
          } else {
            let startPointId: string;
            
            if (pendingPoints[0].id) {
              startPointId = pendingPoints[0].id;
            } else {
              const startPoint = addPoint(pendingPoints[0].x, pendingPoints[0].y);
              startPointId = startPoint.id;
            }
            
            let endPointId: string;
            if (snapTarget?.type === 'point' && snapTarget.elementId) {
              const existingPoint = state.construction.elements.get(snapTarget.elementId);
              if (existingPoint && existingPoint.type === 'point') {
                endPointId = existingPoint.id;
              } else {
                const newEndPoint = addPoint(worldPos.x, worldPos.y);
                endPointId = newEndPoint.id;
              }
            } else {
              const newEndPoint = addPoint(worldPos.x, worldPos.y);
              endPointId = newEndPoint.id;
            }
            
            addVector(startPointId, endPointId);
            setPendingPoints([]);
            setPreviewData(null);
          }
          break;
        }

        case 'delete': {
          const hitId = hitTest(screenPos.x, screenPos.y);
          if (hitId) {
            deleteElement(hitId);
          }
          break;
        }

        case 'intersect': {
          const hitId = hitTest(screenPos.x, screenPos.y);
          if (hitId) {
            if (pendingPoints.length === 0) {
              const element = state.construction.elements.get(hitId);
              if (element && (element.type === 'line' || element.type === 'segment' || element.type === 'circle')) {
                setPendingPoints([{ x: 0, y: 0, id: hitId }]);
              }
            } else if (pendingPoints.length === 1) {
              const firstElementId = pendingPoints[0].id;
              const secondElement = state.construction.elements.get(hitId);
              const firstElement = state.construction.elements.get(firstElementId!);
              
              if (firstElement && secondElement && 
                  (secondElement.type === 'line' || secondElement.type === 'segment' || secondElement.type === 'circle')) {
                const getElement = (id: string) => state.construction.elements.get(id);
                const intersections = findIntersections(firstElement, secondElement, getElement);
                
                for (const point of intersections) {
                  addIntersectionPoint(point.x, point.y, [firstElementId!, hitId]);
                }
                
                setPendingPoints([]);
              }
            }
          }
          break;
        }

        case 'perpendicular':
        case 'parallel': {
          if (pendingPoints.length === 0) {
            const hitId = hitTest(screenPos.x, screenPos.y);
            if (hitId) {
              const element = state.construction.elements.get(hitId);
              if (element && (element.type === 'line' || element.type === 'segment')) {
                let lineParams: { a: number; b: number; c: number };
                if (element.type === 'line') {
                  lineParams = { a: element.a, b: element.b, c: element.c };
                } else {
                  const startPoint = state.construction.elements.get(element.startPointId);
                  const endPoint = state.construction.elements.get(element.endPointId);
                  if (startPoint && endPoint && startPoint.type === 'point' && endPoint.type === 'point') {
                    const x1 = startPoint.x, y1 = startPoint.y;
                    const x2 = endPoint.x, y2 = endPoint.y;
                    lineParams = { a: y1 - y2, b: x2 - x1, c: x1 * y2 - x2 * y1 };
                  } else {
                    break;
                  }
                }
                setPendingPoints([{ x: lineParams.a, y: lineParams.b, id: hitId }]);
                setPreviewData({ 
                  type: state.interaction.mode as 'perpendicular' | 'parallel',
                  sourceLineParams: lineParams 
                });
              }
            }
          } else if (pendingPoints.length === 1 && previewData?.sourceLineParams) {
            const lineParams = previewData.sourceLineParams;
            const { a, b } = lineParams;
            
            let pointX: number, pointY: number;
            if (snapTarget?.type === 'point' && snapTarget.elementId) {
              const existingPoint = state.construction.elements.get(snapTarget.elementId);
              if (existingPoint && existingPoint.type === 'point') {
                pointX = existingPoint.x;
                pointY = existingPoint.y;
              } else {
                break;
              }
            } else {
              pointX = worldPos.x;
              pointY = worldPos.y;
            }
            
            if (state.interaction.mode === 'perpendicular') {
              const newA = -b;
              const newB = a;
              const newC = b * pointX - a * pointY;
              addLine(newA, newB, newC);
            } else {
              const newC = -a * pointX - b * pointY;
              addLine(a, b, newC);
            }
            
            setPendingPoints([]);
            setPreviewData(null);
          }
          break;
        }

        case 'perpendicular_bisector': {
          if (pendingPoints.length === 0) {
            if (snapTarget?.type === 'point' && snapTarget.elementId) {
              const existingPoint = state.construction.elements.get(snapTarget.elementId);
              if (existingPoint && existingPoint.type === 'point') {
                setPendingPoints([{ x: existingPoint.x, y: existingPoint.y, id: existingPoint.id }]);
              }
            } else {
              setPendingPoints([worldPos]);
            }
          } else if (pendingPoints.length === 1) {
            const p1 = pendingPoints[0];
            const p2 = worldPos;
            
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const mx = (p1.x + p2.x) / 2;
            const my = (p1.y + p2.y) / 2;
            
            const a = dx;
            const b = dy;
            const c = -(dx * mx + dy * my);
            
            addLine(a, b, c);
            setPendingPoints([]);
            setPreviewData(null);
          }
          break;
        }

        case 'angular_bisector': {
          if (pendingPoints.length < 3) {
            if (snapTarget?.type === 'point' && snapTarget.elementId) {
              const existingPoint = state.construction.elements.get(snapTarget.elementId);
              if (existingPoint && existingPoint.type === 'point') {
                setPendingPoints([...pendingPoints, { x: existingPoint.x, y: existingPoint.y, id: existingPoint.id }]);
              }
            } else {
              setPendingPoints([...pendingPoints, worldPos]);
            }
          } else if (pendingPoints.length === 3) {
            const vertex = pendingPoints[1];
            const p1 = pendingPoints[0];
            const p2 = pendingPoints[2];
            
            const dx1 = p1.x - vertex.x;
            const dy1 = p1.y - vertex.y;
            const dx2 = p2.x - vertex.x;
            const dy2 = p2.y - vertex.y;
            
            const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
            const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
            
            const nx1 = dx1 / len1;
            const ny1 = dy1 / len1;
            const nx2 = dx2 / len2;
            const ny2 = dy2 / len2;
            
            const bx = nx1 + nx2;
            const by = ny1 + ny2;
            
            const blen = Math.sqrt(bx * bx + by * by);
            
            let a, b, c;
            if (blen < 1e-10) {
              a = -ny1;
              b = nx1;
              c = ny1 * vertex.x - nx1 * vertex.y;
            } else {
              const nbx = bx / blen;
              const nby = by / blen;
              a = -nby;
              b = nbx;
              c = nby * vertex.x - nbx * vertex.y;
            }
            
            addLine(a, b, c);
            setPendingPoints([]);
            setPreviewData(null);
          }
          break;
        }

        case 'pan': {
          panStartRef.current = screenPos;
          isPanningRef.current = true;
          if (canvasRef.current) {
            canvasRef.current.style.cursor = 'grabbing';
          }
          break;
        }

        case 'translate': {
          const hitId = hitTest(screenPos.x, screenPos.y);
          if (hitId) {
            selectElements([hitId]);
            startDrag(screenPos);
          }
          break;
        }

        case 'rotate': {
          if (pendingPoints.length === 0) {
            const hitId = hitTest(screenPos.x, screenPos.y);
            if (hitId) {
              selectElements([hitId]);
              setPendingPoints([{ x: worldPos.x, y: worldPos.y, id: hitId }]);
            }
          } else if (pendingPoints.length === 1) {
            setPendingPoints([...pendingPoints, worldPos]);
          }
          break;
        }

        case 'scale': {
          if (pendingPoints.length === 0) {
            const hitId = hitTest(screenPos.x, screenPos.y);
            if (hitId) {
              selectElements([hitId]);
              setPendingPoints([{ x: worldPos.x, y: worldPos.y, id: hitId }]);
            }
          } else if (pendingPoints.length === 1) {
            setPendingPoints([...pendingPoints, worldPos]);
          }
          break;
        }

        case 'mirror': {
          if (pendingPoints.length === 0) {
            const hitId = hitTest(screenPos.x, screenPos.y);
            if (hitId) {
              selectElements([hitId]);
              setPendingPoints([{ x: worldPos.x, y: worldPos.y, id: hitId }]);
            }
          } else if (pendingPoints.length === 1) {
            const mirrorAxisId = hitTest(screenPos.x, screenPos.y);
            if (mirrorAxisId) {
              const mirrorElement = state.construction.elements.get(mirrorAxisId);
              if (mirrorElement && (mirrorElement.type === 'line' || mirrorElement.type === 'segment')) {
                const selectedId = pendingPoints[0].id;
                if (selectedId) {
                  const selectedElement = state.construction.elements.get(selectedId);
                  if (selectedElement) {
                    applyMirrorTransform(selectedElement, mirrorElement);
                  }
                }
              }
            }
            setPendingPoints([]);
            setPreviewData(null);
          }
          break;
        }

        default:
          break;
      }
    },
    [state.interaction.mode, pendingPoints, getMousePosition, screenToWorld, hitTest, selectElements, startDrag, addLineFromPointIds, getSnappedPosition, addPoint, state.construction.elements]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const screenPos = getMousePosition(e);
      let worldPos = screenToWorld(screenPos.x, screenPos.y);
      
      if (isPanningRef.current && panStartRef.current && rendererRef.current) {
        const dx = screenPos.x - panStartRef.current.x;
        const dy = screenPos.y - panStartRef.current.y;
        
        const currentOffset = rendererRef.current.getOffset();
        rendererRef.current.setOffset(currentOffset.x + dx, currentOffset.y + dy);
        
        panStartRef.current = screenPos;
        snapTargetRef.current = null;
        renderElements();
        return;
      }
      
      if (state.interaction.mode === 'pan') {
        snapTargetRef.current = null;
        return;
      }
      
      if (state.interaction.mode === 'move' && state.interaction.isDragging && boxSelection) {
        setBoxSelection({ ...boxSelection, end: screenPos });
        renderElements();
        return;
      }
      
      const needsSnap = ['point', 'segment', 'line', 'circle', 'polygon', 'perpendicular', 'parallel', 'perpendicular_bisector', 'angular_bisector'].includes(state.interaction.mode);
      
      if (needsSnap) {
        worldPos = getSnappedPosition(screenPos, worldPos);
        renderElements();
      } else {
        snapTargetRef.current = null;
      }

      if (state.interaction.isDragging && state.interaction.selectedIds.length > 0) {
        const selectedId = state.interaction.selectedIds[0];
        const geo = state.construction.elements.get(selectedId);

        if (geo && geo.type === 'point') {
          updatePointPosition(selectedId, worldPos.x, worldPos.y);
        } else if (dragStateRef.current) {
          const dragState = dragStateRef.current;
          const deltaX = worldPos.x - dragState.startWorld.x;
          const deltaY = worldPos.y - dragState.startWorld.y;
          
          for (const pointId of dragState.pointIds) {
            const initialPos = dragState.initialPositions.get(pointId);
            if (initialPos) {
              updatePointPosition(pointId, initialPos.x + deltaX, initialPos.y + deltaY);
            }
          }
        }
      } else {
        const hitId = hitTest(screenPos.x, screenPos.y);
        setHovered(hitId);
      }

      if (pendingPoints.length > 0) {
        const mode = state.interaction.mode;
        
        if (mode === 'segment' && pendingPoints.length === 1) {
          const newPreviewData: PreviewData = { type: 'segment' };
          newPreviewData.startPoint = pendingPoints[0];
          newPreviewData.endPoint = worldPos;
          setPreviewData(newPreviewData);
        } else if (mode === 'line' && pendingPoints.length === 1) {
          const newPreviewData: PreviewData = { type: 'line' };
          const a = worldPos.y - pendingPoints[0].y;
          const b = pendingPoints[0].x - worldPos.x;
          const c = worldPos.x * pendingPoints[0].y - pendingPoints[0].x * worldPos.y;
          newPreviewData.lineParams = { a, b, c };
          setPreviewData(newPreviewData);
        } else if ((mode === 'circle' || mode === 'circle_center_point') && pendingPoints.length === 1) {
          const newPreviewData: PreviewData = { type: 'circle' };
          const radius = Math.sqrt(
            Math.pow(worldPos.x - pendingPoints[0].x, 2) +
              Math.pow(worldPos.y - pendingPoints[0].y, 2)
          );
          newPreviewData.center = pendingPoints[0];
          newPreviewData.radius = radius;
          setPreviewData(newPreviewData);
        } else if (mode === 'circle_point_radius' && pendingPoints.length === 1) {
          const newPreviewData: PreviewData = { type: 'circle' };
          const radius = Math.sqrt(
            Math.pow(worldPos.x - pendingPoints[0].x, 2) +
              Math.pow(worldPos.y - pendingPoints[0].y, 2)
          );
          newPreviewData.center = worldPos;
          newPreviewData.radius = radius;
          setPreviewData(newPreviewData);
        } else if (mode === 'circle_three_points' && pendingPoints.length >= 1) {
          if (pendingPoints.length === 1) {
            const newPreviewData: PreviewData = { type: 'polygon' };
            newPreviewData.points = [pendingPoints[0], worldPos];
            setPreviewData(newPreviewData);
          } else if (pendingPoints.length === 2) {
            const newPreviewData: PreviewData = { type: 'polygon' };
            newPreviewData.points = [pendingPoints[0], pendingPoints[1], worldPos];
            setPreviewData(newPreviewData);
          }
        } else if (mode === 'polygon' && pendingPoints.length >= 1) {
          const newPreviewData: PreviewData = { type: 'polygon' };
          newPreviewData.points = [...pendingPoints, worldPos];
          setPreviewData(newPreviewData);
        } else if (mode === 'vector' && pendingPoints.length === 1) {
          const newPreviewData: PreviewData = { type: 'segment' };
          newPreviewData.startPoint = pendingPoints[0];
          newPreviewData.endPoint = worldPos;
          setPreviewData(newPreviewData);
        } else if ((mode === 'perpendicular' || mode === 'parallel') && pendingPoints.length === 1 && previewData?.sourceLineParams) {
          const newPreviewData: PreviewData = { ...previewData };
          const { a, b } = previewData.sourceLineParams;
          
          let pointX: number, pointY: number;
          const currentSnapTarget = snapTargetRef.current;
          if (currentSnapTarget?.type === 'point' && currentSnapTarget.elementId) {
            const existingPoint = state.construction.elements.get(currentSnapTarget.elementId);
            if (existingPoint && existingPoint.type === 'point') {
              pointX = existingPoint.x;
              pointY = existingPoint.y;
            } else {
              pointX = worldPos.x;
              pointY = worldPos.y;
            }
          } else {
            pointX = worldPos.x;
            pointY = worldPos.y;
          }
          
          if (mode === 'perpendicular') {
            newPreviewData.lineParams = { a: -b, b: a, c: b * pointX - a * pointY };
          } else {
            newPreviewData.lineParams = { a, b, c: -a * pointX - b * pointY };
          }
          setPreviewData(newPreviewData);
        } else if (mode === 'perpendicular_bisector' && pendingPoints.length === 1) {
          const newPreviewData: PreviewData = { type: 'bisector' };
          const p1 = pendingPoints[0];
          const dx = worldPos.x - p1.x;
          const dy = worldPos.y - p1.y;
          const mx = (p1.x + worldPos.x) / 2;
          const my = (p1.y + worldPos.y) / 2;
          newPreviewData.lineParams = { a: dx, b: dy, c: -(dx * mx + dy * my) };
          setPreviewData(newPreviewData);
        } else if (mode === 'angular_bisector' && pendingPoints.length >= 1) {
          const newPreviewData: PreviewData = { type: 'angular' };
          if (pendingPoints.length === 1) {
            newPreviewData.points = [pendingPoints[0], worldPos];
          } else if (pendingPoints.length === 2) {
            const vertex = pendingPoints[1];
            const p1 = pendingPoints[0];
            const p2 = worldPos;
            
            const dx1 = p1.x - vertex.x;
            const dy1 = p1.y - vertex.y;
            const dx2 = p2.x - vertex.x;
            const dy2 = p2.y - vertex.y;
            
            const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
            const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
            
            const nx1 = dx1 / len1;
            const ny1 = dy1 / len1;
            const nx2 = dx2 / len2;
            const ny2 = dy2 / len2;
            
            const bx = nx1 + nx2;
            const by = ny1 + ny2;
            
            const blen = Math.sqrt(bx * bx + by * by);
            
            let a, b, c;
            if (blen < 1e-10) {
              a = -ny1;
              b = nx1;
              c = ny1 * vertex.x - nx1 * vertex.y;
            } else {
              const nbx = bx / blen;
              const nby = by / blen;
              a = -nby;
              b = nbx;
              c = nby * vertex.x - nbx * vertex.y;
            }
            
            newPreviewData.lineParams = { a, b, c };
          }
          setPreviewData(newPreviewData);
        } else if ((mode === 'rotate' || mode === 'scale') && pendingPoints.length === 2) {
          const selectedId = pendingPoints[0].id;
          const centerPoint = pendingPoints[1];
          const selectedElement = selectedId ? state.construction.elements.get(selectedId) : null;
          
          if (selectedElement && selectedElement.type === 'point') {
            const x = selectedElement.x;
            const y = selectedElement.y;
            
            if (mode === 'rotate') {
              const angle = Math.atan2(worldPos.y - centerPoint.y, worldPos.x - centerPoint.x) - 
                           Math.atan2(y - centerPoint.y, x - centerPoint.x);
              applyRotateTransform(selectedElement, centerPoint.x, centerPoint.y, angle);
            } else {
              const dist1 = Math.sqrt(Math.pow(x - centerPoint.x, 2) + Math.pow(y - centerPoint.y, 2));
              const dist2 = Math.sqrt(Math.pow(worldPos.x - centerPoint.x, 2) + Math.pow(worldPos.y - centerPoint.y, 2));
              const scale = dist1 > 0 ? dist2 / dist1 : 1;
              applyScaleTransform(selectedElement, centerPoint.x, centerPoint.y, scale);
            }
          }
        } else {
          setPreviewData(null);
        }
      } else {
        setPreviewData(null);
      }
    },
    [
      state.interaction.isDragging,
      state.interaction.selectedIds,
      state.interaction.mode,
      state.construction.elements,
      pendingPoints,
      getMousePosition,
      screenToWorld,
      hitTest,
      updatePointPosition,
      setHovered,
      getSnappedPosition,
      renderElements,
      applyRotateTransform,
      applyScaleTransform,
    ]
  );

  const handlePointerUp = useCallback(() => {
    dragStateRef.current = null;
    if (state.interaction.isDragging) {
      endDrag();
    }
    
    if (boxSelection) {
      const minX = Math.min(boxSelection.start.x, boxSelection.end.x);
      const maxX = Math.max(boxSelection.start.x, boxSelection.end.x);
      const minY = Math.min(boxSelection.start.y, boxSelection.end.y);
      const maxY = Math.max(boxSelection.start.y, boxSelection.end.y);
      
      const selectedIds: string[] = [];
      
      for (const [id, element] of state.construction.elements) {
        if (element.type === 'point') {
          const screen = rendererRef.current?.worldToScreen(element.x, element.y);
          if (screen && screen.x >= minX && screen.x <= maxX && screen.y >= minY && screen.y <= maxY) {
            selectedIds.push(id);
          }
        }
      }
      
      selectElements(selectedIds);
      setBoxSelection(null);
    }
    
    if (state.interaction.mode === 'rotate' && pendingPoints.length === 2) {
      setPendingPoints([]);
      setPreviewData(null);
    }
    
    if (state.interaction.mode === 'scale' && pendingPoints.length === 2) {
      setPendingPoints([]);
      setPreviewData(null);
    }
    
    if (isPanningRef.current) {
      isPanningRef.current = false;
      panStartRef.current = null;
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'grab';
      }
    }
  }, [state.interaction.isDragging, state.interaction.mode, endDrag, boxSelection, state.construction.elements, selectElements, pendingPoints]);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || !rendererRef.current) return;

      const rect = canvas.getBoundingClientRect();
      const screenPos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      const factor = e.deltaY > 0 ? 0.9 : 1.1;

      rendererRef.current.zoom(factor, screenPos.x, screenPos.y);
      renderElements();
    },
    [renderElements]
  );

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: `${width}px`, height: `${height}px`, backgroundColor: '#ffffff', touchAction: 'none', position: 'relative', ...style }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        style={{ 
          touchAction: 'none',
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
      <div style={{ position: 'absolute', bottom: '10px', left: '10px', display: 'flex', gap: '8px', backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: '8px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
        <button
          onClick={() => {
            const renderer = rendererRef.current;
            if (renderer) {
              renderer.zoom(1.1, width / 2, height / 2);
              renderElements();
            }
          }}
          title="放大"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '4px',
            border: '1px solid #e5e7eb',
            backgroundColor: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={() => {
            const renderer = rendererRef.current;
            if (renderer) {
              renderer.zoom(0.9, width / 2, height / 2);
              renderElements();
            }
          }}
          title="缩小"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '4px',
            border: '1px solid #e5e7eb',
            backgroundColor: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ZoomOut size={16} />
        </button>
        <div style={{ width: '1px', height: '24px', backgroundColor: '#e5e7eb' }} />
        <button
          onClick={undo}
          disabled={!canUndo}
          title="撤销 (Ctrl+Z)"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '4px',
            border: '1px solid #e5e7eb',
            backgroundColor: canUndo ? 'white' : '#f9fafb',
            color: canUndo ? '#374151' : '#d1d5db',
            cursor: canUndo ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Undo2 size={16} />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          title="重做 (Ctrl+Y)"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '4px',
            border: '1px solid #e5e7eb',
            backgroundColor: canRedo ? 'white' : '#f9fafb',
            color: canRedo ? '#374151' : '#d1d5db',
            cursor: canRedo ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Redo2 size={16} />
        </button>
      </div>
    </div>
  );
});
