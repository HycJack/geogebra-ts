import React from 'react';
import { useGeoGebra } from '../../core/GeoGebraContext';
import { GeoElement } from '../../types';
import ButtonControl from './ButtonControl';
import SliderControl from './SliderControl';
import CheckboxControl from './CheckboxControl';

export const ControlPanel: React.FC = () => {
  const { 
    state, 
    addPoint, 
    addLine, 
    addCircle, 
    addSegment, 
    addPolygon, 
    addVector, 
    deleteElement,
    updateElement,
    selectElements
  } = useGeoGebra();

  const selectedElement = state.interaction.selectedIds.length > 0 
    ? state.construction.elements.get(state.interaction.selectedIds[0]) 
    : undefined;

  return (
    <div className="absolute right-4 top-4 w-64 bg-white rounded-lg shadow-lg p-4 space-y-4 z-10">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Geogebra Controls</h3>
      
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-600">Add Elements</h4>
        <div className="grid grid-cols-2 gap-2">
          <ButtonControl 
            label="Point" 
            onClick={() => addPoint(Math.random() * 10 - 5, Math.random() * 10 - 5)} 
          />
          <ButtonControl 
            label="Line" 
            onClick={() => addLine(1, 1, -1)} 
          />
          <ButtonControl 
            label="Circle" 
            onClick={() => {
              const center = addPoint(0, 0);
              addCircle(center.id, 2);
            }} 
          />
          <ButtonControl 
            label="Segment" 
            onClick={() => {
              const p1 = addPoint(-1, 0);
              const p2 = addPoint(1, 0);
              addSegment(p1.id, p2.id);
            }} 
          />
          <ButtonControl 
            label="Polygon" 
            onClick={() => {
              const p1 = addPoint(-1, -1);
              const p2 = addPoint(1, -1);
              const p3 = addPoint(0, 1);
              addPolygon([p1.id, p2.id, p3.id]);
            }} 
          />
          <ButtonControl 
            label="Vector" 
            onClick={() => {
              const p1 = addPoint(0, 0);
              const p2 = addPoint(1, 1);
              addVector(p1.id, p2.id);
            }} 
          />
        </div>
      </div>

      {selectedElement && (
        <div className="space-y-4 border-t pt-4">
          <h4 className="text-sm font-medium text-gray-600">{selectedElement.type} Properties</h4>
          
          <CheckboxControl 
            label="Visible" 
            checked={selectedElement.style.visible} 
            onChange={(checked) => {
              updateElement(selectedElement.id, {
                style: {
                  ...selectedElement.style,
                  visible: checked
                }
              });
            }} 
          />
          
          <CheckboxControl 
            label="Label Visible" 
            checked={selectedElement.style.labelVisible} 
            onChange={(checked) => {
              updateElement(selectedElement.id, {
                style: {
                  ...selectedElement.style,
                  labelVisible: checked
                }
              });
            }} 
          />
          
          <SliderControl 
            label="Stroke Width" 
            value={selectedElement.style.strokeWidth} 
            min={1} 
            max={10} 
            step={1} 
            onChange={(value) => {
              updateElement(selectedElement.id, {
                style: {
                  ...selectedElement.style,
                  strokeWidth: value
                }
              });
            }} 
          />
          
          {selectedElement.type === 'point' && (
            <SliderControl 
              label="Point Size" 
              value={(selectedElement as any).pointSize} 
              min={1} 
              max={10} 
              step={1} 
              onChange={(value) => {
                updateElement(selectedElement.id, {
                  pointSize: value
                });
              }} 
            />
          )}
          
          {selectedElement.type === 'circle' && (
            <SliderControl 
              label="Radius" 
              value={(selectedElement as any).radius} 
              min={0.1} 
              max={5} 
              step={0.1} 
              onChange={(value) => {
                updateElement(selectedElement.id, {
                  radius: value
                });
              }} 
            />
          )}
          
          <ButtonControl 
            label="Delete" 
            onClick={() => {
              if (selectedElement) {
                deleteElement(selectedElement.id);
              }
            }} 
            variant="danger"
          />
        </div>
      )}
    </div>
  );
};

export default ControlPanel;