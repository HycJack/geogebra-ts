# React GeoGebra

基于 React 的几何绘图系统，灵感来自 GeoGebra。

## 特性

- 🎨 **多种几何对象**：点、线、线段、圆、多边形、向量、文本
- 🔄 **交互式操作**：拖动、选择、缩放、平移
- 📐 **坐标系统**：世界坐标与屏幕坐标的双向转换
- 🎯 **依赖更新**：自动更新依赖对象（如移动点时更新线段）
- 🎨 **样式定制**：颜色、线宽、透明度等样式控制
- 🖱️ **多种工具**：移动、创建点、线段、圆、多边形等
- 📱 **响应式设计**：支持自定义尺寸

## 安装

```bash
npm install react-geogebra
```

## 快速开始

```tsx
import React from 'react';
import { GeoGebra } from 'react-geogebra';

function App() {
  return (
    <GeoGebra
      width={800}
      height={600}
      showAxes={true}
      showGrid={true}
      showToolbar={true}
      showObjectList={true}
      showPropertiesPanel={true}
    />
  );
}
```

## 核心组件

### GeoGebra

主组件，提供完整的几何绘图环境。

```tsx
<GeoGebra
  width={800}                    // 画布宽度
  height={600}                   // 画布高度
  showAxes={true}                // 显示坐标轴
  showGrid={true}                // 显示网格
  showToolbar={true}             // 显示工具栏
  showObjectList={true}          // 显示对象列表
  showPropertiesPanel={true}      // 显示属性面板
  initialView={{                 // 初始视图设置
    xZero: 400,
    yZero: 300,
    xScale: 50,
    yScale: 50
  }}
/>
```

### EuclidianView

几何视图组件，可以单独使用。

```tsx
import { EuclidianView } from 'react-geogebra';

<EuclidianView
  width={800}
  height={600}
  showAxes={true}
  showGrid={true}
/>
```

### Toolbar

工具栏组件，提供绘图工具选择。

```tsx
import { Toolbar } from 'react-geogebra';

<Toolbar />
```

### ObjectList

对象列表组件，显示所有几何对象。

```tsx
import { ObjectList } from 'react-geogebra';

<ObjectList />
```

### PropertiesPanel

属性面板组件，用于编辑选中对象的属性。

```tsx
import { PropertiesPanel } from 'react-geogebra';

<PropertiesPanel />
```

## 编程式 API

使用 `useGeoGebra` Hook 访问编程式 API。

```tsx
import { useGeoGebra } from 'react-geogebra';

function MyComponent() {
  const {
    addPoint,
    addSegment,
    addCircle,
    addPolygon,
    updatePointPosition,
    deleteElement,
    setMode
  } = useGeoGebra();

  // 创建点
  const pointA = addPoint(0, 0, 'A');
  const pointB = addPoint(4, 0, 'B');

  // 创建线段
  addSegment(pointA.id, pointB.id, 'AB');

  // 创建圆
  const center = addPoint(2, 2, 'O');
  addCircle(center.id, 3, 'circle1');

  // 创建多边形
  const p1 = addPoint(0, 0);
  const p2 = addPoint(4, 0);
  const p3 = addPoint(2, 3);
  addPolygon([p1.id, p2.id, p3.id], 'triangle');

  // 更新点的位置
  updatePointPosition(pointA.id, 1, 1);

  // 删除对象
  deleteElement(pointB.id);

  // 设置工具模式
  setMode('move');

  return null;
}
```

## 可用工具

- `move` - 移动和拖动对象
- `point` - 创建点
- `line` - 创建直线
- `segment` - 创建线段
- `ray` - 创建射线
- `vector` - 创建向量
- `circle` - 创建圆
- `polygon` - 创建多边形
- `text` - 创建文本
- `intersect` - 创建交点
- `midpoint` - 创建中点
- `perpendicular` - 创建垂线
- `parallel` - 创建平行线
- `delete` - 删除对象

## 几何对象类型

### GeoPointElement

```tsx
{
  id: string;
  type: 'point';
  label: string;
  x: number;
  y: number;
  pointSize: number;
  pointStyle: 'dot' | 'cross' | 'circle' | 'square';
  style: GeoElementStyle;
  isIndependent: boolean;
  parentIds: string[];
}
```

### GeoLineElement

```tsx
{
  id: string;
  type: 'line';
  label: string;
  a: number;  // 直线方程 ax + by + c = 0
  b: number;
  c: number;
  style: GeoElementStyle;
  isIndependent: boolean;
  parentIds: string[];
}
```

### GeoSegmentElement

```tsx
{
  id: string;
  type: 'segment';
  label: string;
  startPointId: string;
  endPointId: string;
  style: GeoElementStyle;
  isIndependent: boolean;
  parentIds: string[];
}
```

### GeoCircleElement

```tsx
{
  id: string;
  type: 'circle';
  label: string;
  centerId: string;
  radius: number;
  style: GeoElementStyle;
  isIndependent: boolean;
  parentIds: string[];
}
```

### GeoPolygonElement

```tsx
{
  id: string;
  type: 'polygon';
  label: string;
  pointIds: string[];
  style: GeoElementStyle;
  isIndependent: boolean;
  parentIds: string[];
}
```

## 样式定制

```tsx
const customStyle = {
  strokeColor: '#ff0000',
  fillColor: '#ff0000',
  strokeWidth: 3,
  strokeDashArray: [5, 5],
  opacity: 0.8,
  fontSize: 16,
  fontFamily: 'Arial',
  visible: true,
  labelVisible: true
};

addPoint(0, 0, 'A', customStyle);
```

## 坐标系统

使用 `CoordinateSystem` 类进行坐标转换：

```tsx
import { CoordinateSystem } from 'react-geogebra';

const coordSystem = new CoordinateSystem(800, 600, 400, 300, 50, 50);

// 世界坐标 → 屏幕坐标
const screenX = coordSystem.toScreenX(5);
const screenY = coordSystem.toScreenY(3);

// 屏幕坐标 → 世界坐标
const worldX = coordSystem.toWorldX(500);
const worldY = coordSystem.toWorldY(300);

// 缩放
coordSystem.zoom(1.2);  // 放大 20%
coordSystem.zoom(0.8);  // 缩小 20%

// 平移
coordSystem.pan(10, -10);  // 向右平移 10px，向上平移 10px
```

## 几何算法

内置多种几何算法：

```tsx
import {
  lineThroughPoints,
  intersectLines,
  intersectLineCircle,
  intersectCircles,
  midpoint,
  angleBisector,
  distance,
  distancePointToLine,
  projectPointOnLine
} from 'react-geogebra';

// 通过两点创建直线
const line = lineThroughPoints({ x: 0, y: 0 }, { x: 1, y: 1 });

// 两直线交点
const intersection = intersectLines(line1, line2);

// 直线与圆的交点
const points = intersectLineCircle(line, { x: 0, y: 0 }, 5);

// 两圆交点
const circleIntersections = intersectCircles(
  { x: 0, y: 0 }, 5,
  { x: 3, y: 0 }, 5
);

// 中点
const mid = midpoint({ x: 0, y: 0 }, { x: 4, y: 0 });

// 角平分线
const bisector = angleBisector(p1, vertex, p2);
```

## 高级用法

### 自定义 Drawable

```tsx
import { Drawable } from 'react-geogebra';

class CustomDrawable extends Drawable {
  update(): void {
    // 更新几何数据
  }

  render(isSelected: boolean, isHovered: boolean): React.ReactNode {
    // 返回 React 元素
    return <g>...</g>;
  }

  hitTest(screenX: number, screenY: number, threshold: number): boolean {
    // 命中测试
    return false;
  }
}
```

### 状态管理

使用 Context API 管理全局状态：

```tsx
import { GeoGebraProvider, useGeoGebra } from 'react-geogebra';

function App() {
  return (
    <GeoGebraProvider initialView={{ xScale: 50, yScale: 50 }}>
      <MyComponent />
    </GeoGebraProvider>
  );
}

function MyComponent() {
  const { state, dispatch } = useGeoGebra();

  // 访问状态
  console.log(state.construction.elements);
  console.log(state.interaction.mode);

  // 分发操作
  dispatch({ type: 'SET_MODE', mode: 'point' });
}
```

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 类型检查
npm run lint
```

## 架构

```
react-geogebra/
├── src/
│   ├── components/       # React 组件
│   │   ├── EuclidianView.tsx
│   │   ├── Toolbar.tsx
│   │   ├── ObjectList.tsx
│   │   └── PropertiesPanel.tsx
│   ├── core/            # 核心逻辑
│   │   └── GeoGebraContext.tsx
│   ├── drawables/       # 绘制对象
│   │   ├── Drawable.ts
│   │   ├── PointDrawable.ts
│   │   ├── LineDrawable.ts
│   │   └── ...
│   ├── types/           # TypeScript 类型定义
│   │   └── index.ts
│   ├── utils/           # 工具函数
│   │   └── coordinates.ts
│   └── index.ts         # 主入口
```

## 设计理念

本系统参考了 GeoGebra 的核心设计：

1. **分离关注点**：几何数据（GeoElement）与渲染（Drawable）分离
2. **依赖更新**：通过算法（Algorithm）维护对象间的依赖关系
3. **坐标转换**：双坐标系统（世界坐标 ↔ 屏幕坐标）
4. **交互优先**：提供直观的拖拽和选择操作
5. **可扩展性**：易于添加新的几何对象类型和算法

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！
