import { useState, useEffect, useRef } from "react";
import NavigatedViewer from "bpmn-js/lib/NavigatedViewer";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";
import { useProcess } from "@/contexts/ProcessContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";
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
    const { getProcessById } = useProcess();
    const { toast } = useToast();

    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<any>(null);

    const [process, setProcess] = useState<any>(null);
    const [selectedNode, setSelectedNode] = useState<any>(null);

    useEffect(() => {
        if (open && processId) {
            const p = getProcessById(processId);
            if (p) {
                setProcess(p);
            } else {
                toast({ title: "错误", description: "找不到该流程定义", variant: "destructive" });
                onOpenChange(false);
            }
        } else if (!open) {
            setProcess(null);
            setSelectedNode(null);
        }
    }, [open, processId, getProcessById, toast, onOpenChange]);

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;

        const initViewer = () => {
            if (!open || !process) return;

            if (!containerRef.current) {
                // If DOM is not yet ready, retry shortly
                timeoutId = setTimeout(initViewer, 50);
                return;
            }

            if (viewerRef.current) return;

            const viewer = new NavigatedViewer({
                container: containerRef.current
            });

            viewerRef.current = viewer;

            viewer.importXML(process.xmlContent).then(() => {
                // Wait for the drawer sliding animation to complete before fitting viewport
                // so the canvas isn't calculated based on a 0-width or animating container
                setTimeout(() => {
                    if (viewerRef.current) {
                        try {
                            const canvas = viewerRef.current.get('canvas');
                            canvas.zoom('fit-viewport', 'auto');
                            // Ensure it is perfectly centered
                            const viewbox = canvas.viewbox();

                            // A slight zoom back can make it look better if it's too tight against the edges
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
                // Don't select the root process element itself
                if (element.type !== 'bpmn:Process') {
                    setSelectedNode((prevSelected: any) => {
                        if (prevSelected) {
                            canvas.removeMarker(prevSelected.id, 'highlight');
                        }
                        if (prevSelected?.id !== element.id) {
                            canvas.addMarker(element.id, 'highlight');
                            return element;
                        }
                        return null; // Toggle off if clicked again
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

        if (open && process) {
            // Start initialization cycle
            initViewer();
        }

        return () => {
            clearTimeout(timeoutId);
            // Cleanup viewer when drawer closes
            if (!open && viewerRef.current) {
                viewerRef.current.destroy();
                viewerRef.current = null;
            }
        };
    }, [open, process, toast]);

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

    if (!process) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-[80vw] sm:max-w-4xl p-0 flex flex-col h-full bg-background border-l border-border/50">
                <SheetHeader className="h-14 shrink-0 flex flex-row items-center justify-between border-b border-border/50 px-6 bg-card space-y-0 text-left">
                    <div className="flex items-center gap-4">
                        <SheetTitle className="text-base font-semibold">{process.name}</SheetTitle>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-sm">V{process.version}</Badge>
                        <span className="text-xs text-muted-foreground">{process.key}</span>
                        <SheetDescription className="sr-only">
                            流程定义的详细可视化大图
                        </SheetDescription>
                    </div>
                </SheetHeader>

                {/* Main Workspace */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Sidebar - Component Library Placeholder */}
                    {/* <aside className="w-64 border-r border-border/50 bg-card/50 hidden md:flex flex-col shrink-0">
             - Hidden since editing is not required currently - 
          </aside> */}

                    {/* Center Canvas */}
                    <main className="flex-1 relative bg-[#FAFAFA] dark:bg-zinc-950/50 min-w-0">
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
                    </main>
                </div>
            </SheetContent>
        </Sheet>
    );
}
