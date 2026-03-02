import { RootFinderOptions } from '../types';

/**
 * 根查找器
 * 提供多种方法查找函数的根
 */
export class RootFinder {
  private static readonly EPSILON = 1e-10;
  private static readonly MAX_ITERATIONS = 100;

  /**
   * 使用牛顿法查找根
   * @param fun 函数
   * @param derivative 导数函数
   * @param start 初始值
   * @param options 选项
   * @returns 根
   */
  static newtonMethod(fun: (x: number) => number, derivative: (x: number) => number, start: number, options: RootFinderOptions = {}): number {
    const { maxIterations = RootFinder.MAX_ITERATIONS, tolerance = RootFinder.EPSILON } = options;
    let x = start;

    for (let i = 0; i < maxIterations; i++) {
      const fx = fun(x);
      if (Math.abs(fx) < tolerance) {
        return x;
      }

      const dfx = derivative(x);
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
   * 使用布伦特法查找根
   * @param fun 函数
   * @param a 左边界
   * @param b 右边界
   * @param options 选项
   * @returns 根
   */
  static brentMethod(fun: (x: number) => number, a: number, b: number, options: RootFinderOptions = {}): number {
    const { maxIterations = RootFinder.MAX_ITERATIONS, tolerance = RootFinder.EPSILON } = options;
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
   * 使用二分法查找根
   * @param fun 函数
   * @param a 左边界
   * @param b 右边界
   * @param options 选项
   * @returns 根
   */
  static bisectionMethod(fun: (x: number) => number, a: number, b: number, options: RootFinderOptions = {}): number {
    const { maxIterations = RootFinder.MAX_ITERATIONS, tolerance = RootFinder.EPSILON } = options;
    let fa = fun(a);
    let fb = fun(b);

    if (fa * fb >= 0) {
      throw new Error('Bisection method requires function values of opposite sign at endpoints');
    }

    for (let i = 0; i < maxIterations; i++) {
      const c = (a + b) / 2;
      const fc = fun(c);

      if (Math.abs(fc) < tolerance || (b - a) / 2 < tolerance) {
        return c;
      }

      if (fa * fc < 0) {
        b = c;
        fb = fc;
      } else {
        a = c;
        fa = fc;
      }
    }

    throw new Error('Bisection method failed to converge');
  }
}