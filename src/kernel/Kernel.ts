/**
 * 核心管理器
 * 对应 Java 版本的 kernel/Kernel.java
 * 
 * 主要职责：
 * 1. 管理 Construction 构造对象
 * 2. 提供算法调度器 AlgoDispatcher
 * 3. 管理全局状态和设置
 * 4. 协调视图更新
 */

import { Construction, ConstructionImpl } from './Construction';
import { AlgoDispatcher } from './algos/AlgoDispatcher';
import { LabelManager } from './LabelManager';
import { GeoElement, GeoElementType } from './geos/GeoElement';
import type { IKernel, EquationSolver } from '../types';
import { EquationSolverImpl } from './solver/EquationSolver';

export interface KernelListener {
  onElementAdded?(element: GeoElement): void;
  onElementRemoved?(element: GeoElement): void;
  onElementUpdated?(element: GeoElement): void;
  onConstructionCleared?(): void;
}

export interface KernelSettings {
  angleUnit: 'degree' | 'radian';
  coordStyle: 'cartesian' | 'polar';
  pointStyle: 'dot' | 'cross' | 'circle' | 'square';
  rightAngleStyle: 'square' | 'arc';
  labelingStyle: 'automatic' | 'manual' | 'none';
  showAxes: boolean;
  showGrid: boolean;
}

export class Kernel implements IKernel {
  private construction: ConstructionImpl;
  private algoDispatcher: AlgoDispatcher;
  private labelManager: LabelManager;
  private listeners: KernelListener[] = [];
  private settings: KernelSettings;
  private notifyViewsActive: boolean = true;
  private silentMode: boolean = false;
  private equationSolver: EquationSolver;
  
  private static instance: Kernel | null = null;

  constructor() {
    this.construction = new ConstructionImpl(this);
    this.algoDispatcher = new AlgoDispatcher(this);
    this.labelManager = new LabelManager();
    this.equationSolver = new EquationSolverImpl();
    
    this.settings = {
      angleUnit: 'degree',
      coordStyle: 'cartesian',
      pointStyle: 'dot',
      rightAngleStyle: 'square',
      labelingStyle: 'automatic',
      showAxes: true,
      showGrid: true,
    };
  }

  static getInstance(): Kernel {
    if (!Kernel.instance) {
      Kernel.instance = new Kernel();
    }
    return Kernel.instance;
  }

  getConstruction(): Construction {
    return this.construction;
  }

  getAlgoDispatcher(): AlgoDispatcher {
    return this.algoDispatcher;
  }

  getLabelManager(): LabelManager {
    return this.labelManager;
  }

  getSettings(): KernelSettings {
    return { ...this.settings };
  }

  updateSettings(updates: Partial<KernelSettings>): void {
    this.settings = { ...this.settings, ...updates };
  }

  addListener(listener: KernelListener): void {
    this.listeners.push(listener);
  }

  removeListener(listener: KernelListener): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  setNotifyViewsActive(active: boolean): void {
    this.notifyViewsActive = active;
  }

  setSilentMode(silent: boolean): void {
    this.silentMode = silent;
  }

  notifyElementAdded(element: GeoElement): void {
    if (!this.notifyViewsActive || this.silentMode) return;
    this.listeners.forEach(l => l.onElementAdded?.(element));
  }

  notifyElementRemoved(element: GeoElement): void {
    if (!this.notifyViewsActive || this.silentMode) return;
    this.listeners.forEach(l => l.onElementRemoved?.(element));
  }

  notifyElementUpdated(element: GeoElement): void {
    if (!this.notifyViewsActive || this.silentMode) return;
    this.listeners.forEach(l => l.onElementUpdated?.(element));
  }

  notifyConstructionCleared(): void {
    if (!this.notifyViewsActive || this.silentMode) return;
    this.listeners.forEach(l => l.onConstructionCleared?.());
  }

  generateLabel(type: GeoElementType): string {
    const labelType = this.geoTypeToLabelType(type);
    return this.labelManager.generateLabel(labelType);
  }

  /**
   * 将 GeoElementType 转换为 LabelType
   * @param geoType 几何元素类型
   * @returns 标签类型
   */
  private geoTypeToLabelType(geoType: GeoElementType): any {
    const mapping: Partial<Record<GeoElementType, string>> = {
      point: 'point',
      line: 'line',
      segment: 'segment',
      ray: 'ray',
      circle: 'circle',
      polygon: 'polygon',
      vector: 'vector',
      text: 'text',
      boolean: 'boolean',
      function: 'function',
      conic: 'conic',
      polyline: 'polyline',
      angle: 'angle',
      numeric: 'number',
    };
    return mapping[geoType] || 'point';
  }

  clear(): void {
    this.construction.clear();
    this.labelManager.reset();
    this.notifyConstructionCleared();
  }

  updateConstruction(): void {
    this.construction.updateConstruction();
  }

  getGeoElementByLabel(label: string): any | null {
    return this.construction.getGeoElementByLabel(label);
  }

  getAllGeoElements(): any[] {
    return this.construction.getAllGeoElements();
  }

  isAngleUnitDegree(): boolean {
    return this.settings.angleUnit === 'degree';
  }

  isAngleUnitRadian(): boolean {
    return this.settings.angleUnit === 'radian';
  }

  toRadians(angle: number): number {
    return this.settings.angleUnit === 'degree' ? angle * Math.PI / 180 : angle;
  }

  toDegrees(angle: number): number {
    return this.settings.angleUnit === 'degree' ? angle * 180 / Math.PI : angle;
  }

  getEquationSolver(): EquationSolver {
    return this.equationSolver;
  }
}
