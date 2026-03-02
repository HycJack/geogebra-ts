// 构造元素接口
export interface ConstructionElement {
  getConstructionIndex(): number;
  update(): void;
}

// 几何元素接口
export interface GeoElement extends ConstructionElement {
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
  getInput(): GeoElement[];
  getOutput(): GeoElement[];
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
  getGeoElementByLabel(label: string): GeoElement | null;
  addGeoElement(geo: GeoElement): void;
  removeGeoElement(geo: GeoElement): void;
  generateLabel(type: string): string;
  getAllGeoElements(): GeoElement[];
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

// 导出 Path 相关类型
export type {
  Path,
  PathParameter,
  PathMover,
  Pathable,
  PathRestrictionType,
} from './Path';

export { PathMoverImpl } from './Path';
