import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Rocket, FileText, CalendarIcon, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { TaskCreateProvider, useTaskCreateContext } from "@/pages/task/components/create-wizard/TaskCreateContext";
import { Step1BasicDef } from "@/pages/task/components/create-wizard/Step1BasicDef";
import { Step2TaskBreakdown } from "@/pages/task/components/create-wizard/Step2TaskBreakdown";
import { Step3TimeConfig } from "@/pages/task/components/create-wizard/Step3TimeConfig";
import { Step4PreviewPublish } from "@/pages/task/components/create-wizard/Step4PreviewPublish";
import { TaskTypeEnum } from "@/enums/task";
import { MeetingMaterialCreateForm } from "@/pages/task/meeting-materials/MeetingMaterialCreateForm";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

const WIZARD_STEPS = [
  { id: 1, title: "基础定义", icon: FileText },
  { id: 2, title: "任务拆解", icon: FileText },
  { id: 3, title: "时限配置", icon: CalendarIcon },
  { id: 4, title: "预览发布", icon: Rocket },
];

// 创建流程表单
function MeetingMaterialCreate() {
  const navigate = useNavigate();
  const { taskType } = useParams<{ taskType?: string }>();
  const [searchParams] = useSearchParams();
  const categoryCode = taskType ? decodeURIComponent(taskType) : "";
  const categoryName = searchParams.get("name") || categoryCode;
  const returnPath = categoryCode ? `/tasks/${encodeURIComponent(categoryCode)}` : "/tasks";

  if (!categoryCode) {
    return (
      <AppLayout title="创建流程">
        <div className="max-w-2xl mx-auto text-center py-16">
          <p className="text-muted-foreground">请从任务中心选择流程类别后创建</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/tasks")}>
            返回任务中心
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="创建流程">
      <div className="max-w-2xl mx-auto">
        <MeetingMaterialCreateForm
          categoryCode={categoryCode}
          categoryName={categoryName}
          onSuccess={() => {
            navigate(returnPath, { state: { refresh: true } });
          }}
          onCancel={() => navigate(-1)}
        />
      </div>
    </AppLayout>
  );
}

// 其他任务类型：保持多步骤向导
function WizardCreate() {
  const { currentStep, handleNext, handleBack, handlePublish, navigate } = useTaskCreateContext();
  const lastStepId = WIZARD_STEPS[WIZARD_STEPS.length - 1].id;

  return (
    <AppLayout title="创建任务">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {WIZARD_STEPS.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`
                    flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all
                    ${isActive ? "border-primary bg-primary text-primary-foreground" : ""}
                    ${isCompleted ? "border-primary/30 bg-primary/10 text-primary" : ""}
                    ${!isActive && !isCompleted ? "border-border bg-muted text-muted-foreground" : ""}
                  `}>
                    {isCompleted ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={`mt-2 text-sm font-medium ${isActive || isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                    {step.title}
                  </span>
                </div>
                {index < WIZARD_STEPS.length - 1 && (
                  <div className={`h-0.5 w-12 sm:w-24 mx-2 ${isCompleted ? "bg-primary/30" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>

        <Card className="shadow-card animate-fade-in">
          {currentStep === 1 && <Step1BasicDef />}
          {currentStep === 2 && <Step2TaskBreakdown />}
          {currentStep === 3 && <Step3TimeConfig />}
          {currentStep === 4 && <Step4PreviewPublish />}

          <div className="flex justify-between p-6 pt-0">
            <Button
              variant="outline"
              onClick={currentStep === 1 ? () => navigate("/tasks") : handleBack}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {currentStep === 1 ? "取消" : "上一步"}
            </Button>

            {currentStep < lastStepId ? (
              <Button onClick={handleNext} className="gradient-primary">
                下一步
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handlePublish} className="gradient-primary">
                <Rocket className="h-4 w-4 mr-2" />
                立即下发
              </Button>
            )}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

export default function TaskCreate() {
  // 统一使用创建流程表单（选择类别后启动对应流程）
  return <MeetingMaterialCreate />;
}
