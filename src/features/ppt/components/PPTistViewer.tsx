import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, ExternalLink, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface PPTistViewerProps {
  title?: string;
  height?: string;
  className?: string;
  /** 
   * 预览模式：
   * - 'edit': 编辑模式（默认PPTist首页，包含编辑工具栏）
   * - 'screen': 放映模式（纯预览，无编辑区域，全屏展示PPT）
   */
  mode?: 'edit' | 'screen';
  /** 是否默认进入放映模式 */
  defaultScreen?: boolean;
}

/**
 * PPTist在线预览组件
 * 
 * PPTist 是一个基于 Vue 3 的在线 PPT 编辑器
 * 支持两种模式：
 * - 编辑模式：完整的编辑界面
 * - 放映模式：纯预览模式，无编辑工具栏
 */
export function PPTistViewer({ 
  title = "PPT预览", 
  height = "500px",
  className = "",
  mode = "screen",
  defaultScreen = true
}: PPTistViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentMode, setCurrentMode] = useState<'edit' | 'screen'>(defaultScreen ? 'screen' : mode);

  // PPTist URL - 使用不同路由进入不同模式
  const getPPTistUrl = (viewMode: 'edit' | 'screen') => {
    const baseUrl = "https://pipipi-pikachu.github.io/PPTist/";
    // 放映模式使用 #/screen 路由
    return viewMode === 'screen' ? `${baseUrl}#/screen` : baseUrl;
  };

  const handleOpenExternal = () => {
    window.open(getPPTistUrl(currentMode), "_blank");
  };

  const toggleMode = () => {
    setCurrentMode(prev => prev === 'edit' ? 'screen' : 'edit');
  };

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleMode}
          >
            <Play className="h-4 w-4 mr-2" />
            {currentMode === 'screen' ? "编辑模式" : "放映模式"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleOpenExternal}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            新窗口打开
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsFullscreen(false)}
          >
            <Minimize2 className="h-4 w-4 mr-2" />
            退出全屏
          </Button>
        </div>
        <iframe
          src={getPPTistUrl(currentMode)}
          className="w-full h-full border-0"
          title={title}
          allow="fullscreen"
        />
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg overflow-hidden border border-border", className)}>
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <div className="flex gap-2">
          <Button
            variant={currentMode === 'screen' ? "default" : "ghost"}
            size="sm"
            onClick={toggleMode}
            className="h-7 px-2"
          >
            <Play className="h-3.5 w-3.5 mr-1" />
            {currentMode === 'screen' ? "放映中" : "放映"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenExternal}
            className="h-7 px-2"
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1" />
            新窗口
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(true)}
            className="h-7 px-2"
          >
            <Maximize2 className="h-3.5 w-3.5 mr-1" />
            全屏
          </Button>
        </div>
      </div>
      <iframe
        src={getPPTistUrl(currentMode)}
        style={{ height: height === "100%" ? "100%" : height }}
        className={cn("w-full border-0", height === "100%" && "h-full")}
        title={title}
        allow="fullscreen"
      />
    </div>
  );
}
