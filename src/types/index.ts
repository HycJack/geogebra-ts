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
  parentAlgorithm?: any;
  constructionIndex?: number;
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
  | GeoTextElement;

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

// 构造元素接口
export interface ConstructionElement {
  getConstructionIndex(): number;
  update(): void;
}

// 核心几何元素接口（来自common/types/index.ts）
export interface CoreGeoElement extends ConstructionElement {
  isDefined(): boolean;
  setUndefined(): void;
  getParentAlgorithm(): AlgoElement | null;
  setParentAlgorithm(algo: AlgoElement): void;
  addDependent(algo: AlgoElement): void;
  removeDependent(algo: AlgoElement): void;
  getDependents(): AlgoElement[];
  updateDependentObjects(): void;
  getLabel(): string;
  setLabel(label: string): void;
}

// 算法元素接口
export interface AlgoElement extends ConstructionElement {
  getInput(): CoreGeoElement[];
  getOutput(): CoreGeoElement[];
  compute(): void;
  update(): void;
  getUpdateAfterAlgo(): AlgoElement | null;
  setDependencies(): void;
  getID(): number;
  dispose(): void;
}

// 算法集合接口
export interface AlgorithmSet extends Iterable<AlgoElement> {
  add(algo: AlgoElement): boolean;
  remove(algo: AlgoElement): boolean;
  contains(algo: AlgoElement): boolean;
  updateAll(): void;
  isEmpty(): boolean;
  getSize(): number;
}

// 构造管理器接口
export interface Construction {
  addToConstructionList(algo: AlgoElement, addToUpdateSet: boolean): void;
  updateConstruction(): void;
  getKernel(): IKernel;
  getGeoElementByLabel(label: string): CoreGeoElement | null;
  addGeoElement(geo: CoreGeoElement): void;
  removeGeoElement(geo: CoreGeoElement): void;
  generateLabel(type: string): string;
  getAllGeoElements(): CoreGeoElement[];
  getAllAlgorithms(): AlgoElement[];
  renameGeoElement(oldLabel: string, newLabel: string): boolean;
  clear(): void;
}

// 核心接口
export interface IKernel {
  getConstruction(): Construction;
  getEquationSolver(): EquationSolver;
}

// 方程求解器接口
export interface EquationSolver {
  solveQuadratic(coeff: number[]): number[];
  solveCubic(coeff: number[]): number[];
  polynomialRoots(coeff: number[]): number[];
  findRoot(fun: (x: number) => number, start: number, options?: RootFinderOptions): number;
}

// 根查找选项
export interface RootFinderOptions {
  maxIterations?: number;
  tolerance?: number;
  lowerBound?: number;
  upperBound?: number;
}

// 函数接口
export interface Function {
  value(x: number): number;
  derivative(x: number): number;
}

// 路径相关类型（如果需要）
export interface Path {
  // 路径接口定义
}

export interface PathParameter {
  // 路径参数接口定义
}

export interface PathMover {
  // 路径移动器接口定义
}

export interface Pathable {
  // 可路径化接口定义
}

export type PathRestrictionType = string;

export class PathMoverImpl implements PathMover {
  // 路径移动器实现
}
