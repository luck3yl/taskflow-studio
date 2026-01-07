import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { TaskProgressChart } from "@/components/dashboard/TaskProgressChart";
import { RecentTasks } from "@/components/dashboard/RecentTasks";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ClipboardList, Clock, CheckCircle2, AlertCircle } from "lucide-react";

const Index = () => {
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "早上好" : currentHour < 18 ? "下午好" : "晚上好";

  return (
    <AppLayout title="工作台">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="animate-fade-in">
          <h2 className="text-2xl font-bold text-foreground">
            {greeting}，张明 👋
          </h2>
          <p className="text-muted-foreground mt-1">
            今天是 {new Date().toLocaleDateString("zh-CN", { 
              year: "numeric", 
              month: "long", 
              day: "numeric",
              weekday: "long"
            })}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="待处理任务"
            value={8}
            description="需要您处理的任务"
            icon={ClipboardList}
            variant="primary"
          />
          <StatCard
            title="进行中"
            value={12}
            description="正在执行的任务"
            icon={Clock}
            variant="warning"
          />
          <StatCard
            title="已完成"
            value={45}
            description="本月完成任务"
            icon={CheckCircle2}
            trend={{ value: 12, isPositive: true }}
            variant="success"
          />
          <StatCard
            title="已驳回"
            value={3}
            description="需要修改的任务"
            icon={AlertCircle}
            variant="destructive"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Chart */}
          <div className="lg:col-span-2">
            <TaskProgressChart />
          </div>
          
          {/* Right Column - Quick Actions */}
          <div>
            <QuickActions />
          </div>
        </div>

        {/* Recent Tasks */}
        <RecentTasks />
      </div>
    </AppLayout>
  );
};

export default Index;
