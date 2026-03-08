import { GeoElement, GeoLineElement, GeoSegmentElement, GeoCircleElement, GeoPointElement, WorldPoint } from '../types';

/**
 * 计算两个几何元素之间的交点
 * @param element1 第一个几何元素
 * @param element2 第二个几何元素
 * @param getElement 根据ID获取元素的函数
 * @returns 交点数组
 */
export function findIntersections(
  element1: GeoElement,
  element2: GeoElement,
  getElement: (id: string) => GeoElement | undefined
): WorldPoint[] {
  const intersections: WorldPoint[] = [];

  // 直线与直线的交点
  if (element1.type === 'line' && element2.type === 'line') {
    const line1 = element1 as GeoLineElement;
    const line2 = element2 as GeoLineElement;
    const intersection = lineLineIntersection(line1, line2);
    if (intersection) {
      intersections.push(intersection);
    }
  }
  
  // 直线与线段的交点
  else if (element1.type === 'line' && element2.type === 'segment') {
    const line = element1 as GeoLineElement;
    const segment = element2 as GeoSegmentElement;
    const points = lineSegmentIntersection(line, segment, getElement);
    intersections.push(...points);
  }
  
  // 线段与直线的交点
  else if (element1.type === 'segment' && element2.type === 'line') {
    const segment = element1 as GeoSegmentElement;
    const line = element2 as GeoLineElement;
    const points = lineSegmentIntersection(line, segment, getElement);
    intersections.push(...points);
  }
  
  // 线段与线段的交点
  else if (element1.type === 'segment' && element2.type === 'segment') {
    const segment1 = element1 as GeoSegmentElement;
    const segment2 = element2 as GeoSegmentElement;
    const point = segmentSegmentIntersection(segment1, segment2, getElement);
    if (point) {
      intersections.push(point);
    }
  }
  
  // 直线与圆的交点
  else if (element1.type === 'line' && element2.type === 'circle') {
    const line = element1 as GeoLineElement;
    const circle = element2 as GeoCircleElement;
    const points = lineCircleIntersection(line, circle, getElement);
    intersections.push(...points);
  }
  
  // 圆与直线的交点
  else if (element1.type === 'circle' && element2.type === 'line') {
    const circle = element1 as GeoCircleElement;
    const line = element2 as GeoLineElement;
    const points = lineCircleIntersection(line, circle, getElement);
    intersections.push(...points);
  }
  
  // 线段与圆的交点
  else if (element1.type === 'segment' && element2.type === 'circle') {
    const segment = element1 as GeoSegmentElement;
    const circle = element2 as GeoCircleElement;
    const points = segmentCircleIntersection(segment, circle, getElement);
    intersections.push(...points);
  }
  
  // 圆与线段的交点
  else if (element1.type === 'circle' && element2.type === 'segment') {
    const circle = element1 as GeoCircleElement;
    const segment = element2 as GeoSegmentElement;
    const points = segmentCircleIntersection(segment, circle, getElement);
    intersections.push(...points);
  }
  
  // 圆与圆的交点
  else if (element1.type === 'circle' && element2.type === 'circle') {
    const circle1 = element1 as GeoCircleElement;
    const circle2 = element2 as GeoCircleElement;
    const points = circleCircleIntersection(circle1, circle2, getElement);
    intersections.push(...points);
  }

  return intersections;
}

/**
 * 计算两条直线的交点
 * @param line1 第一条直线
 * @param line2 第二条直线
 * @returns 交点，如果平行则返回null
 */
function lineLineIntersection(line1: GeoLineElement, line2: GeoLineElement): WorldPoint | null {
  const { a: a1, b: b1, c: c1 } = line1;
  const { a: a2, b: b2, c: c2 } = line2;

  const determinant = a1 * b2 - a2 * b1;
  
  if (Math.abs(determinant) < 1e-10) {
    // 直线平行，无交点
    return null;
  }

  const x = (b1 * c2 - b2 * c1) / determinant;
  const y = (a2 * c1 - a1 * c2) / determinant;

  return { x, y };
}

/**
 * 计算直线与线段的交点
 * @param line 直线
 * @param segment 线段
 * @param getElement 根据ID获取元素的函数
 * @returns 交点数组
 */
function lineSegmentIntersection(
  line: GeoLineElement,
  segment: GeoSegmentElement,
  getElement: (id: string) => GeoElement | undefined
): WorldPoint[] {
  const startPoint = getElement(segment.startPointId) as GeoPointElement;
  const endPoint = getElement(segment.endPointId) as GeoPointElement;
  
  if (!startPoint || !endPoint) {
    return [];
  }

  const { a, b, c } = line;
  const { x: x1, y: y1 } = startPoint;
  const { x: x2, y: y2 } = endPoint;

  // 计算直线与线段所在直线的交点
  const denominator = a * (y1 - y2) - b * (x1 - x2);
  
  if (Math.abs(denominator) < 1e-10) {
    // 直线与线段所在直线平行
    return [];
  }

  const t = (a * x1 + b * y1 + c) / denominator;
  
  if (t < 0 || t > 1) {
    // 交点在线段外
    return [];
  }

  const x = x1 + t * (x2 - x1);
  const y = y1 + t * (y2 - y1);

  return [{ x, y }];
}

/**
 * 计算两条线段的交点
 * @param segment1 第一条线段
 * @param segment2 第二条线段
 * @param getElement 根据ID获取元素的函数
 * @returns 交点，如果没有交点则返回null
 */
function segmentSegmentIntersection(
  segment1: GeoSegmentElement,
  segment2: GeoSegmentElement,
  getElement: (id: string) => GeoElement | undefined
): WorldPoint | null {
  const start1 = getElement(segment1.startPointId) as GeoPointElement;
  const end1 = getElement(segment1.endPointId) as GeoPointElement;
  const start2 = getElement(segment2.startPointId) as GeoPointElement;
  const end2 = getElement(segment2.endPointId) as GeoPointElement;
  
  if (!start1 || !end1 || !start2 || !end2) {
    return null;
  }

  const { x: x1, y: y1 } = start1;
  const { x: x2, y: y2 } = end1;
  const { x: x3, y: y3 } = start2;
  const { x: x4, y: y4 } = end2;

  const denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  
  if (Math.abs(denominator) < 1e-10) {
    // 线段所在直线平行
    return null;
  }

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;

  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    const x = x1 + ua * (x2 - x1);
    const y = y1 + ua * (y2 - y1);
    return { x, y };
  }

  return null;
}

/**
 * 计算直线与圆的交点
 * @param line 直线
 * @param circle 圆
 * @param getElement 根据ID获取元素的函数
 * @returns 交点数组
 */
function lineCircleIntersection(
  line: GeoLineElement,
  circle: GeoCircleElement,
  getElement: (id: string) => GeoElement | undefined
): WorldPoint[] {
  const center = getElement(circle.centerId) as GeoPointElement;
  
  if (!center) {
    return [];
  }

  const { a, b, c } = line;
  const { x: cx, y: cy } = center;
  const r = circle.radius;

  // 将直线方程转换为标准形式：ax + by + c = 0
  // 计算圆心到直线的距离
  const distance = Math.abs(a * cx + b * cy + c) / Math.sqrt(a * a + b * b);
  
  if (distance > r) {
    // 直线与圆相离，无交点
    return [];
  }
  
  if (Math.abs(distance - r) < 1e-10) {
    // 直线与圆相切，有一个交点
    // 找到直线上离圆心最近的点
    const t = -(a * cx + b * cy + c) / (a * a + b * b);
    const x = cx + a * t;
    const y = cy + b * t;
    return [{ x, y }];
  }
  
  // 直线与圆相交，有两个交点
  // 找到直线上离圆心最近的点
  const t0 = -(a * cx + b * cy + c) / (a * a + b * b);
  const closestX = cx + a * t0;
  const closestY = cy + b * t0;
  
  // 计算从最近点到交点的距离
  const d = Math.sqrt(r * r - distance * distance);
  
  // 计算直线的方向向量（垂直于法向量）
  const dirX = -b;
  const dirY = a;
  const dirLength = Math.sqrt(dirX * dirX + dirY * dirY);
  
  // 归一化方向向量
  const unitDirX = dirX / dirLength;
  const unitDirY = dirY / dirLength;
  
  // 计算两个交点
  const x1 = closestX + d * unitDirX;
  const y1 = closestY + d * unitDirY;
  const x2 = closestX - d * unitDirX;
  const y2 = closestY - d * unitDirY;
  
  return [{ x: x1, y: y1 }, { x: x2, y: y2 }];
}

/**
 * 计算线段与圆的交点
 * @param segment 线段
 * @param circle 圆
 * @param getElement 根据ID获取元素的函数
 * @returns 交点数组
 */
function segmentCircleIntersection(
  segment: GeoSegmentElement,
  circle: GeoCircleElement,
  getElement: (id: string) => GeoElement | undefined
): WorldPoint[] {
  const startPoint = getElement(segment.startPointId) as GeoPointElement;
  const endPoint = getElement(segment.endPointId) as GeoPointElement;
  const center = getElement(circle.centerId) as GeoPointElement;
  
  if (!startPoint || !endPoint || !center) {
    return [];
  }

  const { x: x1, y: y1 } = startPoint;
  const { x: x2, y: y2 } = endPoint;
  const { x: cx, y: cy } = center;
  const r = circle.radius;

  // 计算线段的参数方程
  const dx = x2 - x1;
  const dy = y2 - y1;
  const a = dx * dx + dy * dy;
  const b = 2 * (dx * (x1 - cx) + dy * (y1 - cy));
  const c = (x1 - cx) * (x1 - cx) + (y1 - cy) * (y1 - cy) - r * r;

  const discriminant = b * b - 4 * a * c;
  
  if (discriminant < 0) {
    // 线段所在直线与圆无交点
    return [];
  }

  const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
  const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);

  const points: WorldPoint[] = [];
  
  if (t1 >= 0 && t1 <= 1) {
    const x = x1 + t1 * dx;
    const y = y1 + t1 * dy;
    points.push({ x, y });
  }
  
  if (t2 >= 0 && t2 <= 1 && Math.abs(t1 - t2) > 1e-10) {
    const x = x1 + t2 * dx;
    const y = y1 + t2 * dy;
    points.push({ x, y });
  }

  return points;
}

/**
 * 计算两个圆的交点
 * @param circle1 第一个圆
 * @param circle2 第二个圆
 * @param getElement 根据ID获取元素的函数
 * @returns 交点数组
 */
function circleCircleIntersection(
  circle1: GeoCircleElement,
  circle2: GeoCircleElement,
  getElement: (id: string) => GeoElement | undefined
): WorldPoint[] {
  const center1 = getElement(circle1.centerId) as GeoPointElement;
  const center2 = getElement(circle2.centerId) as GeoPointElement;
  
  if (!center1 || !center2) {
    return [];
  }

  const { x: x1, y: y1 } = center1;
  const { x: x2, y: y2 } = center2;
  const r1 = circle1.radius;
  const r2 = circle2.radius;

  // 计算两圆心之间的距离
  const dx = x2 - x1;
  const dy = y2 - y1;
  const d = Math.sqrt(dx * dx + dy * dy);

  if (d > r1 + r2 || d < Math.abs(r1 - r2)) {
    // 两圆相离或内含，无交点
    return [];
  }

  if (Math.abs(d) < 1e-10) {
    // 两圆同心
    return [];
  }

  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(r1 * r1 - a * a);

  const xm = x1 + a * dx / d;
  const ym = y1 + a * dy / d;

  const xs1 = xm + h * dy / d;
  const ys1 = ym - h * dx / d;
  const xs2 = xm - h * dy / d;
  const ys2 = ym + h * dx / d;

  if (Math.abs(d - (r1 + r2)) < 1e-10 || Math.abs(d - Math.abs(r1 - r2)) < 1e-10) {
    // 两圆相切，只有一个交点
    return [{ x: xs1, y: ys1 }];
  }

  // 两圆相交，有两个交点
  return [{ x: xs1, y: ys1 }, { x: xs2, y: ys2 }];
}