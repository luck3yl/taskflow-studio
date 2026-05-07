import { useTaskCreateContext } from './TaskCreateContext';
import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { formatPageRange } from '@/lib/utils';
import { FileSpreadsheet, FileText, Upload, Users, Plus, X, Search, Building2, AlertCircle, CheckCircle2, CalendarIcon } from 'lucide-react';
import { parsePageInput, togglePageSelection, togglePageGroupSelection } from '@/lib/ppt-calculator';

export function Step3TimeConfig() {
  const {
    users, departments, currentUser,
    taskType, setTaskType,
    taskTitle, setTaskTitle,
    taskDescription, setTaskDescription,
    templateFile, setTemplateFile,
    templatePageCount, setTemplatePageCount,
    assignments, setAssignments,
    pptDeptRows, setPptDeptRows,
    pptReviewerId, setPptReviewerId,
    pptApproverId, setPptApproverId,
    deptHeadPickerIdx, setDeptHeadPickerIdx,
    pagePickerRowIdx, setPagePickerRowIdx,
    deptHeadSearch, setDeptHeadSearch,
    reviewerPickerOpen, setReviewerPickerOpen,
    rolePickerSearch, setRolePickerSearch,
    deadlineDate, setDeadlineDate,
    deadlineTime, setDeadlineTime,
    reviewer, setReviewer,
    memberSearch, setMemberSearch,
    isAdvancedSelectOpen, setIsAdvancedSelectOpen,
    reviewerOptions, filteredMembers,
    getAssignedPages, getRemainingPages,
    handleAddAssignment, handleRemoveAssignment,
    toggleMemberSelection, handleUpdateAssignment,
    handleFileUpload, handlePublish,
    getMemberById, setDeptRowPageSelection,
    activePagePickerIdx, activePagePickerRow,
    activePagePickerSelection, pageAssignmentCounts,
    coveredPages, repeatedPages, uncoveredPages,
    activePagesAssignedElsewhere, activeOverlapPages,
    activeUnassignedPages, remainingPages
  } = useTaskCreateContext();

  // 补全缺失的 formatPageSelection 辅助函数
  const formatPageSelection = (pages: number[]) => {
    if (pages.length === 0) return '';
    const sorted = [...pages].sort((a, b) => a - b);
    let result = '';
    let start = sorted[0];
    let end = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === end + 1) {
        end = sorted[i];
      } else {
        result += start === end ? `${start}, ` : `${start}-${end}, `;
        start = sorted[i];
        end = sorted[i];
      }
    }
    result += start === end ? `${start}` : `${start}-${end}`;
    return result;
  };

  return (
    <>
            <>
              <CardHeader>
                <CardTitle>时限与审核配置</CardTitle>
                <CardDescription>
                  {taskType === "例会资料"
                    ? "设置截止时间、审核人（汇总审核）和审批人（最终批准）"
                    : "设置截止时间和指定审核人"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>截止日期</Label>
                  <div className="flex gap-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-[200px] justify-start text-left font-normal",
                            !deadlineDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {deadlineDate ? format(deadlineDate, "yyyy年MM月dd日", { locale: zhCN }) : "选择日期"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={deadlineDate}
                          onSelect={setDeadlineDate}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <Input
                      type="time"
                      value={deadlineTime}
                      onChange={(e) => setDeadlineTime(e.target.value)}
                      className="w-[120px]"
                    />
                  </div>
                </div>

                {taskType === "例会资料" ? (
                  <>
                    {/* 审核人（从真实用户中选） */}
                    <div className="space-y-2">
                      <div>
                        <Label>审核人 <span className="text-xs text-muted-foreground font-normal ml-1">— 各部门完成后进行阶段性汇总审核</span></Label>
                      </div>
                      {pptReviewerId ? (
                        (() => {
                          const u = users.find(x => x.id === pptReviewerId)!;
                          return (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-primary/20 bg-primary/5">
                              <Avatar className="h-9 w-9 shrink-0">
                                <AvatarFallback className="bg-primary text-white font-bold">{u.avatar}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-semibold">{u.name}</p>
                                <p className="text-xs text-muted-foreground">{u.role} · {u.department}</p>
                              </div>
                              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setPptReviewerId("")}>更换</Button>
                            </div>
                          );
                        })()
                      ) : (
                        <Button variant="outline" className="w-full border-dashed justify-start text-muted-foreground hover:text-primary hover:border-primary/50"
                          onClick={() => { setReviewerPickerOpen("reviewer"); setRolePickerSearch(""); }}>
                          <Plus className="h-4 w-4 mr-2" />
                          选择审核人
                        </Button>
                      )}
                    </div>

                    {/* 审批人 */}
                    <div className="space-y-2">
                      <div>
                        <Label>审批人 <span className="text-xs text-muted-foreground font-normal ml-1">— 最终合并前的终审批准人</span></Label>
                      </div>
                      {pptApproverId ? (
                        (() => {
                          const u = users.find(x => x.id === pptApproverId)!;
                          return (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-primary/20 bg-primary/5">
                              <Avatar className="h-9 w-9 shrink-0">
                                <AvatarFallback className="bg-primary text-white font-bold">{u.avatar}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-semibold">{u.name}</p>
                                <p className="text-xs text-muted-foreground">{u.role} · {u.department}</p>
                              </div>
                              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setPptApproverId("")}>更换</Button>
                            </div>
                          );
                        })()
                      ) : (
                        <Button variant="outline" className="w-full border-dashed justify-start text-muted-foreground hover:text-primary hover:border-primary/50"
                          onClick={() => { setReviewerPickerOpen("approver"); setRolePickerSearch(""); }}>
                          <Plus className="h-4 w-4 mr-2" />
                          选择审批人
                        </Button>
                      )}
                    </div>

                    {/* 审核人/审批人 选择弹窗 */}
                    <Dialog open={reviewerPickerOpen !== null} onOpenChange={(open) => !open && setReviewerPickerOpen(null)}>
                      <DialogContent className="sm:max-w-[600px] h-[500px] flex flex-col p-6 rounded-2xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            {reviewerPickerOpen === "reviewer" ? "选择审核人" : "选择审批人"}
                          </DialogTitle>
                          <DialogDescription>
                            {reviewerPickerOpen === "reviewer"
                              ? "审核人负责各部门完成后的阶段性汇总审核"
                              : "审批人负责最终合并前的终审批准"}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="relative mt-3 mb-3">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="搜索姓名、工号或职位..." className="pl-10 h-10 rounded-xl" value={rolePickerSearch} onChange={(e) => setRolePickerSearch(e.target.value)} />
                        </div>
                        <ScrollArea className="flex-1 -mx-2 px-2">
                          <div className="space-y-4 pb-4">
                            {departments.map(dept => {
                              const deptMembers = users.filter(u =>
                                u.department === dept.name &&
                                (u.name.includes(rolePickerSearch) || u.staffId.includes(rolePickerSearch) || u.role.includes(rolePickerSearch))
                              );
                              if (deptMembers.length === 0) return null;
                              return (
                                <div key={dept.id} className="space-y-2">
                                  <h4 className="text-sm font-bold text-muted-foreground flex items-center gap-1 sticky top-0 bg-background/95 py-1">
                                    <Building2 className="h-4 w-4" />{dept.name}
                                  </h4>
                                  <div className="grid grid-cols-2 gap-2">
                                    {deptMembers.map(u => {
                                      const isSelected = reviewerPickerOpen === "reviewer" ? pptReviewerId === u.id : pptApproverId === u.id;
                                      return (
                                        <div key={u.id} onClick={() => {
                                          if (reviewerPickerOpen === "reviewer") setPptReviewerId(u.id);
                                          else setPptApproverId(u.id);
                                          setReviewerPickerOpen(null);
                                        }} className={cn("flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all", isSelected ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20" : "border-border/40 bg-muted/10 hover:bg-primary/5 hover:border-primary/30")}>
                                          <Avatar className="h-9 w-9 shrink-0">
                                            <AvatarFallback className={cn("text-sm font-bold", isSelected ? "bg-primary text-white" : "bg-primary/10 text-primary")}>{u.avatar}</AvatarFallback>
                                          </Avatar>
                                          <div className="min-w-0">
                                            <p className="text-sm font-semibold truncate">{u.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{u.role} · {u.staffId}</p>
                                          </div>
                                          {isSelected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0 ml-auto" />}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label>审核人</Label>
                    <Select value={reviewer} onValueChange={setReviewer}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择审核人" />
                      </SelectTrigger>
                      <SelectContent>
                        {reviewerOptions.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            <span className="font-medium">{r.name}</span>
                            <span className="text-muted-foreground ml-2">({r.title})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </>
    </>
  );
}
