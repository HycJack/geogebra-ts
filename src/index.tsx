import React, { useRef } from 'react';
import { GeoGebraProvider } from './core/GeoGebraContext';
import { EuclidianView, Toolbar, ObjectList, PropertiesPanel, EuclidianViewRef } from './euclidian';
import { ViewState } from './types';
import { cn } from './lib/utils';

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
  const viewRef = useRef<EuclidianViewRef>(null);

  const handleZoomIn = () => {
    viewRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    viewRef.current?.zoomOut();
  };

  return (
    <GeoGebraProvider initialView={initialView}>
      <div
        className={cn(
          'flex flex-col bg-gray-50 rounded-lg overflow-hidden shadow-sm',
          className
        )}
        style={style}
      >
        {showToolbar && <Toolbar onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />}
        <div className="flex flex-1 gap-4 p-4">
          {showObjectList && <ObjectList />}
          <div className="flex-1 rounded-lg overflow-hidden border border-gray-200 bg-white">
            <EuclidianView
              ref={viewRef}
              width={width}
              height={height}
              showAxes={showAxes}
              showGrid={showGrid}
            />
          </div>
          {showPropertiesPanel && <PropertiesPanel />}
        </div>
      </div>
    </GeoGebraProvider>
  );
}

export { GeoGebraProvider, useGeoGebra } from './core/GeoGebraContext';
export { EuclidianView, Toolbar, ObjectList, PropertiesPanel } from './euclidian';
export * from './types';
export * from './utils/coordinates';
