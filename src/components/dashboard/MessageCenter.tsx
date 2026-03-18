import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Mail, Info, CheckCircle2, MoreHorizontal, Inbox, Star, Archive, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const messages = [
  {
    id: 1,
    title: "系统公告：关于 2024 年度总结的通知",
    content: "请各位同事在 3 月 20 日前完成年度总结提交。",
    type: "system",
    time: "10 分钟前",
    status: "unread",
    sender: "行政部"
  },
  {
    id: 2,
    title: "流程通知：市场调研报告已通过审核",
    content: "您的市场调研报告已被李四审核通过。",
    type: "process",
    time: "45 分钟前",
    status: "read",
    sender: "流程引擎"
  },
  {
    id: 3,
    title: "有人提到了你：关于“协作模板 v2.0”",
    content: "王五在评论中提到了你：“这个模板还需要再调整一下。”",
    type: "mention",
    time: "2 小时前",
    status: "unread",
    sender: "王五"
  },
  {
    id: 4,
    title: "评论回复：季度财务报表制作",
    content: "周六回复了你在“季度财务报表制作”任务下的评论。",
    type: "comment",
    time: "5 小时前",
    status: "read",
    sender: "周六"
  }
];

export function MessageCenter() {
  return (
    <Card className="bg-white dark:bg-card border-border/50 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
              <Inbox className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">消息中心</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">接收系统公告、流程通知等所有消息</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-muted-foreground/50 hover:text-foreground rounded-xl">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col pt-0 pb-6">
        <Tabs defaultValue="all" className="flex-1 flex flex-col">
          <TabsList className="bg-muted/50 p-1 rounded-xl mb-4 w-fit h-auto">
            <TabsTrigger value="all" className="px-4 py-1.5 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">全部</TabsTrigger>
            <TabsTrigger value="system" className="px-4 py-1.5 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">系统公告</TabsTrigger>
            <TabsTrigger value="process" className="px-4 py-1.5 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">流程通知</TabsTrigger>
            <TabsTrigger value="mention" className="px-4 py-1.5 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">提到我的</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 m-0 outline-none">
            {messages.map((item, index) => (
              <div 
                key={item.id} 
                className={cn(
                  "group flex items-start gap-3 p-4 rounded-xl border transition-all duration-300 animate-slide-up",
                  item.status === "unread" ? "bg-primary/5 border-primary/20" : "bg-card border-border/50 hover:border-primary/30"
                )}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm",
                  item.type === "system" ? "bg-blue-50 border-blue-100 text-blue-500" :
                  item.type === "process" ? "bg-emerald-50 border-emerald-100 text-emerald-500" :
                  item.type === "mention" ? "bg-amber-50 border-amber-100 text-amber-500" : "bg-purple-50 border-purple-100 text-purple-500"
                )}>
                  {item.type === "system" ? <Bell className="h-5 w-5" /> :
                   item.type === "process" ? <CheckCircle2 className="h-5 w-5" /> :
                   item.type === "mention" ? <Mail className="h-5 w-5" /> : <Info className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-bold text-foreground line-clamp-1">{item.title}</span>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider shrink-0">{item.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-snug line-clamp-2 mb-2">
                    {item.content}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">{item.sender}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-50">
                        <Star className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>
          {/* Filters for other tabs would be implemented similarly */}
        </Tabs>
        
        <div className="mt-4 pt-4 border-t border-border/50 flex gap-3">
          <Button variant="outline" className="flex-1 py-2.5 text-xs font-bold text-muted-foreground rounded-xl transition-all flex items-center justify-center gap-1.5 group border-dashed border-border/50 hover:border-primary/30 hover:text-primary hover:bg-primary/5">
            <Archive className="h-3.5 w-3.5" />
            查看已归档消息
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
