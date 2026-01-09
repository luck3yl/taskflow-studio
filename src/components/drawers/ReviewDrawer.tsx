import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Download, 
  FileText, 
  CheckCircle2,
  XCircle,
  Clock,
  Monitor
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Task, Assignee } from "@/contexts/TaskContext";
import { PPTistViewer } from "@/components/ppt/PPTistViewer";

interface ReviewDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
  assignee?: Assignee;
  onApprove?: () => void;
  onReject?: (feedback: string) => void;
}

const quickFeedbacks = [
  "准予通过",
  "数据有误，请核实",
  "格式需要调整",
  "内容不够完整",
  "请补充更多细节",
];

export function ReviewDrawer({ 
  open, 
  onOpenChange, 
  task, 
  assignee,
  onApprove,
  onReject
}: ReviewDrawerProps) {
  const [feedback, setFeedback] = useState("");
  const [showPPTist, setShowPPTist] = useState(false);
  const { toast } = useToast();

  if (!task || !assignee) return null;

  const latestSubmission = assignee.submissions[assignee.submissions.length - 1];

  const handleApprove = () => {
    if (onApprove) {
      onApprove();
    }
    toast({
      title: "审核通过",
      description: `已通过 ${assignee.name} 的提交`,
    });
    onOpenChange(false);
  };

  const handleReject = () => {
    if (!feedback.trim()) {
      toast({
        title: "请填写驳回原因",
        description: "驳回时需要填写原因说明",
        variant: "destructive",
      });
      return;
    }
    if (onReject) {
      onReject(feedback);
    }
    toast({
      title: "已驳回",
      description: `已驳回 ${assignee.name} 的提交`,
    });
    setFeedback("");
    onOpenChange(false);
  };

  const canReview = assignee.status === "submitted";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl">{task.title}</SheetTitle>
          <div className="flex items-center gap-3 mt-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary">
                {assignee.avatar}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">{assignee.name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                提交于 {latestSubmission?.submittedAt || "-"}
              </div>
            </div>
            <Badge 
              className={
                assignee.status === "approved" 
                  ? "bg-success/10 text-success border-success/20 ml-auto"
                  : assignee.status === "rejected"
                    ? "bg-destructive/10 text-destructive border-destructive/20 ml-auto"
                    : "bg-warning/10 text-warning border-warning/20 ml-auto"
              }
            >
              {assignee.status === "approved" && "已通过"}
              {assignee.status === "rejected" && "已驳回"}
              {assignee.status === "submitted" && "待审核"}
            </Badge>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Task Description */}
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground text-sm">任务内容</h4>
            <div className="rounded-lg bg-secondary/50 border border-border p-3">
              <p className="text-sm text-muted-foreground">{assignee.taskDescription}</p>
              {assignee.pageRange && (
                <Badge variant="outline" className="mt-2 text-xs">
                  负责第 {assignee.pageRange} 页
                </Badge>
              )}
            </div>
          </div>

          {/* Submitted File Info */}
          {latestSubmission && (
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground text-sm">提交文件</h4>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <FileText className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{latestSubmission.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {latestSubmission.fileSize?.toFixed(2)} MB
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  下载
                </Button>
              </div>
              {latestSubmission.note && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">提交备注：</p>
                  <p className="text-sm mt-1">{latestSubmission.note}</p>
                </div>
              )}
            </div>
          )}

          {/* PPT Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground">成果预览</h4>
              <Button 
                variant={showPPTist ? "default" : "outline"} 
                size="sm"
                onClick={() => setShowPPTist(!showPPTist)}
              >
                <Monitor className="h-4 w-4 mr-2" />
                {showPPTist ? "关闭在线预览" : "在线预览"}
              </Button>
            </div>
            
            {showPPTist ? (
              <PPTistViewer 
                title={`${assignee.name} - ${assignee.pageRange ? `第${assignee.pageRange}页` : "提交内容"}`}
                height="400px"
              />
            ) : (
              <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
                <div className="aspect-[16/9] flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                  <div className="text-center p-8">
                    <FileText className="h-16 w-16 mx-auto text-primary/40 mb-4" />
                    <p className="text-lg font-medium text-foreground">PPT 预览区域</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      点击"在线预览"查看完整PPT
                    </p>
                    {assignee.pageRange && (
                      <Badge variant="outline" className="mt-3">
                        负责第 {assignee.pageRange} 页
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Previous Review (if rejected/approved) */}
          {latestSubmission?.feedback && (
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground text-sm">
                {assignee.status === "rejected" ? "驳回记录" : "审批记录"}
              </h4>
              <div className={`rounded-lg p-3 ${
                assignee.status === "rejected" 
                  ? "bg-destructive/5 border border-destructive/20" 
                  : "bg-success/5 border border-success/20"
              }`}>
                <p className={`text-sm ${
                  assignee.status === "rejected" ? "text-destructive" : "text-success"
                }`}>
                  {latestSubmission.feedback}
                </p>
                {latestSubmission.feedbackAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {latestSubmission.feedbackAt}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Feedback Section - Only show if can review */}
          {canReview && (
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">审核意见</h4>
              
              {/* Quick Feedback */}
              <div className="flex flex-wrap gap-2">
                {quickFeedbacks.map((text) => (
                  <Button
                    key={text}
                    variant="outline"
                    size="sm"
                    onClick={() => setFeedback(text)}
                    className="text-xs"
                  >
                    {text}
                  </Button>
                ))}
              </div>
              
              <Textarea
                placeholder="输入审核意见（驳回时必填）..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {/* Action Buttons */}
          {canReview && (
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline"
                className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                onClick={handleReject}
              >
                <XCircle className="h-4 w-4 mr-2" />
                驳回
              </Button>
              <Button 
                className="flex-1 gradient-success"
                onClick={handleApprove}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                通过
              </Button>
            </div>
          )}

          {/* Submission History */}
          {assignee.submissions.length > 1 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground text-sm">历史提交记录</h4>
                <div className="space-y-2">
                  {assignee.submissions.slice(0, -1).map((submission) => (
                    <div 
                      key={submission.id}
                      className="flex items-center justify-between p-2 rounded border border-border text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{submission.fileName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {submission.submittedAt}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {submission.status === "rejected" ? "已驳回" : "已通过"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
