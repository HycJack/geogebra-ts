import type {
  GeoElement,
  GeoPointElement,
  GeoLineElement,
  GeoSegmentElement,
  GeoRayElement,
  GeoCircleElement,
  GeoPolygonElement,
  GeoVectorElement,
  GeoTextElement,
} from './index';

export function isGeoPoint(element: GeoElement): element is GeoPointElement {
  return element.type === 'point';
}

export function isGeoLine(element: GeoElement): element is GeoLineElement {
  return element.type === 'line';
}

export function isGeoSegment(element: GeoElement): element is GeoSegmentElement {
  return element.type === 'segment';
}

export function isGeoRay(element: GeoElement): element is GeoRayElement {
  return element.type === 'ray';
}

export function isGeoCircle(element: GeoElement): element is GeoCircleElement {
  return element.type === 'circle';
}

export function isGeoPolygon(element: GeoElement): element is GeoPolygonElement {
  return element.type === 'polygon';
}

export function isGeoVector(element: GeoElement): element is GeoVectorElement {
  return element.type === 'vector';
}

export function isGeoText(element: GeoElement): element is GeoTextElement {
  return element.type === 'text';
}

export function isLineLike(element: GeoElement): element is GeoLineElement | GeoSegmentElement | GeoRayElement {
  return element.type === 'line' || element.type === 'segment' || element.type === 'ray';
}

export function isPathLike(element: GeoElement): element is GeoLineElement | GeoSegmentElement | GeoRayElement | GeoCircleElement | GeoPolygonElement {
  return isLineLike(element) || element.type === 'circle' || element.type === 'polygon';
}

export function hasCoordinates(element: GeoElement): element is GeoPointElement | GeoTextElement {
  return element.type === 'point' || element.type === 'text';
}

export function hasRadius(element: GeoElement): element is GeoCircleElement {
  return element.type === 'circle';
}

export function hasEndpoints(element: GeoElement): element is GeoSegmentElement | GeoVectorElement {
  return element.type === 'segment' || element.type === 'vector';
}

export function hasVertices(element: GeoElement): element is GeoPolygonElement {
  return element.type === 'polygon';
}

export function getDisplayName(element: GeoElement): string {
  const typeNames: Record<string, string> = {
    point: '点',
    line: '直线',
    segment: '线段',
    ray: '射线',
    circle: '圆',
    polygon: '多边形',
    vector: '向量',
    text: '文本',
  };
  const typeName = typeNames[element.type] || element.type;
  return `${typeName} ${element.label}`;
}

export function getElementDescription(element: GeoElement): string {
  if (isGeoPoint(element)) {
    return `(${element.x.toFixed(2)}, ${element.y.toFixed(2)})`;
  }
  if (isGeoLine(element)) {
    return `${element.a.toFixed(2)}x + ${element.b.toFixed(2)}y + ${element.c.toFixed(2)} = 0`;
  }
  if (isGeoCircle(element)) {
    return `半径: ${element.radius.toFixed(2)}`;
  }
  if (isGeoPolygon(element)) {
    return `${element.vertexCount} 个顶点`;
  }
  if (isGeoText(element)) {
    return element.text;
  }
  return '';
}

export function asGeoPoint(element: GeoElement): GeoPointElement | null {
  return isGeoPoint(element) ? element : null;
}

export function asGeoLine(element: GeoElement): GeoLineElement | null {
  return isGeoLine(element) ? element : null;
}

export function asGeoSegment(element: GeoElement): GeoSegmentElement | null {
  return isGeoSegment(element) ? element : null;
}

export function asGeoCircle(element: GeoElement): GeoCircleElement | null {
  return isGeoCircle(element) ? element : null;
}

export function asGeoPolygon(element: GeoElement): GeoPolygonElement | null {
  return isGeoPolygon(element) ? element : null;
}

export function assertIsGeoPoint(element: GeoElement): asserts element is GeoPointElement {
  if (!isGeoPoint(element)) {
    throw new TypeError(`Expected point element, got ${element.type}`);
  }
}

export function assertIsGeoLine(element: GeoElement): asserts element is GeoLineElement {
  if (!isGeoLine(element)) {
    throw new TypeError(`Expected line element, got ${element.type}`);
  }
}

export function assertIsGeoCircle(element: GeoElement): asserts element is GeoCircleElement {
  if (!isGeoCircle(element)) {
    throw new TypeError(`Expected circle element, got ${element.type}`);
  }
}

export function isDraggable(element: GeoElement): boolean {
  if (element.type === 'point' || element.type === 'text') {
    return element.isIndependent;
  }
  return false;
}

export function isSelectable(element: GeoElement): boolean {
  return element.style.visible;
}

export function isDeletable(element: GeoElement): boolean {
  return element.isIndependent;
}

export const ElementTypeNames: Record<string, string> = {
  point: '点',
  line: '直线',
  segment: '线段',
  ray: '射线',
  circle: '圆',
  polygon: '多边形',
  vector: '向量',
  text: '文本',
};

export function createElementAccessor(element: GeoElement) {
  return {
    isPoint: () => isGeoPoint(element),
    isLine: () => isGeoLine(element),
    isSegment: () => isGeoSegment(element),
    isRay: () => isGeoRay(element),
    isCircle: () => isGeoCircle(element),
    isPolygon: () => isGeoPolygon(element),
    isVector: () => isGeoVector(element),
    isText: () => isGeoText(element),
    get: () => element,
  };
}
