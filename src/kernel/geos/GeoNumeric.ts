/**
 * 数值对象
 * 对应 Java 版本的 GeoNumeric
 */

import type { GeoNumericElement } from './GeoElement';

export class GeoNumeric {
  static readonly DEFAULT_MIN = 0;
  static readonly DEFAULT_MAX = 10;
  static readonly DEFAULT_STEP = 0.1;

  static create(
    value: number,
    min: number = GeoNumeric.DEFAULT_MIN,
    max: number = GeoNumeric.DEFAULT_MAX,
    step: number = GeoNumeric.DEFAULT_STEP
  ): Partial<GeoNumericElement> {
    return {
      type: 'numeric',
      value,
      minValue: min,
      maxValue: max,
      animationStep: step,
      isSlider: false,
      isAngle: false,
    };
  }

  static createSlider(
    value: number,
    min: number = GeoNumeric.DEFAULT_MIN,
    max: number = GeoNumeric.DEFAULT_MAX,
    step: number = GeoNumeric.DEFAULT_STEP
  ): Partial<GeoNumericElement> {
    return {
      type: 'numeric',
      value,
      minValue: min,
      maxValue: max,
      animationStep: step,
      isSlider: true,
      isAngle: false,
    };
  }

  static createAngle(
    value: number,
    min: number = 0,
    max: number = 2 * Math.PI,
    step: number = Math.PI / 180
  ): Partial<GeoNumericElement> {
    return {
      type: 'numeric',
      value,
      minValue: min,
      maxValue: max,
      animationStep: step,
      isSlider: true,
      isAngle: true,
    };
  }

  static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  static snapToStep(value: number, step: number): number {
    return Math.round(value / step) * step;
  }

  static formatValue(value: number, decimals: number = 2): string {
    return value.toFixed(decimals);
  }

  static toDegrees(radians: number): number {
    return (radians * 180) / Math.PI;
  }

  static toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}
