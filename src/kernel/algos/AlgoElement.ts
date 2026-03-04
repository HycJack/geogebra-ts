/**
 * 算法基类，所有具体算法的父类
 * 管理输入输出对象，实现更新逻辑
 * 参考 Java 版本的 AlgoElement
 */

import type { Construction } from '../Construction';
import type { IGeoElement } from '../geos/GeoElement';

export interface OutputHandlerInterface<T> {
  getOutput(): T[];
  getOutputAt(index: number): T | undefined;
  setOutputLength(n: number): void;
  setOutputAt(i: number, geo: T): void;
}

export type ElementFactory<T> = (index: number, label?: string) => T;

export class OutputHandler<T extends IGeoElement> {
  private output: T[] = [];
  private _factory: ElementFactory<T>;
  private _outputInterface: OutputHandlerInterface<T>;
  private _labels?: string[];

  constructor(
    factory: ElementFactory<T>,
    outputInterface: OutputHandlerInterface<T>,
    labels?: string[]
  ) {
    this._factory = factory;
    this._outputInterface = outputInterface;
    this._labels = labels;
  }

  setOutputLength(n: number): void {
    this.output = new Array(n);
    this._outputInterface.setOutputLength(n);
  }

  setOutputAt(i: number, geo: T): void {
    this.output[i] = geo;
    this._outputInterface.setOutputAt(i, geo);
  }

  getOutput(): T[] {
    return this.output;
  }

  getOutputAt(index: number): T | undefined {
    return this.output[index];
  }

  clear(): void {
    this.output = [];
  }
}

export abstract class AlgoElement {
  protected input: IGeoElement[] = [];
  protected output: IGeoElement[] = [];
  protected construction: Construction;
  private updateAfterAlgo: AlgoElement | null = null;
  private id: number;
  private constructionIndex: number;
  private outputHandlers: OutputHandler<any>[] = [];
  private stopUpdateCascade: boolean = false;
  private removed: boolean = false;
  private updatedDependentGeos: boolean = false;

  constructor(construction: Construction, addToConstructionList: boolean = true) {
    this.construction = construction;
    this.id = Math.floor(Math.random() * 1000000);
    this.constructionIndex = 0;

    if (addToConstructionList) {
      construction.addToConstructionList(this, false);
    }
  }

  getInput(): IGeoElement[] {
    return this.input;
  }

  getInputAt(index: number): IGeoElement | undefined {
    return this.input[index];
  }

  getOutput(): IGeoElement[] {
    return this.output;
  }

  getOutputAt(index: number): IGeoElement | undefined {
    return this.output[index];
  }

  protected setInput(input: IGeoElement[]): void {
    this.input = input;
    this.updateConstructionIndex();
  }

  protected setOutput(output: IGeoElement[]): void {
    this.output = output;
  }

  protected setOutputLength(n: number): void {
    this.output = new Array(n);
  }

  protected setOutputAt(i: number, geo: IGeoElement): void {
    this.output[i] = geo;
  }

  protected setOnlyOutput(output: IGeoElement): void {
    this.output = [output];
  }

  protected createOutputHandler<T extends IGeoElement>(
    factory: ElementFactory<T>,
    labels?: string[]
  ): OutputHandler<T> {
    const self = this;
    const handler = new OutputHandler<T>(factory, {
      getOutput: () => self.output as T[],
      getOutputAt: (index: number) => self.output[index] as T,
      setOutputLength: (n: number) => self.setOutputLength(n),
      setOutputAt: (i: number, geo: T) => self.setOutputAt(i, geo),
    }, labels);
    this.outputHandlers.push(handler as any);
    return handler;
  }

  protected setUpdateAfterAlgo(algo: AlgoElement): void {
    this.updateAfterAlgo = algo;
  }

  getUpdateAfterAlgo(): AlgoElement | null {
    return this.updateAfterAlgo;
  }

  abstract compute(): void;

  update(): void {
    if (this.stopUpdateCascade || this.removed) {
      return;
    }

    for (const inputElement of this.input) {
      const parentAlgo = inputElement.getParentAlgorithm();
      if (parentAlgo) {
        parentAlgo.update();
      }
    }

    this.compute();
    this.updateDependentGeos();
  }

  private updateDependentGeos(): void {
    if (this.updatedDependentGeos) {
      return;
    }
    this.updatedDependentGeos = true;

    try {
      for (const outputElement of this.output) {
        if (outputElement) {
          outputElement.update();
        }
      }

      if (this.updateAfterAlgo) {
        this.updateAfterAlgo.update();
      }
    } finally {
      this.updatedDependentGeos = false;
    }
  }

  setDependencies(): void {
    for (const inputElement of this.input) {
      inputElement.addDependent(this);
    }
  }

  getConstructionIndex(): number {
    return this.constructionIndex;
  }

  getID(): number {
    return this.id;
  }

  private updateConstructionIndex(): void {
    let maxIndex = 0;
    for (const inputElement of this.input) {
      maxIndex = Math.max(maxIndex, inputElement.getConstructionIndex());
    }
    this.constructionIndex = maxIndex + 1;
  }

  protected stopCascade(): void {
    this.stopUpdateCascade = true;
  }

  protected resumeCascade(): void {
    this.stopUpdateCascade = false;
  }

  isRemoved(): boolean {
    return this.removed;
  }

  dispose(): void {
    this.removed = true;

    for (const inputElement of this.input) {
      inputElement.removeDependent(this);
    }

    for (const handler of this.outputHandlers) {
      handler.clear();
    }

    this.input = [];
    this.output = [];
    this.outputHandlers = [];
    this.updateAfterAlgo = null;
  }

  getFreeInputPoints(): IGeoElement[] {
    return this.input.filter(el => el.isIndependent);
  }

  hasOnlyFreeInputPoints(): boolean {
    return this.input.every(el => el.isIndependent);
  }

  getOutputHandlers(): OutputHandler<any>[] {
    return [...this.outputHandlers];
  }
}
