import React from 'react';
import { useGeoGebra } from '../core/GeoGebraContext';
import { Settings, Type, Palette, Paintbrush, Move, Eye, EyeOff, Tag } from 'lucide-react';
import { cn } from '../lib/utils';

interface PropertiesPanelProps {
  className?: string;
  style?: React.CSSProperties;
}

export function PropertiesPanel({ className, style }: PropertiesPanelProps): React.ReactElement {
  const { state, dispatch } = useGeoGebra();

  const selectedId = state.interaction.selectedIds[0];
  const selectedGeo = selectedId ? state.construction.elements.get(selectedId) : null;

  if (!selectedGeo) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center w-60 h-40 bg-white border border-gray-200 rounded-lg text-gray-400',
          className
        )}
        style={style}
      >
        <Settings size={24} className="mb-2 opacity-50" />
        <span className="text-sm">未选择对象</span>
      </div>
    );
  }

  const handleStyleChange = (property: string, value: string | number | boolean) => {
    dispatch({
      type: 'UPDATE_ELEMENT',
      id: selectedGeo.id,
      updates: {
        style: {
          ...selectedGeo.style,
          [property]: value,
        },
      },
    });
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
        <Settings size={16} className="text-gray-500" />
        <span className="font-medium text-gray-700">属性</span>
        <span className="ml-auto text-sm text-gray-400">{selectedGeo.label || selectedGeo.type}</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Type size={14} />
            标签
          </label>
          <input
            type="text"
            value={selectedGeo.label}
            onChange={(e) =>
              dispatch({
                type: 'UPDATE_ELEMENT',
                id: selectedGeo.id,
                updates: { label: e.target.value },
              })
            }
            className={cn(
              'w-full px-3 py-2 text-sm border border-gray-200 rounded-md',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'transition-all duration-200'
            )}
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Palette size={14} />
            线条颜色
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={selectedGeo.style.strokeColor}
              onChange={(e) => handleStyleChange('strokeColor', e.target.value)}
              className="w-10 h-10 rounded-md border border-gray-200 cursor-pointer"
            />
            <input
              type="text"
              value={selectedGeo.style.strokeColor}
              onChange={(e) => handleStyleChange('strokeColor', e.target.value)}
              className={cn(
                'flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              )}
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Paintbrush size={14} />
            填充颜色
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={selectedGeo.style.fillColor}
              onChange={(e) => handleStyleChange('fillColor', e.target.value)}
              className="w-10 h-10 rounded-md border border-gray-200 cursor-pointer"
            />
            <input
              type="text"
              value={selectedGeo.style.fillColor}
              onChange={(e) => handleStyleChange('fillColor', e.target.value)}
              className={cn(
                'flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              )}
            />
          </div>
        </div>

        <div>
          <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
            <span className="flex items-center gap-2">
              <Move size={14} />
              线条宽度
            </span>
            <span className="text-gray-400">{selectedGeo.style.strokeWidth}px</span>
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={selectedGeo.style.strokeWidth}
            onChange={(e) => handleStyleChange('strokeWidth', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        <div>
          <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
            <span className="flex items-center gap-2">
              <Eye size={14} />
              透明度
            </span>
            <span className="text-gray-400">{(selectedGeo.style.opacity * 100).toFixed(0)}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={selectedGeo.style.opacity}
            onChange={(e) => handleStyleChange('opacity', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        <div className="pt-2 space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedGeo.style.visible}
              onChange={(e) => handleStyleChange('visible', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
            />
            <span className="flex items-center gap-2 text-sm text-gray-700">
              {selectedGeo.style.visible ? <Eye size={14} /> : <EyeOff size={14} />}
              显示对象
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedGeo.style.labelVisible}
              onChange={(e) => handleStyleChange('labelVisible', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
            />
            <span className="flex items-center gap-2 text-sm text-gray-700">
              <Tag size={14} />
              显示标签
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
