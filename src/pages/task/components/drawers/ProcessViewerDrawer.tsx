import { useState, useEffect, useRef } from "react";
import NavigatedViewer from "bpmn-js/lib/NavigatedViewer";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";
import { useProcess } from "@/contexts/ProcessContext";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";

interface ProcessViewerDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    processId?: string;
}

export function ProcessViewerDrawer({ open, onOpenChange, processId }: ProcessViewerDrawerProps) {
    const { processes, getProcessXml } = useProcess();
    const { toast } = useToast();

    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<any>(null);

    const [xmlContent, setXmlContent] = useState<string | null>(null);
    const [xmlLoading, setXmlLoading] = useState(false);
    const [selectedNode, setSelectedNode] = useState<any>(null);

    const process = processId ? processes.find(p => p.id === processId) : undefined;

    // 当 drawer 打开时，通过 API 获取 XML
    useEffect(() => {
        if (open && processId) {
            setXmlLoading(true);
            setXmlContent(null);
            getProcessXml(processId).then((xml) => {
                if (xml) {
                    setXmlContent(xml);
                } else {
                    toast({ title: "错误", description: "无法获取流程 XML", variant: "destructive" });
                    onOpenChange(false);
                }
            }).finally(() => {
                setXmlLoading(false);
            });
        } else if (!open) {
            setXmlContent(null);
            setSelectedNode(null);
        }
    }, [open, processId, getProcessXml, toast, onOpenChange]);

    // 渲染 BPMN 图
    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;

        const initViewer = () => {
            if (!open || !xmlContent) return;

            if (!containerRef.current) {
                timeoutId = setTimeout(initViewer, 50);
                return;
            }

            if (viewerRef.current) return;

            const viewer = new NavigatedViewer({
                container: containerRef.current
            });

            viewerRef.current = viewer;

            viewer.importXML(xmlContent).then(() => {
                setTimeout(() => {
                    if (viewerRef.current) {
                        try {
                            const canvas = viewerRef.current.get('canvas');
                            canvas.zoom('fit-viewport', 'auto');
                            const viewbox = canvas.viewbox();
                            if (viewbox.scale > 1) {
                                canvas.zoom(1, 'auto');
                            }
                        } catch (e) { /* ignore if already unmounted */ }
                    }
                }, 300);
            }).catch((err: any) => {
                console.error('Failed to render BPMN', err);
                toast({ title: "渲染失败", description: "BPMN XML 格式错误", variant: "destructive" });
            });

            // Event Listener for Node Selection
            const eventBus = viewer.get('eventBus');
            const canvas = viewer.get('canvas');

            eventBus.on('element.click', (e: any) => {
                const { element } = e;
                if (element.type !== 'bpmn:Process') {
                    setSelectedNode((prevSelected: any) => {
                        if (prevSelected) {
                            canvas.removeMarker(prevSelected.id, 'highlight');
                        }
                        if (prevSelected?.id !== element.id) {
                            canvas.addMarker(element.id, 'highlight');
                            return element;
                        }
                        return null;
                    });
                } else {
                    setSelectedNode((prevSelected: any) => {
                        if (prevSelected) {
                            canvas.removeMarker(prevSelected.id, 'highlight');
                        }
                        return null;
                    });
                }
            });
        };

        if (open && xmlContent) {
            initViewer();
        }

        return () => {
            clearTimeout(timeoutId);
            if (!open && viewerRef.current) {
                viewerRef.current.destroy();
                viewerRef.current = null;
            }
        };
    }, [open, xmlContent, toast]);

    // 当 drawer 关闭时销毁 viewer
    useEffect(() => {
        if (!open && viewerRef.current) {
            viewerRef.current.destroy();
            viewerRef.current = null;
        }
    }, [open]);

    const handleZoomIn = () => {
        if (viewerRef.current) {
            viewerRef.current.get('zoomScroll').stepZoom(1);
        }
    };

    const handleZoomOut = () => {
        if (viewerRef.current) {
            viewerRef.current.get('zoomScroll').stepZoom(-1);
        }
    };

    const handleFitViewport = () => {
        if (viewerRef.current) {
            viewerRef.current.get('canvas').zoom('fit-viewport');
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-[80vw] sm:max-w-4xl p-0 flex flex-col h-full bg-background border-l border-border/50">
                <SheetHeader className="h-14 shrink-0 flex flex-row items-center justify-between border-b border-border/50 px-6 bg-card space-y-0 text-left">
                    <div className="flex items-center gap-4">
                        <SheetTitle className="text-base font-semibold">
                            {process?.name || "流程预览"}
                        </SheetTitle>
                        {process && (
                            <>
                                <Badge variant="outline" className="text-xs px-1.5 py-0 rounded-sm">
                                    V{process.version}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{process.key}</span>
                            </>
                        )}
                        <SheetDescription className="sr-only">
                            流程定义的详细可视化大图
                        </SheetDescription>
                    </div>
                </SheetHeader>

                {/* Main Workspace */}
                <div className="flex-1 flex overflow-hidden">
                    <main className="flex-1 relative bg-[#FAFAFA] dark:bg-zinc-950/50 min-w-0">
                        {xmlLoading ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-muted-foreground">加载流程图...</span>
                            </div>
                        ) : (
                            <>
                                {/* BPMN Canvas Container */}
                                <div ref={containerRef} className="absolute inset-0" />

                                {/* Canvas Floating Toolbar */}
                                <div className="absolute bottom-6 flex justify-center w-full pointer-events-none">
                                    <div className="flex items-center gap-1 p-1 bg-card/80 backdrop-blur-md border border-border/50 rounded-lg shadow-lg pointer-events-auto">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={handleZoomOut} title="缩小">
                                            <ZoomOut className="h-4 w-4" />
                                        </Button>
                                        <div className="w-[1px] h-4 bg-border mx-1" />
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={handleFitViewport} title="适应屏幕">
                                            <Maximize className="h-4 w-4" />
                                        </Button>
                                        <div className="w-[1px] h-4 bg-border mx-1" />
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={handleZoomIn} title="放大">
                                            <ZoomIn className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </main>
                </div>
            </SheetContent>
        </Sheet>
    );
}
