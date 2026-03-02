import React from 'react';
import { useGeoGebra } from '../core/GeoGebraContext';
import { GeoElement, GeoPointElement, GeoLineElement, GeoSegmentElement, GeoCircleElement, GeoPolygonElement } from '../types';

interface ObjectListProps {
  className?: string;
  style?: React.CSSProperties;
}

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
      className={className}
      style={{
        width: '250px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        backgroundColor: '#fff',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          padding: '10px',
          borderBottom: '1px solid #ddd',
          fontWeight: 'bold',
          backgroundColor: '#f5f5f5',
        }}
      >
        对象列表 ({state.construction.elements.size})
      </div>
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {state.construction.elementOrder.map((id) => {
          const geo = state.construction.elements.get(id);
          if (!geo) return null;

          const isSelected = state.interaction.selectedIds.includes(id);

          return (
            <div
              key={id}
              onClick={() => selectElements([id])}
              style={{
                padding: '8px 12px',
                borderBottom: '1px solid #eee',
                cursor: 'pointer',
                backgroundColor: isSelected ? '#e6f2ff' : 'transparent',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 'bold', color: geo.style.strokeColor }}>
                  {geo.label || geo.type}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>{getElementInfo(geo)}</div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteElement(id);
                }}
                style={{
                  padding: '2px 6px',
                  fontSize: '12px',
                  border: '1px solid #ccc',
                  borderRadius: '3px',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                }}
              >
                删除
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
