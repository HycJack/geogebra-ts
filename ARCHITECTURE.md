# GeoGebra TypeScript 代码结构

## 目录结构

```
src/
├── kernel/                    # 核心数学内核 (对应 Java kernel/)
│   ├── Kernel.ts              # 内核主类
│   ├── Construction.ts        # 构造管理
│   │
│   ├── geos/                  # 几何对象类型定义 (对应 Java geos/)
│   │   ├── GeoElement.ts      # 基础元素接口
│   │   ├── GeoPoint.ts        # 点
│   │   ├── GeoLine.ts         # 直线
│   │   ├── GeoSegment.ts      # 线段
│   │   ├── GeoCircle.ts       # 圆
│   │   ├── GeoPolygon.ts      # 多边形
│   │   ├── GeoVector.ts       # 向量
│   │   ├── GeoConic.ts        # 圆锥曲线
│   │   └── index.ts
│   │
│   ├── algos/                 # 算法类 (对应 Java algos/)
│   │   ├── AlgoElement.ts     # 算法基类
│   │   ├── AlgoIntersect.ts   # 交点算法
│   │   ├── AlgoMidpoint.ts    # 中点算法
│   │   ├── AlgoPerpendicular.ts # 垂线算法
│   │   ├── AlgoParallel.ts    # 平行线算法
│   │   ├── AlgoAngleBisector.ts # 角平分线算法
│   │   ├── AlgoPolygon.ts     # 多边形算法
│   │   └── index.ts
│   │
│   ├── arithmetic/            # 算术运算 (对应 Java arithmetic/)
│   │   ├── GeoVec3D.ts        # 齐次坐标向量
│   │   ├── EquationSolver.ts  # 方程求解器
│   │   └── index.ts
│   │
│   ├── commands/              # 命令处理 (对应 Java commands/)
│   │   ├── CommandDispatcher.ts
│   │   └── index.ts
│   │
│   └── index.ts
│
├── euclidian/                 # 欧几里得视图/渲染 (对应 Java euclidian/)
│   ├── EuclidianView.ts       # 视图组件
│   ├── CoordinateSystem.ts    # 坐标系统
│   │
│   ├── drawables/             # 绘制对象
│   │   ├── Drawable.ts        # 绘制基类
│   │   ├── PointDrawable.ts
│   │   ├── LineDrawable.ts
│   │   ├── SegmentDrawable.ts
│   │   ├── CircleDrawable.ts
│   │   ├── PolygonDrawable.ts
│   │   └── index.ts
│   │
│   ├── rendering/             # 渲染器
│   │   ├── CanvasRenderer.ts
│   │   ├── SVGRenderer.ts
│   │   └── index.ts
│   │
│   ├── interaction/           # 交互处理
│   │   ├── InteractionManager.ts
│   │   ├── HitTestManager.ts
│   │   └── index.ts
│   │
│   ├── snapping/              # 吸附功能
│   │   ├── SnapManager.ts
│   │   └── index.ts
│   │
│   └── index.ts
│
├── gui/                       # GUI 组件 (对应 Java gui/)
│   ├── components/
│   │   ├── Toolbar.tsx
│   │   ├── ObjectList.tsx
│   │   ├── PropertiesPanel.tsx
│   │   └── index.ts
│   │
│   ├── context/
│   │   ├── GeoGebraContext.tsx
│   │   └── index.ts
│   │
│   └── index.ts
│
├── io/                        # 输入输出 (对应 Java io/)
│   ├── ImportExport.ts
│   ├── Serialization.ts
│   └── index.ts
│
├── util/                      # 工具类 (对应 Java util/)
│   ├── coordinates.ts
│   ├── labelManager.ts
│   └── index.ts
│
├── types/                     # 全局类型定义
│   ├── index.ts               # 统一导出
│   └── guards.ts              # 类型守卫
│
└── index.ts                   # 主入口
```

## 与 Java 版本的对应关系

| Java 包 | TS 目录 | 说明 |
|---------|---------|------|
| kernel | kernel/ | 核心数学内核 |
| kernel.geos | kernel/geos/ | 几何对象类型 |
| kernel.algos | kernel/algos/ | 算法类 |
| kernel.arithmetic | kernel/arithmetic/ | 算术运算 |
| kernel.commands | kernel/commands/ | 命令处理 |
| euclidian | euclidian/ | 视图和渲染 |
| gui | gui/ | GUI 组件 |
| io | io/ | 输入输出 |
| util | util/ | 工具类 |

## 模块职责

### kernel/ - 核心数学内核
- **geos/**: 几何对象的类型定义和接口
- **algos/**: 几何算法的实现
- **arithmetic/**: 数学运算工具（齐次坐标、方程求解等）
- **commands/**: 命令解析和执行

### euclidian/ - 视图和渲染
- **drawables/**: 可绘制对象的封装
- **rendering/**: 渲染器实现
- **interaction/**: 用户交互处理
- **snapping/**: 吸附功能

### gui/ - 用户界面
- **components/**: React 组件
- **context/**: React Context 状态管理

### io/ - 输入输出
- 导入导出功能
- 序列化和反序列化

### util/ - 工具类
- 坐标转换
- 标签管理
- 其他通用工具
