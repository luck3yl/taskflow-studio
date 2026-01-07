import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
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
  AlertCircle,
  Calendar
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface TaskProcessDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: {
    id: string;
    title: string;
    leader: string;
    requirement: string;
    deadline: string;
    status: string;
    hasTemplate: boolean;
    rejectReason?: string;
  } | null;
}

const submissionHistory = [
  {
    id: "1",
    fileName: "Q4季度汇报_v1.pptx",
    submittedAt: "2024-01-13 14:30",
    status: "rejected",
    feedback: "数据有误，请核实财务数据后重新提交",
  },
];

export function TaskProcessDrawer({ open, onOpenChange, task }: TaskProcessDrawerProps) {
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  if (!task) return null;

  const handleSubmit = () => {
    if (!file) {
      toast({
        title: "请上传文件",
        description: "提交前请先上传您的PPT文件",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "提交成功",
      description: "您的成果已提交，等待领导审核",
    });
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
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const isUrgent = hours < 24;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl">{task.title}</SheetTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {task.leader}
                </Badge>
                <Badge 
                  className={isUrgent 
                    ? "bg-destructive/10 text-destructive border-destructive/20" 
                    : "bg-warning/10 text-warning border-warning/20"
                  }
                >
                  <Clock className="h-3 w-3 mr-1" />
                  {hours > 0 ? `剩余 ${hours} 小时` : "已超时"}
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Deadline */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>截止时间：{task.deadline}</span>
          </div>

          {/* Requirement Section */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              任务要求
            </h4>
            <div className="rounded-lg bg-secondary/50 border border-border p-4">
              <p className="text-sm text-foreground leading-relaxed">
                {task.requirement}
              </p>
            </div>
          </div>

          {/* Template Download */}
          {task.hasTemplate && (
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Download className="h-4 w-4 text-primary" />
                模板文件
              </h4>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Q4季度汇报模板.pptx
                <Download className="h-4 w-4 ml-auto" />
              </Button>
            </div>
          )}

          <Separator />

          {/* Upload Section */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />
              提交成果
            </h4>
            
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
          </div>

          <Separator />

          {/* Submission History */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground">提交记录</h4>
            {submissionHistory.length > 0 ? (
              <div className="space-y-3">
                {submissionHistory.map((submission) => (
                  <div 
                    key={submission.id}
                    className="rounded-lg border border-border p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{submission.fileName}</span>
                      </div>
                      <Badge 
                        className={submission.status === "rejected" 
                          ? "bg-destructive/10 text-destructive border-destructive/20"
                          : "bg-success/10 text-success border-success/20"
                        }
                      >
                        {submission.status === "rejected" ? (
                          <><AlertCircle className="h-3 w-3 mr-1" />已驳回</>
                        ) : (
                          <><CheckCircle2 className="h-3 w-3 mr-1" />已通过</>
                        )}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      提交时间：{submission.submittedAt}
                    </p>
                    {submission.feedback && (
                      <div className="rounded bg-destructive/5 p-2 mt-2">
                        <p className="text-xs text-destructive">{submission.feedback}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                暂无提交记录
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button 
              className="w-full gradient-primary" 
              size="lg"
              onClick={handleSubmit}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              提交成果
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
