import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, ExternalLink } from "lucide-react";

interface PPTistViewerProps {
  title?: string;
  height?: string;
  className?: string;
}

export function PPTistViewer({ 
  title = "PPT预览", 
  height = "500px",
  className = ""
}: PPTistViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleOpenExternal = () => {
    window.open("https://pipipi-pikachu.github.io/PPTist/", "_blank");
  };

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <div className="absolute top-4 right-4 z-10 flex gap-2">
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
          src="https://pipipi-pikachu.github.io/PPTist/"
          className="w-full h-full border-0"
          title={title}
        />
      </div>
    );
  }

  return (
    <div className={`rounded-lg overflow-hidden border border-border ${className}`}>
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <div className="flex gap-2">
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
        src="https://pipipi-pikachu.github.io/PPTist/"
        style={{ height }}
        className="w-full border-0"
        title={title}
      />
    </div>
  );
}
