import React from 'react';
import ReactDOM from 'react-dom/client';
import { GeoGebra, GeoGebraProvider } from './index.tsx';
import { AdvancedExample } from './examples/AdvancedExample';

function DemoApp(): React.ReactElement {
  return (
    <div>
      <h1>React GeoGebra 几何绘图演示</h1>
      <GeoGebraProvider>
        <AdvancedExample />
        <div className="demo-container">
          <GeoGebra
            width={900}
            height={600}
            showAxes={true}
            showGrid={true}
            showToolbar={true}
            showObjectList={true}
            showPropertiesPanel={true}
          />
        </div>
      </GeoGebraProvider>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DemoApp />
  </React.StrictMode>
);
