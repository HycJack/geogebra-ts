/**
 * 布尔对象
 * 对应 Java 版本的 GeoBoolean
 */

import type { GeoBooleanElement } from './GeoElement';

export class GeoBoolean {
  static create(value: boolean): Partial<GeoBooleanElement> {
    return {
      type: 'boolean',
      value,
    };
  }

  static toggle(geo: GeoBooleanElement): boolean {
    return !geo.value;
  }

  static and(a: boolean, b: boolean): boolean {
    return a && b;
  }

  static or(a: boolean, b: boolean): boolean {
    return a || b;
  }

  static not(a: boolean): boolean {
    return !a;
  }

  static xor(a: boolean, b: boolean): boolean {
    return a !== b;
  }
}
