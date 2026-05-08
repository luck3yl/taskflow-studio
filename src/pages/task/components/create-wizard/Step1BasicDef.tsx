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

export function Step1BasicDef() {
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
                <CardTitle>基础定义</CardTitle>
                <CardDescription>填写任务名称及描述并上传模板</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>任务名称 *</Label>
                  <Input
                    placeholder="输入任务名称"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>任务描述 *</Label>
                  <Textarea
                    placeholder="输入任务背景、目的及相关说明"
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>模板文件</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      id="template-upload"
                      className="hidden"
                      accept=".ppt,.pptx,.pdf,.doc,.docx"
                      onChange={handleFileUpload}
                    />
                    <label htmlFor="template-upload" className="cursor-pointer">
                      {templateFile ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center gap-2">
                            <FileSpreadsheet className="h-10 w-10 text-primary" />
                            <div className="text-left">
                              <p className="font-medium text-foreground">{templateFile.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(templateFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          {templatePageCount > 0 && (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                              <FileText className="h-4 w-4" />
                              共 {templatePageCount} 页
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">点击上传模板文件</p>
                          {/* <p className="text-xs text-muted-foreground mt-1">
                            支持 .ppt, .pptx, .pdf, .doc, .docx 格式
                          </p> */}
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </CardContent>
            </>
    </>
  );
}
