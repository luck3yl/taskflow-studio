import { CheckCircle2, FileText, GitMerge, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface OverviewCardsProps {
  totalPages: number;
  deptCount: number;
  reviewedCount: number;
  totalCount: number;
  conflictCount: number;
}

/** 协调者视图的 4 个概览卡片：总页数 / 参与部门 / 审核通过 / 冲突页面 */
export function OverviewCards({
  totalPages,
  deptCount,
  reviewedCount,
  totalCount,
  conflictCount,
}: OverviewCardsProps) {
  const progress = totalCount > 0 ? (reviewedCount / totalCount) * 100 : 0;
  const hasConflict = conflictCount > 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <SimpleCard
        value={totalPages}
        label="总页数"
        icon={<FileText className="h-5 w-5 text-blue-600" />}
        iconClass="bg-blue-50 group-hover:bg-blue-100 border-blue-100/50"
      />
      <SimpleCard
        value={deptCount}
        label="参与部门"
        icon={<Users className="h-5 w-5 text-indigo-600" />}
        iconClass="bg-indigo-50 group-hover:bg-indigo-100 border-indigo-100/50"
      />
      <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-center group overflow-hidden relative">
        <div className="flex items-center justify-between z-10 relative mb-3">
          <div className="space-y-1">
            <p className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">{reviewedCount}</p>
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 whitespace-nowrap">
              审核通过
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 transition-colors shrink-0 flex items-center justify-center border border-emerald-100/50">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
        </div>
        <div className="w-full relative z-10">
          <div className="flex justify-between items-center text-[10px] font-semibold text-emerald-600/80 mb-1.5">
            <span>进度 {Math.round(progress)}%</span>
            <span>{reviewedCount} / {totalCount}</span>
          </div>
          <Progress value={progress} className="h-1.5 bg-emerald-100/50 w-full [&>div]:bg-emerald-500" />
        </div>
      </div>
      <div
        className={cn(
          "rounded-2xl border p-4 sm:p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-center group overflow-hidden relative",
          hasConflict ? "border-red-200/60 bg-red-50/50" : "border-border/60 bg-card"
        )}
      >
        <div className="flex items-center justify-between z-10 relative">
          <div className="space-y-1.5">
            <p
              className={cn(
                "text-2xl sm:text-3xl font-black tracking-tight",
                hasConflict ? "text-red-600" : "text-foreground"
              )}
            >
              {conflictCount}
            </p>
            <p
              className={cn(
                "text-xs font-medium flex items-center gap-1.5 whitespace-nowrap",
                hasConflict ? "text-red-600/80" : "text-muted-foreground"
              )}
            >
              冲突页面
            </p>
          </div>
          <div
            className={cn(
              "h-10 w-10 rounded-xl transition-colors shrink-0 flex items-center justify-center border",
              hasConflict
                ? "bg-red-100/80 border-red-200 group-hover:bg-red-200"
                : "bg-amber-50/80 border-amber-100 group-hover:bg-amber-100/80"
            )}
          >
            <GitMerge className={cn("h-5 w-5", hasConflict ? "text-red-600" : "text-amber-500")} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SimpleCard({
  value,
  label,
  icon,
  iconClass,
}: {
  value: number;
  label: string;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-center group overflow-hidden relative">
      <div className="flex items-center justify-between z-10 relative">
        <div className="space-y-1.5">
          <p className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">{value}</p>
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">{label}</p>
        </div>
        <div
          className={`h-10 w-10 rounded-xl transition-colors shrink-0 flex items-center justify-center border ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
