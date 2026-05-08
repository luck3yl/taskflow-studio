const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '../TaskCreate.tsx'), 'utf-8');
const lines = content.split('\n');

const step1 = lines.slice(154, 222).join('\n'); // without <> and </>
const step2 = lines.slice(226, 842).join('\n');
const step3 = lines.slice(846, 1033).join('\n');
const step4 = lines.slice(1037, 1184).join('\n');

const createComponent = (name, inner) => `import { useTaskCreateContext } from './TaskCreateContext';
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

export function ${name}() {
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
        result += start === end ? \`\${start}, \` : \`\${start}-\${end}, \`;
        start = sorted[i];
        end = sorted[i];
      }
    }
    result += start === end ? \`\${start}\` : \`\${start}-\${end}\`;
    return result;
  };

  return (
    <>
${inner}
    </>
  );
}
`;

fs.writeFileSync(path.join(__dirname, 'Step1BasicDef.tsx'), createComponent('Step1BasicDef', step1));
fs.writeFileSync(path.join(__dirname, 'Step2TaskBreakdown.tsx'), createComponent('Step2TaskBreakdown', step2));
fs.writeFileSync(path.join(__dirname, 'Step3TimeConfig.tsx'), createComponent('Step3TimeConfig', step3));
fs.writeFileSync(path.join(__dirname, 'Step4PreviewPublish.tsx'), createComponent('Step4PreviewPublish', step4));
console.log('Files generated!');
