import React, { useRef, useState } from 'react';
import { 
  CircleDot, 
  Minus, 
  Slash, 
  Circle, 
  Hexagon,
  ArrowRight,
  Target,
  Trash2,
  MousePointer2,
  Hand,
  // ZoomIn,
  // ZoomOut,
  // Undo2,
  // Redo2,
  Download,
  Upload,
  ChevronDown,
  Square,
  RotateCw,
  // Move,
  // RotateCcw,
  // Maximize2,
  FlipHorizontal,
  Grid,
  Layers
} from 'lucide-react';
import { ToolMode } from '../types';
import { useGeoGebra } from '../core/GeoGebraContext';
import { cn } from '../lib/utils';
import { downloadJSON, readFileContent, generateExportFilename } from '../utils/importExport';

interface ToolButton {
  mode: ToolMode;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const tools: ToolButton[] = [
  { mode: 'move', label: '移动', icon: <MousePointer2 size={18} />, description: '移动和拖动对象' },
  { mode: 'pan', label: '抓手', icon: <Hand size={18} />, description: '拖拽坐标系' },
  { mode: 'point', label: '点', icon: <Circle size={18} fill="currentColor" />, description: '创建点' },
  { mode: 'segment', label: '线段', icon: <Minus size={18} />, description: '创建线段（两点）' },
  { mode: 'line', label: '直线', icon: <Slash size={18} />, description: '创建直线' },
  { mode: 'polygon', label: '多边形', icon: <Hexagon size={18} />, description: '创建多边形' },
  { mode: 'vector', label: '向量', icon: <ArrowRight size={18} />, description: '创建向量' },
  { mode: 'intersect', label: '交点', icon: <Target size={18} />, description: '创建交点' },
  { mode: 'delete', label: '删除', icon: <Trash2 size={18} />, description: '删除对象' },
];

const circleTools: ToolButton[] = [
  { mode: 'circle', label: '圆与圆上一点', icon: <CircleDot size={16} />, description: '创建圆（圆心和圆上一点）' },
  { mode: 'circle_point_radius', label: '半径与圆心', icon: <CircleDot size={16} />, description: '创建圆（半径长度和圆心）' },
  { mode: 'circle_three_points', label: '圆过三点', icon: <CircleDot size={16} />, description: '创建经过三点的圆' },
];

const lineTools: ToolButton[] = [
  { mode: 'perpendicular', label: '垂线', icon: <Square size={16} />, description: '选择直线/线段，再选点创建垂线' },
  { mode: 'parallel', label: '平行线', icon: <Slash size={16} />, description: '选择直线/线段，再选点创建平行线' },
  { mode: 'perpendicular_bisector', label: '中垂线', icon: <Square size={16} />, description: '选择两点创建中垂线' },
  { mode: 'angular_bisector', label: '角平分线', icon: <RotateCw size={16} />, description: '选择三点创建角平分线' },
];

const transformTools: ToolButton[] = [
  { mode: 'mirror', label: '镜像', icon: <FlipHorizontal size={16} />, description: '选择对象，点击镜像轴' },
];

interface ToolbarProps {
  className?: string;
  style?: React.CSSProperties;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

export function Toolbar({ className, style }: ToolbarProps): React.ReactElement {
  const { state, setMode, exportData, importData, toggleGrid, toggleAxes } = useGeoGebra();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [openMenu, setOpenMenu] = useState<'circle' | 'line' | 'transform' | null>(null);

  const handleExport = () => {
    const jsonContent = exportData();
    const filename = generateExportFilename();
    downloadJSON(jsonContent, filename);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await readFileContent(file);
      importData(content);
    } catch (error) {
      console.error('导入失败:', error);
      alert('导入失败: ' + (error as Error).message);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-3 py-2 bg-white border-b border-gray-200',
        className
      )}
      style={style}
    >
      {tools.map((tool) => {
        const isActive = state.interaction.mode === tool.mode;
        return (
          <button
            key={tool.mode}
            onClick={() => setMode(tool.mode)}
            title={tool.description}
            className={cn(
              'flex items-center justify-center w-9 h-9 rounded-md transition-all duration-200',
              'hover:bg-gray-100 active:scale-95',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
              isActive 
                ? 'bg-blue-100 text-blue-600 ring-1 ring-blue-500' 
                : 'bg-white text-gray-600 hover:text-gray-900'
            )}
          >
            {tool.icon}
          </button>
        );
      })}
      
      {/* 圆工具下拉菜单 */}
      <div className="relative group">
        <button
          onClick={() => setOpenMenu(openMenu === 'circle' ? null : 'circle')}
          title="圆工具"
          className={cn(
            'flex items-center justify-center w-9 h-9 rounded-md transition-all duration-200',
            'hover:bg-gray-100 active:scale-95',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
            circleTools.some(t => state.interaction.mode === t.mode)
              ? 'bg-blue-100 text-blue-600 ring-1 ring-blue-500' 
              : 'bg-white text-gray-600 hover:text-gray-900'
          )}
        >
          <CircleDot size={18} />
          <ChevronDown size={12} className="ml-1" />
        </button>
        
        {openMenu === 'circle' && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
            {circleTools.map((tool) => {
              const isActive = state.interaction.mode === tool.mode;
              return (
                <button
                  key={tool.mode}
                  onClick={() => {
                    setMode(tool.mode);
                    setOpenMenu(null);
                  }}
                  title={tool.description}
                  className={cn(
                    'flex items-center w-full px-3 py-2 text-left transition-colors duration-200',
                    'hover:bg-gray-100 focus:outline-none',
                    isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  )}
                >
                  <span className="mr-2">{tool.icon}</span>
                  <span>{tool.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      
      {/* 线工具下拉菜单 */}
      <div className="relative group">
        <button
          onClick={() => setOpenMenu(openMenu === 'line' ? null : 'line')}
          title="线工具"
          className={cn(
            'flex items-center justify-center w-9 h-9 rounded-md transition-all duration-200',
            'hover:bg-gray-100 active:scale-95',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
            lineTools.some(t => state.interaction.mode === t.mode)
              ? 'bg-blue-100 text-blue-600 ring-1 ring-blue-500' 
              : 'bg-white text-gray-600 hover:text-gray-900'
          )}
        >
          <Slash size={18} />
          <ChevronDown size={12} className="ml-1" />
        </button>
        
        {openMenu === 'line' && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
            {lineTools.map((tool) => {
              const isActive = state.interaction.mode === tool.mode;
              return (
                <button
                  key={tool.mode}
                  onClick={() => {
                    setMode(tool.mode);
                    setOpenMenu(null);
                  }}
                  title={tool.description}
                  className={cn(
                    'flex items-center w-full px-3 py-2 text-left transition-colors duration-200',
                    'hover:bg-gray-100 focus:outline-none',
                    isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  )}
                >
                  <span className="mr-2">{tool.icon}</span>
                  <span>{tool.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      
      {/* 变换工具下拉菜单 */}
      <div className="relative group">
        <button
          onClick={() => setOpenMenu(openMenu === 'transform' ? null : 'transform')}
          title="变换工具"
          className={cn(
            'flex items-center justify-center w-9 h-9 rounded-md transition-all duration-200',
            'hover:bg-gray-100 active:scale-95',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
            transformTools.some(t => state.interaction.mode === t.mode)
              ? 'bg-blue-100 text-blue-600 ring-1 ring-blue-500' 
              : 'bg-white text-gray-600 hover:text-gray-900'
          )}
        >
          <FlipHorizontal size={18} />
          <ChevronDown size={12} className="ml-1" />
        </button>
        
        {openMenu === 'transform' && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
            {transformTools.map((tool) => {
              const isActive = state.interaction.mode === tool.mode;
              return (
                <button
                  key={tool.mode}
                  onClick={() => {
                    setMode(tool.mode);
                    setOpenMenu(null);
                  }}
                  title={tool.description}
                  className={cn(
                    'flex items-center w-full px-3 py-2 text-left transition-colors duration-200',
                    'hover:bg-gray-100 focus:outline-none',
                    isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  )}
                >
                  <span className="mr-2">{tool.icon}</span>
                  <span>{tool.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="w-px h-6 bg-gray-200 mx-2" />
      
      {/* 显示/隐藏网格和坐标轴 */}
      <button
        onClick={toggleGrid}
        title={state.view.showGrid ? "隐藏网格" : "显示网格"}
        className={cn(
          'flex items-center justify-center w-9 h-9 rounded-md transition-all duration-200',
          'hover:bg-gray-100 active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
          state.view.showGrid ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-600 hover:text-gray-900'
        )}
      >
        <Grid size={18} />
      </button>
      
      <button
        onClick={toggleAxes}
        title={state.view.showAxes ? "隐藏坐标轴" : "显示坐标轴"}
        className={cn(
          'flex items-center justify-center w-9 h-9 rounded-md transition-all duration-200',
          'hover:bg-gray-100 active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
          state.view.showAxes ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-600 hover:text-gray-900'
        )}
      >
        <Layers size={18} />
      </button>
      
      <div className="w-px h-6 bg-gray-200 mx-2" />
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />
      
      <button
        onClick={handleImportClick}
        title="导入 (从JSON文件)"
        className={cn(
          'flex items-center justify-center w-9 h-9 rounded-md transition-all duration-200',
          'hover:bg-gray-100 active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
          'bg-white text-gray-600 hover:text-gray-900'
        )}
      >
        <Upload size={18} />
      </button>
      
      <button
        onClick={handleExport}
        title="导出 (保存为JSON文件)"
        className={cn(
          'flex items-center justify-center w-9 h-9 rounded-md transition-all duration-200',
          'hover:bg-gray-100 active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
          'bg-white text-gray-600 hover:text-gray-900'
        )}
      >
        <Download size={18} />
      </button>
    </div>
  );
}
