/**
 * 几何对象类型定义
 * 对应 Java 版本的 kernel/geos/ 包
 */

import type { AlgoElement } from '../algos/AlgoElement';

export interface IGeoElement {
  id?: string;
  type: string;
  label: string;
  isIndependent: boolean;
  parentIds: string[];
  parentAlgorithm: AlgoElement | null;
  constructionIndex: number;
  isDefined(): boolean;
  setUndefined(): void;
  getConstructionIndex(): number;
  getParentAlgorithm(): AlgoElement | null;
  setParentAlgorithm(algo: AlgoElement): void;
  addDependent(algo: AlgoElement): void;
  removeDependent(algo: AlgoElement): void;
  getDependents(): AlgoElement[];
  updateDependentObjects(): void;
  getLabel(): string;
  setLabel(label: string): void;
  update(): void;
  getX?(): number;
  getY?(): number;
  setCoords?(x: number, y: number, z?: number): void;
  setCircleCoords?(center: any, radius: number): void;
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
  | 'function'
  | 'numeric'
  | 'boolean'
  | 'list';

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
  parentAlgorithm?: any;
  constructionIndex?: number;
}

export interface GeoPointElement extends GeoElementBase {
  type: 'point';
  x: number;
  y: number;
  z?: number;
  pointSize: number;
  pointStyle: 'dot' | 'cross' | 'circle' | 'square';
  path?: {
    type: string;
    elementId: string;
    parameter?: number;
  };
  region?: {
    type: string;
    elementId: string;
  };
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

export interface GeoRayElement extends GeoElementBase {
  type: 'ray';
  startPointId: string;
  throughPointId: string;
}

export interface GeoCircleElement extends GeoElementBase {
  type: 'circle';
  centerId: string;
  radius: number;
}

export interface GeoPolygonElement extends GeoElementBase {
  type: 'polygon';
  pointIds: string[];
  vertexCount: number;
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
  | GeoRayElement
  | GeoCircleElement
  | GeoPolygonElement
  | GeoVectorElement
  | GeoTextElement
  | GeoConicElement
  | GeoAngleElement
  | GeoFunctionElement
  | GeoNumericElement
  | GeoBooleanElement
  | GeoListElement;

export interface GeoConicElement extends GeoElementBase {
  type: 'conic';
  conicType: number;
  matrix: [number, number, number, number, number, number];
  center?: { x: number; y: number };
  semiMajorAxis?: number;
  semiMinorAxis?: number;
  rotationAngle?: number;
}

export interface GeoAngleElement extends GeoElementBase {
  type: 'angle';
  value: number;
  rawValue: number;
  vertexId?: string;
  point1Id?: string;
  point2Id?: string;
  startAngle: number;
  endAngle: number;
}

export interface GeoFunctionElement extends GeoElementBase {
  type: 'function';
  expression: string;
  functionType: string;
  domain?: { min: number; max: number };
}

export interface GeoNumericElement extends GeoElementBase {
  type: 'numeric';
  value: number;
  minValue: number;
  maxValue: number;
  animationStep: number;
  isSlider: boolean;
  isAngle: boolean;
}

export interface GeoBooleanElement extends GeoElementBase {
  type: 'boolean';
  value: boolean;
}

export interface GeoListElement extends GeoElementBase {
  type: 'list';
  items: GeoElement[];
  isClosed: boolean;
  showDOM: boolean;
}

export type ToolMode = 
  | 'select'
  | 'move'
  | 'pan'
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
  id?: string;
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
