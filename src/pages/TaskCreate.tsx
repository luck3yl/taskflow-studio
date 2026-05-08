import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Rocket, FileText, Users, CalendarIcon, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCreateProvider, useTaskCreateContext } from "@/pages/task/components/create-wizard/TaskCreateContext";
import { Step1BasicDef } from "@/pages/task/components/create-wizard/Step1BasicDef";
import { Step2TaskBreakdown } from "@/pages/task/components/create-wizard/Step2TaskBreakdown";
import { Step3TimeConfig } from "@/pages/task/components/create-wizard/Step3TimeConfig";
import { Step4PreviewPublish } from "@/pages/task/components/create-wizard/Step4PreviewPublish";

const steps = [
  { id: 1, title: "基础定义", icon: FileText },
  { id: 2, title: "任务拆解", icon: Users },
  { id: 3, title: "时限配置", icon: CalendarIcon },
  { id: 4, title: "预览发布", icon: Rocket },
];

function TaskCreateInner() {
  const { currentStep, handleNext, handleBack, handlePublish, navigate } = useTaskCreateContext();

  return (
    <AppLayout title="创建任务">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`
                    flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all
                    \${isActive ? "border-primary bg-primary text-primary-foreground" : ""}
                    \${isCompleted ? "border-success bg-success text-success-foreground" : ""}
                    \${!isActive && !isCompleted ? "border-border bg-muted text-muted-foreground" : ""}
                  `}>
                    {isCompleted ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={`mt-2 text-sm font-medium \${isActive ? "text-primary" : "text-muted-foreground"}`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 w-12 sm:w-24 mx-2 \${isCompleted ? "bg-success" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <Card className="shadow-card animate-fade-in">
          {currentStep === 1 && <Step1BasicDef />}
          {currentStep === 2 && <Step2TaskBreakdown />}
          {currentStep === 3 && <Step3TimeConfig />}
          {currentStep === 4 && <Step4PreviewPublish />}

          {/* Navigation */}
          <div className="flex justify-between p-6 pt-0">
            <Button
              variant="outline"
              onClick={currentStep === 1 ? () => navigate("/tasks") : handleBack}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {currentStep === 1 ? "取消" : "上一步"}
            </Button>

            {currentStep < 4 ? (
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
  return (
    <TaskCreateProvider>
      <TaskCreateInner />
    </TaskCreateProvider>
  );
}
