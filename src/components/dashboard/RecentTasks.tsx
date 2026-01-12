import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const tasks = [
  {
    id: "1",
    title: "Q4季度汇报PPT制作",
    assignee: "李",
    assigneeName: "李华",
    status: "pending",
    statusText: "待处理",
    deadline: "今天 18:00",
    urgent: true,
  },
  {
    id: "2",
    title: "产品功能演示文档",
    assignee: "王",
    assigneeName: "王芳",
    status: "in_progress",
    statusText: "进行中",
    deadline: "明天 12:00",
    urgent: false,
  },
  {
    id: "3",
    title: "年度总结报告",
    assignee: "赵",
    assigneeName: "赵强",
    status: "rejected",
    statusText: "已驳回",
    deadline: "后天 17:00",
    urgent: false,
  },
  {
    id: "4",
    title: "客户案例分析PPT",
    assignee: "陈",
    assigneeName: "陈静",
    status: "submitted",
    statusText: "已提交",
    deadline: "本周五",
    urgent: false,
  },
];

const statusStyles = {
  pending: "bg-warning/10 text-warning border-warning/30",
  in_progress: "bg-info/10 text-info border-info/30",
  submitted: "bg-success/10 text-success border-success/30",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
};

const avatarColors = [
  "from-primary to-blue-600",
  "from-violet-500 to-purple-600",
  "from-success to-emerald-500",
  "from-accent to-orange-500",
];

export function RecentTasks() {
  const navigate = useNavigate();

  return (
    <Card className="bg-white dark:bg-card border-border/50 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold">最新待办</CardTitle>
          <p className="text-sm text-muted-foreground">需要您处理的任务</p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-primary hover:text-primary hover:bg-primary/10 rounded-lg gap-1"
          onClick={() => navigate("/todos")}
        >
          查看全部
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.map((task, index) => (
            <div 
              key={task.id}
              className="group flex items-center gap-4 rounded-xl border border-border/50 bg-white dark:bg-card/50 p-4 transition-all duration-300 hover:shadow-md hover:border-primary/30 hover:bg-primary/[0.02] cursor-pointer animate-slide-up"
              style={{ animationDelay: `${index * 60}ms` }}
              onClick={() => navigate("/todos")}
            >
              <Avatar className={cn(
                "h-11 w-11 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-card transition-transform group-hover:scale-105",
                task.urgent ? "ring-destructive/50" : "ring-primary/20"
              )}>
                <AvatarFallback className={`bg-gradient-to-br ${avatarColors[index % avatarColors.length]} text-white font-semibold`}>
                  {task.assignee}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors">{task.title}</p>
                  {task.urgent && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0 gap-0.5 animate-pulse-soft">
                      <AlertCircle className="h-2.5 w-2.5" />
                      紧急
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{task.deadline}</span>
                  <span className="text-muted-foreground/40">•</span>
                  <span className="text-sm text-muted-foreground">{task.assigneeName}</span>
                </div>
              </div>
              
              <Badge className={cn(
                "rounded-lg font-medium",
                statusStyles[task.status as keyof typeof statusStyles]
              )}>
                {task.statusText}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
