import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const urgentTasks = [
  {
    id: 1,
    title: "2024 年度总结提交",
    deadline: "今日 18:00",
    priority: "high",
    status: "pending",
  },
  {
    id: 2,
    title: "市场调研报告二次审核",
    deadline: "明日 10:00",
    priority: "medium",
    status: "pending",
  },
  {
    id: 3,
    title: "协作项目 v2.0 终审",
    deadline: "2024-03-22",
    priority: "low",
    status: "pending",
  }
];

export function UrgentTaskReminder() {
  return (
    <Card className="bg-white dark:bg-card border-border/50 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col h-full overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-600 shadow-lg shadow-red-500/20">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">紧急事务提醒</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">主动推送即将超期或需处理的任务</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-xs font-bold text-primary hover:bg-primary/5 rounded-lg h-8">
            全部处理
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col pt-0 pb-6">
        <div className="flex-1 space-y-3 overflow-y-auto pr-1 -mr-1">
          {urgentTasks.map((task, index) => (
            <div 
              key={task.id} 
              className="group flex flex-col gap-2 p-3 rounded-xl border border-border/50 bg-card hover:border-red-200 hover:bg-red-50/30 transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm",
                  task.priority === "high" ? "bg-red-50 border-red-100 text-red-500" :
                  task.priority === "medium" ? "bg-orange-50 border-orange-100 text-orange-500" : "bg-blue-50 border-blue-100 text-blue-500"
                )}>
                  <Clock className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-bold text-foreground group-hover:text-red-600 transition-colors line-clamp-1 flex-1">{task.title}</h4>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md text-muted-foreground group-hover:text-red-500 transition-all shrink-0">
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex items-center justify-between pl-11">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0",
                    task.priority === "high" ? "bg-red-100 text-red-600" :
                    task.priority === "medium" ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"
                  )}>
                    {task.priority === "high" ? "紧急" : task.priority === "medium" ? "重要" : "普通"}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium truncate">截止: {task.deadline}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
