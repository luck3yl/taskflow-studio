import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "success" | "warning" | "destructive";
}

const variantStyles = {
  default: {
    card: "bg-white dark:bg-card border-border/50",
    iconBg: "from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800",
    iconColor: "text-slate-600 dark:text-slate-300",
    iconShadow: "",
  },
  primary: {
    card: "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-primary/20",
    iconBg: "from-primary to-blue-600",
    iconColor: "text-white",
    iconShadow: "shadow-lg shadow-primary/25",
  },
  success: {
    card: "bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/50 dark:to-cyan-950/50 border-success/20",
    iconBg: "from-success to-emerald-500",
    iconColor: "text-white",
    iconShadow: "shadow-lg shadow-success/25",
  },
  warning: {
    card: "bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50 border-warning/20",
    iconBg: "from-warning to-orange-500",
    iconColor: "text-white",
    iconShadow: "shadow-lg shadow-warning/25",
  },
  destructive: {
    card: "bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/50 dark:to-red-950/50 border-destructive/20",
    iconBg: "from-destructive to-rose-500",
    iconColor: "text-white",
    iconShadow: "shadow-lg shadow-destructive/25",
  },
};

export function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  variant = "default" 
}: StatCardProps) {
  const styles = variantStyles[variant];
  
  return (
    <div className={cn(
      "group rounded-2xl border p-6 transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 animate-fade-in",
      styles.card
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground tracking-wide">{title}</p>
          <div className="flex items-baseline gap-3">
            <p className="text-4xl font-bold text-foreground tracking-tight">{value}</p>
            {trend && (
              <div className={cn(
                "flex items-center gap-1 text-sm font-semibold px-2 py-0.5 rounded-full",
                trend.isPositive 
                  ? "text-success bg-success/10" 
                  : "text-destructive bg-destructive/10"
              )}>
                {trend.isPositive ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {trend.isPositive ? "+" : ""}{trend.value}%
              </div>
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className={cn(
          "flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br transition-transform duration-300 group-hover:scale-110",
          styles.iconBg,
          styles.iconShadow
        )}>
          <Icon className={cn("h-7 w-7", styles.iconColor)} />
        </div>
      </div>
    </div>
  );
}
