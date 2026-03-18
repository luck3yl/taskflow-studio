import React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Task } from "@/contexts/TaskContext";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, parseISO, isSameDay } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, Users } from "lucide-react";

interface TaskCalendarViewProps {
  tasks: Task[];
}

export function TaskCalendarView({ tasks }: TaskCalendarViewProps) {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  // Function to get tasks for a specific day
  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => {
      try {
        const taskDate = parseISO(task.deadline);
        return isSameDay(taskDate, day);
      } catch (e) {
        return false;
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-320px)] min-h-[500px]">
      <Card className="lg:col-span-1 border-border/50 shadow-sm overflow-hidden flex flex-col">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            选择日期
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 flex justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border border-border/50"
            locale={zhCN}
            modifiers={{
              hasTask: (date) => getTasksForDay(date).length > 0,
            }}
            modifiersClassNames={{
              hasTask: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-primary font-bold",
            }}
          />
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 border-border/50 shadow-sm overflow-hidden flex flex-col">
        <CardHeader className="p-4 border-b border-border/50 bg-secondary/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              {date ? format(date, "yyyy年MM月dd日", { locale: zhCN }) : "未选择日期"}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                任务列表
              </span>
            </CardTitle>
            {date && (
              <Badge variant="secondary" className="h-5 px-1.5 py-0 text-xs">
                {getTasksForDay(date).length} 个任务
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-y-auto">
          {date && getTasksForDay(date).length > 0 ? (
            <div className="divide-y divide-border/50">
              {getTasksForDay(date).map((task) => (
                <div key={task.id} className="p-4 hover:bg-secondary/10 transition-colors group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] h-4">
                          {task.type}
                        </Badge>
                        <h4 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                          {task.title}
                        </h4>
                      </div>
                      <div className="flex items-center flex-wrap gap-4 mt-2">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          截止时间：{task.deadline.split(' ')[1] || "18:00"}
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Users className="h-3 w-3 mr-1" />
                          进度：{task.completedCount}/{task.totalAssignees}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center opacity-40">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <CalendarIcon className="h-6 w-6" />
              </div>
              <p className="text-sm">该日期下暂无截止任务</p>
              <p className="text-xs mt-1">请选择有任务标记（小圆点）的日期</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
