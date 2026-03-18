import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Task, Assignee } from "@/contexts/TaskContext";
import { 
  Download, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle 
} from "lucide-react";
import { toast } from "sonner";

interface TaskProgressListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: Task[];
}

const statusConfig = {
  pending: { label: "待提交", icon: Clock, color: "text-muted-foreground", badge: "secondary" },
  submitted: { label: "待审核", icon: AlertCircle, color: "text-warning", badge: "warning" },
  approved: { label: "已通过", icon: CheckCircle2, color: "text-success", badge: "success" },
  rejected: { label: "已驳回", icon: XCircle, color: "text-destructive", badge: "destructive" },
};

export function TaskProgressList({ open, onOpenChange, tasks }: TaskProgressListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Flatten all assignees across all tasks
  const allSubTasks = tasks.flatMap(task => 
    task.assignees.map(assignee => ({
      ...assignee,
      parentTaskTitle: task.title,
      parentTaskId: task.id,
      deadline: task.deadline,
    }))
  );

  const filteredSubTasks = allSubTasks.filter(st => 
    st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    st.parentTaskTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    st.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    toast.success("正在生成进度清单报告...", {
      description: "Excel文件已准备好，正在下载...",
    });
    // Simulated export
    setTimeout(() => {
      console.log("Exporting subtasks:", filteredSubTasks);
    }, 1000);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-4xl p-0 overflow-hidden flex flex-col">
        <SheetHeader className="p-6 border-b border-border/50 bg-secondary/10">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
              任务进度清单
            </SheetTitle>
            <Button variant="outline" size="sm" onClick={handleExport} className="h-9">
              <Download className="h-4 w-4 mr-2" />
              导出报表
            </Button>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索负责人、任务名称或部门..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
            <Button variant="ghost" size="icon" className="h-10 w-10 border border-border/50">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="w-[200px]">主任务名称</TableHead>
                <TableHead>子任务负责人</TableHead>
                <TableHead>负责内容 / 页码</TableHead>
                <TableHead>部门</TableHead>
                <TableHead>当前状态</TableHead>
                <TableHead className="text-right">截止时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubTasks.map((st) => {
                const config = statusConfig[st.status as keyof typeof statusConfig];
                const StatusIcon = config.icon;
                
                return (
                  <TableRow key={`${st.parentTaskId}-${st.id}`} className="hover:bg-secondary/5 transition-colors">
                    <TableCell className="font-medium text-xs line-clamp-2 max-w-[200px]">
                      {st.parentTaskTitle}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-sm bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                          {st.avatar}
                        </div>
                        <span className="text-sm">{st.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs text-muted-foreground line-clamp-1">{st.taskDescription}</p>
                      {st.pageRange && (
                        <Badge variant="outline" className="mt-1 text-[10px] h-4 py-0">第 {st.pageRange} 页</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] font-normal">{st.department}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <StatusIcon className={`h-3.5 w-3.5 ${config.color}`} />
                        <span className={`text-xs font-medium ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground font-mono">
                      {st.deadline.split(' ')[0]}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredSubTasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                    未找到匹配的任务记录
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </SheetContent>
    </Sheet>
  );
}
