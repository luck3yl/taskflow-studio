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

export function Step2TaskBreakdown() {
  const {
    users, departments, currentUser,
    taskType, setTaskType,
    taskTitle, setTaskTitle,
    taskDescription, setTaskDescription,
    templateFile, setTemplateFile,
    templatePageCount, setTemplatePageCount,
    assignments, setAssignments,
    meetingMaterialDeptRows, setMeetingMaterialDeptRows,
    meetingMaterialReviewerId, setMeetingMaterialReviewerId,
    meetingMaterialApproverId, setMeetingMaterialApproverId,
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
                <CardTitle>任务拆解</CardTitle>
                <CardDescription>
                  {taskType === "例会资料"
                    ? "将模板页面分配给各部门，部门负责人后续再分配给员工"
                    : "为每位执行人分配具体的工作包"}
                  {templatePageCount > 0 && (
                    <span className="ml-2 text-primary">
                      （模板共 {templatePageCount} 页）
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 例会资料部门分配 UI */}
                {taskType === "例会资料" ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>部门</Label>
                          <span className="text-xs text-muted-foreground">共 {meetingMaterialDeptRows.length} 个部门</span>
                        </div>

                        {meetingMaterialDeptRows.map((row, idx) => {
                          const selectedPages = parsePageInput(row.pageSelection, templatePageCount);
                          const pagesAssignedElsewhere = new Set<number>();

                          meetingMaterialDeptRows.forEach((otherRow, otherIdx) => {
                            if (otherIdx === idx) return;
                            parsePageInput(otherRow.pageSelection, templatePageCount).forEach(page => {
                              pagesAssignedElsewhere.add(page);
                            });
                          });

                          const sharedPageCount = selectedPages.filter(page => pagesAssignedElsewhere.has(page)).length;
                          const isActive = activePagePickerIdx === idx;

                          return (
                            <div
                              key={idx}
                              onClick={() => setPagePickerRowIdx(idx)}
                              className={cn(
                                "w-full cursor-pointer rounded-lg border px-4 py-3 text-left transition-all",
                                isActive ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"
                              )}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1 space-y-1.5">
                                  <div className="flex min-w-0 items-center gap-2">
                                    <span className={cn(
                                      "h-2.5 w-2.5 shrink-0 rounded-full",
                                      isActive ? "bg-primary" : sharedPageCount > 0 ? "bg-emerald-500" : selectedPages.length > 0 ? "bg-sky-500" : "bg-muted-foreground/30"
                                    )} />
                                    <div className="flex min-w-0 items-center gap-1.5">
                                      <p className="truncate text-sm font-medium text-foreground">
                                        {row.deptName || `部门 ${idx + 1}`}
                                      </p>
                                      <span className="truncate text-xs text-muted-foreground">
                                        {row.headUserName ? `· ${row.headUserName}` : "· 未选择负责人"}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5" title={selectedPages.length > 0 ? formatPageSelection(selectedPages) : "未分配页码"}>
                                    {selectedPages.length > 0 ? (
                                      <span
                                        className="inline-flex max-w-full items-center rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
                                      >
                                        <span className="truncate">{formatPageSelection(selectedPages)}</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center rounded-md border border-primary/30 bg-primary/8 px-2 py-0.5 text-[11px] font-medium text-primary/70">
                                        未分配
                                      </span>
                                    )}
                                  </div>
                                  <p
                                    className="truncate text-xs text-muted-foreground"
                                    title={row.requirement || "未填写说明"}
                                  >
                                    {row.requirement || "未填写说明"}
                                  </p>
                                </div>

                                <div className="flex items-start pl-2">
                                  <button
                                    type="button"
                                    className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setMeetingMaterialDeptRows(prev => prev.filter((_, itemIdx) => itemIdx !== idx));
                                      setPagePickerRowIdx(prev => (
                                        prev === null ? null : prev === idx ? null : prev > idx ? prev - 1 : prev
                                      ));
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full border-dashed border-primary/40 text-primary hover:bg-primary/5"
                          onClick={() => {
                            const nextIndex = meetingMaterialDeptRows.length;
                            setMeetingMaterialDeptRows(prev => [...prev, { deptName: "", pageSelection: "", requirement: "", headUserId: "", headUserName: "", headUserAvatar: "" }]);
                            setPagePickerRowIdx(nextIndex);
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          添加部门
                        </Button>
                      </div>

                      <div className="space-y-3 xl:sticky xl:top-24">
                        {templatePageCount > 0 ? (
                          <div className="rounded-xl border border-border bg-card shadow-sm">
                            <div className="border-b border-border px-4 py-4">
                              <div className="flex items-center justify-between gap-3">
                                <Label>页面</Label>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span>{coveredPages.length}/{templatePageCount}</span>
                                  {uncoveredPages.length > 0 && <span>未分配 {uncoveredPages.length}</span>}
                                  {repeatedPages.length > 0 && <span className="text-emerald-600">共同负责 {repeatedPages.length}</span>}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4 p-4">
                              {activePagePickerRow ? (
                                <>
                                  <div className="grid gap-3 lg:grid-cols-[160px_minmax(0,1fr)_auto]">
                                    <Select value={activePagePickerRow.deptName} onValueChange={(value) => activePagePickerIdx !== null && setMeetingMaterialDeptRows(prev => prev.map((item, itemIdx) => itemIdx === activePagePickerIdx ? { ...item, deptName: value, headUserId: "", headUserName: "", headUserAvatar: "" } : item))}>
                                      <SelectTrigger className="h-9 w-full font-medium">
                                        <SelectValue placeholder="选择部门" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {departments.map(dept => (
                                          <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>

                                    {activePagePickerRow.headUserId ? (
                                      <button
                                        type="button"
                                        className="flex h-9 items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 text-left transition-colors hover:bg-primary/15"
                                        onClick={() => {
                                          if (activePagePickerIdx !== null) {
                                            setDeptHeadPickerIdx(activePagePickerIdx);
                                            setDeptHeadSearch("");
                                          }
                                        }}
                                      >
                                        <Avatar className="h-5 w-5 shrink-0">
                                          <AvatarFallback className="text-xs bg-primary text-white">{activePagePickerRow.headUserAvatar}</AvatarFallback>
                                        </Avatar>
                                        <span className="truncate text-sm font-medium text-primary">{activePagePickerRow.headUserName}</span>
                                      </button>
                                    ) : (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-9 justify-start border-dashed"
                                        onClick={() => {
                                          if (activePagePickerIdx !== null) {
                                            setDeptHeadPickerIdx(activePagePickerIdx);
                                            setDeptHeadSearch("");
                                          }
                                        }}
                                      >
                                        <Plus className="mr-2 h-3.5 w-3.5" />
                                        负责人
                                      </Button>
                                    )}

                                    <div className="flex flex-wrap gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => activePagePickerIdx !== null && setDeptRowPageSelection(
                                          activePagePickerIdx,
                                          formatPageSelection(Array.from({ length: templatePageCount }, (_, index) => index + 1))
                                        )}
                                      >
                                        全选
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={activeUnassignedPages.length === 0}
                                        onClick={() => activePagePickerIdx !== null && setDeptRowPageSelection(
                                          activePagePickerIdx,
                                          togglePageGroupSelection(activePagePickerRow.pageSelection, activeUnassignedPages, templatePageCount)
                                        )}
                                      >
                                        剩余页
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-muted-foreground"
                                        onClick={() => activePagePickerIdx !== null && setDeptRowPageSelection(activePagePickerIdx, "")}
                                      >
                                        清空
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                    <span className="inline-flex items-center gap-1.5">
                                      <span className="h-2.5 w-2.5 rounded-full bg-primary" /> 当前
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> 共同负责
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> 已占用
                                    </span>
                                  </div>

                                  <div className="max-h-[360px] overflow-auto rounded-xl border border-border/60 bg-secondary/10 p-4">
                                    <div className="grid grid-cols-5 gap-2 sm:grid-cols-7 lg:grid-cols-8 2xl:grid-cols-10">
                                      {Array.from({ length: templatePageCount }).map((_, pageIndex) => {
                                        const page = pageIndex + 1;
                                        const isSelected = activePagePickerSelection.includes(page);
                                        const assignedElsewhere = activePagesAssignedElsewhere.has(page);
                                        const isConflict = isSelected && assignedElsewhere;

                                        return (
                                          <button
                                            key={page}
                                            type="button"
                                            className={cn(
                                              "flex h-11 items-center justify-center rounded-lg border text-sm font-semibold transition-all",
                                              isConflict && "border-emerald-500 bg-emerald-500 text-white shadow-sm",
                                              isSelected && !isConflict && "border-primary bg-primary text-primary-foreground shadow-sm",
                                              !isSelected && assignedElsewhere && "border-amber-300 bg-amber-50 text-amber-700",
                                              !isSelected && !assignedElsewhere && "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-primary"
                                            )}
                                            onClick={() => activePagePickerIdx !== null && setDeptRowPageSelection(
                                              activePagePickerIdx,
                                              togglePageSelection(activePagePickerRow.pageSelection, page, templatePageCount)
                                            )}
                                          >
                                            {page}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label>说明</Label>
                                    <Textarea
                                      rows={5}
                                      placeholder="补充该部门要处理的内容说明、数据要求或输出要求..."
                                      value={activePagePickerRow.requirement}
                                      onChange={(e) => activePagePickerIdx !== null && setMeetingMaterialDeptRows(prev => prev.map((item, itemIdx) => itemIdx === activePagePickerIdx ? { ...item, requirement: e.target.value } : item))}
                                    />
                                  </div>

                                  {activeOverlapPages.length > 0 && (
                                    <div className="text-xs text-emerald-700">
                                      当前与其他部门共同负责的页码：{formatPageRange(activeOverlapPages)}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="rounded-lg border border-dashed border-border bg-secondary/10 px-4 py-6 text-sm text-muted-foreground">
                                  先在左侧添加部门，然后选择一个部门开始分配页面。
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-border bg-secondary/10 px-4 py-6 text-sm text-muted-foreground">
                            上传模板后，这里会显示统一的页码分配工作台。
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 负责人选择弹窗 */}
                    <Dialog open={deptHeadPickerIdx !== null} onOpenChange={(open) => !open && setDeptHeadPickerIdx(null)}>
                      <DialogContent className="sm:max-w-[600px] h-[520px] flex flex-col p-6 rounded-2xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            选择部门负责人
                            {deptHeadPickerIdx !== null && meetingMaterialDeptRows[deptHeadPickerIdx]?.deptName && (
                              <Badge variant="secondary" className="ml-2">{meetingMaterialDeptRows[deptHeadPickerIdx].deptName}</Badge>
                            )}
                          </DialogTitle>
                          <DialogDescription>搜索并选择该部门的负责人，负责后续向员工分配任务</DialogDescription>
                        </DialogHeader>
                        <div className="relative mt-3 mb-3">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="搜索姓名、工号或职位..." className="pl-10 h-10 rounded-xl" value={deptHeadSearch} onChange={(e) => setDeptHeadSearch(e.target.value)} />
                        </div>
                        <ScrollArea className="flex-1 -mx-2 px-2">
                          <div className="space-y-4 pb-4">
                            {departments.map(dept => {
                              const selectedDeptName = deptHeadPickerIdx !== null ? meetingMaterialDeptRows[deptHeadPickerIdx]?.deptName : "";
                              const deptMembers = users.filter(u =>
                                (!selectedDeptName || u.department === selectedDeptName) &&
                                (u.name.includes(deptHeadSearch) || u.staffId.includes(deptHeadSearch) || u.role.includes(deptHeadSearch))
                              );
                              if (!deptMembers.some(u => u.department === dept.name)) return null;
                              const show = deptMembers.filter(u => u.department === dept.name);
                              if (show.length === 0) return null;
                              return (
                                <div key={dept.id} className="space-y-2">
                                  <h4 className="text-sm font-bold text-muted-foreground flex items-center gap-1 sticky top-0 bg-background/95 py-1">
                                    <Building2 className="h-4 w-4" />{dept.name}
                                  </h4>
                                  <div className="grid grid-cols-2 gap-2">
                                    {show.map(u => (
                                      <div key={u.id} onClick={() => {
                                        if (deptHeadPickerIdx !== null) {
                                          setMeetingMaterialDeptRows(prev => prev.map((r, i) => i === deptHeadPickerIdx ? { ...r, headUserId: u.id, headUserName: u.name, headUserAvatar: u.avatar } : r));
                                          setDeptHeadPickerIdx(null);
                                        }
                                      }} className="flex items-center gap-3 p-2.5 rounded-xl border border-border/40 bg-muted/10 hover:bg-primary/5 hover:border-primary/30 cursor-pointer transition-all">
                                        <Avatar className="h-9 w-9 shrink-0">
                                          <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">{u.avatar}</AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                          <p className="text-sm font-semibold truncate">{u.name}</p>
                                          <p className="text-xs text-muted-foreground truncate">{u.role} · {u.staffId}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  </div>
                ) : (
                  <>{/* Page Status */}
                    {templatePageCount > 0 && (
                      <div className="rounded-lg border border-border p-4 bg-secondary/30">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium">页面分配状态</span>
                          <span className="text-xs text-muted-foreground">
                            已分配 {getAssignedPages().size} / {templatePageCount} 页
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {Array.from({ length: templatePageCount }).map((_, i) => {
                            const pageNum = i + 1;
                            const isAssigned = getAssignedPages().has(pageNum);
                            return (
                              <div
                                key={pageNum}
                                className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium transition-colors ${isAssigned
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground border border-border"
                                  }`}
                              >
                                {pageNum}
                              </div>
                            );
                          })}
                        </div>
                        {remainingPages.length > 0 && remainingPages.length < templatePageCount && (
                          <p className="text-xs text-warning mt-2 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            未分配页面：{formatPageRange(remainingPages)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Team Member Selection */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>添加执行人</Label>
                        <div className="relative w-64 group">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary" />
                          <Input
                            placeholder="搜索姓名、工号或部门"
                            className="h-8 pl-8 text-xs rounded-lg"
                            value={memberSearch}
                            onChange={(e) => setMemberSearch(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 p-1 border border-border/30 rounded-lg bg-muted/20">
                        {filteredMembers.slice(0, 12).map((member) => {
                          const isSelected = assignments.some(a => a.memberId === member.id);
                          return (
                            <Button
                              key={member.id}
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleMemberSelection(member.id)}
                              className={cn("h-8 px-3 text-xs", isSelected ? "gradient-primary border-primary/20" : "border-border/50 hover:bg-primary/5 hover:text-primary")}
                            >
                              {isSelected ? (
                                <X className="h-3 w-3 mr-1" />
                              ) : (
                                <Plus className="h-3 w-3 mr-1" />
                              )}
                              {member.name}
                              <span className="ml-1 text-xs opacity-70">({member.department})</span>
                            </Button>
                          );
                        })}

                        <Dialog open={isAdvancedSelectOpen} onOpenChange={setIsAdvancedSelectOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 px-3 text-xs border-dashed border-primary/30 text-primary hover:bg-primary/5 hover:text-primary">
                              <Plus className="h-3 w-3 mr-1" />
                              更多人员...
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[700px] h-[600px] flex flex-col p-6 rounded-2xl">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                全量人员选择器
                              </DialogTitle>
                              <DialogDescription>
                                支持跨部门搜索与选择，已选中 {assignments.length} 位执行人。
                              </DialogDescription>
                            </DialogHeader>

                            <div className="relative mt-4 mb-4">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="搜索姓名、工号、部门或职位..."
                                className="pl-10 h-10 rounded-xl"
                                value={memberSearch}
                                onChange={(e) => setMemberSearch(e.target.value)}
                              />
                            </div>

                            <ScrollArea className="flex-1 -mx-2 px-2">
                              <div className="space-y-6 pb-4">
                                {departments.map(dept => {
                                  const deptMembers = users.filter(u => u.department === dept.name && (
                                    u.name.includes(memberSearch) ||
                                    u.department.includes(memberSearch) ||
                                    u.staffId.includes(memberSearch) ||
                                    u.role.includes(memberSearch)
                                  ));

                                  if (deptMembers.length === 0) return null;

                                  return (
                                    <div key={dept.id} className="space-y-3">
                                      <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-sm py-1 z-10 border-b border-border/30">
                                        <h4 className="text-sm font-bold flex items-center gap-2">
                                          <Building2 className="h-4 w-4 text-muted-foreground" />
                                          {dept.name}
                                          <span className="text-xs font-normal text-muted-foreground">({deptMembers.length}人)</span>
                                        </h4>
                                      </div>
                                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {deptMembers.map(member => {
                                          const isSelected = assignments.some(a => a.memberId === member.id);
                                          return (
                                            <div
                                              key={member.id}
                                              onClick={() => toggleMemberSelection(member.id)}
                                              className={cn(
                                                "flex items-center gap-3 p-2 rounded-xl border cursor-pointer transition-all hover:shadow-md",
                                                isSelected
                                                  ? "bg-primary/5 border-primary/30 shadow-sm ring-1 ring-primary/20"
                                                  : "bg-muted/10 border-border/40 hover:bg-muted/30"
                                              )}
                                            >
                                              <Avatar className="h-8 w-8 shrink-0">
                                                <AvatarFallback className={cn("text-xs font-bold", isSelected ? "bg-primary text-white" : "bg-primary/10 text-primary")}>
                                                  {member.avatar}
                                                </AvatarFallback>
                                              </Avatar>
                                              <div className="min-w-0 flex-1">
                                                <p className="text-sm font-bold truncate">{member.name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                                              </div>
                                              {isSelected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </ScrollArea>

                            <DialogFooter className="mt-4 pt-4 border-t border-border/30">
                              <Button onClick={() => setIsAdvancedSelectOpen(false)} className="gradient-primary px-8 rounded-xl shadow-lg shadow-primary/20">
                                确定选择
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        {filteredMembers.length === 0 && (
                          <div className="w-full text-center py-4 text-xs text-muted-foreground">
                            未找到匹配的成员
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Assignment Details */}
                    <div className="space-y-4">
                      <Label>工作包分配</Label>
                      {assignments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                          <p>请先添加执行人</p>
                        </div>
                      ) : (
                        assignments.map((assignment) => {
                          const member = getMemberById(assignment.memberId);
                          if (!member) return null;
                          return (
                            <div
                              key={assignment.memberId}
                              className="flex items-start gap-4 p-4 rounded-lg border border-border bg-secondary/30"
                            >
                              <Avatar className="h-10 w-10 shrink-0">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {member.avatar}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">{member.name}</p>
                                    <p className="text-xs text-muted-foreground">{member.department}</p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => handleRemoveAssignment(member.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>

                                {/* Page Range Selection */}
                                {templatePageCount > 0 && (
                                  <div className="flex items-center gap-2">
                                    <Label className="text-xs shrink-0">负责页面：</Label>
                                    <Input
                                      type="number"
                                      min={1}
                                      max={templatePageCount}
                                      placeholder="起始页"
                                      className="w-20 h-8 text-sm"
                                      value={assignment.startPage || ""}
                                      onChange={(e) => handleUpdateAssignment(member.id, {
                                        startPage: parseInt(e.target.value) || undefined
                                      })}
                                    />
                                    <span className="text-muted-foreground">-</span>
                                    <Input
                                      type="number"
                                      min={1}
                                      max={templatePageCount}
                                      placeholder="结束页"
                                      className="w-20 h-8 text-sm"
                                      value={assignment.endPage || ""}
                                      onChange={(e) => handleUpdateAssignment(member.id, {
                                        endPage: parseInt(e.target.value) || undefined
                                      })}
                                    />
                                    {assignment.startPage && assignment.endPage && (
                                      <Badge variant="outline" className="text-xs">
                                        共 {assignment.endPage - assignment.startPage + 1} 页
                                      </Badge>
                                    )}
                                  </div>
                                )}

                                <Textarea
                                  placeholder="描述该成员需要完成的具体工作内容"
                                  value={assignment.requirement}
                                  onChange={(e) => handleUpdateAssignment(member.id, {
                                    requirement: e.target.value
                                  })}
                                  rows={2}
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>)}
              </CardContent>
            </>
    </>
  );
}
