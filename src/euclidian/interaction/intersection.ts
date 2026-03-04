import { GeoElement, GeoLineElement, GeoCircleElement, GeoSegmentElement, GeoRayElement, GeoPolygonElement } from '../../types';

export interface IntersectionPoint {
  x: number;
  y: number;
  exists: boolean;
}

export function lineLineIntersection(
  line1: GeoLineElement,
  line2: GeoLineElement
): IntersectionPoint | null {
  const det = line1.a * line2.b - line2.a * line1.b;
  
  if (Math.abs(det) < 1e-10) {
    return null;
  }
  
  const x = (line1.b * line2.c - line2.b * line1.c) / det;
  const y = (line2.a * line1.c - line1.a * line2.c) / det;
  
  return { x, y, exists: true };
}

export function isPointOnSegment(
  point: IntersectionPoint,
  startX: number,
  startY: number,
  endX: number,
  endY: number
): boolean {
  const minX = Math.min(startX, endX) - 1e-10;
  const maxX = Math.max(startX, endX) + 1e-10;
  const minY = Math.min(startY, endY) - 1e-10;
  const maxY = Math.max(startY, endY) + 1e-10;
  
  return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
}

export function isPointOnRay(
  point: IntersectionPoint,
  startX: number,
  startY: number,
  throughX: number,
  throughY: number
): boolean {
  const dx = throughX - startX;
  const dy = throughY - startY;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) {
      return point.x >= startX - 1e-10;
    } else {
      return point.x <= startX + 1e-10;
    }
  } else {
    if (dy > 0) {
      return point.y >= startY - 1e-10;
    } else {
      return point.y <= startY + 1e-10;
    }
  }
}

export function lineCircleIntersection(
  line: GeoLineElement,
  circle: GeoCircleElement,
  center: { x: number; y: number }
): IntersectionPoint[] {
  const results: IntersectionPoint[] = [];
  
  const { a, b, c } = line;
  const { x: cx, y: cy } = center;
  const r = circle.radius;
  
  const distance = Math.abs(a * cx + b * cy + c) / Math.sqrt(a * a + b * b);
  if (distance > r + 1e-10) {
    return [];
  }
  
  if (Math.abs(a) < 1e-10) {
    const y0 = -c / b;
    const dx = Math.sqrt(Math.max(0, r * r - (y0 - cy) * (y0 - cy)));
    
    if (Math.abs(dx) < 1e-10) {
      results.push({ x: cx, y: y0, exists: true });
    } else {
      results.push({ x: cx + dx, y: y0, exists: true });
      results.push({ x: cx - dx, y: y0, exists: true });
    }
  } else if (Math.abs(b) < 1e-10) {
    const x0 = -c / a;
    const dy = Math.sqrt(Math.max(0, r * r - (x0 - cx) * (x0 - cx)));
    
    if (Math.abs(dy) < 1e-10) {
      results.push({ x: x0, y: cy, exists: true });
    } else {
      results.push({ x: x0, y: cy + dy, exists: true });
      results.push({ x: x0, y: cy - dy, exists: true });
    }
  } else {
    const m = -a / b;
    const k = -c / b;
    
    const A = 1 + m * m;
    const B = 2 * (m * (k - cy) - cx);
    const C = cx * cx + (k - cy) * (k - cy) - r * r;
    
    const discriminant = B * B - 4 * A * C;
    
    if (discriminant < -1e-10) {
      return [];
    }
    
    if (Math.abs(discriminant) < 1e-10) {
      const x = -B / (2 * A);
      const y = m * x + k;
      results.push({ x, y, exists: true });
    } else {
      const sqrtD = Math.sqrt(discriminant);
      const x1 = (-B + sqrtD) / (2 * A);
      const x2 = (-B - sqrtD) / (2 * A);
      
      results.push({ x: x1, y: m * x1 + k, exists: true });
      results.push({ x: x2, y: m * x2 + k, exists: true });
    }
  }
  
  return results;
}

export function circleCircleIntersection(
  circle1: GeoCircleElement,
  center1: { x: number; y: number },
  circle2: GeoCircleElement,
  center2: { x: number; y: number }
): IntersectionPoint[] {
  const { x: x1, y: y1 } = center1;
  const { x: x2, y: y2 } = center2;
  const r1 = circle1.radius;
  const r2 = circle2.radius;
  
  const dx = x2 - x1;
  const dy = y2 - y1;
  const d = Math.sqrt(dx * dx + dy * dy);
  
  if (d > r1 + r2 + 1e-10) {
    return [];
  }
  
  if (d < Math.abs(r1 - r2) - 1e-10) {
    return [];
  }
  
  if (Math.abs(d) < 1e-10 && Math.abs(r1 - r2) < 1e-10) {
    return [];
  }
  
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const hSquared = r1 * r1 - a * a;
  const h = Math.sqrt(Math.max(0, hSquared));
  
  const px = x1 + (a * dx) / d;
  const py = y1 + (a * dy) / d;
  
  const results: IntersectionPoint[] = [];
  
  if (Math.abs(h) < 1e-10) {
    results.push({ x: px, y: py, exists: true });
  } else {
    results.push({
      x: px + (h * dy) / d,
      y: py - (h * dx) / d,
      exists: true
    });
    results.push({
      x: px - (h * dy) / d,
      y: py + (h * dx) / d,
      exists: true
    });
  }
  
  return results;
}

export function findIntersections(
  element1: GeoElement,
  element2: GeoElement,
  getElement: (id: string) => GeoElement | undefined
): IntersectionPoint[] {
  const results: IntersectionPoint[] = [];
  
  const isLine = (el: GeoElement): el is GeoLineElement => el.type === 'line';
  const isSegment = (el: GeoElement): el is GeoSegmentElement => el.type === 'segment';
  const isRay = (el: GeoElement): el is GeoRayElement => el.type === 'ray';
  const isCircle = (el: GeoElement): el is GeoCircleElement => el.type === 'circle';
  const isPolygon = (el: GeoElement): el is GeoPolygonElement => el.type === 'polygon';
  
  const isLineLike = (el: GeoElement) => isLine(el) || isSegment(el) || isRay(el);
  
  const getLineParams = (el: GeoElement): { a: number; b: number; c: number } | null => {
    if (isLine(el)) {
      return { a: el.a, b: el.b, c: el.c };
    }
    if (isSegment(el)) {
      const start = getElement(el.startPointId);
      const end = getElement(el.endPointId);
      if (start && end && start.type === 'point' && end.type === 'point') {
        const a = end.y - start.y;
        const b = start.x - end.x;
        const c = end.x * start.y - start.x * end.y;
        return { a, b, c };
      }
    }
    if (isRay(el)) {
      const start = getElement(el.startPointId);
      const through = getElement(el.throughPointId);
      if (start && through && start.type === 'point' && through.type === 'point') {
        const a = through.y - start.y;
        const b = start.x - through.x;
        const c = through.x * start.y - start.x * through.y;
        return { a, b, c };
      }
    }
    return null;
  };
  
  const getCenter = (circle: GeoCircleElement): { x: number; y: number } | null => {
    const center = getElement(circle.centerId);
    if (center && center.type === 'point') {
      return { x: center.x, y: center.y };
    }
    return null;
  };
  
  const getSegmentEndpoints = (segment: GeoSegmentElement): { startX: number; startY: number; endX: number; endY: number } | null => {
    const start = getElement(segment.startPointId);
    const end = getElement(segment.endPointId);
    if (start && end && start.type === 'point' && end.type === 'point') {
      return { startX: start.x, startY: start.y, endX: end.x, endY: end.y };
    }
    return null;
  };
  
  const getRayPoints = (ray: GeoRayElement): { startX: number; startY: number; throughX: number; throughY: number } | null => {
    const start = getElement(ray.startPointId);
    const through = getElement(ray.throughPointId);
    if (start && through && start.type === 'point' && through.type === 'point') {
      return { startX: start.x, startY: start.y, throughX: through.x, throughY: through.y };
    }
    return null;
  };
  
  const getPolygonVertices = (polygon: GeoPolygonElement): Array<{ x: number; y: number }> | null => {
    const vertices: Array<{ x: number; y: number }> = [];
    for (const pointId of polygon.pointIds) {
      const point = getElement(pointId);
      if (point && point.type === 'point') {
        vertices.push({ x: point.x, y: point.y });
      } else {
        return null;
      }
    }
    return vertices;
  };
  
  const filterSegmentIntersection = (point: IntersectionPoint, segment: GeoSegmentElement): boolean => {
    const endpoints = getSegmentEndpoints(segment);
    if (!endpoints) return false;
    return isPointOnSegment(point, endpoints.startX, endpoints.startY, endpoints.endX, endpoints.endY);
  };
  
  const filterRayIntersection = (point: IntersectionPoint, ray: GeoRayElement): boolean => {
    const points = getRayPoints(ray);
    if (!points) return false;
    return isPointOnRay(point, points.startX, points.startY, points.throughX, points.throughY);
  };
  
  const handleLineLikeIntersection = (
    el1: GeoElement,
    el2: GeoElement,
    params1: { a: number; b: number; c: number },
    params2: { a: number; b: number; c: number }
  ): void => {
    const line1: GeoLineElement = { ...el1, type: 'line', ...params1 } as GeoLineElement;
    const line2: GeoLineElement = { ...el2, type: 'line', ...params2 } as GeoLineElement;
    const intersection = lineLineIntersection(line1, line2);
    
    if (intersection) {
      let valid = true;
      
      if (isSegment(el1)) {
        valid = valid && filterSegmentIntersection(intersection, el1);
      } else if (isRay(el1)) {
        valid = valid && filterRayIntersection(intersection, el1);
      }
      
      if (isSegment(el2)) {
        valid = valid && filterSegmentIntersection(intersection, el2);
      } else if (isRay(el2)) {
        valid = valid && filterRayIntersection(intersection, el2);
      }
      
      if (valid) {
        results.push(intersection);
      }
    }
  };
  
  const handleLineLikeCircleIntersection = (
    lineLike: GeoElement,
    circle: GeoCircleElement,
    params: { a: number; b: number; c: number }
  ): void => {
    const center = getCenter(circle);
    if (!center) return;
    
    const line: GeoLineElement = { ...lineLike, type: 'line', ...params } as GeoLineElement;
    const intersections = lineCircleIntersection(line, circle, center);
    
    for (const point of intersections) {
      let valid = true;
      
      if (isSegment(lineLike)) {
        valid = filterSegmentIntersection(point, lineLike);
      } else if (isRay(lineLike)) {
        valid = filterRayIntersection(point, lineLike);
      }
      
      if (valid) {
        results.push(point);
      }
    }
  };
  
  const handlePolygonIntersection = (polygon: GeoPolygonElement, other: GeoElement): void => {
    const vertices = getPolygonVertices(polygon);
    if (!vertices || vertices.length < 2) return;
    
    for (let i = 0; i < vertices.length; i++) {
      const start = vertices[i];
      const end = vertices[(i + 1) % vertices.length];
      
      // const tempSegment: GeoSegmentElement = {
      //   id: `temp-segment-${i}`,
      //   type: 'segment',
      //   label: '',
      //   startPointId: '',
      //   endPointId: '',
      //   style: {} as any,
      //   isIndependent: false,
      //   parentIds: [],
      // };
      
      const params = {
        a: end.y - start.y,
        b: start.x - end.x,
        c: end.x * start.y - start.x * end.y,
      };
      
      if (isLineLike(other)) {
        const otherParams = getLineParams(other);
        if (otherParams) {
          const line: GeoLineElement = { ...other, type: 'line', ...otherParams } as GeoLineElement;
          const intersection = lineLineIntersection({ type: 'line', ...params } as GeoLineElement, line);
          
          if (intersection) {
            const onSegment = isPointOnSegment(intersection, start.x, start.y, end.x, end.y);
            let onOther = true;
            
            if (isSegment(other)) {
              onOther = filterSegmentIntersection(intersection, other);
            } else if (isRay(other)) {
              onOther = filterRayIntersection(intersection, other);
            }
            
            if (onSegment && onOther) {
              results.push(intersection);
            }
          }
        }
      } else if (isCircle(other)) {
        const center = getCenter(other);
        if (center) {
          const intersections = lineCircleIntersection({ type: 'line', ...params } as GeoLineElement, other, center);
          
          for (const point of intersections) {
            if (isPointOnSegment(point, start.x, start.y, end.x, end.y)) {
              results.push(point);
            }
          }
        }
      }
    }
  };
  
  if (isPolygon(element1) && !isPolygon(element2)) {
    handlePolygonIntersection(element1, element2);
  } else if (!isPolygon(element1) && isPolygon(element2)) {
    handlePolygonIntersection(element2, element1);
  } else if (isPolygon(element1) && isPolygon(element2)) {
    handlePolygonIntersection(element1, element2);
    handlePolygonIntersection(element2, element1);
  } else if (isLineLike(element1) && isLineLike(element2)) {
    const params1 = getLineParams(element1);
    const params2 = getLineParams(element2);
    
    if (params1 && params2) {
      handleLineLikeIntersection(element1, element2, params1, params2);
    }
  } else if (isLineLike(element1) && isCircle(element2)) {
    const params = getLineParams(element1);
    
    if (params) {
      handleLineLikeCircleIntersection(element1, element2, params);
    }
  } else if (isCircle(element1) && isLineLike(element2)) {
    const params = getLineParams(element2);
    
    if (params) {
      handleLineLikeCircleIntersection(element2, element1, params);
    }
  } else if (isCircle(element1) && isCircle(element2)) {
    const center1 = getCenter(element1);
    const center2 = getCenter(element2);
    
    if (center1 && center2) {
      results.push(...circleCircleIntersection(element1, center1, element2, center2));
    }
  }
  
  const uniqueResults: IntersectionPoint[] = [];
  for (const point of results) {
    const exists = uniqueResults.some(
      p => Math.abs(p.x - point.x) < 1e-10 && Math.abs(p.y - point.y) < 1e-10
    );
    if (!exists) {
      uniqueResults.push(point);
    }
  }
  
  return uniqueResults;
}
