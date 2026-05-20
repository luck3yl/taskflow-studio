import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPageRange } from "@/lib/utils";
import type { MeetingMaterialUserAssignment } from "@/contexts/TaskContext";

interface SubmitWorkDialogProps {
  open: boolean;
  ua?: MeetingMaterialUserAssignment;
  pageVersions: Record<number, number>;
  file: File | null;
  note: string;
  onFileChange: (file: File | null) => void;
  onNoteChange: (note: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

/** 员工上传 PPT 提交 Dialog */
export function SubmitWorkDialog({
  open,
  ua,
  pageVersions,
  file,
  note,
  onFileChange,
  onNoteChange,
  onClose,
  onConfirm,
}: SubmitWorkDialogProps) {
  const hasExistingVersion = ua?.pages.some(p => (pageVersions[p] || 0) > 0);

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            上传提交
          </DialogTitle>
          <DialogDescription>
            您负责第 <strong>{formatPageRange(ua?.pages)}</strong> 页
            {hasExistingVersion && (
              <span className="block mt-1 text-amber-600 text-xs">
                ⚠️ 这些页面已有其他版本，系统将自动进行版本冲突检测
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-sm font-medium">上传文件</Label>
            <input
              type="file"
              id="meeting-material-submit-file"
              className="hidden"
              accept=".ppt,.pptx,.pdf"
              onChange={event => onFileChange(event.target.files?.[0] || null)}
            />
            <label
              htmlFor="meeting-material-submit-file"
              className="mt-1.5 flex items-center justify-center h-20 border-2 border-dashed border-border rounded-xl bg-muted/30 cursor-pointer hover:border-primary/50 transition-colors"
            >
              <div className="text-center px-4">
                <Upload className="h-5 w-5 text-muted-foreground mx-auto" />
                <p className="text-xs text-muted-foreground mt-1">
                  {file ? file.name : "点击上传 .pptx 文件"}
                </p>
              </div>
            </label>
          </div>
          <div>
            <Label className="text-sm font-medium">备注说明（选填）</Label>
            <Textarea
              className="mt-1.5 resize-none text-sm"
              rows={2}
              placeholder="填写本次修改说明..."
              value={note}
              onChange={e => onNoteChange(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button className="gradient-primary" onClick={onConfirm}>确认提交</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
