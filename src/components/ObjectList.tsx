import React from 'react';
import { useGeoGebra } from '../core/GeoGebraContext';
import { GeoElement, GeoPointElement, GeoLineElement, GeoSegmentElement, GeoCircleElement, GeoPolygonElement } from '../types';
import { Trash2, CircleDot, Slash, Minus, Circle, Hexagon, Layers } from 'lucide-react';
import { cn } from '../lib/utils';

interface ObjectListProps {
  className?: string;
  style?: React.CSSProperties;
}

const typeIcons: Record<string, React.ReactNode> = {
  point: <CircleDot size={14} />,
  line: <Slash size={14} />,
  segment: <Minus size={14} />,
  circle: <Circle size={14} />,
  polygon: <Hexagon size={14} />,
};

export function ObjectList({ className, style }: ObjectListProps): React.ReactElement {
  const { state, selectElements, deleteElement } = useGeoGebra();

  const getElementInfo = (geo: GeoElement): string => {
    switch (geo.type) {
      case 'point': {
        const p = geo as GeoPointElement;
        return `(${p.x.toFixed(2)}, ${p.y.toFixed(2)})`;
      }
      case 'line': {
        const l = geo as GeoLineElement;
        return `${l.a.toFixed(2)}x + ${l.b.toFixed(2)}y + ${l.c.toFixed(2)} = 0`;
      }
      case 'segment': {
        const s = geo as GeoSegmentElement;
        return `${s.startPointId.slice(-4)} → ${s.endPointId.slice(-4)}`;
      }
      case 'circle': {
        const c = geo as GeoCircleElement;
        return `r = ${c.radius.toFixed(2)}`;
      }
      case 'polygon': {
        const p = geo as GeoPolygonElement;
        return `${p.pointIds.length} 个顶点`;
      }
      default:
        return '';
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col w-60 bg-white border border-gray-200 rounded-lg overflow-hidden',
        className
      )}
      style={style}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-gray-50">
        <Layers size={16} className="text-gray-500" />
        <span className="font-medium text-gray-700">对象列表</span>
        <span className="ml-auto text-sm text-gray-400">{state.construction.elements.size}</span>
      </div>
      <div className="flex-1 overflow-y-auto max-h-[400px]">
        {state.construction.elementOrder.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            暂无对象
          </div>
        ) : (
          state.construction.elementOrder.map((id) => {
            const geo = state.construction.elements.get(id);
            if (!geo) return null;

            const isSelected = state.interaction.selectedIds.includes(id);

            return (
              <div
                key={id}
                onClick={() => selectElements([id])}
                className={cn(
                  'flex items-center justify-between px-4 py-2 border-b border-gray-100 cursor-pointer transition-colors',
                  'hover:bg-gray-50',
                  isSelected && 'bg-blue-50 border-l-2 border-l-blue-500'
                )}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span style={{ color: geo.style.strokeColor }}>
                    {typeIcons[geo.type] || <CircleDot size={14} />}
                  </span>
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate" style={{ color: geo.style.strokeColor }}>
                      {geo.label || geo.type}
                    </div>
                    <div className="text-xs text-gray-400 truncate">{getElementInfo(geo)}</div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteElement(id);
                  }}
                  className={cn(
                    'p-1.5 rounded-md transition-colors',
                    'hover:bg-gray-100 text-gray-400 hover:text-red-500'
                  )}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
