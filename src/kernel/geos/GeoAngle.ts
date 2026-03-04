/**
 * 角度元素
 * 对应 Java 版本的 GeoAngle
 */

import { GeoElementBase } from './GeoElement';

export enum AngleStyle {
  ANTICLOCKWISE = 0,
  NOTREFLEX = 1,
  ISREFLEX = 2,
  UNBOUNDED = 3,
}

export enum AngleDecoration {
  NONE = 0,
  TWO_ARCS = 1,
  THREE_ARCS = 2,
  ONE_TICK = 3,
  TWO_TICKS = 4,
  THREE_TICKS = 5,
  ARROW_ANTICLOCKWISE = 6,
  ARROW_CLOCKWISE = 7,
}

export interface GeoAngleStyle {
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  opacity: number;
  visible: boolean;
  labelVisible: boolean;
  arcSize: number;
  decoration: AngleDecoration;
  emphasizeRightAngle: boolean;
}

export interface GeoAngleElement extends GeoElementBase {
  type: 'angle';
  value: number;
  rawValue: number;
  angleStyle: AngleStyle;
  vertexId?: string;
  point1Id?: string;
  point2Id?: string;
  startAngle: number;
  endAngle: number;
  style: GeoAngleStyle;
}

export class GeoAngle {
  static readonly DEFAULT_SLIDER_MIN = 0;
  static readonly DEFAULT_SLIDER_MAX = 2 * Math.PI;
  static readonly DEFAULT_SLIDER_INCREMENT = Math.PI / 180;

  static createAngle(
    vertexId: string,
    point1Id: string,
    point2Id: string,
    value: number
  ): Partial<GeoAngleElement> {
    return {
      type: 'angle',
      value,
      rawValue: value,
      vertexId,
      point1Id,
      point2Id,
      angleStyle: AngleStyle.ANTICLOCKWISE,
      startAngle: 0,
      endAngle: value,
    };
  }

  static createAngleFromPoints(
    vertex: { x: number; y: number },
    point1: { x: number; y: number },
    point2: { x: number; y: number }
  ): number {
    const v1 = {
      x: point1.x - vertex.x,
      y: point1.y - vertex.y,
    };
    const v2 = {
      x: point2.x - vertex.x,
      y: point2.y - vertex.y,
    };

    const angle1 = Math.atan2(v1.y, v1.x);
    const angle2 = Math.atan2(v2.y, v2.x);

    let angle = angle2 - angle1;

    if (angle < 0) {
      angle += 2 * Math.PI;
    }

    return angle;
  }

  static normalizeAngle(angle: number, style: AngleStyle): number {
    switch (style) {
      case AngleStyle.ANTICLOCKWISE:
        while (angle < 0) angle += 2 * Math.PI;
        while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;
        return angle;

      case AngleStyle.NOTREFLEX:
        angle = this.normalizeAngle(angle, AngleStyle.ANTICLOCKWISE);
        return angle > Math.PI ? 2 * Math.PI - angle : angle;

      case AngleStyle.ISREFLEX:
        angle = this.normalizeAngle(angle, AngleStyle.ANTICLOCKWISE);
        return angle < Math.PI ? 2 * Math.PI - angle : angle;

      case AngleStyle.UNBOUNDED:
      default:
        return angle;
    }
  }

  static toDegrees(radians: number): number {
    return radians * 180 / Math.PI;
  }

  static toRadians(degrees: number): number {
    return degrees * Math.PI / 180;
  }

  static formatAngle(
    radians: number,
    angleUnit: 'degree' | 'radian' = 'degree',
    precision: number = 2
  ): string {
    if (angleUnit === 'degree') {
      const degrees = this.toDegrees(radians);
      return `${degrees.toFixed(precision)}°`;
    }
    return `${radians.toFixed(precision)} rad`;
  }

  static isRightAngle(angle: number, tolerance: number = 1e-6): boolean {
    const normalized = this.normalizeAngle(angle, AngleStyle.ANTICLOCKWISE);
    return Math.abs(normalized - Math.PI / 2) < tolerance;
  }

  static isStraightAngle(angle: number, tolerance: number = 1e-6): boolean {
    const normalized = this.normalizeAngle(angle, AngleStyle.ANTICLOCKWISE);
    return Math.abs(normalized - Math.PI) < tolerance;
  }

  static isFullAngle(angle: number, tolerance: number = 1e-6): boolean {
    const normalized = this.normalizeAngle(angle, AngleStyle.ANTICLOCKWISE);
    return Math.abs(normalized - 2 * Math.PI) < tolerance;
  }

  static getArcPoints(
    center: { x: number; y: number },
    startAngle: number,
    endAngle: number,
    radius: number,
    numPoints: number = 32
  ): Array<{ x: number; y: number }> {
    const points: Array<{ x: number; y: number }> = [];
    const angleStep = (endAngle - startAngle) / (numPoints - 1);

    for (let i = 0; i < numPoints; i++) {
      const angle = startAngle + i * angleStep;
      points.push({
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
      });
    }

    return points;
  }

  static getSectorPath(
    center: { x: number; y: number },
    startAngle: number,
    endAngle: number,
    radius: number
  ): string {
    const startX = center.x + radius * Math.cos(startAngle);
    const startY = center.y + radius * Math.sin(startAngle);
    const endX = center.x + radius * Math.cos(endAngle);
    const endY = center.y + radius * Math.sin(endAngle);

    const largeArcFlag = (endAngle - startAngle) > Math.PI ? 1 : 0;

    return [
      `M ${center.x} ${center.y}`,
      `L ${startX} ${startY}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
      'Z',
    ].join(' ');
  }

  static getRightAngleMarker(
    center: { x: number; y: number },
    startAngle: number,
    size: number = 20
  ): string {
    const x1 = center.x + size * Math.cos(startAngle);
    const y1 = center.y + size * Math.sin(startAngle);
    const x2 = center.x + size * Math.cos(startAngle + Math.PI / 2);
    const y2 = center.y + size * Math.sin(startAngle + Math.PI / 2);
    const xm = center.x + size * Math.cos(startAngle + Math.PI / 4);
    const ym = center.y + size * Math.sin(startAngle + Math.PI / 4);

    return `M ${x1} ${y1} L ${xm} ${ym} L ${x2} ${y2}`;
  }

  static bisectAngle(angle1: number, angle2: number): number {
    let a1 = this.normalizeAngle(angle1, AngleStyle.ANTICLOCKWISE);
    let a2 = this.normalizeAngle(angle2, AngleStyle.ANTICLOCKWISE);

    let diff = a2 - a1;
    if (diff > Math.PI) diff -= 2 * Math.PI;
    if (diff < -Math.PI) diff += 2 * Math.PI;

    return a1 + diff / 2;
  }

  static complement(angle: number): number {
    return Math.PI / 2 - angle;
  }

  static supplement(angle: number): number {
    return Math.PI - angle;
  }

  static conjugate(angle: number): number {
    return 2 * Math.PI - angle;
  }
}
