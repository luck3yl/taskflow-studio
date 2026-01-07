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
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ReviewDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle?: string;
  assignee?: {
    id: string;
    name: string;
    avatar: string;
    status: string;
    submittedAt: string | null;
  };
}

const quickFeedbacks = [
  "准予通过",
  "数据有误，请核实",
  "格式需要调整",
  "内容不够完整",
  "请补充更多细节",
];

export function ReviewDrawer({ open, onOpenChange, taskTitle, assignee }: ReviewDrawerProps) {
  const [feedback, setFeedback] = useState("");
  const [currentSlide, setCurrentSlide] = useState(1);
  const totalSlides = 6;
  const { toast } = useToast();

  if (!assignee) return null;

  const handleApprove = () => {
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
    toast({
      title: "已驳回",
      description: `已驳回 ${assignee.name} 的提交`,
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl">{taskTitle}</SheetTitle>
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
                提交于 {assignee.submittedAt}
              </div>
            </div>
            <Badge 
              className={assignee.status === "approved" 
                ? "bg-success/10 text-success border-success/20 ml-auto"
                : "bg-warning/10 text-warning border-warning/20 ml-auto"
              }
            >
              {assignee.status === "approved" ? "已通过" : "待审核"}
            </Badge>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* PPT Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground">成果预览</h4>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                下载原件
              </Button>
            </div>
            
            {/* Preview Container */}
            <div className="relative rounded-xl border border-border bg-muted/30 overflow-hidden">
              {/* Slide Preview */}
              <div className="aspect-[16/9] flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                <div className="text-center p-8">
                  <FileText className="h-16 w-16 mx-auto text-primary/40 mb-4" />
                  <p className="text-lg font-medium text-foreground">PPT 预览区域</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    第 {currentSlide} 页 / 共 {totalSlides} 页
                  </p>
                </div>
              </div>
              
              {/* Navigation */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-card/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md border border-border">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentSlide(Math.max(1, currentSlide - 1))}
                  disabled={currentSlide === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[60px] text-center">
                  {currentSlide} / {totalSlides}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentSlide(Math.min(totalSlides, currentSlide + 1))}
                  disabled={currentSlide === totalSlides}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Thumbnail Strip */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {Array.from({ length: totalSlides }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i + 1)}
                  className={`shrink-0 w-20 h-12 rounded-lg border-2 transition-all ${
                    currentSlide === i + 1 
                      ? "border-primary bg-primary/10" 
                      : "border-border bg-muted/30 hover:border-primary/50"
                  }`}
                >
                  <span className="text-xs text-muted-foreground">{i + 1}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Feedback Section */}
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

          {/* Action Buttons */}
          {assignee.status !== "approved" && (
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
