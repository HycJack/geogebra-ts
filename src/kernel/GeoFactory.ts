/**
 * 几何对象工厂
 * 对应 Java 版本的 GeoFactory
 * 
 * 负责创建各种几何对象实例
 */

// import type { Construction } from './Construction';
import type { GeoElementType, GeoElement, GeoElementStyle } from './geos/GeoElement';
import { ConicType } from './geos/GeoConic';
import { AngleStyle, AngleDecoration } from './geos/GeoAngle';
import { FunctionType } from './geos/GeoFunction';

export type GeoTypeString =
  | 'point'
  | 'line'
  | 'segment'
  | 'ray'
  | 'vector'
  | 'circle'
  | 'conic'
  | 'ellipse'
  | 'hyperbola'
  | 'parabola'
  | 'polygon'
  | 'polyline'
  | 'angle'
  | 'function'
  | 'text'
  | 'numeric'
  | 'boolean'
  | 'list';

export interface GeoCreateOptions {
  label?: string;
  style?: Partial<GeoElementStyle>;
  visible?: boolean;
  defined?: boolean;
}

export interface PointCreateOptions extends GeoCreateOptions {
  x: number;
  y: number;
  z?: number;
  pointSize?: number;
  pointStyle?: 'dot' | 'cross' | 'circle' | 'square';
}

export interface LineCreateOptions extends GeoCreateOptions {
  a: number;
  b: number;
  c: number;
}

export interface SegmentCreateOptions extends GeoCreateOptions {
  startPointId: string;
  endPointId: string;
}

export interface RayCreateOptions extends GeoCreateOptions {
  startPointId: string;
  throughPointId: string;
}

export interface CircleCreateOptions extends GeoCreateOptions {
  centerId: string;
  radius: number;
}

export interface PolygonCreateOptions extends GeoCreateOptions {
  pointIds: string[];
}

export interface ConicCreateOptions extends GeoCreateOptions {
  matrix?: [number, number, number, number, number, number];
  conicType?: ConicType;
  center?: { x: number; y: number };
  semiMajorAxis?: number;
  semiMinorAxis?: number;
  rotationAngle?: number;
}

export interface AngleCreateOptions extends GeoCreateOptions {
  value: number;
  vertexId?: string;
  point1Id?: string;
  point2Id?: string;
  angleStyle?: AngleStyle;
  decoration?: AngleDecoration;
}

export interface FunctionCreateOptions extends GeoCreateOptions {
  expression: string;
  functionType?: FunctionType;
  domain?: { min: number; max: number };
}

export class GeoFactory {
  // private _construction: Construction;
  private idCounter: number = 0;

  // constructor(construction: Construction) {
  //   this._construction = construction;
  // }

  createGeoElement(type: GeoTypeString, options?: GeoCreateOptions): GeoElement | null {
    switch (type) {
      case 'point':
        return this.createPoint(options as PointCreateOptions);
      case 'line':
        return this.createLine(options as LineCreateOptions);
      case 'segment':
        return this.createSegment(options as SegmentCreateOptions);
      case 'ray':
        return this.createRay(options as RayCreateOptions);
      case 'circle':
        return this.createCircle(options as CircleCreateOptions);
      case 'polygon':
        return this.createPolygon(options as PolygonCreateOptions);
      case 'conic':
      case 'ellipse':
      case 'hyperbola':
      case 'parabola':
        return this.createConic(options as ConicCreateOptions);
      case 'angle':
        return this.createAngle(options as AngleCreateOptions);
      case 'function':
        return this.createFunction(options as FunctionCreateOptions);
      default:
        console.warn(`GeoFactory: element of type ${type} could not be created.`);
        return null;
    }
  }

  createPoint(options: PointCreateOptions): any {
    const id = this.generateId();
    const label = options.label || this.generateLabel('point');
    const style = this.mergeStyle(options.style);

    return {
      id,
      type: 'point' as const,
      label,
      x: options.x,
      y: options.y,
      z: options.z ?? 1,
      pointSize: options.pointSize ?? 4,
      pointStyle: options.pointStyle ?? 'dot',
      style,
      visible: options.visible ?? true,
      defined: options.defined ?? true,
      isIndependent: true,
      parentIds: [],
      childIds: [],
      constructionIndex: 0,
    };
  }

  createLine(options: LineCreateOptions): any {
    const id = this.generateId();
    const label = options.label || this.generateLabel('line');
    const style = this.mergeStyle(options.style);

    return {
      id,
      type: 'line' as const,
      label,
      a: options.a,
      b: options.b,
      c: options.c,
      style,
      visible: options.visible ?? true,
      defined: options.defined ?? true,
      isIndependent: true,
      parentIds: [],
      childIds: [],
      constructionIndex: 0,
    };
  }

  createSegment(options: SegmentCreateOptions): any {
    const id = this.generateId();
    const label = options.label || this.generateLabel('segment');
    const style = this.mergeStyle(options.style);

    return {
      id,
      type: 'segment' as const,
      label,
      startPointId: options.startPointId,
      endPointId: options.endPointId,
      style,
      visible: options.visible ?? true,
      defined: options.defined ?? true,
      isIndependent: false,
      parentIds: [options.startPointId, options.endPointId],
      childIds: [],
      constructionIndex: 0,
    };
  }

  createRay(options: RayCreateOptions): any {
    const id = this.generateId();
    const label = options.label || this.generateLabel('ray');
    const style = this.mergeStyle(options.style);

    return {
      id,
      type: 'ray' as const,
      label,
      startPointId: options.startPointId,
      throughPointId: options.throughPointId,
      style,
      visible: options.visible ?? true,
      defined: options.defined ?? true,
      isIndependent: false,
      parentIds: [options.startPointId, options.throughPointId],
      childIds: [],
      constructionIndex: 0,
    };
  }

  createCircle(options: CircleCreateOptions): any {
    const id = this.generateId();
    const label = options.label || this.generateLabel('circle');
    const style = this.mergeStyle(options.style);

    return {
      id,
      type: 'circle' as const,
      label,
      centerId: options.centerId,
      radius: options.radius,
      style,
      visible: options.visible ?? true,
      defined: options.defined ?? true,
      isIndependent: false,
      parentIds: [options.centerId],
      childIds: [],
      constructionIndex: 0,
    };
  }

  createPolygon(options: PolygonCreateOptions): any {
    const id = this.generateId();
    const label = options.label || this.generateLabel('polygon');
    const style = this.mergeStyle(options.style);

    return {
      id,
      type: 'polygon' as const,
      label,
      pointIds: options.pointIds,
      vertexCount: options.pointIds.length,
      style,
      visible: options.visible ?? true,
      defined: options.defined ?? true,
      isIndependent: false,
      parentIds: [...options.pointIds],
      childIds: [],
      constructionIndex: 0,
    };
  }

  createConic(options: ConicCreateOptions): any {
    const id = this.generateId();
    const label = options.label || this.generateLabel('conic');
    const style = this.mergeStyle(options.style);

    return {
      id,
      type: 'conic' as const,
      label,
      conicType: options.conicType ?? ConicType.CONIC_ELLIPSE,
      matrix: options.matrix ?? [1, 1, 0, 0, 0, 0],
      center: options.center,
      semiMajorAxis: options.semiMajorAxis,
      semiMinorAxis: options.semiMinorAxis,
      rotationAngle: options.rotationAngle,
      style,
      visible: options.visible ?? true,
      defined: options.defined ?? true,
      parentIds: [],
      childIds: [],
      constructionIndex: 0,
    };
  }

  createEllipse(
    centerX: number,
    centerY: number,
    semiMajorAxis: number,
    semiMinorAxis: number,
    rotationAngle: number = 0,
    options?: GeoCreateOptions
  ): any {
    const a = semiMajorAxis;
    const b = semiMinorAxis;
    const cos = Math.cos(rotationAngle);
    const sin = Math.sin(rotationAngle);
    const cos2 = cos * cos;
    const sin2 = sin * sin;
    const sin2cos = 2 * sin * cos;

    const A = cos2 / (a * a) + sin2 / (b * b);
    const B = sin2cos / (a * a) - sin2cos / (b * b);
    const C = sin2 / (a * a) + cos2 / (b * b);
    const D = -2 * A * centerX - B * centerY;
    const E = -B * centerX - 2 * C * centerY;
    const F = A * centerX * centerX + B * centerX * centerY + C * centerY * centerY - 1;

    return this.createConic({
      ...options,
      conicType: ConicType.CONIC_ELLIPSE,
      center: { x: centerX, y: centerY },
      semiMajorAxis,
      semiMinorAxis,
      rotationAngle,
      matrix: [A, B, C, D, E, F],
    });
  }

  createHyperbola(
    centerX: number,
    centerY: number,
    semiTransverseAxis: number,
    semiConjugateAxis: number,
    rotationAngle: number = 0,
    options?: GeoCreateOptions
  ): any {
    const a = semiTransverseAxis;
    const b = semiConjugateAxis;
    const cos = Math.cos(rotationAngle);
    const sin = Math.sin(rotationAngle);
    const cos2 = cos * cos;
    const sin2 = sin * sin;
    const sin2cos = 2 * sin * cos;

    const A = cos2 / (a * a) - sin2 / (b * b);
    const B = sin2cos / (a * a) + sin2cos / (b * b);
    const C = sin2 / (a * a) - cos2 / (b * b);
    const D = -2 * A * centerX - B * centerY;
    const E = -B * centerX - 2 * C * centerY;
    const F = A * centerX * centerX + B * centerX * centerY + C * centerY * centerY - 1;

    return this.createConic({
      ...options,
      conicType: ConicType.CONIC_HYPERBOLA,
      center: { x: centerX, y: centerY },
      semiMajorAxis: semiTransverseAxis,
      semiMinorAxis: semiConjugateAxis,
      rotationAngle,
      matrix: [A, B, C, D, E, F],
    });
  }

  createParabola(
    vertexX: number,
    vertexY: number,
    focalLength: number,
    rotationAngle: number = 0,
    options?: GeoCreateOptions
  ): any {
    const p = focalLength;
    const cos = Math.cos(rotationAngle);
    const sin = Math.sin(rotationAngle);

    const A = sin * sin;
    const B = -2 * sin * cos;
    const C = cos * cos;
    const D = -sin * (2 * p * cos + vertexX * sin - vertexY * cos);
    const E = cos * (2 * p * cos + vertexX * sin - vertexY * cos);
    const F = 2 * p * (vertexX * cos + vertexY * sin);

    return this.createConic({
      ...options,
      conicType: ConicType.CONIC_PARABOLA,
      center: { x: vertexX, y: vertexY },
      semiMajorAxis: focalLength,
      rotationAngle,
      matrix: [A, B, C, D, E, F],
    });
  }

  createAngle(options: AngleCreateOptions): any {
    const id = this.generateId();
    const label = options.label || this.generateLabel('angle');
    const style = this.mergeStyle(options.style);

    return {
      id,
      type: 'angle' as const,
      label,
      value: options.value,
      rawValue: options.value,
      vertexId: options.vertexId,
      point1Id: options.point1Id,
      point2Id: options.point2Id,
      angleStyle: options.angleStyle ?? AngleStyle.ANTICLOCKWISE,
      startAngle: 0,
      endAngle: options.value,
      style,
      visible: options.visible ?? true,
      defined: options.defined ?? true,
      isIndependent: false,
      parentIds: options.vertexId ? [options.vertexId] : [],
      childIds: [],
      constructionIndex: 0,
    };
  }

  createFunction(options: FunctionCreateOptions): any {
    const id = this.generateId();
    const label = options.label || this.generateLabel('function');
    const style = this.mergeStyle(options.style);

    return {
      id,
      type: 'function' as const,
      label,
      functionType: options.functionType ?? 'explicit',
      expression: options.expression,
      domain: options.domain,
      style,
      visible: options.visible ?? true,
      defined: options.defined ?? true,
      isIndependent: true,
      parentIds: [],
      childIds: [],
      constructionIndex: 0,
    };
  }

  createVector(startPointId: string, endPointId: string, options?: GeoCreateOptions): any {
    const id = this.generateId();
    const label = options?.label || this.generateLabel('vector');
    const style = this.mergeStyle(options?.style);

    return {
      id,
      type: 'vector' as const,
      label,
      startPointId,
      endPointId,
      style,
      visible: options?.visible ?? true,
      defined: options?.defined ?? true,
      isIndependent: false,
      parentIds: [startPointId, endPointId],
      childIds: [],
      constructionIndex: 0,
    };
  }

  createText(x: number, y: number, text: string, options?: GeoCreateOptions): any {
    const id = this.generateId();
    const label = options?.label || this.generateLabel('text');
    const style = this.mergeStyle(options?.style);

    return {
      id,
      type: 'text' as const,
      label,
      x,
      y,
      text,
      fontSize: 14,
      style,
      visible: options?.visible ?? true,
      defined: options?.defined ?? true,
      isIndependent: true,
      parentIds: [],
      childIds: [],
      constructionIndex: 0,
    };
  }

  private generateId(): string {
    return `geo_${Date.now()}_${++this.idCounter}`;
  }

  private generateLabel(type: GeoElementType): string {
    const counters: Record<string, number> = {
      point: 0,
      line: 0,
      segment: 0,
      ray: 0,
      circle: 0,
      polygon: 0,
      vector: 0,
      conic: 0,
      angle: 0,
      function: 0,
      text: 0,
    };
    
    counters[type]++;
    
    const prefixes: Record<string, string> = {
      point: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      line: 'abcdefghijklmnopqrstuvwxyz',
      segment: 's',
      ray: 'r',
      circle: 'c',
      polygon: 'poly',
      vector: 'v',
      conic: 'conic',
      angle: 'α',
      function: 'f',
      text: 'text',
    };
    
    const prefix = prefixes[type] || type.charAt(0);
    
    if (type === 'point') {
      const count = counters[type];
      if (count <= 26) {
        return prefix[count - 1];
      }
      return `P${count - 26}`;
    }
    
    return `${prefix}${counters[type]}`;
  }

  private mergeStyle(style?: Partial<GeoElementStyle>): GeoElementStyle {
    const defaultStyle: GeoElementStyle = {
      strokeColor: '#000000',
      fillColor: '#3366ff',
      strokeWidth: 2,
      opacity: 1,
      visible: true,
      labelVisible: true,
    };
    return { ...defaultStyle, ...style };
  }

  copy(geo: GeoElement): GeoElement | null {
    const type = geo.type as GeoTypeString;
    return this.createGeoElement(type, { ...geo } as GeoCreateOptions);
  }

  // copyInternal(geo: GeoElement, newConstruction: Construction): GeoElement | null {
  //   const factory = new GeoFactory(newConstruction);
  //   return factory.copy(geo);
  // }
}
