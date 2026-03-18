import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  Download,
  Upload,
  FileText,
  CheckCircle2,
  Calendar,
  Eye,
  Edit,
  XCircle
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Task, Assignee } from "@/contexts/TaskContext";
import { FilePreviewDialog } from "@/components/ppt/FilePreviewDialog";
import { cn } from "@/lib/utils";
import { TaskTimelineView } from "@/components/task/TaskTimelineView";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface TaskProcessDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
  assignee?: Assignee;
  onSubmit?: (file: File, note: string) => void;
}

export function TaskProcessDrawer({
  open,
  onOpenChange,
  task,
  assignee,
  onSubmit
}: TaskProcessDrawerProps) {
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [templatePreviewOpen, setTemplatePreviewOpen] = useState(false);
  const [submissionPreview, setSubmissionPreview] = useState<{ fileName: string, fileUrl: string } | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  if (!task || !assignee) return null;

  const handleSubmit = () => {
    if (!file) {
      toast({
        title: "请上传文件",
        description: "提交前请先上传您的PPT文件",
        variant: "destructive",
      });
      return;
    }

    if (onSubmit) {
      onSubmit(file, note);
    }

    toast({
      title: "提交成功",
      description: "您的成果已提交，等待领导审核",
    });

    setFile(null);
    setNote("");
    onOpenChange(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  // Calculate remaining time
  const deadline = new Date(task.deadline);
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();

  const formatRemainingTime = (diffMs: number) => {
    if (diffMs <= 0) return "已超时";

    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const remainingHours = totalHours % 24;

    if (days > 0) {
      return `剩余 ${days} 天 ${remainingHours} 小时`;
    }
    return `剩余 ${totalHours} 小时`;
  };

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const isUrgent = hours > 0 && hours < 24;
  const isOverdue = hours <= 0;

  const canSubmit = assignee.status === "pending" || assignee.status === "rejected";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl">{task.title}</SheetTitle>
              <SheetDescription className="sr-only">
                查看任务详情、模板文件并提交您的工作成果。
              </SheetDescription>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {task.createdBy}
                </Badge>
                <Badge
                  className={cn(
                    isOverdue
                      ? "bg-destructive/10 text-destructive border-destructive/20"
                      : isUrgent
                        ? "bg-warning/10 text-warning border-warning/20"
                        : "bg-muted text-muted-foreground",
                    "hover:bg-transparent cursor-default"
                  )}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  {formatRemainingTime(diff)}
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              我的任务
            </h4>
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
              <p className="text-sm text-foreground leading-relaxed">
                {assignee.taskDescription}
              </p>
              {assignee.pageRange && (
                <Badge variant="outline" className="mt-2 text-primary border-primary/30">
                  负责第 {assignee.pageRange} 页
                </Badge>
              )}
            </div>
          </div>

          {task.templateFileName && (
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Download className="h-4 w-4 text-primary" />
                模板文件
              </h4>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-md border border-input bg-background overflow-hidden h-10">
                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                  <div className="flex-1 min-w-0 flex items-baseline gap-1.5 overflow-hidden">
                    <span className="truncate font-medium text-sm">
                      {task.templateFileName}
                    </span>
                    {task.templatePageCount && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        ({task.templatePageCount}页)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0 ml-auto">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-primary"
                      onClick={() => setTemplatePreviewOpen(true)}
                      title="预览"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-primary"
                      onClick={() => {
                        if (task.templateFileUrl) {
                          window.open(task.templateFileUrl, '_blank');
                        } else {
                          toast({
                            title: "下载失败",
                            description: "未找到文件下载地址",
                            variant: "destructive"
                          });
                        }
                      }}
                      title="下载模板"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {task.templateFileUrl && (
                  <Button
                    variant="outline"
                    className="gap-1.5 text-primary border-primary/30 hover:bg-primary hover:text-white transition-colors shrink-0 h-10 px-3"
                    onClick={() => {
                      onOpenChange(false);
                      navigate(`/editor/${task.id}/${assignee.id}`);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                    <span className="text-sm">在线协作</span>
                  </Button>
                )}
              </div>

              <FilePreviewDialog
                open={templatePreviewOpen}
                onOpenChange={setTemplatePreviewOpen}
                fileName={task.templateFileName}
                fileUrl={task.templateFileUrl}
              />
            </div>
          )}

          <Separator />

          <div className="space-y-3">
            <Tabs defaultValue="task" className="w-full">
              <TabsList className="h-8 bg-secondary/50">
                <TabsTrigger value="task" className="text-xs py-1 px-3">工作提交</TabsTrigger>
                <TabsTrigger value="timeline" className="text-xs py-1 px-3">进度时间线</TabsTrigger>
              </TabsList>

              <TabsContent value="task" className="mt-4 space-y-6">
                {/* Upload Section - Only show if can submit */}
                {canSubmit ? (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        accept=".ppt,.pptx,.pdf"
                        onChange={handleFileChange}
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        {file ? (
                          <div className="flex items-center justify-center gap-2">
                            <FileText className="h-8 w-8 text-primary" />
                            <div className="text-left">
                              <p className="font-medium text-foreground">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              点击上传 PPT 文件
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              支持 .ppt, .pptx, .pdf 格式
                            </p>
                          </>
                        )}
                      </label>
                    </div>

                    <Textarea
                      placeholder="添加备注说明（可选）"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                    />

                    <Button
                      className="w-full gradient-primary"
                      size="lg"
                      onClick={handleSubmit}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      立即提交成果
                    </Button>
                  </div>
                ) : null}

                {/* Submission History - RESTORED PREVIOUS STYLE */}
                <div className="space-y-3 pt-2">
                  <h4 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-primary" />
                    提交记录
                  </h4>
                  {assignee.submissions.length > 0 ? (
                    <div className="space-y-4">
                      {assignee.submissions.slice().reverse().map((submission) => (
                        <div
                          key={submission.id}
                          className="rounded-lg border border-border p-3 space-y-3 bg-card"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">{submission.fileName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-primary"
                                onClick={() => setSubmissionPreview({ fileName: submission.fileName, fileUrl: submission.fileUrl })}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-primary"
                                onClick={() => window.open(submission.fileUrl, '_blank')}
                              >
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                              <Badge
                                className={
                                  submission.status === "rejected"
                                    ? "bg-destructive/10 text-destructive border-destructive/20 ml-1"
                                    : submission.status === "approved"
                                      ? "bg-success/10 text-success border-success/20 ml-1"
                                      : "bg-warning/10 text-warning border-warning/20 ml-1"
                                }
                              >
                                {submission.status === "rejected" ? "已驳回" :
                                  submission.status === "approved" ? "已通过" : "待审核"}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {submission.submittedAt}
                          </p>
                          {submission.note && (
                            <p className="text-xs text-muted-foreground bg-secondary/30 rounded p-2">
                              备注：{submission.note}
                            </p>
                          )}
                          {submission.feedback && (
                            <div className={`rounded p-3 mt-2 ${submission.status === "rejected"
                              ? "bg-destructive/5 border border-destructive/10"
                              : "bg-success/5 border border-success/10"
                              }`}>
                              <p className={`text-xs font-semibold mb-1 ${submission.status === "rejected"
                                ? "text-destructive"
                                : "text-success"
                                }`}>
                                {submission.status === "rejected" ? "驳回原因" : "审批意见"}
                              </p>
                              <p className={`text-xs leading-relaxed ${submission.status === "rejected"
                                ? "text-destructive/90"
                                : "text-success/90"
                                }`}>
                                {submission.feedback}
                              </p>
                              {submission.feedbackAt && (
                                <p className="text-[10px] opacity-60 mt-2">
                                  {submission.feedbackAt}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6 border border-dashed rounded-lg">
                      暂无提交记录
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="mt-4">
                <div className="bg-secondary/10 rounded-lg p-5 border border-border/50">
                  <TaskTimelineView task={task} assignee={assignee} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <FilePreviewDialog
            open={!!submissionPreview}
            onOpenChange={(open) => !open && setSubmissionPreview(null)}
            fileName={submissionPreview?.fileName || ""}
            fileUrl={submissionPreview?.fileUrl || ""}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
