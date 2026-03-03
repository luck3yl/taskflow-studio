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
    icon: "bg-secondary text-secondary-foreground",
    iconBg: "from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800",
    iconColor: "text-slate-600 dark:text-slate-300",
  },
  primary: {
    card: "bg-white dark:bg-card border-primary/20",
    icon: "shadow-lg shadow-primary/25",
    iconBg: "from-primary to-blue-600",
    iconColor: "text-white",
  },
  success: {
    card: "bg-white dark:bg-card border-success/20",
    icon: "shadow-lg shadow-success/25",
    iconBg: "from-success to-emerald-500",
    iconColor: "text-white",
  },
  warning: {
    card: "bg-white dark:bg-card border-warning/20",
    icon: "shadow-lg shadow-warning/25",
    iconBg: "from-warning to-orange-500",
    iconColor: "text-white",
  },
  destructive: {
    card: "bg-white dark:bg-card border-destructive/20",
    icon: "shadow-lg shadow-destructive/25",
    iconBg: "from-destructive to-rose-500",
    iconColor: "text-white",
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
          styles.icon
        )}>
          <Icon className={cn("h-7 w-7", styles.iconColor)} />
        </div>
      </div>
    </div>
  );
}
