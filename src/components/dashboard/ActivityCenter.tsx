import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users2, CheckCircle2, FileUp, MessageSquare, Plus, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const dynamics = [
  {
    user: "张三",
    avatar: "张",
    action: "更新了",
    target: "2024 年度总结 PPT",
    timestamp: "10 分钟前",
    icon: FileUp,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    user: "李四",
    avatar: "李",
    action: "审核通过",
    target: "市场调研报告",
    timestamp: "45 分钟前",
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
  {
    user: "王五",
    avatar: "王",
    action: "发表评论",
    target: "协作模板 v2.0",
    timestamp: "2 小时前",
    icon: MessageSquare,
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    user: "周六",
    avatar: "周",
    action: "创建了任务",
    target: "季度财务报表制作",
    timestamp: "3 小时前",
    icon: Plus,
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
  {
    user: "赵六",
    avatar: "赵",
    action: "上传模板",
    target: "商务汇报套系",
    timestamp: "昨日 16:45",
    icon: FileUp,
    color: "text-indigo-500",
    bg: "bg-indigo-50",
  },
];

export function ActivityCenter() {
  return (
    <Card className="bg-white dark:bg-card border-border/50 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
              <Users2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">协作动态</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">实时关注团队进展</p>
            </div>
          </div>
          <div className="relative">
            <Bell className="h-5 w-5 text-muted-foreground/30" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col pt-0 pb-6 overflow-hidden">
        <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-4">
          {dynamics.slice(0, 3).map((item, index) => (
            <div 
              key={index} 
              className="group flex items-start gap-3 p-3 rounded-xl border border-transparent hover:border-border/50 hover:bg-muted/30 transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border border-border/20 shadow-sm", item.bg)}>
                <item.icon className={cn("h-5 w-5", item.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-bold text-foreground">{item.user}</span>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{item.timestamp}</span>
                </div>
                <p className="text-sm leading-snug">
                  <span className="text-muted-foreground mr-1">{item.action}</span>
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors cursor-pointer decoration-primary/30 decoration-1 underline-offset-4 hover:underline">{item.target}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-border/50">
          <button className="w-full py-2.5 text-xs font-bold text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all flex items-center justify-center gap-1.5 group border border-dashed border-border/50 hover:border-primary/30">
            查看完整部门动态
            <Users2 className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
