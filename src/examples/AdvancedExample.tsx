import React from 'react';
import { useGeoGebra } from '../index.tsx';

function AdvancedExample(): React.ReactElement {
  const { addPoint, addSegment, addCircle, addPolygon, setMode, state } = useGeoGebra();

  const createTriangle = () => {
    const p1 = addPoint(0, 0, 'A', { strokeColor: '#ff0000' });
    const p2 = addPoint(4, 0, 'B', { strokeColor: '#ff0000' });
    const p3 = addPoint(2, 3, 'C', { strokeColor: '#ff0000' });

    addSegment(p1.id, p2.id, 'AB', { strokeColor: '#0000ff' });
    addSegment(p2.id, p3.id, 'BC', { strokeColor: '#0000ff' });
    addSegment(p3.id, p1.id, 'CA', { strokeColor: '#0000ff' });

    addPolygon([p1.id, p2.id, p3.id], 'triangle', {
      fillColor: '#00ff00',
      opacity: 0.3,
    });
  };

  const createCircleWithCenter = () => {
    const center = addPoint(5, 0, 'O', { strokeColor: '#ff6600' });
    addCircle(center.id, 2, 'circle1', {
      strokeColor: '#ff6600',
      fillColor: '#ff6600',
    });
  };

  const createSquare = () => {
    const p1 = addPoint(-3, -2, 'P1', { strokeColor: '#9900ff' });
    const p2 = addPoint(-1, -2, 'P2', { strokeColor: '#9900ff' });
    const p3 = addPoint(-1, 0, 'P3', { strokeColor: '#9900ff' });
    const p4 = addPoint(-3, 0, 'P4', { strokeColor: '#9900ff' });

    addPolygon([p1.id, p2.id, p3.id, p4.id], 'square', {
      fillColor: '#9900ff',
      opacity: 0.4,
    });
  };

  const clearAll = () => {
    const { deleteElement } = useGeoGebra();
    for (const id of state.construction.elementOrder) {
      deleteElement(id);
    }
  };

  return (
    <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
      <h3 style={{ marginBottom: '10px', color: '#495057' }}>快速创建示例</h3>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={createTriangle}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          创建三角形
        </button>
        <button
          onClick={createCircleWithCenter}
          style={{
            padding: '8px 16px',
            backgroundColor: '#fd7e14',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          创建圆
        </button>
        <button
          onClick={createSquare}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6f42c1',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          创建正方形
        </button>
        <button
          onClick={() => setMode('move')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          移动模式
        </button>
        <button
          onClick={clearAll}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          清除所有
        </button>
      </div>
    </div>
  );
}

export { AdvancedExample };
