import React, { useRef, useState, useEffect } from 'react';
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
  ZoomIn,
  ZoomOut,
  Undo2,
  Redo2,
  Download,
  Upload,
  ChevronDown,
  Square
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
  isDropdown?: boolean;
  dropdownOptions?: { mode: ToolMode; label: string; description: string }[];
}

const circleDropdownOptions = [
  { mode: 'circle' as ToolMode, label: '圆心与半径', description: '先点击圆心，再点击确定半径' },
  { mode: 'circle_center_point' as ToolMode, label: '圆心与一点', description: '先点击圆心，再点击圆上一点' },
  { mode: 'circle_center_radius' as ToolMode, label: '圆心与半径（输入）', description: '先点击圆心，再输入半径值' },
  { mode: 'circle_point_radius' as ToolMode, label: '半径与圆心', description: '先点击确定半径，再点击圆心' },
  { mode: 'circle_three_points' as ToolMode, label: '圆过三点', description: '依次点击三个点' },
];

const lineToolsDropdownOptions = [
  { mode: 'perpendicular' as ToolMode, label: '垂线', description: '过一点作直线的垂线' },
  { mode: 'parallel' as ToolMode, label: '平行线', description: '过一点作直线的平行线' },
  { mode: 'perpendicular_bisector' as ToolMode, label: '中垂线', description: '作线段的中垂线' },
  { mode: 'angular_bisector' as ToolMode, label: '角平分线', description: '作角的平分线' },
];

const tools: ToolButton[] = [
  { mode: 'move', label: '移动', icon: <MousePointer2 size={18} />, description: '移动和拖动对象' },
  { mode: 'pan', label: '抓手', icon: <Hand size={18} />, description: '拖拽坐标系' },
  { mode: 'point', label: '点', icon: <CircleDot size={18} />, description: '创建点' },
  { mode: 'segment', label: '线段', icon: <Minus size={18} />, description: '创建线段（两点）' },
  { mode: 'line', label: '直线', icon: <Slash size={18} />, description: '创建直线' },
  { mode: 'circle', label: '圆', icon: <Circle size={18} />, description: '创建圆', isDropdown: true, dropdownOptions: circleDropdownOptions },
  { mode: 'polygon', label: '多边形', icon: <Hexagon size={18} />, description: '创建多边形' },
  { mode: 'vector', label: '向量', icon: <ArrowRight size={18} />, description: '创建向量' },
  { mode: 'intersect', label: '交点', icon: <Target size={18} />, description: '创建交点' },
  { mode: 'midpoint', label: '中点', icon: <CircleDot size={18} strokeWidth={1} />, description: '创建中点' },
  { mode: 'line_tools', label: '线工具', icon: <Square size={18} />, description: '线工具', isDropdown: true, dropdownOptions: lineToolsDropdownOptions },
  { mode: 'delete', label: '删除', icon: <Trash2 size={18} />, description: '删除对象' },
];

interface ToolbarProps {
  className?: string;
  style?: React.CSSProperties;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

export function Toolbar({ className, style, onZoomIn, onZoomOut }: ToolbarProps): React.ReactElement {
  const { state, setMode, undo, redo, canUndo, canRedo, exportData, importData } = useGeoGebra();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleDropdownClick = (toolMode: string) => {
    setOpenDropdown(openDropdown === toolMode ? null : toolMode);
  };

  const handleDropdownOptionClick = (mode: ToolMode) => {
    setMode(mode);
    setOpenDropdown(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [openDropdown]);

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-3 py-2 bg-white border-b border-gray-200',
        className
      )}
      style={style}
    >
      {tools.map((tool) => {
        const isActive = state.interaction.mode === tool.mode || 
          (tool.isDropdown && tool.dropdownOptions?.some(opt => opt.mode === state.interaction.mode));
        
        if (tool.isDropdown && tool.dropdownOptions) {
          return (
            <div key={tool.mode} className="relative dropdown-container">
              <button
                onClick={() => handleDropdownClick(tool.mode)}
                title={tool.description}
                className={cn(
                  'flex items-center justify-center gap-1 px-2 h-9 rounded-md transition-all duration-200',
                  'hover:bg-gray-100 active:scale-95',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
                  isActive 
                    ? 'bg-blue-100 text-blue-600 ring-1 ring-blue-500' 
                    : 'bg-white text-gray-600 hover:text-gray-900'
                )}
              >
                {tool.icon}
                <ChevronDown size={14} />
              </button>
              
              {openDropdown === tool.mode && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[180px]">
                  {tool.dropdownOptions.map((option) => (
                    <button
                      key={option.mode}
                      onClick={() => handleDropdownOptionClick(option.mode)}
                      title={option.description}
                      className={cn(
                        'w-full px-3 py-2 text-left text-sm transition-colors',
                        'hover:bg-gray-100',
                        state.interaction.mode === option.mode 
                          ? 'bg-blue-50 text-blue-600' 
                          : 'text-gray-700'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        }
        
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
      
      <div className="w-px h-6 bg-gray-200 mx-2" />
      
      <button
        onClick={onZoomIn}
        title="放大"
        className={cn(
          'flex items-center justify-center w-9 h-9 rounded-md transition-all duration-200',
          'hover:bg-gray-100 active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
          'bg-white text-gray-600 hover:text-gray-900'
        )}
      >
        <ZoomIn size={18} />
      </button>
      
      <button
        onClick={onZoomOut}
        title="缩小"
        className={cn(
          'flex items-center justify-center w-9 h-9 rounded-md transition-all duration-200',
          'hover:bg-gray-100 active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
          'bg-white text-gray-600 hover:text-gray-900'
        )}
      >
        <ZoomOut size={18} />
      </button>
      
      <div className="w-px h-6 bg-gray-200 mx-2" />
      
      <button
        onClick={undo}
        disabled={!canUndo}
        title="撤销 (Ctrl+Z)"
        className={cn(
          'flex items-center justify-center w-9 h-9 rounded-md transition-all duration-200',
          'hover:bg-gray-100 active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
          canUndo
            ? 'bg-white text-gray-600 hover:text-gray-900'
            : 'bg-gray-50 text-gray-300 cursor-not-allowed'
        )}
      >
        <Undo2 size={18} />
      </button>
      
      <button
        onClick={redo}
        disabled={!canRedo}
        title="重做 (Ctrl+Y)"
        className={cn(
          'flex items-center justify-center w-9 h-9 rounded-md transition-all duration-200',
          'hover:bg-gray-100 active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
          canRedo
            ? 'bg-white text-gray-600 hover:text-gray-900'
            : 'bg-gray-50 text-gray-300 cursor-not-allowed'
        )}
      >
        <Redo2 size={18} />
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
