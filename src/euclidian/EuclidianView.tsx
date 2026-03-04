import React, { useRef, useEffect, useCallback, useState, useImperativeHandle, forwardRef } from 'react';
import { useGeoGebra } from '../core/GeoGebraContext';
import { ScreenPoint, WorldPoint } from '../types';
import { CanvasRenderer } from '../euclidian/CanvasRenderer';
import { SnapManagerImpl, SnapTarget, DEFAULT_SNAP_CONFIG } from './snapping';
import { findIntersections } from './interaction';

interface PreviewData {
  type: 'segment' | 'line' | 'circle' | 'polygon';
  startPoint?: WorldPoint;
  endPoint?: WorldPoint;
  center?: WorldPoint;
  radius?: number;
  points?: WorldPoint[];
  lineParams?: { a: number; b: number; c: number };
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
  const { state, dispatch, updatePointPosition, selectElements, setHovered, startDrag, endDrag, setPreview, addPoint, addIntersectionPoint, addLineFromPointIds, addSegment, addCircle, addPolygon, deleteElement } = useGeoGebra();

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
      initSize();
    });

    return () => {
      renderer.destroy();
      rendererRef.current = null;
      snapManagerRef.current = null;
    };
  }, [showGrid, showAxes, enableSnap]);

  useEffect(() => {
    if (snapManagerRef.current) {
      snapManagerRef.current.updateElements(state.construction.elements);
    }
  }, [state.construction.elements]);

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
            selectElements([hitId]);
            startDrag(screenPos);
            setBoxSelection(null);
            
            const element = state.construction.elements.get(hitId);
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

        case 'circle': {
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
            addCircle(centerId, radius);
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

        case 'pan': {
          panStartRef.current = screenPos;
          isPanningRef.current = true;
          if (canvasRef.current) {
            canvasRef.current.style.cursor = 'grabbing';
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
      
      const needsSnap = ['point', 'segment', 'line', 'circle', 'polygon'].includes(state.interaction.mode);
      
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
        } else if (mode === 'circle' && pendingPoints.length === 1) {
          const newPreviewData: PreviewData = { type: 'circle' };
          const radius = Math.sqrt(
            Math.pow(worldPos.x - pendingPoints[0].x, 2) +
              Math.pow(worldPos.y - pendingPoints[0].y, 2)
          );
          newPreviewData.center = pendingPoints[0];
          newPreviewData.radius = radius;
          setPreviewData(newPreviewData);
        } else if (mode === 'polygon' && pendingPoints.length >= 1) {
          const newPreviewData: PreviewData = { type: 'polygon' };
          newPreviewData.points = [...pendingPoints, worldPos];
          setPreviewData(newPreviewData);
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
    
    if (isPanningRef.current) {
      isPanningRef.current = false;
      panStartRef.current = null;
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'grab';
      }
    }
  }, [state.interaction.isDragging, endDrag, boxSelection, state.construction.elements, selectElements]);

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
      style={{ width: `${width}px`, height: `${height}px`, backgroundColor: '#ffffff', touchAction: 'none', ...style }}
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
    </div>
  );
});
