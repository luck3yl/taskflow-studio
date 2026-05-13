import { BenchmarkEvaluationTable } from "@/pages/task/benchmark-evaluation/BenchmarkEvaluationTable";
import { MeetingFeedbackTable } from "@/pages/task/meeting-feedback/MeetingFeedbackTable";
import { ResearchFeedbackTable } from "@/pages/task/research-feedback/ResearchFeedbackTable";
import type { SpecialTaskType } from "@/pages/task/specialTaskTypes";
import { SystemCapabilityEvaluationTable } from "@/pages/task/system-capability-evaluation/SystemCapabilityEvaluationTable";
import { TrainingExchangeTable } from "@/pages/task/training-exchange/TrainingExchangeTable";

interface TaskSpecialTableViewProps {
  type: SpecialTaskType;
}

export function TaskSpecialTableView({ type }: TaskSpecialTableViewProps) {
  if (type === "标杆机组评价") {
    return <BenchmarkEvaluationTable />;
  }
  if (type === "培训交流") {
    return <TrainingExchangeTable />;
  }
  if (type === "例会反馈") {
    return <MeetingFeedbackTable />;
  }
  if (type === "调研反馈") {
    return <ResearchFeedbackTable />;
  }
  if (type === "体系能力评价") {
    return <SystemCapabilityEvaluationTable />;
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
      不支持的任务类型表格展示
    </div>
  );
}
