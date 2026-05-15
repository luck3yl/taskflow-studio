import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTaskContext } from "@/contexts/TaskContext";
import { useToast } from "@/hooks/use-toast";
import { uploadFileApi } from "@/services/apis/files";
import { PdfSlideViewer } from "@/pages/ppt/components/PdfSlideViewer";
import { DeptAssignForm } from "./ppt-collab-forms/DeptAssignForm";
import { cn } from "@/lib/utils";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

export default function DeptAssignPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { getTaskById } = useTaskContext();
  const { toast } = useToast();

  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templateFileId, setTemplateFileId] = useState("");
  const [templatePageCount, setTemplatePageCount] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const task = taskId ? getTaskById(taskId) : undefined;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setTemplateFile(file);
    setIsUploading(true);

    try {
      const uploaded = await uploadFileApi({
        file,
        category: "template",
      });
      setTemplateFileId(uploaded.fileId);
      setTemplatePageCount(uploaded.pageCount ?? 0);
      toast({
        title: "模板上传成功",
        description: uploaded.pageCount
          ? `已识别共 ${uploaded.pageCount} 页`
          : "模板已上传",
      });
    } catch (error) {
      setTemplateFile(null);
      setTemplateFileId("");
      setTemplatePageCount(0);
      toast({
        title: "模板上传失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleSuccess = () => {
    toast({ title: "部门分配成功" });
    navigate("/tasks", { state: { refresh: true } });
  };

  if (!task) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-foreground">任务不存在</h2>
          <p className="text-muted-foreground">请从任务列表进入</p>
          <Button onClick={() => navigate("/tasks")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回任务列表
          </Button>
        </div>
      </div>
    );
  }

  const hasTemplate = !!templateFile;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-card px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate("/tasks")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{task.title}</h1>
            <p className="text-xs text-muted-foreground">部门分配</p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">
          待分配部门
        </Badge>
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left: PPT Preview */}
          <ResizablePanel defaultSize={hasTemplate ? 40 : 30} minSize={20} maxSize={70}>
            <div className="h-full flex flex-col border-r border-border bg-muted/20">
              <div className="shrink-0 px-4 py-3 border-b border-border bg-card/50 flex items-center justify-between">
                <span className="text-sm font-medium">PPT 预览</span>
                <div className="flex items-center gap-2">
                  {templateFile && (
                    <span className="text-xs text-muted-foreground">
                      {templateFile.name}
                      {templatePageCount > 0 && ` · ${templatePageCount}页`}
                    </span>
                  )}
                  <input
                    type="file"
                    id="dept-assign-template"
                    className="hidden"
                    accept=".ppt,.pptx"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                  <label htmlFor="dept-assign-template">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs cursor-pointer"
                      asChild
                      disabled={isUploading}
                    >
                      <span>
                        {isUploading ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Upload className="h-3 w-3 mr-1" />
                        )}
                        {templateFile ? "更换模板" : "上传模板"}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>

              <div className="flex-1 overflow-auto">
                {hasTemplate && templateFileId ? (
                  <PdfSlideViewer
                    fileId={templateFileId}
                    fileName={templateFile?.name}
                    pageCount={templatePageCount}
                    height="100%"
                    layout="top-bottom"
                    className="h-full"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center p-8">
                    <label
                      htmlFor="dept-assign-template"
                      className={cn(
                        "flex flex-col items-center gap-4 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-colors",
                        "border-border hover:border-primary/50 bg-card/50 hover:bg-primary/5",
                        isUploading && "cursor-not-allowed opacity-60"
                      )}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-12 w-12 text-primary animate-spin" />
                          <span className="text-sm text-muted-foreground">上传中...</span>
                        </>
                      ) : (
                        <>
                          <FileSpreadsheet className="h-12 w-12 text-muted-foreground/60" />
                          <div className="text-center">
                            <p className="text-sm font-medium text-foreground">
                              上传 PPT 模板文件
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              上传后可预览内容，方便按页分配部门
                            </p>
                          </div>
                        </>
                      )}
                    </label>
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right: Assignment Panel */}
          <ResizablePanel defaultSize={hasTemplate ? 60 : 70} minSize={30}>
            <div className="h-full overflow-auto p-6">
              <DeptAssignForm
                task={task}
                totalPages={templatePageCount}
                templateFileId={templateFileId}
                onSuccess={handleSuccess}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
