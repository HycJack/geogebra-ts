export interface Point {
  x: number;
  y: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface WorldPoint {
  x: number;
  y: number;
}

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface ViewTransform {
  xZero: number;
  yZero: number;
  xScale: number;
  yScale: number;
}

export type GeoElementType = 
  | 'point'
  | 'line'
  | 'segment'
  | 'ray'
  | 'vector'
  | 'circle'
  | 'conic'
  | 'polygon'
  | 'polyline'
  | 'text'
  | 'angle'
  | 'function';

export interface GeoElementStyle {
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  strokeDashArray?: number[];
  opacity: number;
  fontSize?: number;
  fontFamily?: string;
  visible: boolean;
  labelVisible: boolean;
}

export interface GeoElementBase {
  id: string;
  type: GeoElementType;
  label: string;
  style: GeoElementStyle;
  isIndependent: boolean;
  parentIds: string[];
}

export interface GeoPointElement extends GeoElementBase {
  type: 'point';
  x: number;
  y: number;
  pointSize: number;
  pointStyle: 'dot' | 'cross' | 'circle' | 'square';
}

export interface GeoLineElement extends GeoElementBase {
  type: 'line';
  a: number;
  b: number;
  c: number;
}

export interface GeoSegmentElement extends GeoElementBase {
  type: 'segment';
  startPointId: string;
  endPointId: string;
}

export interface GeoCircleElement extends GeoElementBase {
  type: 'circle';
  centerId: string;
  radius: number;
}

export interface GeoPolygonElement extends GeoElementBase {
  type: 'polygon';
  pointIds: string[];
}

export interface GeoVectorElement extends GeoElementBase {
  type: 'vector';
  startPointId: string;
  endPointId: string;
}

export interface GeoTextElement extends GeoElementBase {
  type: 'text';
  x: number;
  y: number;
  text: string;
}

export type GeoElement = 
  | GeoPointElement 
  | GeoLineElement 
  | GeoSegmentElement 
  | GeoCircleElement
  | GeoPolygonElement
  | GeoVectorElement
  | GeoTextElement;

export type ToolMode = 
  | 'select'
  | 'move'
  | 'point'
  | 'line'
  | 'segment'
  | 'ray'
  | 'vector'
  | 'circle'
  | 'circle3'
  | 'polygon'
  | 'text'
  | 'intersect'
  | 'midpoint'
  | 'perpendicular'
  | 'parallel'
  | 'delete';

export interface InteractionState {
  mode: ToolMode;
  selectedIds: string[];
  hoveredId: string | null;
  isDragging: boolean;
  dragStartPoint: ScreenPoint | null;
  previewElements: GeoElement[];
}

export interface ViewState {
  width: number;
  height: number;
  xZero: number;
  yZero: number;
  xScale: number;
  yScale: number;
  showAxes: boolean;
  showGrid: boolean;
  gridInterval: number;
}

export interface ConstructionState {
  elements: Map<string, GeoElement>;
  elementOrder: string[];
  algorithms: Map<string, Algorithm>;
}

export interface Algorithm {
  id: string;
  type: string;
  inputIds: string[];
  outputIds: string[];
  compute: (inputs: GeoElement[], outputs: GeoElement[]) => void;
}
