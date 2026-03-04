/**
 * 算法调度器
 * 对应 Java 版本的 kernel/algos/AlgoDispatcher.java
 * 
 * 主要职责：
 * 1. 创建各种算法实例
 * 2. 管理算法的生命周期
 * 3. 协调算法之间的依赖关系
 */

import type { Kernel } from '../Kernel';
import type { Construction } from '../Construction';
import { AlgoElement } from './AlgoElement';
import type { IGeoElement } from '../geos/GeoElement';
import { GeoElementType } from '../geos/GeoElement';

export interface AlgoCreateOptions {
  label?: string;
  labels?: string[];
  addToConstruction?: boolean;
}

export class AlgoDispatcher {
  private kernel: Kernel;
  private construction: Construction;
  private algorithms: AlgoElement[] = [];

  constructor(kernel: Kernel) {
    this.kernel = kernel;
    this.construction = kernel.getConstruction();
  }

  getKernel(): Kernel {
    return this.kernel;
  }

  getConstruction(): Construction {
    return this.construction;
  }

  registerAlgorithm(algo: AlgoElement): void {
    this.algorithms.push(algo);
  }

  unregisterAlgorithm(algo: AlgoElement): void {
    const index = this.algorithms.indexOf(algo);
    if (index >= 0) {
      this.algorithms.splice(index, 1);
    }
  }

  getAlgorithms(): AlgoElement[] {
    return [...this.algorithms];
  }

  clear(): void {
    this.algorithms.forEach(algo => algo.dispose());
    this.algorithms = [];
  }

  createPoint(x: number, y: number, options?: AlgoCreateOptions): IGeoElement {
    const label = options?.label || this.kernel.generateLabel('point');
    const point = this.createGeoElement('point', { x, y, label });
    return point;
  }

  createLineThroughPoints(
    _point1: IGeoElement,
    _point2: IGeoElement,
    options?: AlgoCreateOptions
  ): IGeoElement {
    const label = options?.label || this.kernel.generateLabel('line');
    const line = this.createGeoElement('line', { label });
    return line;
  }

  createSegment(
    _startPoint: IGeoElement,
    _endPoint: IGeoElement,
    options?: AlgoCreateOptions
  ): IGeoElement {
    const label = options?.label || this.kernel.generateLabel('segment');
    const segment = this.createGeoElement('segment', { label });
    return segment;
  }

  createCircleCenterRadius(
    _center: IGeoElement,
    _radius: number,
    options?: AlgoCreateOptions
  ): IGeoElement {
    const label = options?.label || this.kernel.generateLabel('circle');
    const circle = this.createGeoElement('circle', { label });
    return circle;
  }

  createCircleThreePoints(
    _p1: IGeoElement,
    _p2: IGeoElement,
    _p3: IGeoElement,
    options?: AlgoCreateOptions
  ): IGeoElement {
    const label = options?.label || this.kernel.generateLabel('circle');
    const circle = this.createGeoElement('circle', { label });
    return circle;
  }

  createPolygon(
    points: IGeoElement[],
    options?: AlgoCreateOptions
  ): IGeoElement {
    const label = options?.label || this.kernel.generateLabel('polygon');
    const polygon = this.createGeoElement('polygon', { label });
    return polygon;
  }

  createMidpoint(
    _point1: IGeoElement,
    _point2: IGeoElement,
    options?: AlgoCreateOptions
  ): IGeoElement {
    const label = options?.label || this.kernel.generateLabel('point');
    const midpoint = this.createGeoElement('point', { label });
    return midpoint;
  }

  createIntersect(
    _geo1: IGeoElement,
    _geo2: IGeoElement,
    options?: AlgoCreateOptions
  ): IGeoElement[] {
    const labels = options?.labels || [
      this.kernel.generateLabel('point'),
      this.kernel.generateLabel('point'),
    ];
    return labels.map(label => this.createGeoElement('point', { label }));
  }

  createPerpendicularLine(
    _line: IGeoElement,
    _point: IGeoElement,
    options?: AlgoCreateOptions
  ): IGeoElement {
    const label = options?.label || this.kernel.generateLabel('line');
    return this.createGeoElement('line', { label });
  }

  createParallelLine(
    _line: IGeoElement,
    _point: IGeoElement,
    options?: AlgoCreateOptions
  ): IGeoElement {
    const label = options?.label || this.kernel.generateLabel('line');
    return this.createGeoElement('line', { label });
  }

  createAngleBisector(
    _line1: IGeoElement,
    _line2: IGeoElement,
    options?: AlgoCreateOptions
  ): IGeoElement[] {
    const labels = options?.labels || [
      this.kernel.generateLabel('line'),
      this.kernel.generateLabel('line'),
    ];
    return labels.map(label => this.createGeoElement('line', { label }));
  }

  private createGeoElement(type: GeoElementType, data: Record<string, any>): IGeoElement {
    let dependents: AlgoElement[] = [];
    let parentAlgorithm: AlgoElement | null = null;
    let label = data.label || '';
    
    return {
      id: `geo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      label,
      isIndependent: true,
      parentIds: [],
      parentAlgorithm: null,
      constructionIndex: this.construction.getConstructionIndex(),
      isDefined: () => true,
      setUndefined: () => {},
      getConstructionIndex: () => this.construction.getConstructionIndex(),
      getParentAlgorithm: function() { return parentAlgorithm; },
      setParentAlgorithm: function(algo: AlgoElement) { parentAlgorithm = algo; this.parentAlgorithm = algo; },
      addDependent: function(algo: AlgoElement) { dependents.push(algo); },
      removeDependent: function(algo: AlgoElement) { 
        const index = dependents.indexOf(algo);
        if (index > -1) dependents.splice(index, 1);
      },
      getDependents: function() { return dependents; },
      updateDependentObjects: function() { 
        dependents.forEach(algo => algo.update());
      },
      getLabel: function() { return label; },
      setLabel: function(newLabel: string) { label = newLabel; this.label = newLabel; },
      update: () => {},
      ...data,
    };
  }
}
