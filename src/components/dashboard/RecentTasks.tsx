import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

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
  pending: "bg-warning/10 text-warning border-warning/20",
  in_progress: "bg-info/10 text-info border-info/20",
  submitted: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

export function RecentTasks() {
  const navigate = useNavigate();

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">最新代办</CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-primary hover:text-primary"
          onClick={() => navigate("/todos")}
        >
          查看全部
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.map((task, index) => (
            <div 
              key={task.id}
              className="flex items-center gap-4 rounded-lg border border-border bg-card p-3 transition-all duration-200 hover:shadow-md hover:border-primary/30 cursor-pointer animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => navigate("/todos")}
            >
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {task.assignee}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground truncate">{task.title}</p>
                  {task.urgent && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                      紧急
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{task.deadline}</span>
                </div>
              </div>
              
              <Badge className={statusStyles[task.status as keyof typeof statusStyles]}>
                {task.statusText}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
