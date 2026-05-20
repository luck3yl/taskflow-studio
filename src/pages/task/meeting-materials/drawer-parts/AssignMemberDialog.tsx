import { Users } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatPageRange } from "@/lib/utils";
import { PageSelector } from "./PageSelector";
import type { AssignDraft } from "./constants";

interface AssignMemberDialogProps {
  open: boolean;
  onClose: () => void;
  assignableUsers: { id: string; name: string; department: string }[];
  assignablePages: number[];
  occupiedPages: number[];
  userId: string;
  onUserIdChange: (id: string) => void;
  selectedPages: number[];
  onSelectedPagesChange: (pages: number[]) => void;
  taskDescription: string;
  onTaskDescriptionChange: (value: string) => void;
  drafts: AssignDraft[];
  onAddDraft: () => void;
  onRemoveDraft: (userId: string) => void;
  onConfirm: () => void;
}

/** 分配员工 Dialog（支持暂存多人） */
export function AssignMemberDialog({
  open,
  onClose,
  assignableUsers,
  assignablePages,
  occupiedPages,
  userId,
  onUserIdChange,
  selectedPages,
  onSelectedPagesChange,
  taskDescription,
  onTaskDescriptionChange,
  drafts,
  onAddDraft,
  onRemoveDraft,
  onConfirm,
}: AssignMemberDialogProps) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            分配页面给员工
          </DialogTitle>
          <DialogDescription>选择员工并指定负责的页面，仅显示本科室已分配的页码</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-sm font-medium">选择员工</Label>
            <Select value={userId} onValueChange={onUserIdChange}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="选择部门内成员" />
              </SelectTrigger>
              <SelectContent>
                {assignableUsers.map(u => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} · {u.department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-medium">分配页面</Label>
            <p className="text-xs text-muted-foreground mb-1.5">
              仅可从本科室负责页中分配，灰色页面已被本科室其他员工占用
            </p>
            <PageSelector
              pages={assignablePages}
              selectedPages={selectedPages}
              occupiedPages={occupiedPages}
              onChange={onSelectedPagesChange}
            />
          </div>
          <div>
            <Label className="text-sm font-medium">任务内容</Label>
            <Textarea
              className="mt-1.5 resize-none text-sm"
              rows={3}
              placeholder="填写该员工负责的具体内容..."
              value={taskDescription}
              onChange={e => onTaskDescriptionChange(e.target.value)}
            />
          </div>
          {drafts.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">本次待分配人员</Label>
              <div className="space-y-2">
                {drafts.map(draft => (
                  <div
                    key={draft.userId}
                    className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-secondary/20 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{draft.userName}</p>
                      <p className="text-xs text-muted-foreground mt-1">第 {formatPageRange(draft.pages)} 页</p>
                      {draft.taskDescription && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{draft.taskDescription}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => onRemoveDraft(draft.userId)}
                    >
                      删除
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onAddDraft}>添加到本次分配</Button>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button className="gradient-primary" onClick={onConfirm}>确认分配</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
