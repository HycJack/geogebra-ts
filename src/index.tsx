import React from 'react';
import { GeoGebraProvider } from './core/GeoGebraContext';
import { EuclidianView, Toolbar, ObjectList, PropertiesPanel } from './components';
import { ViewState } from './types';

interface GeoGebraProps {
  width?: number;
  height?: number;
  showAxes?: boolean;
  showGrid?: boolean;
  showToolbar?: boolean;
  showObjectList?: boolean;
  showPropertiesPanel?: boolean;
  initialView?: Partial<ViewState>;
  className?: string;
  style?: React.CSSProperties;
}

export function GeoGebra({
  width = 800,
  height = 600,
  showAxes = true,
  showGrid = true,
  showToolbar = true,
  showObjectList = true,
  showPropertiesPanel = true,
  initialView,
  className,
  style,
}: GeoGebraProps): React.ReactElement {
  return (
    <GeoGebraProvider initialView={initialView}>
      <div
        className={className}
        style={{
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Arial, sans-serif',
          ...style,
        }}
      >
        {showToolbar && <Toolbar />}
        <div style={{ display: 'flex', flex: 1 }}>
          {showObjectList && <ObjectList style={{ marginRight: '10px' }} />}
          <EuclidianView
            width={width}
            height={height}
            showAxes={showAxes}
            showGrid={showGrid}
            style={{ border: '1px solid #ddd' }}
          />
          {showPropertiesPanel && <PropertiesPanel style={{ marginLeft: '10px' }} />}
        </div>
      </div>
    </GeoGebraProvider>
  );
}

export { GeoGebraProvider, useGeoGebra } from './core/GeoGebraContext';
export { EuclidianView, Toolbar, ObjectList, PropertiesPanel } from './components';
export * from './types';
export * from './utils/coordinates';
