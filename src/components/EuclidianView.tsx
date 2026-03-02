import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useGeoGebra } from '../core/GeoGebraContext';
import { Drawable, DrawableFactory } from '../common/drawable';
import { GeoElement, ScreenPoint, WorldPoint } from '../types';
import { CanvasRenderer } from '../common/rendering/CanvasRenderer';

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
  className?: string;
  style?: React.CSSProperties;
}

export function EuclidianView({
  width = 800,
  height = 600,
  showAxes = true,
  showGrid = true,
  className,
  style,
}: EuclidianViewProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const factoryRef = useRef<DrawableFactory | null>(null);
  const { state, coordSystem, dispatch, updatePointPosition, selectElements, setHovered, startDrag, endDrag, setPreview, addPoint, addLineFromPoints, addSegment, addCircle, addPolygon, deleteElement } = useGeoGebra();

  const [drawables, setDrawables] = useState<Map<string, Drawable>>(new Map());
  const [pendingPoints, setPendingPoints] = useState<WorldPoint[]>([]);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  useEffect(() => {
    dispatch({ type: 'SET_VIEW', view: { width, height } });
  }, [width, height, dispatch]);

  useEffect(() => {
    // 创建或更新 DrawableFactory
    if (!factoryRef.current) {
      factoryRef.current = new DrawableFactory(coordSystem);
    } else {
      factoryRef.current.setCoordSystem(coordSystem);
    }

    const newDrawables = new Map<string, Drawable>();

    for (const [id, geo] of state.construction.elements) {
      const drawable = factoryRef.current.create(geo);
      if (drawable) {
        drawable.update();
        newDrawables.set(id, drawable);
      }
    }

    setDrawables(newDrawables);
  }, [state.construction.elements, coordSystem]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const renderer = new CanvasRenderer(coordSystem, {
      showGrid,
      showAxes,
      backgroundColor: '#ffffff',
    });

    renderer.initialize(canvasRef.current);
    rendererRef.current = renderer;

    // 设置初始大小（使用 props 中的 width 和 height）
    renderer.resize(width, height);

    return () => {
      renderer.destroy();
      rendererRef.current = null;
    };
  }, [coordSystem, showGrid, showAxes, width, height]);

  // 单独的 effect 用于渲染，确保在 drawables 变化时重新渲染
  useEffect(() => {
    if (!rendererRef.current) return;
    
    const drawableArray = Array.from(drawables.values());
    rendererRef.current.render(drawableArray);
  }, [drawables]);

  // 渲染 pending points 和 preview
  useEffect(() => {
    if (!rendererRef.current) return;
    
    // 先重新渲染所有几何元素（这会清空画布）
    const drawableArray = Array.from(drawables.values());
    rendererRef.current.render(drawableArray);

    // 渲染 pending points
    if (pendingPoints.length > 0) {
      const ctx = rendererRef.current.getContext();
      if (ctx) {
        for (const point of pendingPoints) {
          const screenPos = coordSystem.toScreenPoint(point);
          ctx.beginPath();
          ctx.arc(screenPos.x, screenPos.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#ff6600';
          ctx.fill();
          ctx.strokeStyle = '#333';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    // 渲染 preview
    if (previewData) {
      const ctx = rendererRef.current.getContext();
      if (!ctx) return;

      if (previewData.type === 'segment' && previewData.startPoint && previewData.endPoint) {
        const p1 = coordSystem.toScreenPoint(previewData.startPoint);
        const p2 = coordSystem.toScreenPoint(previewData.endPoint);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = '#999999';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      if (previewData.type === 'circle' && previewData.center && previewData.radius !== undefined) {
        const center = coordSystem.toScreenPoint(previewData.center);
        const screenRadius = previewData.radius * coordSystem.getTransform().xScale;
        ctx.beginPath();
        ctx.arc(center.x, center.y, screenRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#999999';
        ctx.globalAlpha = 0.15;
        ctx.fill();
        ctx.strokeStyle = '#999999';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }, [drawables, pendingPoints, previewData, coordSystem]);

  useEffect(() => {
    if (rendererRef.current && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      rendererRef.current.resize(rect.width, rect.height);
    }
  }, [width, height]);

  const clearPendingState = useCallback(() => {
    setPendingPoints([]);
    setPreviewData(null);
    setPreview([]);
  }, [setPreview]);

  useEffect(() => {
    clearPendingState();
  }, [state.interaction.mode, clearPendingState]);

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
      return coordSystem.toWorldPoint({ x: screenX, y: screenY });
    },
    [coordSystem]
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

      for (const [id, drawable] of drawables) {
        if (drawable.hitTest(screenX, screenY, threshold)) {
          return id;
        }
      }

      return null;
    },
    [drawables]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const screenPos = getMousePosition(e);
      const worldPos = screenToWorld(screenPos.x, screenPos.y);

      switch (state.interaction.mode) {
        case 'move': {
          const hitId = hitTest(screenPos.x, screenPos.y);
          if (hitId) {
            selectElements([hitId]);
            startDrag(screenPos);
          } else {
            selectElements([]);
          }
          break;
        }

        case 'point': {
          addPoint(worldPos.x, worldPos.y);
          break;
        }

        case 'segment': {
          if (pendingPoints.length === 0) {
            setPendingPoints([worldPos]);
          } else {
            const p1 = addPoint(pendingPoints[0].x, pendingPoints[0].y);
            const p2 = addPoint(worldPos.x, worldPos.y);
            addSegment(p1.id, p2.id);
            setPendingPoints([]);
            setPreviewData(null);
          }
          break;
        }

        case 'line': {
          if (pendingPoints.length === 0) {
            setPendingPoints([worldPos]);
          } else {
            const p1 = addPoint(pendingPoints[0].x, pendingPoints[0].y);
            const p2 = addPoint(worldPos.x, worldPos.y);
            addLineFromPoints(p1.x, p1.y, p2.x, p2.y);
            setPendingPoints([]);
            setPreviewData(null);
          }
          break;
        }

        case 'circle': {
          if (pendingPoints.length === 0) {
            setPendingPoints([worldPos]);
          } else {
            const center = addPoint(pendingPoints[0].x, pendingPoints[0].y);
            const edge = addPoint(worldPos.x, worldPos.y);
            const radius = Math.sqrt(
              Math.pow(edge.x - center.x, 2) + Math.pow(edge.y - center.y, 2)
            );
            addCircle(center.id, radius);
            setPendingPoints([]);
            setPreviewData(null);
          }
          break;
        }

        case 'polygon': {
          if (pendingPoints.length === 0) {
            setPendingPoints([worldPos]);
          } else {
            const lastPoint = pendingPoints[pendingPoints.length - 1];
            const dist = Math.sqrt(
              Math.pow(worldPos.x - lastPoint.x, 2) + Math.pow(worldPos.y - lastPoint.y, 2)
            );

            if (dist < 0.2 && pendingPoints.length >= 3) {
              const points = pendingPoints.map((p) => addPoint(p.x, p.y));
              addPolygon(points.map((p) => p.id));
              setPendingPoints([]);
              setPreviewData(null);
            } else {
              setPendingPoints([...pendingPoints, worldPos]);
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

        default:
          break;
      }
    },
    [state.interaction.mode, pendingPoints, getMousePosition, screenToWorld, hitTest, selectElements, startDrag, addLineFromPoints]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const screenPos = getMousePosition(e);
      const worldPos = screenToWorld(screenPos.x, screenPos.y);

      if (state.interaction.isDragging && state.interaction.selectedIds.length > 0) {
        const selectedId = state.interaction.selectedIds[0];
        const geo = state.construction.elements.get(selectedId);

        if (geo && geo.type === 'point') {
          updatePointPosition(selectedId, worldPos.x, worldPos.y);
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
    ]
  );

  const handlePointerUp = useCallback(() => {
    if (state.interaction.isDragging) {
      endDrag();
    }
  }, [state.interaction.isDragging, endDrag]);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const screenPos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      const factor = e.deltaY > 0 ? 0.9 : 1.1;

      coordSystem.zoom(factor, screenPos);

      dispatch({
        type: 'SET_VIEW',
        view: {
          xZero: coordSystem.getTransform().xZero,
          yZero: coordSystem.getTransform().yZero,
          xScale: coordSystem.getTransform().xScale,
          yScale: coordSystem.getTransform().yScale,
        },
      });
    },
    [coordSystem, dispatch]
  );

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width, height, backgroundColor: '#ffffff', touchAction: 'none', ...style }}
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
}
