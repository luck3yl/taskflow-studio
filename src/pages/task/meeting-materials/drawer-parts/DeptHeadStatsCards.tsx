import { CheckCircle2, Clock, XCircle } from "lucide-react";

interface DeptHeadStatsCardsProps {
  submittedCount: number;
  completedCount: number;
  rejectedCount: number;
}

/** 部门负责人视角的三个统计卡片：待审核 / 已通过 / 已驳回 */
export function DeptHeadStatsCards({
  submittedCount,
  completedCount,
  rejectedCount,
}: DeptHeadStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard
        label="待审核"
        value={submittedCount}
        icon={<Clock className="h-6 w-6 text-amber-600" />}
        iconBgClass="bg-amber-50 group-hover:bg-amber-100 border-amber-100/50"
      />
      <StatCard
        label="已审核通过"
        value={completedCount}
        icon={<CheckCircle2 className="h-6 w-6 text-green-600" />}
        iconBgClass="bg-green-50 group-hover:bg-green-100 border-green-100/50"
      />
      <StatCard
        label="已驳回"
        value={rejectedCount}
        icon={<XCircle className="h-6 w-6 text-red-600" />}
        iconBgClass="bg-red-50 group-hover:bg-red-100 border-red-100/50"
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  iconBgClass,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconBgClass: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm transition-all hover:shadow-md flex items-center justify-between group">
      <div className="space-y-1">
        <p className="text-[13px] font-medium text-muted-foreground flex items-center gap-2">{label}</p>
        <p className="text-3xl font-black tracking-tight text-foreground">{value}</p>
      </div>
      <div className={`h-12 w-12 rounded-xl transition-colors flex items-center justify-center border ${iconBgClass}`}>
        {icon}
      </div>
    </div>
  );
}
