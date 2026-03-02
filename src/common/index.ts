// 导出核心类型
export * from './types';
export * from './types/GeoElements';

// 导出依赖图引擎实现
import { Kernel } from './dependency/Kernel';
import { Construction as ConstructionClass } from './dependency/Construction';
import { AlgoElement as AlgoElementClass } from './dependency/AlgoElement';

export { Kernel };
export { ConstructionClass as Construction };
export { AlgoElementClass as AlgoElement };

// 导出几何算法
export * from './geometry/algorithms';

// 导出数值求解器
export * from './solver/EquationSolver';
export * from './solver/RootFinder';

// 导出坐标系统
export * from './coordinates';

// 导出绘制对象系统（排除与 types 冲突的 GeoElement）
export * from './drawable';

// 导出渲染系统
export * from './rendering';

// 导出交互系统
export * from './interaction';
