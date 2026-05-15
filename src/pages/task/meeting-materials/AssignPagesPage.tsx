import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTaskContext } from "@/contexts/TaskContext";
import { useUserContext } from "@/contexts/UserContext";
import { PdfSlideViewer } from "@/pages/ppt/components/PdfSlideViewer";
import { AssignPagesForm } from "./ppt-collab-forms/AssignPagesForm";
import { formatPageRange } from "@/lib/utils";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

export default function AssignPagesPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { getTaskById } = useTaskContext();
  const { currentUser } = useUserContext();

  const task = taskId ? getTaskById(taskId) : undefined;

  // 获取模板文件 ID 用于预览
  const templateFileId = task?.templateFileId || task?.meetingMaterialWorkflow?.templateFileId;

  // 获取当前室主任负责的部门页码，用于高亮显示
  const myDeptPages = useMemo(() => {
    if (!task?.meetingMaterialWorkflow) return undefined;
    const myDept = task.meetingMaterialWorkflow.deptAssignments.find(
      (d) => d.headUserId === currentUser.id
    );
    return myDept ? new Set(myDept.pages) : undefined;
  }, [task, currentUser.id]);

  const myDept = task?.meetingMaterialWorkflow?.deptAssignments.find(
    (d) => d.headUserId === currentUser.id
  );

  const handleSuccess = () => {
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
            <p className="text-xs text-muted-foreground">
              分配员工页码
              {myDept && (
                <span className="ml-2 text-primary font-medium">
                  · {myDept.department} · 负责第 {formatPageRange(myDept.pages)} 页
                </span>
              )}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">
          待分配员工
        </Badge>
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left: PPT Preview */}
          <ResizablePanel defaultSize={40} minSize={20} maxSize={70}>
            <div className="h-full flex flex-col border-r border-border bg-muted/20">
              <div className="shrink-0 px-4 py-3 border-b border-border bg-card/50">
                <span className="text-sm font-medium">PPT 预览</span>
                {myDept && (
                  <span className="text-xs text-muted-foreground ml-2">
                    （本部门负责第 {formatPageRange(myDept.pages)} 页）
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-auto">
                {templateFileId ? (
                  <PdfSlideViewer
                    fileId={templateFileId}
                    fileName={task.templateFileName}
                    pageCount={task.templatePageCount}
                    height="100%"
                    layout="top-bottom"
                    className="h-full"
                    visiblePages={myDeptPages}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center p-8">
                    <p className="text-sm text-muted-foreground">暂无模板文件可预览</p>
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right: Assignment Panel */}
          <ResizablePanel defaultSize={60} minSize={30}>
            <div className="h-full overflow-auto p-6">
              <AssignPagesForm
                task={task}
                onSuccess={handleSuccess}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
