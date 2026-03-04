import React, { createContext, useContext, useCallback, useMemo, useReducer, useEffect } from 'react';
import {
  GeoElement,
  GeoPointElement,
  GeoLineElement,
  GeoSegmentElement,
  GeoCircleElement,
  GeoPolygonElement,
  GeoVectorElement,
  GeoTextElement,
  ViewState,
  InteractionState,
  ToolMode,
  GeoElementStyle,
  Algorithm,
} from '../types';
import { generateId } from '../utils/coordinates';
import { CoordinateSystem } from '../euclidian/coordinates/CoordinateSystem';
import { Kernel, Construction, GeoPoint, GeoLine, GeoSegment, GeoCircle, GeoPolygon, GeoVector } from '../kernel';
import { exportToJSON, importFromJSON } from '../utils/importExport';
import { AlgoJoinPointsSegment, AlgoJoinPointsLine } from '../kernel/algos/AlgoJoinPoints';

interface ConstructionState {
  elements: Map<string, GeoElement>;
  elementOrder: string[];
  algorithms: Map<string, Algorithm>;
  kernel: Kernel | null;
  construction: Construction | null;
  coreElements: Map<string, any>;
}

interface HistoryState {
  past: ConstructionState[];
  future: ConstructionState[];
}

interface GeoGebraState {
  construction: ConstructionState;
  view: ViewState;
  interaction: InteractionState;
  history: HistoryState;
}

type GeoGebraAction =
  | { type: 'ADD_ELEMENT'; element: GeoElement }
  | { type: 'UPDATE_ELEMENT'; id: string; updates: Partial<GeoElement> }
  | { type: 'DELETE_ELEMENT'; id: string }
  | { type: 'SET_VIEW'; view: Partial<ViewState> }
  | { type: 'SET_MODE'; mode: ToolMode }
  | { type: 'SELECT'; ids: string[] }
  | { type: 'SET_HOVERED'; id: string | null }
  | { type: 'START_DRAG'; startPoint: { x: number; y: number } }
  | { type: 'END_DRAG' }
  | { type: 'SET_PREVIEW'; elements: GeoElement[] }
  | { type: 'UPDATE_POINT'; id: string; x: number; y: number }
  | { type: 'ADD_ALGORITHM'; algorithm: Algorithm }
  | { type: 'UPDATE_CONSTRUCTION'; kernel?: Kernel; construction?: Construction }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SAVE_HISTORY' }
  | { type: 'IMPORT_DATA'; elements: GeoElement[]; view?: Partial<ViewState> }
  | { type: 'CLEAR_ALL' }

const defaultStyle: GeoElementStyle = {
  strokeColor: '#000000',
  fillColor: '#3366ff',
  strokeWidth: 2,
  opacity: 1,
  visible: true,
  labelVisible: true,
};

const initialState: GeoGebraState = {
  construction: {
    elements: new Map(),
    elementOrder: [],
    algorithms: new Map(),
    kernel: null,
    construction: null,
    coreElements: new Map(),
  },
  view: {
    width: 800,
    height: 600,
    xZero: 400,
    yZero: 300,
    xScale: 50,
    yScale: 50,
    showAxes: true,
    showGrid: true,
    gridInterval: 1,
  },
  interaction: {
    mode: 'move',
    selectedIds: [],
    hoveredId: null,
    isDragging: false,
    dragStartPoint: null,
    previewElements: [],
  },
  history: {
    past: [],
    future: [],
  },
};

function geoGebraReducer(state: GeoGebraState, action: GeoGebraAction): GeoGebraState {
  switch (action.type) {
    case 'ADD_ELEMENT': {
      const newElements = new Map(state.construction.elements);
      newElements.set(action.element.id, action.element);
      const newCoreElements = new Map(state.construction.coreElements);
      return {
        ...state,
        construction: {
          ...state.construction,
          elements: newElements,
          elementOrder: [...state.construction.elementOrder, action.element.id],
          coreElements: newCoreElements,
        },
      };
    }

    case 'UPDATE_ELEMENT': {
      const newElements = new Map(state.construction.elements);
      const existing = newElements.get(action.id);
      if (existing) {
        newElements.set(action.id, { ...existing, ...action.updates } as GeoElement);
      }
      return {
        ...state,
        construction: {
          ...state.construction,
          elements: newElements,
        },
      };
    }

    case 'DELETE_ELEMENT': {
      const newElements = new Map(state.construction.elements);
      newElements.delete(action.id);
      const newCoreElements = new Map(state.construction.coreElements);
      newCoreElements.delete(action.id);
      return {
        ...state,
        construction: {
          ...state.construction,
          elements: newElements,
          elementOrder: state.construction.elementOrder.filter((id) => id !== action.id),
          coreElements: newCoreElements,
        },
        interaction: {
          ...state.interaction,
          selectedIds: state.interaction.selectedIds.filter((id) => id !== action.id),
          hoveredId: state.interaction.hoveredId === action.id ? null : state.interaction.hoveredId,
        },
      };
    }

    case 'SET_VIEW':
      return {
        ...state,
        view: { ...state.view, ...action.view },
      };

    case 'SET_MODE':
      return {
        ...state,
        interaction: {
          ...state.interaction,
          mode: action.mode,
          selectedIds: [],
          previewElements: [],
        },
      };

    case 'SELECT':
      return {
        ...state,
        interaction: {
          ...state.interaction,
          selectedIds: action.ids,
        },
      };

    case 'SET_HOVERED':
      return {
        ...state,
        interaction: {
          ...state.interaction,
          hoveredId: action.id,
        },
      };

    case 'START_DRAG':
      return {
        ...state,
        interaction: {
          ...state.interaction,
          isDragging: true,
          dragStartPoint: action.startPoint,
        },
      };

    case 'END_DRAG':
      return {
        ...state,
        interaction: {
          ...state.interaction,
          isDragging: false,
          dragStartPoint: null,
        },
      };

    case 'SET_PREVIEW':
      return {
        ...state,
        interaction: {
          ...state.interaction,
          previewElements: action.elements,
        },
      };

    case 'UPDATE_POINT': {
      const newElements = new Map(state.construction.elements);
      const existing = newElements.get(action.id) as GeoPointElement | undefined;
      if (existing && existing.type === 'point') {
        newElements.set(action.id, { ...existing, x: action.x, y: action.y });
        
        for (const [elemId, elem] of newElements) {
          if (elem.parentIds && elem.parentIds.includes(action.id)) {
            if (elem.type === 'segment') {
              const segment = elem as GeoSegmentElement;
              const coreSegment = state.construction.coreElements.get(elemId);
              if (coreSegment && typeof coreSegment.getA === 'function') {
                newElements.set(elemId, { 
                  ...segment, 
                  a: coreSegment.getA(),
                  b: coreSegment.getB(),
                  c: coreSegment.getC()
                });
              }
            } else if (elem.type === 'line') {
              const line = elem as GeoLineElement;
              const coreLine = state.construction.coreElements.get(elemId);
              if (coreLine && typeof coreLine.getA === 'function') {
                newElements.set(elemId, { 
                  ...line, 
                  a: coreLine.getA(),
                  b: coreLine.getB(),
                  c: coreLine.getC()
                });
              }
            } else if (elem.type === 'ray') {
              const ray = elem as any;
              const coreRay = state.construction.coreElements.get(elemId);
              if (coreRay && typeof coreRay.getA === 'function') {
                newElements.set(elemId, { 
                  ...ray, 
                  a: coreRay.getA(),
                  b: coreRay.getB(),
                  c: coreRay.getC()
                });
              }
            } else if (elem.type === 'circle') {
              const circle = elem as GeoCircleElement;
              newElements.set(elemId, { ...circle });
            } else if (elem.type === 'polygon') {
              const polygon = elem as GeoPolygonElement;
              newElements.set(elemId, { ...polygon });
            } else if (elem.type === 'vector') {
              const vector = elem as GeoVectorElement;
              newElements.set(elemId, { ...vector });
            }
          }
        }
      }
      return {
        ...state,
        construction: {
          ...state.construction,
          elements: newElements,
        },
      };
    }

    case 'ADD_ALGORITHM': {
      const newAlgorithms = new Map(state.construction.algorithms);
      newAlgorithms.set(action.algorithm.id, action.algorithm);
      return {
        ...state,
        construction: {
          ...state.construction,
          algorithms: newAlgorithms,
        },
      };
    }

    case 'UPDATE_CONSTRUCTION': {
      return {
        ...state,
        construction: {
          ...state.construction,
          kernel: action.kernel || state.construction.kernel,
          construction: action.construction || state.construction.construction,
        },
      };
    }

    case 'SAVE_HISTORY': {
      const newPast = [...state.history.past, state.construction].slice(-50);
      return {
        ...state,
        history: {
          past: newPast,
          future: [],
        },
      };
    }

    case 'UNDO': {
      if (state.history.past.length === 0) return state;
      
      const previous = state.history.past[state.history.past.length - 1];
      const newPast = state.history.past.slice(0, -1);
      
      return {
        ...state,
        construction: previous,
        history: {
          past: newPast,
          future: [state.construction, ...state.history.future],
        },
        interaction: {
          ...state.interaction,
          selectedIds: [],
          hoveredId: null,
        },
      };
    }

    case 'REDO': {
      if (state.history.future.length === 0) return state;
      
      const next = state.history.future[0];
      const newFuture = state.history.future.slice(1);
      
      return {
        ...state,
        construction: next,
        history: {
          past: [...state.history.past, state.construction],
          future: newFuture,
        },
        interaction: {
          ...state.interaction,
          selectedIds: [],
          hoveredId: null,
        },
      };
    }

    case 'IMPORT_DATA': {
      const newElements = new Map(state.construction.elements);
      const newOrder = [...state.construction.elementOrder];
      
      for (const element of action.elements) {
        if (!newElements.has(element.id)) {
          newElements.set(element.id, element);
          newOrder.push(element.id);
        }
      }
      
      return {
        ...state,
        construction: {
          ...state.construction,
          elements: newElements,
          elementOrder: newOrder,
        },
        view: action.view ? { ...state.view, ...action.view } : state.view,
        interaction: {
          ...state.interaction,
          selectedIds: [],
          hoveredId: null,
          previewElements: [],
        },
      };
    }

    case 'CLEAR_ALL': {
      return {
        ...state,
        construction: {
          elements: new Map(),
          elementOrder: [],
          algorithms: new Map(),
          kernel: state.construction.kernel,
          construction: state.construction.construction,
          coreElements: new Map(),
        },
        interaction: {
          ...state.interaction,
          selectedIds: [],
          hoveredId: null,
          previewElements: [],
        },
        history: {
          past: [],
          future: [],
        },
      };
    }

    default:
      return state;
  }
}

interface GeoGebraContextValue {
  state: GeoGebraState;
  dispatch: React.Dispatch<GeoGebraAction>;
  coordSystem: CoordinateSystem;
  getGeoElement: (id: string) => GeoElement | undefined;
  addPoint: (x: number, y: number, label?: string, style?: Partial<GeoElementStyle>) => GeoPointElement;
  addIntersectionPoint: (x: number, y: number, parentIds: string[]) => GeoPointElement;
  addLine: (a: number, b: number, c: number, label?: string, style?: Partial<GeoElementStyle>) => GeoLineElement;
  addLineFromPoints: (x1: number, y1: number, x2: number, y2: number, label?: string, style?: Partial<GeoElementStyle>) => GeoLineElement;
  addLineFromPointIds: (point1Id: string, point2Id: string, label?: string, style?: Partial<GeoElementStyle>) => GeoLineElement;
  addSegment: (startPointId: string, endPointId: string, label?: string, style?: Partial<GeoElementStyle>) => GeoSegmentElement;
  addCircle: (centerId: string, radius: number, label?: string, style?: Partial<GeoElementStyle>) => GeoCircleElement;
  addPolygon: (pointIds: string[], label?: string, style?: Partial<GeoElementStyle>) => GeoPolygonElement;
  addVector: (startPointId: string, endPointId: string, label?: string, style?: Partial<GeoElementStyle>) => GeoVectorElement;
  addText: (x: number, y: number, text: string, style?: Partial<GeoElementStyle>) => GeoTextElement;
  updatePointPosition: (id: string, x: number, y: number) => void;
  deleteElement: (id: string) => void;
  setMode: (mode: ToolMode) => void;
  selectElements: (ids: string[]) => void;
  setHovered: (id: string | null) => void;
  startDrag: (startPoint: { x: number; y: number }) => void;
  endDrag: () => void;
  setPreview: (elements: GeoElement[]) => void;
  updateConstruction: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  exportData: () => string;
  importData: (jsonString: string) => void;
  clearAll: () => void;
}

const GeoGebraContext = createContext<GeoGebraContextValue | null>(null);

export function useGeoGebra(): GeoGebraContextValue {
  const context = useContext(GeoGebraContext);
  if (!context) {
    throw new Error('useGeoGebra must be used within a GeoGebraProvider');
  }
  return context;
}

interface GeoGebraProviderProps {
  children: React.ReactNode;
  initialView?: Partial<ViewState>;
}

export function GeoGebraProvider({ children, initialView }: GeoGebraProviderProps): React.ReactElement {
  const [state, dispatch] = useReducer(geoGebraReducer, {
    ...initialState,
    view: { ...initialState.view, ...initialView },
  });

  // 初始化 Kernel
  useEffect(() => {
    const kernel = new Kernel();
    const construction = kernel.getConstruction();
    
    dispatch({
      type: 'UPDATE_CONSTRUCTION',
      kernel,
      construction,
    });
  }, []);

  const coordSystem = useMemo(() => {
    const cs = new CoordinateSystem(
      state.view.width,
      state.view.height,
      state.view.xZero,
      state.view.yZero,
      state.view.xScale,
      state.view.yScale
    );
    return cs;
  }, [state.view.width, state.view.height, state.view.xZero, state.view.yZero, state.view.xScale, state.view.yScale]);

  const getGeoElement = useCallback(
    (id: string): GeoElement | undefined => {
      return state.construction.elements.get(id);
    },
    [state.construction.elements]
  );

  const addPoint = useCallback(
    (x: number, y: number, label?: string, style?: Partial<GeoElementStyle>): GeoPointElement => {
      const id = generateId();
      let pointLabel: string;
      
      if (state.construction.construction) {
        const corePoint = new GeoPoint(state.construction.construction, x, y);
        if (label) {
          corePoint.setLabel(label);
        }
        pointLabel = corePoint.getLabel();
        state.construction.coreElements.set(id, corePoint);
      } else {
        pointLabel = label || `P${state.construction.elements.size + 1}`;
      }
      
      const element: GeoPointElement = {
        id,
        type: 'point',
        label: pointLabel,
        x,
        y,
        pointSize: 5,
        pointStyle: 'dot',
        style: { ...defaultStyle, ...style },
        isIndependent: true,
        parentIds: [],
      };
      
      dispatch({ type: 'SAVE_HISTORY' });
      dispatch({ type: 'ADD_ELEMENT', element });
      return element;
    },
    [state.construction.elements.size, state.construction.construction, state.construction.coreElements]
  );

  const addIntersectionPoint = useCallback(
    (x: number, y: number, parentIds: string[]): GeoPointElement => {
      const id = generateId();
      const pointLabel = `I${state.construction.elements.size + 1}`;
      
      if (state.construction.construction) {
        const corePoint = new GeoPoint(state.construction.construction, x, y);
        corePoint.setLabel(pointLabel);
        state.construction.coreElements.set(id, corePoint);
      }
      
      const element: GeoPointElement = {
        id,
        type: 'point',
        label: pointLabel,
        x,
        y,
        pointSize: 5,
        pointStyle: 'dot',
        style: {
          strokeColor: '#666666',
          fillColor: '#999999',
          strokeWidth: 2,
          opacity: 1,
          visible: true,
          labelVisible: true,
        },
        isIndependent: false,
        parentIds,
      };
      
      dispatch({ type: 'SAVE_HISTORY' });
      dispatch({ type: 'ADD_ELEMENT', element });
      return element;
    },
    [state.construction.elements.size, state.construction.construction, state.construction.coreElements]
  );

  const addLine = useCallback(
    (a: number, b: number, c: number, label?: string, style?: Partial<GeoElementStyle>): GeoLineElement => {
      const element: GeoLineElement = {
        id: generateId(),
        type: 'line',
        label: label || `l${state.construction.elements.size + 1}`,
        a,
        b,
        c,
        style: { ...defaultStyle, ...style },
        isIndependent: true,
        parentIds: [],
      };
      
      if (state.construction.construction) {
        const coreLine = new GeoLine(state.construction.construction, a, b, c);
        coreLine.setLabel(element.label);
        state.construction.coreElements.set(element.id, coreLine);
        state.construction.construction.addGeoElement(coreLine);
      }
      
      dispatch({ type: 'SAVE_HISTORY' });
      dispatch({ type: 'ADD_ELEMENT', element });
      return element;
    },
    [state.construction.elements.size, state.construction.construction, state.construction.coreElements]
  );

  const addLineFromPoints = useCallback(
    (x1: number, y1: number, x2: number, y2: number, label?: string, style?: Partial<GeoElementStyle>): GeoLineElement => {
      const a = y2 - y1;
      const b = x1 - x2;
      const c = x2 * y1 - x1 * y2;
      return addLine(a, b, c, label, style);
    },
    [addLine]
  );

  const addLineFromPointIds = useCallback(
    (point1Id: string, point2Id: string, label?: string, style?: Partial<GeoElementStyle>): GeoLineElement => {
      const element: GeoLineElement = {
        id: generateId(),
        type: 'line',
        label: label || `l${state.construction.elements.size + 1}`,
        a: 0,
        b: 0,
        c: 0,
        style: { ...defaultStyle, ...style },
        isIndependent: false,
        parentIds: [point1Id, point2Id],
      };
      
      if (state.construction.construction) {
        const point1 = state.construction.coreElements.get(point1Id);
        const point2 = state.construction.coreElements.get(point2Id);
        if (point1 && point2) {
          const coreLine = new GeoLine(state.construction.construction);
          coreLine.setLabel(element.label);
          
          new AlgoJoinPointsLine(
            state.construction.construction,
            point1 as any,
            point2 as any,
            coreLine as any
          );
          
          state.construction.coreElements.set(element.id, coreLine);
          state.construction.construction.addGeoElement(coreLine);
          
          element.a = coreLine.getA();
          element.b = coreLine.getB();
          element.c = coreLine.getC();
        }
      }
      
      dispatch({ type: 'SAVE_HISTORY' });
      dispatch({ type: 'ADD_ELEMENT', element });
      return element;
    },
    [state.construction.elements.size, state.construction.construction, state.construction.coreElements]
  );

  const addSegment = useCallback(
    (startPointId: string, endPointId: string, label?: string, style?: Partial<GeoElementStyle>): GeoSegmentElement => {
      let a = 0, b = 0, c = 0;
      const startPoint = state.construction.elements.get(startPointId);
      const endPoint = state.construction.elements.get(endPointId);
      if (startPoint && startPoint.type === 'point' && endPoint && endPoint.type === 'point') {
        const x1 = startPoint.x, y1 = startPoint.y;
        const x2 = endPoint.x, y2 = endPoint.y;
        a = y1 - y2;
        b = x2 - x1;
        c = x1 * y2 - x2 * y1;
      }
      
      const element: GeoSegmentElement = {
        id: generateId(),
        type: 'segment',
        label: label || `s${state.construction.elements.size + 1}`,
        startPointId,
        endPointId,
        a, b, c,
        style: { ...defaultStyle, ...style },
        isIndependent: false,
        parentIds: [startPointId, endPointId],
      };
      
      if (state.construction.construction) {
        const startPoint = state.construction.coreElements.get(startPointId);
        const endPoint = state.construction.coreElements.get(endPointId);
        if (startPoint && endPoint) {
          const coreSegment = new GeoSegment(state.construction.construction, startPoint as any, endPoint as any);
          coreSegment.setLabel(element.label);
          
          new AlgoJoinPointsSegment(
            state.construction.construction,
            startPoint as any,
            endPoint as any,
            coreSegment as any
          );
          
          state.construction.coreElements.set(element.id, coreSegment);
          state.construction.construction.addGeoElement(coreSegment);
        }
      }
      
      dispatch({ type: 'SAVE_HISTORY' });
      dispatch({ type: 'ADD_ELEMENT', element });
      return element;
    },
    [state.construction.elements.size, state.construction.construction, state.construction.coreElements]
  );

  const addCircle = useCallback(
    (centerId: string, radius: number, label?: string, style?: Partial<GeoElementStyle>): GeoCircleElement => {
      const element: GeoCircleElement = {
        id: generateId(),
        type: 'circle',
        label: label || `c${state.construction.elements.size + 1}`,
        centerId,
        radius,
        style: { ...defaultStyle, ...style },
        isIndependent: false,
        parentIds: [centerId],
      };
      
      if (state.construction.construction) {
        const center = state.construction.coreElements.get(centerId);
        if (center) {
          const coreCircle = new GeoCircle(state.construction.construction, center, radius);
          coreCircle.setLabel(element.label);
          state.construction.coreElements.set(element.id, coreCircle);
          state.construction.construction.addGeoElement(coreCircle);
        }
      }
      
      dispatch({ type: 'SAVE_HISTORY' });
      dispatch({ type: 'ADD_ELEMENT', element });
      return element;
    },
    [state.construction.elements.size, state.construction.construction, state.construction.coreElements]
  );

  const addPolygon = useCallback(
    (pointIds: string[], label?: string, style?: Partial<GeoElementStyle>): GeoPolygonElement => {
      const element: GeoPolygonElement = {
        id: generateId(),
        type: 'polygon',
        label: label || `poly${state.construction.elements.size + 1}`,
        pointIds,
        vertexCount: pointIds.length,
        style: { ...defaultStyle, fillColor: '#3366ff', ...style },
        isIndependent: false,
        parentIds: pointIds,
      };
      
      dispatch({ type: 'SAVE_HISTORY' });
      dispatch({ type: 'ADD_ELEMENT', element });
      
      const segments: GeoSegmentElement[] = [];
      for (let i = 0; i < pointIds.length; i++) {
        const startPointId = pointIds[i];
        const endPointId = pointIds[(i + 1) % pointIds.length];
        
        let a = 0, b = 0, c = 0;
        const startPoint = state.construction.elements.get(startPointId);
        const endPoint = state.construction.elements.get(endPointId);
        if (startPoint && startPoint.type === 'point' && endPoint && endPoint.type === 'point') {
          const x1 = startPoint.x, y1 = startPoint.y;
          const x2 = endPoint.x, y2 = endPoint.y;
          a = y1 - y2;
          b = x2 - x1;
          c = x1 * y2 - x2 * y1;
        }
        
        const segment: GeoSegmentElement = {
          id: generateId(),
          type: 'segment',
          label: pointIds.length === 3 
            ? ['c', 'a', 'b'][i] || `s${i + 1}`
            : `s${i + 1}`,
          startPointId,
          endPointId,
          a, b, c,
          style: { ...defaultStyle, ...style },
          isIndependent: false,
          parentIds: [element.id, startPointId, endPointId],
        };
        
        segments.push(segment);
        dispatch({ type: 'ADD_ELEMENT', element: segment });
      }
      
      if (state.construction.construction) {
        const points = pointIds.map(id => state.construction.coreElements.get(id)).filter(Boolean);
        if (points.length === pointIds.length) {
          const corePolygon = new GeoPolygon(state.construction.construction, points as any);
          corePolygon.setLabel(element.label);
          state.construction.coreElements.set(element.id, corePolygon);
          state.construction.construction.addGeoElement(corePolygon);
          
          for (const segment of segments) {
            const start = state.construction.coreElements.get(segment.startPointId);
            const end = state.construction.coreElements.get(segment.endPointId);
            if (start && end) {
              const coreSegment = new GeoSegment(state.construction.construction, start as any, end as any);
              coreSegment.setLabel(segment.label);
              state.construction.coreElements.set(segment.id, coreSegment);
              state.construction.construction.addGeoElement(coreSegment);
            }
          }
        }
      }
      
      return element;
    },
    [state.construction.elements.size, state.construction.construction, state.construction.coreElements]
  );

  const addVector = useCallback(
    (startPointId: string, endPointId: string, label?: string, style?: Partial<GeoElementStyle>): GeoVectorElement => {
      const element: GeoVectorElement = {
        id: generateId(),
        type: 'vector',
        label: label || `v${state.construction.elements.size + 1}`,
        startPointId,
        endPointId,
        style: { ...defaultStyle, ...style },
        isIndependent: false,
        parentIds: [startPointId, endPointId],
      };
      
      if (state.construction.construction) {
        const startPoint = state.construction.coreElements.get(startPointId);
        const endPoint = state.construction.coreElements.get(endPointId);
        if (startPoint && endPoint) {
          const coreVector = new GeoVector(state.construction.construction);
          coreVector.setFromPoints(startPoint, endPoint);
          coreVector.setLabel(element.label);
          state.construction.coreElements.set(element.id, coreVector);
          state.construction.construction.addGeoElement(coreVector);
        }
      }
      
      dispatch({ type: 'SAVE_HISTORY' });
      dispatch({ type: 'ADD_ELEMENT', element });
      return element;
    },
    [state.construction.elements.size, state.construction.construction, state.construction.coreElements]
  );

  const addText = useCallback(
    (x: number, y: number, text: string, style?: Partial<GeoElementStyle>): GeoTextElement => {
      const element: GeoTextElement = {
        id: generateId(),
        type: 'text',
        label: '',
        x,
        y,
        text,
        style: { ...defaultStyle, ...style },
        isIndependent: true,
        parentIds: [],
      };
      
      dispatch({ type: 'SAVE_HISTORY' });
      dispatch({ type: 'ADD_ELEMENT', element });
      return element;
    },
    []
  );

  const updatePointPosition = useCallback((id: string, x: number, y: number) => {
    const point = state.construction.elements.get(id);
    if (point && point.type === 'point' && !point.isIndependent) {
      return;
    }
    
    dispatch({ type: 'SAVE_HISTORY' });
    
    const corePoint = state.construction.coreElements.get(id);
    if (corePoint && typeof corePoint.setCoords === 'function') {
      corePoint.setCoords(x, y);
    }
    
    dispatch({ type: 'UPDATE_POINT', id, x, y });
  }, [state.construction.coreElements, state.construction.elements]);

  const deleteElement = useCallback((id: string) => {
    dispatch({ type: 'SAVE_HISTORY' });
    dispatch({ type: 'DELETE_ELEMENT', id });
    
    state.construction.coreElements.delete(id);
  }, [state.construction.coreElements]);

  const setMode = useCallback((mode: ToolMode) => {
    dispatch({ type: 'SET_MODE', mode });
  }, []);

  const selectElements = useCallback((ids: string[]) => {
    dispatch({ type: 'SELECT', ids });
  }, []);

  const setHovered = useCallback((id: string | null) => {
    dispatch({ type: 'SET_HOVERED', id });
  }, []);

  const startDrag = useCallback((startPoint: { x: number; y: number }) => {
    dispatch({ type: 'START_DRAG', startPoint });
  }, []);

  const endDrag = useCallback(() => {
    dispatch({ type: 'END_DRAG' });
  }, []);

  const setPreview = useCallback((elements: GeoElement[]) => {
    dispatch({ type: 'SET_PREVIEW', elements });
  }, []);

  const updateConstruction = useCallback(() => {
    dispatch({ type: 'UPDATE_CONSTRUCTION' });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const canUndo = state.history.past.length > 0;
  const canRedo = state.history.future.length > 0;

  const exportData = useCallback(() => {
    return exportToJSON(
      state.construction.elements,
      state.construction.elementOrder,
      state.view
    );
  }, [state.construction.elements, state.construction.elementOrder, state.view]);

  const importData = useCallback((jsonString: string) => {
    const { elements, view } = importFromJSON(jsonString);
    dispatch({ type: 'IMPORT_DATA', elements, view });
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

  const value: GeoGebraContextValue = {
    state,
    dispatch,
    coordSystem,
    getGeoElement,
    addPoint,
    addIntersectionPoint,
    addLine,
    addLineFromPoints,
    addLineFromPointIds,
    addSegment,
    addCircle,
    addPolygon,
    addVector,
    addText,
    updatePointPosition,
    deleteElement,
    setMode,
    selectElements,
    setHovered,
    startDrag,
    endDrag,
    setPreview,
    updateConstruction,
    undo,
    redo,
    canUndo,
    canRedo,
    exportData,
    importData,
    clearAll,
  };

  return <GeoGebraContext.Provider value={value}>{children}</GeoGebraContext.Provider>;
}
