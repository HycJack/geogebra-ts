// import { GeoPoint, GeoLine, GeoSegment, GeoCircle } from '../types/GeoElements';
// import { AngleAlgorithms } from './algorithms/AngleAlgorithms';
// import { TriangleAlgorithms } from './algorithms/TriangleAlgorithms';
// import { TransformationAlgorithms } from './algorithms/TransformationAlgorithms';
// import { DistanceAlgorithms } from './algorithms/DistanceAlgorithms';
// import { ProjectionAlgorithms } from './algorithms/ProjectionAlgorithms';
// import { IntersectionAlgorithms } from './algorithms/IntersectionAlgorithms';
// import { LineAlgorithms } from './algorithms/LineAlgorithms';
// import { AngleBisectorAlgorithms } from './algorithms/AngleBisectorAlgorithms';
// import { TangentAlgorithms } from './algorithms/TangentAlgorithms';
// import { PerpendicularBisectorAlgorithms } from './algorithms/PerpendicularBisectorAlgorithms';
// import { CircleAlgorithms } from './algorithms/CircleAlgorithms';
// import { CollinearityAlgorithms } from './algorithms/CollinearityAlgorithms';
// import { ConvexHullAlgorithms } from './algorithms/ConvexHullAlgorithms';

// /**
//  * 几何算法工具类
//  * 提供平面几何中常用的算法实现
//  * 
//  * @deprecated 请直接使用具体的算法类，如 AngleAlgorithms, TriangleAlgorithms 等
//  * 此类保留用于向后兼容
//  */
// export class GeometryAlgorithms {

//   // ==================== 角度计算 ====================

//   /**
//    * 计算两点之间的角度（相对于 x 轴）
//    * @param p1 起点
//    * @param p2 终点
//    * @returns 角度（弧度）
//    */
//   static angleBetweenPoints(p1: GeoPoint, p2: GeoPoint): number {
//     return AngleAlgorithms.angleBetweenPoints(p1, p2);
//   }

//   /**
//    * 计算三点形成的角度（以 middle 为顶点）
//    * @param p1 第一个点
//    * @param middle 顶点
//    * @param p2 第二个点
//    * @returns 角度（弧度）
//    */
//   static angleBetweenThreePoints(p1: GeoPoint, middle: GeoPoint, p2: GeoPoint): number {
//     return AngleAlgorithms.angleBetweenThreePoints(p1, middle, p2);
//   }

//   /**
//    * 将弧度转换为角度
//    * @param radians 弧度
//    * @returns 角度
//    */
//   static toDegrees(radians: number): number {
//     return AngleAlgorithms.toDegrees(radians);
//   }

//   /**
//    * 将角度转换为弧度
//    * @param degrees 角度
//    * @returns 弧度
//    */
//   static toRadians(degrees: number): number {
//     return AngleAlgorithms.toRadians(degrees);
//   }

//   // ==================== 三角形相关算法 ====================

//   /**
//    * 计算三角形面积（使用海伦公式）
//    * @param p1 顶点1
//    * @param p2 顶点2
//    * @param p3 顶点3
//    * @returns 面积
//    */
//   static triangleArea(p1: GeoPoint, p2: GeoPoint, p3: GeoPoint): number {
//     return TriangleAlgorithms.triangleArea(p1, p2, p3);
//   }

//   /**
//    * 计算三角形重心
//    * @param p1 顶点1
//    * @param p2 顶点2
//    * @param p3 顶点3
//    * @param construction 构造管理器
//    * @returns 重心
//    */
//   static triangleCentroid(p1: GeoPoint, p2: GeoPoint, p3: GeoPoint, construction: any): GeoPoint {
//     return TriangleAlgorithms.triangleCentroid(p1, p2, p3, construction);
//   }

//   /**
//    * 计算三角形外心
//    * @param p1 顶点1
//    * @param p2 顶点2
//    * @param p3 顶点3
//    * @param construction 构造管理器
//    * @returns 外心
//    */
//   static triangleCircumcenter(p1: GeoPoint, p2: GeoPoint, p3: GeoPoint, construction: any): GeoPoint | null {
//     return TriangleAlgorithms.triangleCircumcenter(p1, p2, p3, construction);
//   }

//   /**
//    * 计算三角形内心
//    * @param p1 顶点1
//    * @param p2 顶点2
//    * @param p3 顶点3
//    * @param construction 构造管理器
//    * @returns 内心
//    */
//   static triangleIncenter(p1: GeoPoint, p2: GeoPoint, p3: GeoPoint, construction: any): GeoPoint {
//     return TriangleAlgorithms.triangleIncenter(p1, p2, p3, construction);
//   }

//   /**
//    * 计算三角形垂心
//    * @param p1 顶点1
//    * @param p2 顶点2
//    * @param p3 顶点3
//    * @param construction 构造管理器
//    * @returns 垂心
//    */
//   static triangleOrthocenter(p1: GeoPoint, p2: GeoPoint, p3: GeoPoint, construction: any): GeoPoint | null {
//     return TriangleAlgorithms.triangleOrthocenter(p1, p2, p3, construction);
//   }

//   // ==================== 几何变换 ====================

//   /**
//    * 平移点
//    * @param point 原点
//    * @param dx x方向平移量
//    * @param dy y方向平移量
//    * @param construction 构造管理器
//    * @returns 平移后的点
//    */
//   static translatePoint(point: GeoPoint, dx: number, dy: number, construction: any): GeoPoint {
//     return TransformationAlgorithms.translatePoint(point, dx, dy, construction);
//   }

//   /**
//    * 旋转点
//    * @param point 原点
//    * @param center 旋转中心
//    * @param angle 旋转角度（弧度）
//    * @param construction 构造管理器
//    * @returns 旋转后的点
//    */
//   static rotatePoint(point: GeoPoint, center: GeoPoint, angle: number, construction: any): GeoPoint {
//     return TransformationAlgorithms.rotatePoint(point, center, angle, construction);
//   }

//   /**
//    * 缩放点
//    * @param point 原点
//    * @param center 缩放中心
//    * @param factor 缩放因子
//    * @param construction 构造管理器
//    * @returns 缩放后的点
//    */
//   static scalePoint(point: GeoPoint, center: GeoPoint, factor: number, construction: any): GeoPoint {
//     return TransformationAlgorithms.scalePoint(point, center, factor, construction);
//   }

//   /**
//    * 反射点（关于直线）
//    * @param point 原点
//    * @param line 反射线
//    * @param construction 构造管理器
//    * @returns 反射后的点
//    */
//   static reflectPoint(point: GeoPoint, line: GeoLine, construction: any): GeoPoint {
//     return TransformationAlgorithms.reflectPoint(point, line, construction);
//   }

//   // ==================== 距离计算 ====================

//   /**
//    * 计算两点间距离
//    * @param p1 点1
//    * @param p2 点2
//    * @returns 距离
//    */
//   static distance(p1: GeoPoint, p2: GeoPoint): number {
//     return DistanceAlgorithms.distance(p1, p2);
//   }

//   /**
//    * 计算点到线段的距离
//    * @param point 点
//    * @param segment 线段
//    * @returns 距离
//    */
//   static distancePointToSegment(point: GeoPoint, segment: GeoSegment): number {
//     return DistanceAlgorithms.distancePointToSegment(point, segment);
//   }

//   /**
//    * 计算两线段间的最短距离
//    * @param segment1 线段1
//    * @param segment2 线段2
//    * @returns 距离
//    */
//   static distanceBetweenSegments(segment1: GeoSegment, segment2: GeoSegment): number {
//     return DistanceAlgorithms.distanceBetweenSegments(segment1, segment2);
//   }

//   // ==================== 投影算法 ====================

//   /**
//    * 计算点在直线上的投影
//    * @param point 点
//    * @param line 直线
//    * @param construction 构造管理器
//    * @returns 投影点
//    */
//   static projectPointToLine(point: GeoPoint, line: GeoLine, construction: any): GeoPoint {
//     return ProjectionAlgorithms.projectPointToLine(point, line, construction);
//   }

//   /**
//    * 计算点在线段上的投影
//    * @param point 点
//    * @param segment 线段
//    * @param construction 构造管理器
//    * @returns 投影点（可能在线段外）
//    */
//   static projectPointToSegment(point: GeoPoint, segment: GeoSegment, construction: any): GeoPoint {
//     return ProjectionAlgorithms.projectPointToSegment(point, segment, construction);
//   }

//   /**
//    * 创建过一点垂直于另两点连线的直线
//    * @param point 点
//    * @param lineStart 直线起点
//    * @param lineEnd 直线终点
//    * @param construction 构造管理器
//    * @returns 垂线
//    */
//   static perpendicularLine(point: GeoPoint, lineStart: GeoPoint, lineEnd: GeoPoint, construction: any): GeoLine | null {
//     return ProjectionAlgorithms.perpendicularLine(point, lineStart, lineEnd, construction);
//   }

//   // ==================== 交点算法 ====================

//   /**
//    * 计算直线与圆的交点
//    * @param line 直线
//    * @param circle 圆
//    * @param construction 构造管理器
//    * @returns 交点数组（0、1或2个点）
//    */
//   static intersectLineCircle(line: GeoLine, circle: GeoCircle, construction: any): GeoPoint[] {
//     return IntersectionAlgorithms.intersectLineCircle(line, circle, construction);
//   }

//   /**
//    * 计算两圆的交点
//    * @param circle1 圆1
//    * @param circle2 圆2
//    * @param construction 构造管理器
//    * @returns 交点数组（0、1或2个点）
//    */
//   static intersectCircleCircle(circle1: GeoCircle, circle2: GeoCircle, construction: any): GeoPoint[] {
//     return IntersectionAlgorithms.intersectCircleCircle(circle1, circle2, construction);
//   }

//   /**
//    * 计算两线段的交点
//    * @param segment1 线段1
//    * @param segment2 线段2
//    * @param construction 构造管理器
//    * @returns 交点或 null
//    */
//   static intersectSegments(segment1: GeoSegment, segment2: GeoSegment, construction: any): GeoPoint | null {
//     return IntersectionAlgorithms.intersectSegments(segment1, segment2, construction);
//   }

//   // ==================== 垂足和平行线算法 ====================

//   /**
//    * 计算点到直线的垂足
//    * @param point 点
//    * @param line 直线
//    * @param construction 构造管理器
//    * @returns 垂足点
//    */
//   static footOfPerpendicular(point: GeoPoint, line: GeoLine, construction: any): GeoPoint {
//     return LineAlgorithms.footOfPerpendicular(point, line, construction);
//   }

//   /**
//    * 过一点作直线的平行线
//    * @param point 点
//    * @param line 直线
//    * @param construction 构造管理器
//    * @returns 平行线
//    */
//   static parallelLine(point: GeoPoint, line: GeoLine, construction: any): GeoLine {
//     return LineAlgorithms.parallelLine(point, line, construction);
//   }

//   /**
//    * 过一点作直线的垂线
//    * @param point 点
//    * @param line 直线
//    * @param construction 构造管理器
//    * @returns 垂线
//    */
//   static perpendicularLineToLine(point: GeoPoint, line: GeoLine, construction: any): GeoLine {
//     return LineAlgorithms.perpendicularLineToLine(point, line, construction);
//   }

//   // ==================== 角平分线算法 ====================

//   /**
//    * 计算三点形成的角的平分线
//    * @param p1 第一条边上的点
//    * @param vertex 顶点
//    * @param p2 第二条边上的点
//    * @param construction 构造管理器
//    * @returns 角平分线
//    */
//   static angleBisectorThreePoints(p1: GeoPoint, vertex: GeoPoint, p2: GeoPoint, construction: any): GeoLine | null {
//     return AngleBisectorAlgorithms.angleBisectorThreePoints(p1, vertex, p2, construction);
//   }

//   /**
//    * 计算两条直线的角平分线（返回两条）
//    * @param line1 直线1
//    * @param line2 直线2
//    * @param construction 构造管理器
//    * @returns 两条角平分线
//    */
//   static angleBisectorTwoLines(line1: GeoLine, line2: GeoLine, construction: any): GeoLine[] {
//     return AngleBisectorAlgorithms.angleBisectorTwoLines(line1, line2, construction);
//   }

//   // ==================== 切线算法 ====================

//   /**
//    * 计算过圆外一点的切线
//    * @param point 点
//    * @param circle 圆
//    * @param construction 构造管理器
//    * @returns 切线数组（0、1或2条）
//    */
//   static tangentsFromPointToCircle(point: GeoPoint, circle: GeoCircle, construction: any): GeoLine[] {
//     return TangentAlgorithms.tangentsFromPointToCircle(point, circle, construction);
//   }

//   /**
//    * 计算过圆上一点的切线
//    * @param point 圆上的点
//    * @param circle 圆
//    * @param construction 构造管理器
//    * @returns 切线
//    */
//   static tangentAtPointOnCircle(point: GeoPoint, circle: GeoCircle, construction: any): GeoLine {
//     return TangentAlgorithms.tangentAtPointOnCircle(point, circle, construction);
//   }

//   // ==================== 中垂线算法 ====================

//   /**
//    * 计算两点的中垂线
//    * @param p1 点1
//    * @param p2 点2
//    * @param construction 构造管理器
//    * @returns 中垂线
//    */
//   static perpendicularBisector(p1: GeoPoint, p2: GeoPoint, construction: any): GeoLine | null {
//     return PerpendicularBisectorAlgorithms.perpendicularBisector(p1, p2, construction);
//   }

//   /**
//    * 计算线段的中垂线
//    * @param segment 线段
//    * @param construction 构造管理器
//    * @returns 中垂线
//    */
//   static perpendicularBisectorOfSegment(segment: GeoSegment, construction: any): GeoLine | null {
//     return this.perpendicularBisector(segment.getStartPoint(), segment.getEndPoint(), construction);
//   }

//   // ==================== 圆相关算法 ====================

//   /**
//    * 计算三角形的内切圆
//    * @param p1 顶点1
//    * @param p2 顶点2
//    * @param p3 顶点3
//    * @param construction 构造管理器
//    * @returns 内切圆
//    */
//   static incircle(p1: GeoPoint, p2: GeoPoint, p3: GeoPoint, construction: any): GeoCircle | null {
//     return CircleAlgorithms.incircle(p1, p2, p3, construction);
//   }

//   /**
//    * 计算三角形的外接圆
//    * @param p1 顶点1
//    * @param p2 顶点2
//    * @param p3 顶点3
//    * @param construction 构造管理器
//    * @returns 外接圆
//    */
//   static circumcircle(p1: GeoPoint, p2: GeoPoint, p3: GeoPoint, construction: any): GeoCircle | null {
//     return CircleAlgorithms.circumcircle(p1, p2, p3, construction);
//   }

//   /**
//    * 过三点创建圆
//    * @param p1 点1
//    * @param p2 点2
//    * @param p3 点3
//    * @param construction 构造管理器
//    * @returns 圆
//    */
//   static circleThroughThreePoints(p1: GeoPoint, p2: GeoPoint, p3: GeoPoint, construction: any): GeoCircle | null {
//     return CircleAlgorithms.circleThroughThreePoints(p1, p2, p3, construction);
//   }

//   // ==================== 共线性、共圆性检测 ====================

//   /**
//    * 检查三点是否共线
//    * @param p1 点1
//    * @param p2 点2
//    * @param p3 点3
//    * @returns 是否共线
//    */
//   static areCollinear(p1: GeoPoint, p2: GeoPoint, p3: GeoPoint): boolean {
//     return CollinearityAlgorithms.areCollinear(p1, p2, p3);
//   }

//   /**
//    * 检查四点是否共圆
//    * @param p1 点1
//    * @param p2 点2
//    * @param p3 点3
//    * @param p4 点4
//    * @returns 是否共圆
//    */
//   static areConcyclic(p1: GeoPoint, p2: GeoPoint, p3: GeoPoint, p4: GeoPoint): boolean {
//     return CollinearityAlgorithms.areConcyclic(p1, p2, p3, p4);
//   }

//   // ==================== 凸包算法 ====================

//   /**
//    * Graham扫描法计算凸包
//    * @param points 点集
//    * @param construction 构造管理器
//    * @returns 凸包顶点数组
//    */
//   static convexHull(points: GeoPoint[], construction: any): GeoPoint[] {
//     return ConvexHullAlgorithms.convexHull(points, construction);
//   }
// }
