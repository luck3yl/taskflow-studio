import { useUserContext } from "@/contexts/UserContext";
import { useTaskContext } from "@/contexts/TaskContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { TaskProgressChart } from "@/components/dashboard/TaskProgressChart";
import { UrgentTaskReminder } from "@/components/dashboard/UrgentTaskReminder";
import { MessageCenter } from "@/components/dashboard/MessageCenter";
import { ClipboardList, Clock, CheckCircle2, AlertCircle } from "lucide-react";

const Index = () => {
  const { currentUser } = useUserContext();
  const { tasks: allTasks } = useTaskContext();
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "早上好" : currentHour < 18 ? "下午好" : "晚上好";

  // Calculate real stats
  const pendingTasks = allTasks.filter(t => t.assignees.some(a => a.memberId === currentUser.id && a.status === "pending")).length;
  const inProgressTasks = allTasks.filter(t => t.assignees.some(a => a.memberId === currentUser.id && a.status === "submitted")).length;
  const completedTasks = allTasks.filter(t => t.assignees.every(a => a.status === "approved")).length;
  const rejectedTasks = allTasks.filter(t => t.assignees.some(a => a.memberId === currentUser.id && a.status === "rejected")).length;


  return (
    <AppLayout title="工作台">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold text-foreground">
              {greeting}，{currentUser.name}
            </h2>
            <span className="text-2xl">👋</span>
          </div>
          <p className="text-muted-foreground">
            今天是 {new Date().toLocaleDateString("zh-CN", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "long"
            })}，祝您工作顺利！
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="我的待办"
            value={pendingTasks}
            description="需要您处理的任务"
            icon={ClipboardList}
            variant="primary"
          />
          <StatCard
            title="已提交审核"
            value={inProgressTasks}
            description="待领导复核的任务"
            icon={Clock}
            variant="warning"
          />
          <StatCard
            title="项目已完成"
            value={completedTasks}
            description="所有成员通过的任务"
            icon={CheckCircle2}
            trend={{ value: 12, isPositive: true }}
            variant="success"
          />
          <StatCard
            title="需要重做"
            value={rejectedTasks}
            description="被领导驳回的任务"
            icon={AlertCircle}
            variant="destructive"
          />
        </div>

        {/* Main Content Grid - Equal Height */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Chart */}
          <div className="lg:col-span-2">
            <TaskProgressChart />
          </div>

          {/* Right Column - Activity Center */}
          <div>
            <UrgentTaskReminder />
          </div>
        </div>

        {/* Recent Tasks */}
        <MessageCenter />
      </div>
    </AppLayout>
  );
};

export default Index;
