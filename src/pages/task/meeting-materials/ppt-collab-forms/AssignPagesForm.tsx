import { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTaskContext } from "@/contexts/TaskContext";
import { useUserContext } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { PptCollabFormProps } from "./types";

// ---- PageSelector with range support ----
function PageSelector({
  pages,
  selectedPages,
  occupiedPages,
  onChange,
}: {
  pages: number[];
  selectedPages: number[];
  occupiedPages: number[];
  onChange: (pages: number[]) => void;
}) {
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");

  const toggle = (page: number) => {
    if (occupiedPages.includes(page) && !selectedPages.includes(page)) return;
    const next = selectedPages.includes(page)
      ? selectedPages.filter((p) => p !== page)
      : [...selectedPages, page].sort((a, b) => a - b);
    onChange(next);
  };

  // 自动选择范围（当两个输入框都有值时自动触发）
  const applyRange = (start: string, end: string) => {
    const s = parseInt(start);
    const e = parseInt(end);
    if (isNaN(s) || isNaN(e) || s > e) return;

    const rangePagesToAdd = pages.filter(
      (p) => p >= s && p <= e && !occupiedPages.includes(p)
    );
    const merged = [...new Set([...selectedPages, ...rangePagesToAdd])].sort((a, b) => a - b);
    onChange(merged);
    setRangeStart("");
    setRangeEnd("");
  };

  const handleStartChange = (val: string) => {
    setRangeStart(val);
    if (val && rangeEnd) applyRange(val, rangeEnd);
  };

  const handleEndChange = (val: string) => {
    setRangeEnd(val);
    if (rangeStart && val) applyRange(rangeStart, val);
  };

  const handleSelectRemaining = () => {
    const remaining = pages.filter(
      (p) => !occupiedPages.includes(p) && !selectedPages.includes(p)
    );
    const merged = [...new Set([...selectedPages, ...remaining])].sort((a, b) => a - b);
    onChange(merged);
  };

  const handleSelectAll = () => {
    const available = pages.filter((p) => !occupiedPages.includes(p));
    onChange(available);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const remainingCount = pages.filter(
    (p) => !occupiedPages.includes(p) && !selectedPages.includes(p)
  ).length;

  return (
    <div className="space-y-2">
      {/* 快捷操作 */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <Input
            type="number"
            placeholder="起"
            className="h-7 w-14 text-xs px-2"
            value={rangeStart}
            onChange={(e) => handleStartChange(e.target.value)}
            min={pages[0]}
            max={pages[pages.length - 1]}
          />
          <span className="text-xs text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder="止"
            className="h-7 w-14 text-xs px-2"
            value={rangeEnd}
            onChange={(e) => handleEndChange(e.target.value)}
            min={pages[0]}
            max={pages[pages.length - 1]}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs px-2"
          onClick={handleSelectRemaining}
          disabled={remainingCount === 0}
        >
          剩余页({remainingCount})
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs px-2"
          onClick={handleSelectAll}
        >
          全选
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs px-2"
          onClick={handleClearAll}
          disabled={selectedPages.length === 0}
        >
          清空
        </Button>
      </div>

      {/* 页码网格 */}
      <div className="flex flex-wrap gap-1.5">
        {pages.map((page) => {
          const isSelected = selectedPages.includes(page);
          const isOccupied = occupiedPages.includes(page) && !isSelected;
          return (
            <button
              key={page}
              type="button"
              disabled={isOccupied}
              onClick={() => toggle(page)}
              className={cn(
                "h-8 w-8 rounded-md border text-xs font-medium transition-all",
                isSelected
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "",
                isOccupied
                  ? "bg-muted text-muted-foreground border-dashed cursor-not-allowed opacity-50"
                  : "",
                !isSelected && !isOccupied
                  ? "border-border hover:border-primary hover:text-primary"
                  : ""
              )}
            >
              {page}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---- Types ----
interface Assignment {
  userId: string;
  pages: number[];
  taskDescription: string;
}

// ---- AssignPagesForm (left-list + right-detail layout) ----
export function AssignPagesForm({ task, onSuccess, onError, readOnly }: PptCollabFormProps) {
  const { completePptAction } = useTaskContext();
  const { currentUser, users } = useUserContext();
  const { toast } = useToast();

  const workflow = task.meetingMaterialWorkflow;

  // 找到当前用户负责的部门
  // 优先通过 headUserId 匹配，如果匹配不到则取第一个（信任后端 assignee 分配）
  const myDept = workflow?.deptAssignments.find(
    (d) => d.headUserId === currentUser.id
  ) || (workflow?.deptAssignments.length === 1 ? workflow.deptAssignments[0] : undefined);

  const deptPages = myDept
    ? [...new Set(myDept.pages)].sort((a, b) => a - b)
    : [];

  // Users that can be assigned (non-management, in same dept or sub-depts)
  const assignableUsers = users.filter(
    (u) =>
      u.department === myDept?.department &&
      !u.roles.some((r) =>
        ["室主任", "设备部长", "分管副部长", "设备厂长", "设备组长"].includes(r)
      )
  );

  const [assignments, setAssignments] = useState<Assignment[]>([
    { userId: "", pages: [], taskDescription: "" },
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getOccupiedPages = (excludeIndex: number) =>
    assignments
      .filter((_, i) => i !== excludeIndex)
      .flatMap((a) => a.pages);

  const addRow = () => {
    const newAssignments = [
      ...assignments,
      { userId: "", pages: [], taskDescription: "" },
    ];
    setAssignments(newAssignments);
    setSelectedIndex(newAssignments.length - 1);
  };

  const removeRow = (index: number) => {
    const newAssignments = assignments.filter((_, i) => i !== index);
    setAssignments(newAssignments);
    if (selectedIndex >= newAssignments.length) {
      setSelectedIndex(Math.max(0, newAssignments.length - 1));
    } else if (selectedIndex > index) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const updateRow = (index: number, updated: Assignment) => {
    setAssignments((prev) =>
      prev.map((item, i) => (i === index ? updated : item))
    );
  };

  const currentAssignment = assignments[selectedIndex];

  const getUserName = (userId: string) => {
    const user = assignableUsers.find((u) => u.id === userId);
    return user?.name || "";
  };

  const handleSubmit = async () => {
    if (!myDept) {
      toast({ title: "未找到您负责的部门", variant: "destructive" });
      return;
    }

    const validAssignments = assignments.filter(
      (a) => a.userId && a.pages.length > 0
    );

    if (validAssignments.length === 0) {
      toast({ title: "至少需要分配一名员工", variant: "destructive" });
      return;
    }

    // Check pages are within dept range
    const deptPageSet = new Set(deptPages);
    for (const a of validAssignments) {
      const outOfRange = a.pages.filter((p) => !deptPageSet.has(p));
      if (outOfRange.length > 0) {
        toast({
          title: `页码 ${outOfRange.join("、")} 超出部门范围`,
          variant: "destructive",
        });
        return;
      }
    }

    // 检查是否所有页码都已分配
    const assignedPages = new Set(validAssignments.flatMap((a) => a.pages));
    const unassignedPages = deptPages.filter((p) => !assignedPages.has(p));
    if (unassignedPages.length > 0) {
      const confirmed = window.confirm(
        `还有 ${unassignedPages.length} 页未分配（第 ${unassignedPages.join("、")} 页），确定要继续提交吗？`
      );
      if (!confirmed) return;
    }

    setIsSubmitting(true);
    try {
      const updatedTask = await completePptAction(task.id, {
        action: "assign_pages",
        payload: {
          deptId: myDept.id,
          assignments: validAssignments.map((a) => ({
            userId: a.userId,
            pages: a.pages,
            taskDescription: a.taskDescription || undefined,
          })),
        },
      });
      toast({ title: "员工分配成功" });
      onSuccess(updatedTask);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      toast({
        title: "分配失败",
        description: err.message,
        variant: "destructive",
      });
      onError?.(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!myDept) {
    return (
      <div className="text-sm text-muted-foreground py-2">
        未找到您负责的部门分配信息，可能业务数据尚未加载完成。
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 mb-4">
        <h3 className="text-sm font-bold text-foreground">分配员工页码</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          为 <span className="font-medium text-foreground/80">{myDept.department}</span>{" "}
          的员工分配负责页码（本部门负责第{" "}
          {deptPages.join("、")} 页）
        </p>
      </div>

      {/* Main: left employee list + right detail */}
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        {/* Left: Employee list */}
        <div className="w-44 shrink-0 flex flex-col gap-2 overflow-auto">
          {assignments.map((assignment, index) => (
            <div
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "group relative rounded-lg border px-3 py-2.5 cursor-pointer transition-all text-sm",
                selectedIndex === index
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/40 hover:bg-muted/30"
              )}
            >
              <div className="font-medium truncate">
                {assignment.userId ? getUserName(assignment.userId) : `员工 ${index + 1}`}
              </div>
              {assignment.pages.length > 0 && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  {assignment.pages.length} 页：第 {assignment.pages.join("、")} 页
                </div>
              )}
              {assignments.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-1 right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRow(index);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full h-9 border-dashed gap-1.5 shrink-0"
            onClick={addRow}
          >
            <Plus className="h-3.5 w-3.5" />
            添加员工
          </Button>
        </div>

        {/* Right: Detail panel for selected employee */}
        <div className="flex-1 overflow-auto space-y-4">
          {currentAssignment && (
            <>
              <div>
                <Label className="text-xs font-medium">选择员工</Label>
                <Select
                  value={currentAssignment.userId}
                  onValueChange={(val) =>
                    updateRow(selectedIndex, { ...currentAssignment, userId: val })
                  }
                >
                  <SelectTrigger className="mt-1 h-9 text-sm">
                    <SelectValue placeholder="选择员工" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} · {u.department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium">负责页码</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  仅可从本部门负责页中分配，灰色页码已被其他员工占用
                </p>
                <PageSelector
                  pages={deptPages}
                  selectedPages={currentAssignment.pages}
                  occupiedPages={getOccupiedPages(selectedIndex)}
                  onChange={(pages) =>
                    updateRow(selectedIndex, { ...currentAssignment, pages })
                  }
                />
              </div>

              <div>
                <Label className="text-xs font-medium">任务描述（选填）</Label>
                <Textarea
                  className="mt-1 resize-none text-sm"
                  rows={3}
                  placeholder="填写该员工的具体任务内容..."
                  value={currentAssignment.taskDescription}
                  onChange={(e) =>
                    updateRow(selectedIndex, {
                      ...currentAssignment,
                      taskDescription: e.target.value,
                    })
                  }
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer: Submit */}
      <div className="shrink-0 pt-4">
        <Button
          className="w-full h-10 font-semibold"
          disabled={isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          确认分配
        </Button>
      </div>
    </div>
  );
}
