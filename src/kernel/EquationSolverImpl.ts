/**
 * 方程求解器实现
 * 对应 Java 版本的 kernel/EquationSolver
 */

import type { EquationSolver, RootFinderOptions } from '../types';

export class EquationSolverImpl implements EquationSolver {
  /**
   * 解二次方程 ax² + bx + c = 0
   * @param coeff 系数数组 [a, b, c]
   * @returns 根的数组
   */
  solveQuadratic(coeff: number[]): number[] {
    const [a, b, c] = coeff;
    
    if (Math.abs(a) < 1e-10) {
      // 退化为一次方程
      if (Math.abs(b) < 1e-10) {
        return []; // 无解
      }
      return [-c / b];
    }
    
    const discriminant = b * b - 4 * a * c;
    
    if (discriminant < -1e-10) {
      return []; // 无实根
    } else if (Math.abs(discriminant) < 1e-10) {
      return [-b / (2 * a)]; // 重根
    } else {
      const sqrtDisc = Math.sqrt(discriminant);
      return [
        (-b - sqrtDisc) / (2 * a),
        (-b + sqrtDisc) / (2 * a)
      ];
    }
  }

  /**
   * 解三次方程 ax³ + bx² + cx + d = 0
   * @param coeff 系数数组 [a, b, c, d]
   * @returns 根的数组
   */
  solveCubic(coeff: number[]): number[] {
    const [a, b, c, d] = coeff;
    
    if (Math.abs(a) < 1e-10) {
      // 退化为二次方程
      return this.solveQuadratic([b, c, d]);
    }
    
    // 归一化系数
    const A = b / a;
    const B = c / a;
    const C = d / a;
    
    // 卡丹公式
    const p = B - A * A / 3;
    const q = (2 * A * A * A - 9 * A * B + 27 * C) / 27;
    const discriminant = q * q / 4 + p * p * p / 27;
    
    const roots: number[] = [];
    
    if (discriminant > 1e-10) {
      // 一个实根，两个复根
      const sqrtDisc = Math.sqrt(discriminant);
      const u = Math.cbrt(-q / 2 + sqrtDisc);
      const v = Math.cbrt(-q / 2 - sqrtDisc);
      roots.push(u + v - A / 3);
    } else if (Math.abs(discriminant) < 1e-10) {
      // 三个实根，其中两个相等
      const u = Math.cbrt(-q / 2);
      roots.push(2 * u - A / 3);
      roots.push(-u - A / 3);
    } else {
      // 三个不同的实根
      const theta = Math.acos(-q / 2 * Math.sqrt(-27 / (p * p * p)));
      const sqrtP = Math.sqrt(-p / 3);
      roots.push(2 * sqrtP * Math.cos(theta / 3) - A / 3);
      roots.push(2 * sqrtP * Math.cos((theta + 2 * Math.PI) / 3) - A / 3);
      roots.push(2 * sqrtP * Math.cos((theta + 4 * Math.PI) / 3) - A / 3);
    }
    
    return roots;
  }

  /**
   * 多项式求根
   * @param coeff 系数数组，从最高次到最低次
   * @returns 根的数组
   */
  polynomialRoots(coeff: number[]): number[] {
    // 移除前导零
    let i = 0;
    while (i < coeff.length && Math.abs(coeff[i]) < 1e-10) {
      i++;
    }
    
    const trimmedCoeff = coeff.slice(i);
    
    if (trimmedCoeff.length === 0) {
      return [];
    }
    
    if (trimmedCoeff.length === 1) {
      return []; // 常数多项式，无实根
    }
    
    if (trimmedCoeff.length === 2) {
      // 一次方程
      return [-trimmedCoeff[1] / trimmedCoeff[0]];
    }
    
    if (trimmedCoeff.length === 3) {
      // 二次方程
      return this.solveQuadratic(trimmedCoeff);
    }
    
    if (trimmedCoeff.length === 4) {
      // 三次方程
      return this.solveCubic(trimmedCoeff);
    }
    
    // 高于三次的方程，使用数值方法
    // 这里简化处理，只返回空数组
    return [];
  }

  /**
   * 寻找函数的根
   * @param fun 函数
   * @param start 起始点
   * @param options 选项
   * @returns 根
   */
  findRoot(fun: (x: number) => number, start: number, options?: RootFinderOptions): number {
    const { maxIterations = 100, tolerance = 1e-10, lowerBound = -Infinity, upperBound = Infinity } = options || {};
    
    let x0 = start;
    let x1 = x0 + 1e-4;
    let fx0 = fun(x0);
    let fx1 = fun(x1);
    
    for (let i = 0; i < maxIterations; i++) {
      if (Math.abs(fx1 - fx0) < 1e-10) {
        x1 = x0 + 1e-4;
        fx1 = fun(x1);
      }
      
      const x2 = x1 - fx1 * (x1 - x0) / (fx1 - fx0);
      
      if (x2 < lowerBound || x2 > upperBound) {
        break;
      }
      
      const fx2 = fun(x2);
      
      if (Math.abs(fx2) < tolerance) {
        return x2;
      }
      
      x0 = x1;
      fx0 = fx1;
      x1 = x2;
      fx1 = fx2;
    }
    
    return NaN;
  }
}