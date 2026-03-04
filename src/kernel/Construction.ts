/**
 * 构造管理器
 * 对应 Java 版本的 kernel/Construction
 */

import type { CoreGeoElement, IKernel } from '../types';
import { AlgoElement } from './algos/AlgoElement';
import { AlgorithmSetImpl } from './AlgorithmSet';

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
  getConstructionIndex(): number;
}

export class ConstructionImpl implements Construction {
  private algorithms: any[] = [];
  private geoElements: Map<string, CoreGeoElement> = new Map();
  private labelCounters: Map<string, number> = new Map();
  private kernel: IKernel;
  private algoSetCurrentlyUpdated: AlgorithmSetImpl = new AlgorithmSetImpl();
  private constructionIndex: number = 0;

  constructor(kernel: IKernel) {
    this.kernel = kernel;
  }

  getConstructionIndex(): number {
    return this.constructionIndex;
  }

  getKernel(): IKernel {
    return this.kernel;
  }

  addToConstructionList(algo: AlgoElement, addToUpdateSet: boolean): void {
    this.algorithms.push(algo);
    
    if (addToUpdateSet) {
      this.algoSetCurrentlyUpdated.add(algo);
    }
  }

  updateConstruction(): void {
    this.algoSetCurrentlyUpdated.updateAll();
  }

  getGeoElementByLabel(label: string): CoreGeoElement | null {
    return this.geoElements.get(label) || null;
  }

  addGeoElement(geo: CoreGeoElement): void {
    const label = geo.getLabel();
    if (label) {
      this.geoElements.set(label, geo);
    }
  }

  removeGeoElement(geo: CoreGeoElement): void {
    const label = geo.getLabel();
    if (label) {
      this.geoElements.delete(label);
    }
  }

  generateLabel(type: string): string {
    const count = (this.labelCounters.get(type) || 0) + 1;
    this.labelCounters.set(type, count);
    
    const prefixes: Record<string, string> = {
      point: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[count - 1] || `P${count}`,
      line: 'l',
      segment: 's',
      circle: 'c',
      polygon: 'poly',
    };
    
    const prefix = prefixes[type] || type.charAt(0);
    return count <= 26 && type === 'point' ? prefix : `${prefix}${count}`;
  }

  getAllGeoElements(): CoreGeoElement[] {
    return Array.from(this.geoElements.values());
  }

  getAllAlgorithms(): AlgoElement[] {
    return [...this.algorithms];
  }

  renameGeoElement(oldLabel: string, newLabel: string): boolean {
    const geo = this.geoElements.get(oldLabel);
    if (geo) {
      this.geoElements.delete(oldLabel);
      geo.setLabel(newLabel);
      this.geoElements.set(newLabel, geo);
      return true;
    }
    return false;
  }

  clear(): void {
    this.algorithms = [];
    this.geoElements.clear();
    this.labelCounters.clear();
    this.algoSetCurrentlyUpdated = new AlgorithmSetImpl();
  }
}
