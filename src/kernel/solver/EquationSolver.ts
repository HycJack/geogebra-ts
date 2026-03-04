/**
 * 方程求解器
 * 实现二次方程、三次方程和多项式求解
 */
import { EquationSolver as EquationSolverInterface, RootFinderOptions } from '../../types';

export class EquationSolverImpl implements EquationSolverInterface {
  private static readonly EPSILON = 1e-10;
  private static readonly MAX_ITERATIONS = 100;

  /**
   * 求解二次方程：ax² + bx + c = 0
   * @param coeff 系数数组 [c, b, a]
   * @returns 实根数组
   */
  solveQuadratic(coeff: number[]): number[] {
    const [c, b, a] = coeff;
    const roots: number[] = [];

    if (Math.abs(a) < EquationSolverImpl.EPSILON) {
      // 退化为线性方程 bx + c = 0
      if (Math.abs(b) < EquationSolverImpl.EPSILON) {
        return []; // 常数方程，无实根
      }
      roots.push(-c / b);
    } else if (Math.abs(b) < EquationSolverImpl.EPSILON * Math.abs(a)) {
      // 形式 ax² + c = 0
      const x2 = -c / a;
      if (Math.abs(x2) < EquationSolverImpl.EPSILON) {
        roots.push(0);
      } else if (x2 > 0) {
        const sqrtX2 = Math.sqrt(x2);
        roots.push(sqrtX2, -sqrtX2);
      }
    } else {
      // 标准二次方程
      const discriminant = b * b - 4 * a * c;
      if (Math.abs(discriminant) < EquationSolverImpl.EPSILON) {
        roots.push(-b / (2 * a));
      } else if (discriminant > 0) {
        const sqrtDiscriminant = Math.sqrt(discriminant);
        // 数值稳定性优化
        const q = (b + (b < 0 ? -sqrtDiscriminant : sqrtDiscriminant)) / -2;
        roots.push(q / a, c / q);
      }
    }

    return roots;
  }

  /**
   * 求解三次方程：ax³ + bx² + cx + d = 0
   * @param coeff 系数数组 [d, c, b, a]
   * @returns 实根数组
   */
  solveCubic(coeff: number[]): number[] {
    const [d, c, b, a] = coeff;
    const roots: number[] = [];

    if (Math.abs(a) < EquationSolverImpl.EPSILON) {
      // 退化为二次方程
      return this.solveQuadratic([d, c, b]);
    }

    // 归一化：x³ + px² + qx + r = 0
    const p = b / a;
    const q = c / a;
    const r = d / a;

    // 判别式计算
    const Q = (p * p - 3 * q) / 9;
    const R = (2 * p * p * p - 9 * p * q + 27 * r) / 54;
    const Q3 = Q * Q * Q;
    const R2 = R * R;

    if (Math.abs(R) < EquationSolverImpl.EPSILON && Math.abs(Q) < EquationSolverImpl.EPSILON) {
      // 三重根
      const root = -p / 3;
      roots.push(root, root, root);
    } else if (R2 < Q3) {
      // 三个不同实根
      const sqrtQ = Math.sqrt(Q);
      const theta = Math.acos(R / (sqrtQ * sqrtQ * sqrtQ));
      const norm = -2 * sqrtQ;
      roots.push(
        norm * Math.cos(theta / 3) - p / 3,
        norm * Math.cos((theta + 2 * Math.PI) / 3) - p / 3,
        norm * Math.cos((theta - 2 * Math.PI) / 3) - p / 3
      );
    } else {
      // 一个实根 + 两个复根
      const sgnR = R >= 0 ? 1 : -1;
      const A = -sgnR * Math.pow(Math.abs(R) + Math.sqrt(R2 - Q3), 1/3);
      const B = Q3 === 0 ? 0 : Q / A;
      roots.push(A + B - p / 3);
    }

    return roots;
  }

  /**
   * 求解多项式方程
   * @param coeff 系数数组 [a0, a1, ..., an]，其中 an 是最高次项系数
   * @returns 实根数组
   */
  polynomialRoots(coeff: number[]): number[] {
    const degree = coeff.length - 1;
    
    switch (degree) {
      case 0:
        return [];
      case 1:
        return [-coeff[0] / coeff[1]];
      case 2:
        return this.solveQuadratic(coeff);
      case 3:
        return this.solveCubic(coeff);
      default:
        // 对于高次多项式，使用牛顿法和布伦特法
        return this.findRealRoots(coeff);
    }
  }

  /**
   * 使用牛顿法查找函数的根
   * @param fun 函数
   * @param start 初始值
   * @param options 选项
   * @returns 根
   */
  findRoot(fun: (x: number) => number, start: number, options: RootFinderOptions = {}): number {
    const { maxIterations = EquationSolverImpl.MAX_ITERATIONS, tolerance = EquationSolverImpl.EPSILON, lowerBound = -1e10, upperBound = 1e10 } = options;
    
    // 尝试布伦特法
    try {
      return this.brentMethod(fun, lowerBound, upperBound, tolerance, maxIterations);
    } catch (e) {
      // 布伦特法失败，尝试牛顿法
      return this.newtonMethod(fun, start, tolerance, maxIterations);
    }
  }

  /**
   * 布伦特法查找根
   * @param fun 函数
   * @param a 左边界
   * @param b 右边界
   * @param tolerance 容差
   * @param maxIterations 最大迭代次数
   * @returns 根
   */
  private brentMethod(fun: (x: number) => number, a: number, b: number, tolerance: number, maxIterations: number): number {
    let fa = fun(a);
    let fb = fun(b);

    if (fa * fb >= 0) {
      throw new Error('Brent method requires function values of opposite sign at endpoints');
    }

    let c = a;
    let fc = fa;
    let d = b - a;
    let e = d;

    for (let i = 0; i < maxIterations; i++) {
      if (Math.abs(fb) < Math.abs(fa)) {
        [a, b] = [b, a];
        [fa, fb] = [fb, fa];
      }

      const delta = 2 * tolerance * Math.abs(b) + tolerance / 2;
      const mid = (a - b) / 2;

      if (Math.abs(mid) <= delta || fb === 0) {
        return b;
      }

      if (Math.abs(e) < delta || Math.abs(fa) <= Math.abs(fb)) {
        e = mid;
        d = e;
      } else {
        let s = fb / fa;
        let p: number, q: number;

        if (a === c) {
          p = 2 * mid * s;
          q = 1 - s;
        } else {
          q = fa / fc;
          const r = fb / fc;
          p = s * (2 * mid * q * (q - r) - (b - a) * (r - 1));
          q = (q - 1) * (r - 1) * (s - 1);
        }

        if (p > 0) {
          q = -q;
        }

        p = Math.abs(p);

        if (2 * p < Math.min(3 * mid * q - Math.abs(delta * q), Math.abs(e * q))) {
          e = d;
          d = p / q;
        } else {
          e = mid;
          d = e;
        }
      }

      a = b;
      fa = fb;

      if (Math.abs(d) > delta) {
        b += d;
      } else {
        b += Math.sign(mid) * delta;
      }

      fb = fun(b);

      if (fb * fun(c) < 0) {
        a = c;
        fa = fc;
        e = b - a;
        d = e;
      }

      c = b;
      fc = fb;
    }

    throw new Error('Brent method failed to converge');
  }

  /**
   * 牛顿法查找根
   * @param fun 函数
   * @param start 初始值
   * @param tolerance 容差
   * @param maxIterations 最大迭代次数
   * @returns 根
   */
  private newtonMethod(fun: (x: number) => number, start: number, tolerance: number, maxIterations: number): number {
    let x = start;

    for (let i = 0; i < maxIterations; i++) {
      const fx = fun(x);
      if (Math.abs(fx) < tolerance) {
        return x;
      }

      // 数值导数
      const h = Math.max(tolerance, Math.abs(x) * tolerance);
      const dfx = (fun(x + h) - fx) / h;

      if (Math.abs(dfx) < tolerance) {
        throw new Error('Newton method: derivative too small');
      }

      const delta = fx / dfx;
      x -= delta;

      if (Math.abs(delta) < tolerance) {
        return x;
      }
    }

    throw new Error('Newton method failed to converge');
  }

  /**
   * 查找多项式的实根
   * @param coeff 系数数组
   * @returns 实根数组
   */
  private findRealRoots(coeff: number[]): number[] {
    const roots: number[] = [];
    // 简单实现：使用牛顿法从多个初始点查找根
    const initialPoints = [-10, -5, -1, 0, 1, 5, 10];

    for (const start of initialPoints) {
      try {
        const root = this.newtonMethod((x) => this.evaluatePolynomial(coeff, x), start, EquationSolverImpl.EPSILON, EquationSolverImpl.MAX_ITERATIONS);
        // 检查根是否有效且未重复
        if (!isNaN(root) && Math.abs(this.evaluatePolynomial(coeff, root)) < EquationSolverImpl.EPSILON) {
          if (!roots.some(r => Math.abs(r - root) < EquationSolverImpl.EPSILON)) {
            roots.push(root);
          }
        }
      } catch (e) {
        // 忽略失败的尝试
      }
    }

    return roots;
  }

  /**
   * 计算多项式值
   * @param coeff 系数数组
   * @param x 变量值
   * @returns 多项式值
   */
  private evaluatePolynomial(coeff: number[], x: number): number {
    let result = 0;
    for (let i = coeff.length - 1; i >= 0; i--) {
      result = result * x + coeff[i];
    }
    return result;
  }
}