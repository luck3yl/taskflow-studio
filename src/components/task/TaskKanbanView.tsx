import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Task } from "@/contexts/TaskContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Users, ArrowRight } from "lucide-react";

interface TaskKanbanViewProps {
  tasks: Task[];
}

export function TaskKanbanView({ tasks }: TaskKanbanViewProps) {
  // Simple categorization based on task status or completion
  const columns = [
    {
      id: "todo",
      title: "待处理",
      tasks: tasks.filter(t => t.completedCount === 0),
      color: "bg-muted/50",
    },
    {
      id: "in_progress",
      title: "进行中",
      tasks: tasks.filter(t => t.completedCount > 0 && t.completedCount < t.totalAssignees),
      color: "bg-primary/5",
    },
    {
      id: "completed",
      title: "已完成",
      tasks: tasks.filter(t => t.completedCount === t.totalAssignees && t.totalAssignees > 0),
      color: "bg-success/5",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-320px)] min-h-[500px]">
      {columns.map((column) => (
        <div key={column.id} className={`flex flex-col rounded-xl border border-border/50 ${column.color}`}>
          <div className="p-4 border-b border-border/50 flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              {column.title}
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 h-5">
                {column.tasks.length}
              </Badge>
            </h3>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {column.tasks.map((task) => (
                <Card key={task.id} className="shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing border-border/50">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                        {task.type}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {task.deadline.split(' ')[0]}
                      </span>
                    </div>
                    <CardTitle className="text-sm mt-2 line-clamp-2">{task.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span>{task.completedCount}/{task.totalAssignees}</span>
                      </div>
                      <div className="flex -space-x-1.5">
                        {task.assignees.slice(0, 3).map((a) => (
                          <div 
                            key={a.id} 
                            className="h-6 w-6 rounded-full bg-primary/10 border-2 border-card flex items-center justify-center text-[10px] font-medium text-primary"
                          >
                            {a.avatar}
                          </div>
                        ))}
                        {task.assignees.length > 3 && (
                          <div className="h-6 w-6 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[8px] text-muted-foreground">
                            +{task.assignees.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-500" 
                        style={{ width: `${(task.completedCount / task.totalAssignees) * 100}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
              {column.tasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-2">
                    <ArrowRight className="h-5 w-5 rotate-45" />
                  </div>
                  <p className="text-xs">暂无任务</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      ))}
    </div>
  );
}
