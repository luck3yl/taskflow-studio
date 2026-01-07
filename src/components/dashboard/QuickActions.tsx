import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Upload, FileText, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const actions = [
  {
    title: "发起任务",
    description: "创建新的协作任务",
    icon: Plus,
    href: "/tasks/create",
    gradient: "gradient-primary",
  },
  {
    title: "上传模板",
    description: "添加PPT模板文件",
    icon: Upload,
    href: "/documents",
    gradient: "gradient-accent",
  },
  {
    title: "文档中心",
    description: "浏览团队文档",
    icon: FileText,
    href: "/documents",
    gradient: "gradient-success",
  },
  {
    title: "团队管理",
    description: "查看团队成员",
    icon: Users,
    href: "/tasks",
    gradient: "bg-chart-5",
  },
];

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">快捷操作</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <button
              key={action.title}
              onClick={() => navigate(action.href)}
              className="group flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 animate-slide-up text-left"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.gradient}`}>
                <action.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground group-hover:text-primary transition-colors">
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
