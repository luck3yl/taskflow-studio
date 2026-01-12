import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Upload, FileText, Users, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const actions = [
  {
    title: "发起任务",
    description: "创建新的协作任务",
    icon: Plus,
    href: "/tasks/create",
    gradient: "from-primary to-blue-600",
    bgLight: "bg-primary/5",
  },
  {
    title: "上传模板",
    description: "添加PPT模板文件",
    icon: Upload,
    href: "/documents",
    gradient: "from-accent to-orange-500",
    bgLight: "bg-accent/5",
  },
  {
    title: "文档中心",
    description: "浏览团队文档",
    icon: FileText,
    href: "/documents",
    gradient: "from-success to-emerald-500",
    bgLight: "bg-success/5",
  },
  {
    title: "团队管理",
    description: "查看团队成员",
    icon: Users,
    href: "/tasks",
    gradient: "from-violet-500 to-purple-600",
    bgLight: "bg-violet-500/5",
  },
];

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <Card className="bg-white dark:bg-card border-border/50 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">快捷操作</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <button
              key={action.title}
              onClick={() => navigate(action.href)}
              className="group relative flex flex-col items-start gap-3 rounded-xl border border-border/50 bg-white dark:bg-card p-4 transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1 text-left overflow-hidden animate-slide-up"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              {/* Hover background effect */}
              <div className={`absolute inset-0 ${action.bgLight} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              
              <div className="relative flex items-center justify-between w-full">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${action.gradient} shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </div>
              
              <div className="relative">
                <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {action.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {action.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
