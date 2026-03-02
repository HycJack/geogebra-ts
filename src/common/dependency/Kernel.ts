import { IKernel as KernelInterface } from '../types';
import { Construction } from './Construction';
import { EquationSolverImpl } from '../solver/EquationSolver';

/**
 * 核心对象
 * 协调依赖图引擎和数值求解器
 */
export class Kernel implements KernelInterface {
  private construction: Construction;
  private equationSolver: EquationSolverImpl;

  /**
   * 构造函数
   */
  constructor() {
    this.construction = new Construction(this);
    this.equationSolver = new EquationSolverImpl();
  }

  /**
   * 获取构造管理器
   * @returns 构造管理器
   */
  getConstruction(): Construction {
    return this.construction;
  }

  /**
   * 获取方程求解器
   * @returns 方程求解器
   */
  getEquationSolver(): EquationSolverImpl {
    return this.equationSolver;
  }

  /**
   * 重置核心
   */
  reset(): void {
    this.construction.clear();
  }
}