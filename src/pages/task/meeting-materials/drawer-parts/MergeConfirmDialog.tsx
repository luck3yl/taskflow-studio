import { GitMerge } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MergeConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

/** 发起合并确认 Dialog */
export function MergeConfirmDialog({ open, onOpenChange, onConfirm }: MergeConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="h-5 w-5 text-primary" />
            开始合并
          </DialogTitle>
          <DialogDescription>系统会将员工已提交且审核通过的 PPT 自动合并，并把任务更新为已合并。</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-xl border border-border/60 bg-secondary/20 px-4 py-3">
            <p className="text-sm font-medium text-foreground">合并范围</p>
            <p className="mt-1 text-xs leading-6 text-muted-foreground">
              系统将按当前任务下已审核通过的页面稿件进行合并，不需要手动上传最终文件。
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button className="gradient-primary" onClick={onConfirm}>确认合并</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
