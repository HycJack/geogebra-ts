import { AlgoElement, Construction as ConstructionInterface } from '../../types';
import { AlgorithmSetImpl } from './AlgorithmSet';
import { Kernel } from './Kernel';

/**
 * Label 生成器
 * 负责为不同类型的几何对象生成唯一的标签
 */
class LabelGenerator {
  private counters: Map<string, number> = new Map();
  
  // 希腊字母表（用于角度）
  private static readonly GREEK_LETTERS = [
    'α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ',
    'ν', 'ξ', 'ο', 'π', 'ρ', 'σ', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω'
  ];

  /**
   * 生成点标签 (A, B, C, ...)
   * @returns 点标签
   */
  generatePointLabel(): string {
    const index = this.counters.get('point') || 0;
    this.counters.set('point', index + 1);
    
    if (index < 26) {
      // A-Z
      return String.fromCharCode(65 + index);
    } else {
      // A1, B1, ...
      const letter = String.fromCharCode(65 + (index % 26));
      const number = Math.floor(index / 26);
      return `${letter}${number}`;
    }
  }

  /**
   * 生成直线标签 (a, b, c, ...)
   * @returns 直线标签
   */
  generateLineLabel(): string {
    const index = this.counters.get('line') || 0;
    this.counters.set('line', index + 1);
    
    if (index < 26) {
      // a-z
      return String.fromCharCode(97 + index);
    } else {
      // a1, b1, ...
      const letter = String.fromCharCode(97 + (index % 26));
      const number = Math.floor(index / 26);
      return `${letter}${number}`;
    }
  }

  /**
   * 生成线段标签
   * @returns 线段标签
   */
  generateSegmentLabel(): string {
    const index = this.counters.get('segment') || 0;
    this.counters.set('segment', index + 1);
    return `s${index + 1}`;
  }

  /**
   * 生成圆标签
   * @returns 圆标签
   */
  generateCircleLabel(): string {
    const index = this.counters.get('circle') || 0;
    this.counters.set('circle', index + 1);
    return `c${index + 1}`;
  }

  /**
   * 生成多边形标签
   * @returns 多边形标签
   */
  generatePolygonLabel(): string {
    const index = this.counters.get('polygon') || 0;
    this.counters.set('polygon', index + 1);
    return `poly${index + 1}`;
  }

  /**
   * 生成向量标签
   * @returns 向量标签
   */
  generateVectorLabel(): string {
    const index = this.counters.get('vector') || 0;
    this.counters.set('vector', index + 1);
    return `v${index + 1}`;
  }

  /**
   * 生成角度标签 (α, β, γ, ...)
   * @returns 角度标签
   */
  generateAngleLabel(): string {
    const index = this.counters.get('angle') || 0;
    this.counters.set('angle', index + 1);
    
    if (index < LabelGenerator.GREEK_LETTERS.length) {
      return LabelGenerator.GREEK_LETTERS[index];
    } else {
      return `α${index - LabelGenerator.GREEK_LETTERS.length + 1}`;
    }
  }

  /**
   * 生成函数标签
   * @returns 函数标签
   */
  generateFunctionLabel(): string {
    const index = this.counters.get('function') || 0;
    this.counters.set('function', index + 1);
    return `f${index + 1}`;
  }

  /**
   * 生成数值标签
   * @returns 数值标签
   */
  generateNumberLabel(): string {
    const index = this.counters.get('number') || 0;
    this.counters.set('number', index + 1);
    return `n${index + 1}`;
  }

  /**
   * 重置所有计数器
   */
  reset(): void {
    this.counters.clear();
  }

  /**
   * 获取指定类型的当前计数
   * @param type 几何对象类型
   * @returns 当前计数
   */
  getCounter(type: string): number {
    return this.counters.get(type) || 0;
  }

  /**
   * 设置指定类型的计数
   * @param type 几何对象类型
   * @param value 计数值
   */
  setCounter(type: string, value: number): void {
    this.counters.set(type, value);
  }
}

/**
 * 构造管理器
 * 管理所有构造元素，协调依赖更新过程
 */
export class Construction implements ConstructionInterface {
  private ceList: any[] = []; // 所有构造元素
  private algoList: AlgoElement[] = []; // 算法列表
  private algoSetCurrentlyUpdated: AlgorithmSetImpl = new AlgorithmSetImpl();
  private geoTable: Map<string, any> = new Map(); // 几何对象表（按标签索引）
  private kernel: Kernel;
  private labelGenerator: LabelGenerator = new LabelGenerator();

  /**
   * 构造函数
   * @param kernel 核心对象
   */
  constructor(kernel: Kernel) {
    this.kernel = kernel;
  }

  /**
   * 添加算法到构造列表
   * @param algo 算法
   * @param addToUpdateSet 是否添加到更新集合
   */
  addToConstructionList(algo: AlgoElement, addToUpdateSet: boolean): void {
    this.ceList.push(algo);
    this.algoList.push(algo);
    
    if (addToUpdateSet) {
      this.algoSetCurrentlyUpdated.add(algo);
    }
  }

  /**
   * 更新整个构造
   * 按拓扑顺序更新所有算法
   */
  updateConstruction(): void {
    // 更新所有算法
    this.algoSetCurrentlyUpdated.updateAll();
  }

  /**
   * 获取核心对象
   * @returns 核心对象
   */
  getKernel(): Kernel {
    return this.kernel;
  }

  /**
   * 根据标签获取几何对象
   * @param label 标签
   * @returns 几何对象或 null
   */
  getGeoElementByLabel(label: string): any | null {
    return this.geoTable.get(label) || null;
  }

  /**
   * 添加几何对象
   * @param geo 几何对象
   */
  addGeoElement(geo: any): void {
    if (geo.getLabel()) {
      this.geoTable.set(geo.getLabel(), geo);
    }
    this.ceList.push(geo);
  }

  /**
   * 移除几何对象
   * @param geo 几何对象
   */
  removeGeoElement(geo: any): void {
    if (geo.getLabel()) {
      this.geoTable.delete(geo.getLabel());
    }
    const index = this.ceList.indexOf(geo);
    if (index > -1) {
      this.ceList.splice(index, 1);
    }
  }

  /**
   * 生成标签
   * @param type 几何对象类型
   * @returns 生成的标签
   */
  generateLabel(type: string): string {
    let label: string;
    
    switch (type) {
      case 'point':
        label = this.labelGenerator.generatePointLabel();
        break;
      case 'line':
        label = this.labelGenerator.generateLineLabel();
        break;
      case 'segment':
        label = this.labelGenerator.generateSegmentLabel();
        break;
      case 'circle':
        label = this.labelGenerator.generateCircleLabel();
        break;
      case 'polygon':
        label = this.labelGenerator.generatePolygonLabel();
        break;
      case 'vector':
        label = this.labelGenerator.generateVectorLabel();
        break;
      case 'angle':
        label = this.labelGenerator.generateAngleLabel();
        break;
      case 'function':
        label = this.labelGenerator.generateFunctionLabel();
        break;
      case 'number':
        label = this.labelGenerator.generateNumberLabel();
        break;
      default:
        label = `${type}${this.labelGenerator.getCounter(type) + 1}`;
        this.labelGenerator.setCounter(type, this.labelGenerator.getCounter(type) + 1);
    }
    
    // 确保标签唯一
    if (this.geoTable.has(label)) {
      // 如果标签已存在，添加后缀
      let counter = 1;
      let newLabel = `${label}_${counter}`;
      while (this.geoTable.has(newLabel)) {
        counter++;
        newLabel = `${label}_${counter}`;
      }
      return newLabel;
    }
    
    return label;
  }

  /**
   * 获取算法集合
   * @returns 算法集合
   */
  getAlgoSet(): AlgorithmSetImpl {
    return this.algoSetCurrentlyUpdated;
  }

  /**
   * 清空构造
   */
  clear(): void {
    this.ceList = [];
    this.algoList = [];
    this.algoSetCurrentlyUpdated = new AlgorithmSetImpl();
    this.geoTable.clear();
    this.labelGenerator.reset();
  }

  /**
   * 获取所有几何对象
   * @returns 几何对象数组
   */
  getAllGeoElements(): any[] {
    return this.ceList.filter(item => item.getLabel !== undefined);
  }

  /**
   * 获取所有算法
   * @returns 算法数组
   */
  getAllAlgorithms(): AlgoElement[] {
    return [...this.algoList];
  }

  /**
   * 根据标签重命名几何对象
   * @param oldLabel 旧标签
   * @param newLabel 新标签
   * @returns 是否成功
   */
  renameGeoElement(oldLabel: string, newLabel: string): boolean {
    const geo = this.geoTable.get(oldLabel);
    if (!geo) {
      return false;
    }
    
    if (this.geoTable.has(newLabel)) {
      return false; // 新标签已存在
    }
    
    this.geoTable.delete(oldLabel);
    geo.setLabel(newLabel);
    this.geoTable.set(newLabel, geo);
    return true;
  }
}
