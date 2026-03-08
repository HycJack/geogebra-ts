/**
 * CircleTool 使用示例
 * 展示如何使用画圆工具创建圆
 */

import { ConstructionImpl } from '../Construction';
import { CircleTool, CircleToolMode } from './CircleTool';

/**
 * 示例1：使用圆心与一点模式创建圆
 */
export function exampleCenterPointMode() {
  const construction = new ConstructionImpl(null as any);
  const tool = new CircleTool(construction, CircleToolMode.CENTER_POINT);
  
  console.log('=== 示例1：圆心与一点模式 ===');
  
  // 第一步：点击圆心位置 (100, 100)
  const circle1 = tool.handleClick(100, 100);
  console.log('步骤:', tool.getStep()); // 应该输出 1
  console.log('圆:', circle1); // 应该输出 null
  
  // 第二步：点击圆上一点位置 (150, 100)
  const circle2 = tool.handleClick(150, 100);
  console.log('步骤:', tool.getStep()); // 应该输出 0（已重置）
  console.log('圆:', circle2); // 应该输出创建的圆对象
  
  if (circle2) {
    console.log('圆心:', circle2.getCenter().getX(), circle2.getCenter().getY());
    console.log('半径:', circle2.getRadius());
  }
}

/**
 * 示例2：使用圆心与半径模式创建圆
 */
export function exampleCenterRadiusMode() {
  const construction = new ConstructionImpl(null as any);
  const tool = new CircleTool(construction, CircleToolMode.CENTER_RADIUS);
  
  console.log('\n=== 示例2：圆心与半径模式 ===');
  
  // 第一步：点击圆心位置 (200, 200)
  const circle1 = tool.handleClick(200, 200);
  console.log('步骤:', tool.getStep()); // 应该输出 1
  console.log('圆:', circle1); // 应该输出 null
  
  // 第二步：点击确定半径位置 (250, 200)
  const circle2 = tool.handleClick(250, 200);
  console.log('步骤:', tool.getStep()); // 应该输出 0（已重置）
  console.log('圆:', circle2); // 应该输出创建的圆对象
  
  if (circle2) {
    console.log('圆心:', circle2.getCenter().getX(), circle2.getCenter().getY());
    console.log('半径:', circle2.getRadius());
  }
}

/**
 * 示例3：使用圆心与半径模式（弹窗输入半径）
 */
export function exampleCenterRadiusWithInput() {
  const construction = new ConstructionImpl(null as any);
  const tool = new CircleTool(construction, CircleToolMode.CENTER_RADIUS);
  
  console.log('\n=== 示例3：圆心与半径模式（弹窗输入半径） ===');
  
  // 第一步：点击圆心位置 (300, 300)
  // const circle1 = tool.handleClick(300, 300);
  // console.log('步骤:', tool.getStep()); // 应该输出 1
  
  // 用户在弹窗中输入半径 50
  const circle2 = tool.setRadius(50);
  console.log('步骤:', tool.getStep()); // 应该输出 0（已重置）
  console.log('圆:', circle2); // 应该输出创建的圆对象
  
  if (circle2) {
    console.log('圆心:', circle2.getCenter().getX(), circle2.getCenter().getY());
    console.log('半径:', circle2.getRadius());
  }
}

/**
 * 示例4：使用半径与圆心模式创建圆
 */
export function examplePointRadiusMode() {
  const construction = new ConstructionImpl(null as any);
  const tool = new CircleTool(construction, CircleToolMode.POINT_RADIUS);
  
  console.log('\n=== 示例4：半径与圆心模式 ===');
  
  // 第一步：点击确定半径点 (50, 0)
  const circle1 = tool.handleClick(50, 0);
  console.log('步骤:', tool.getStep()); // 应该输出 1
  console.log('圆:', circle1); // 应该输出 null
  
  // 第二步：点击圆心位置 (400, 400)
  const circle2 = tool.handleClick(400, 400);
  console.log('步骤:', tool.getStep()); // 应该输出 0（已重置）
  console.log('圆:', circle2); // 应该输出创建的圆对象
  
  if (circle2) {
    console.log('圆心:', circle2.getCenter().getX(), circle2.getCenter().getY());
    console.log('半径:', circle2.getRadius());
  }
}

/**
 * 示例5：使用圆过三点模式创建圆
 */
export function exampleThreePointsMode() {
  const construction = new ConstructionImpl(null as any);
  const tool = new CircleTool(construction, CircleToolMode.THREE_POINTS);
  
  console.log('\n=== 示例5：圆过三点模式 ===');
  
  // 第一步：点击第一个点 (100, 200)
  const circle1 = tool.handleClick(100, 200);
  console.log('步骤:', tool.getStep()); // 应该输出 1
  console.log('圆:', circle1); // 应该输出 null
  
  // 第二步：点击第二个点 (200, 100)
  const circle2 = tool.handleClick(200, 100);
  console.log('步骤:', tool.getStep()); // 应该输出 2
  console.log('圆:', circle2); // 应该输出 null
  
  // 第三步：点击第三个点 (300, 200)
  const circle3 = tool.handleClick(300, 200);
  console.log('步骤:', tool.getStep()); // 应该输出 0（已重置）
  console.log('圆:', circle3); // 应该输出创建的圆对象
  
  if (circle3) {
    console.log('圆心:', circle3.getCenter().getX(), circle3.getCenter().getY());
    console.log('半径:', circle3.getRadius());
  }
}

/**
 * 示例6：取消操作
 */
export function exampleCancel() {
  const construction = new ConstructionImpl(null as any);
  const tool = new CircleTool(construction, CircleToolMode.CENTER_POINT);
  
  console.log('\n=== 示例6：取消操作 ===');
  
  // 第一步：点击圆心位置 (100, 100)
  // const circle1 = tool.handleClick(100, 100);
  // console.log('步骤:', tool.getStep()); // 应该输出 1
  
  // 取消操作
  tool.cancel();
  console.log('步骤:', tool.getStep()); // 应该输出 0
  console.log('点数量:', tool.getPoints().length); // 应该输出 0
}

/**
 * 运行所有示例
 */
export function runAllExamples() {
  exampleCenterPointMode();
  exampleCenterRadiusMode();
  exampleCenterRadiusWithInput();
  examplePointRadiusMode();
  exampleThreePointsMode();
  exampleCancel();
}
