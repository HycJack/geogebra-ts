/**
 * 画圆工具演示页面
 * 展示如何使用CircleToolPanel创建圆
 */

import React, { useRef, useState, useEffect } from 'react';
// import { CoordinateSystem } from '../euclidian/coordinates/CoordinateSystem';
import { Circle } from 'lucide-react';

export function CircleToolDemo(): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [circles, setCircles] = useState<Array<{ cx: number; cy: number; r: number; color: string }>>([]);
  const [points, setPoints] = useState<Array<{ x: number; y: number; color: string }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制网格
    drawGrid(ctx, canvas.width, canvas.height);

    // 绘制坐标轴
    drawAxes(ctx, canvas.width, canvas.height);

    // 绘制所有圆
    circles.forEach(circle => {
      drawCircle(ctx, circle.cx, circle.cy, circle.r, circle.color);
    });

    // 绘制所有点
    points.forEach(point => {
      drawPoint(ctx, point.x, point.y, point.color);
    });
  }, [circles, points]);

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    const gridSize = 50;
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const drawAxes = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 2;

    // X轴
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Y轴
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
  };

  const drawCircle = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  };

  const drawPoint = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // 添加点击的点
    const newPoint = {
      x,
      y,
      color: '#ef4444'
    };
    setPoints(prev => [...prev, newPoint]);
  };

  // const handleCircleCreated = (circle: any) => {
  //   const newCircle = {
  //     cx: circle.getCenter().getX(),
  //     cy: circle.getCenter().getY(),
  //     r: circle.getRadius(),
  //     color: '#3b82f6'
  //   };
  //   setCircles(prev => [...prev, newCircle]);
  //   setPoints([]); // 清空点
  // };

  const handleClear = () => {
    setCircles([]);
    setPoints([]);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Circle className="text-blue-600" size={24} />
          <h1 className="text-xl font-semibold text-gray-800">画圆工具演示</h1>
        </div>
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
        >
          清空画布
        </button>
      </div>

      {/* 主内容区域 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧工具面板 */}
        <div className="w-80 p-4 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="text-center p-8">
            <p className="text-gray-500">CircleToolPanel 组件暂未实现</p>
          </div>
        </div>

        {/* 右侧画布区域 */}
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              onClick={handleCanvasClick}
              className="bg-white rounded-lg shadow-lg cursor-crosshair"
            />
            <div className="absolute bottom-2 right-2 px-3 py-1 bg-gray-100 rounded text-xs text-gray-600">
              800 × 600
            </div>
          </div>
        </div>
      </div>

      {/* 底部状态栏 */}
      <div className="px-6 py-2 bg-white border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>已创建圆: {circles.length}</span>
          <span>已点击点: {points.length}</span>
          <span>提示: 在画布上点击以创建圆</span>
        </div>
      </div>
    </div>
  );
}
