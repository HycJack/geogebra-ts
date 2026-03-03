import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/globals.css';
import { GeoGebra, GeoGebraProvider } from './index.tsx';

function DemoApp(): React.ReactElement {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          React GeoGebra 几何绘图
        </h1>
        <GeoGebraProvider>
          <GeoGebra
            width={900}
            height={600}
            showAxes={true}
            showGrid={true}
            showToolbar={true}
            showObjectList={true}
            showPropertiesPanel={true}
          />
        </GeoGebraProvider>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DemoApp />
  </React.StrictMode>
);
