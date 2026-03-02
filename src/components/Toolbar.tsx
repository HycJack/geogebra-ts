import React from 'react';
import { ToolMode } from '../types';
import { useGeoGebra } from '../core/GeoGebraContext';

interface ToolButton {
  mode: ToolMode;
  label: string;
  icon: string;
  description: string;
}

const tools: ToolButton[] = [
  { mode: 'move', label: '移动', icon: '↔', description: '移动和拖动对象' },
  { mode: 'point', label: '点', icon: '•', description: '创建点' },
  { mode: 'segment', label: '线段', icon: '—', description: '创建线段（两点）' },
  { mode: 'line', label: '直线', icon: '/', description: '创建直线' },
  { mode: 'circle', label: '圆', icon: '○', description: '创建圆（圆心和半径）' },
  { mode: 'polygon', label: '多边形', icon: '△', description: '创建多边形' },
  { mode: 'vector', label: '向量', icon: '→', description: '创建向量' },
  { mode: 'intersect', label: '交点', icon: '×', description: '创建交点' },
  { mode: 'midpoint', label: '中点', icon: '⊙', description: '创建中点' },
  { mode: 'delete', label: '删除', icon: '×', description: '删除对象' },
];

interface ToolbarProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Toolbar({ className, style }: ToolbarProps): React.ReactElement {
  const { state, setMode } = useGeoGebra();

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '4px',
        padding: '8px',
        backgroundColor: '#f5f5f5',
        borderBottom: '1px solid #ddd',
        ...style,
      }}
    >
      {tools.map((tool) => (
        <button
          key={tool.mode}
          onClick={() => setMode(tool.mode)}
          title={tool.description}
          style={{
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            border: state.interaction.mode === tool.mode ? '2px solid #0066cc' : '1px solid #ccc',
            borderRadius: '4px',
            backgroundColor: state.interaction.mode === tool.mode ? '#e6f2ff' : '#fff',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {tool.icon}
        </button>
      ))}
    </div>
  );
}
