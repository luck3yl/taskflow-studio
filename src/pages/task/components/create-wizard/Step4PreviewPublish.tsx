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

export function Step4PreviewPublish() {
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
                <CardTitle>预览并发布</CardTitle>
                <CardDescription>确认任务信息无误后点击下发</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">任务名称</span>
                    <span className="font-medium">{taskTitle || "未设置"}</span>
                  </div>
                  <div className="flex flex-col gap-2 py-2 border-b border-border">
                    <span className="text-muted-foreground transition-all">任务描述</span>
                    <div className="text-sm bg-muted/30 p-2 rounded max-h-24 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                      {taskDescription || "无任务描述"}
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">模板文件</span>
                    <div className="text-right">
                      <span>{templateFile?.name || "未上传"}</span>
                      {templatePageCount > 0 && (
                        <span className="ml-2 text-primary text-sm">({templatePageCount}页)</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">截止时间</span>
                    <span>
                      {deadlineDate
                        ? `${format(deadlineDate, "yyyy年MM月dd日", { locale: zhCN })} ${deadlineTime}`
                        : "未设置"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">审核人</span>
                    <span>
                      {taskType === "例会资料"
                        ? (users.find(u => u.id === meetingMaterialReviewerId)?.name || <span className="text-muted-foreground text-sm">未设置</span>)
                        : (reviewerOptions.find(r => r.id === reviewer)?.name || "")}
                      {taskType !== "例会资料" && (
                        <span className="text-muted-foreground ml-1">
                          ({reviewerOptions.find(r => r.id === reviewer)?.title || ""})
                        </span>
                      )}
                    </span>
                  </div>
                  {taskType === "例会资料" && (
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">审批人</span>
                      <span>{users.find(u => u.id === meetingMaterialApproverId)?.name || <span className="text-muted-foreground text-sm">未设置</span>}</span>
                    </div>
                  )}
                </div>

                {/* Assignment List */}
                <div className="space-y-3">
                  <Label>分配清单</Label>
                  {taskType === "例会资料" ? (
                    <div className="rounded-lg border border-border overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left px-4 py-2 text-sm font-medium w-1/4">部门 & 负责人</th>
                            <th className="text-left px-4 py-2 text-sm font-medium w-1/4">负责页面</th>
                            <th className="text-left px-4 py-2 text-sm font-medium w-1/2">页面要求</th>
                          </tr>
                        </thead>
                        <tbody>
                          {meetingMaterialDeptRows.filter(r => r.deptName && parsePageInput(r.pageSelection, templatePageCount).length > 0).map((row, i) => (
                            <tr key={i} className="border-t border-border">
                              <td className="px-4 py-3">
                                <div className="font-medium mb-1">{row.deptName}</div>
                                {row.headUserName ? (
                                  <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Avatar className="h-5 w-5"><AvatarFallback className="text-xs bg-primary/10 text-primary">{row.headUserAvatar}</AvatarFallback></Avatar>
                                    <span className="text-xs">{row.headUserName}</span>
                                  </div>
                                ) : <span className="text-xs text-muted-foreground/70">未指派负责人</span>}
                              </td>
                              <td className="px-4 py-3 align-top">
                                <div className="flex-col flex gap-1 items-start">
                                  <Badge variant="outline">第 {row.pageSelection} 页</Badge>
                                  <span className="text-xs text-muted-foreground ml-1">共 {parsePageInput(row.pageSelection, templatePageCount).length} 页</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 align-top text-sm">
                                <div className="text-muted-foreground text-xs leading-relaxed max-w-sm">
                                  {row.requirement || <span className="italic opacity-50">无具体要求</span>}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-border overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left px-4 py-2 text-sm font-medium">执行人</th>
                            <th className="text-left px-4 py-2 text-sm font-medium">负责页面</th>
                            <th className="text-left px-4 py-2 text-sm font-medium">工作要求</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assignments.map((assignment) => {
                            const member = getMemberById(assignment.memberId);
                            return (
                              <tr key={assignment.memberId} className="border-t border-border">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                        {member?.avatar}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <span className="font-medium">{member?.name}</span>
                                      <p className="text-xs text-muted-foreground">{member?.department}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  {assignment.startPage && assignment.endPage ? (
                                    <Badge variant="outline">
                                      第 {assignment.startPage}-{assignment.endPage} 页
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                  {assignment.requirement || "未填写具体要求"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </CardContent>
            </>
    </>
  );
}
