import React from 'react';
import { useGeoGebra } from '../core/GeoGebraContext';

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
        className={className}
        style={{
          width: '250px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          backgroundColor: '#fff',
          padding: '10px',
          ...style,
        }}
      >
        <div style={{ color: '#666', textAlign: 'center' }}>未选择对象</div>
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
        属性: {selectedGeo.label || selectedGeo.type}
      </div>
      <div style={{ padding: '10px' }}>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
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
            style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '3px' }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            线条颜色
          </label>
          <input
            type="color"
            value={selectedGeo.style.strokeColor}
            onChange={(e) => handleStyleChange('strokeColor', e.target.value)}
            style={{ width: '100%', height: '30px' }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            填充颜色
          </label>
          <input
            type="color"
            value={selectedGeo.style.fillColor}
            onChange={(e) => handleStyleChange('fillColor', e.target.value)}
            style={{ width: '100%', height: '30px' }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            线条宽度: {selectedGeo.style.strokeWidth}
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={selectedGeo.style.strokeWidth}
            onChange={(e) => handleStyleChange('strokeWidth', parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            透明度: {(selectedGeo.style.opacity * 100).toFixed(0)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={selectedGeo.style.opacity}
            onChange={(e) => handleStyleChange('opacity', parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={selectedGeo.style.visible}
              onChange={(e) => handleStyleChange('visible', e.target.checked)}
            />
            显示对象
          </label>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={selectedGeo.style.labelVisible}
              onChange={(e) => handleStyleChange('labelVisible', e.target.checked)}
            />
            显示标签
          </label>
        </div>
      </div>
    </div>
  );
}
