import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useTaskCreateContext } from "./TaskCreateContext";

export function Step4PreviewPublish() {
  const {
    taskType,
    taskTitle,
    taskDescription,
    templateFile,
    templatePageCount,
    deadlineDate,
    deadlineTime,
    reviewer,
    reviewerOptions,
    assignments,
    getMemberById,
  } = useTaskCreateContext();

  const isMeetingMaterialTask = taskType === "例会资料";

  return (
    <>
      <CardHeader>
        <CardTitle>预览并发布</CardTitle>
        <CardDescription>确认任务信息无误后点击发布</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border py-2">
            <span className="text-muted-foreground">任务名称</span>
            <span className="font-medium">{taskTitle || "未设置"}</span>
          </div>
          <div className="flex flex-col gap-2 border-b border-border py-2">
            <span className="text-muted-foreground">任务描述</span>
            <div className="max-h-24 overflow-y-auto whitespace-pre-wrap rounded bg-muted/30 p-2 text-sm leading-relaxed">
              {taskDescription || "无任务描述"}
            </div>
          </div>
          <div className="flex items-center justify-between border-b border-border py-2">
            <span className="text-muted-foreground">模板文件</span>
            <div className="text-right">
              <span>{templateFile?.name || "未上传"}</span>
              {templatePageCount > 0 && (
                <span className="ml-2 text-sm text-primary">({templatePageCount} 页)</span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between border-b border-border py-2">
            <span className="text-muted-foreground">截止时间</span>
            <span>
              {deadlineDate
                ? `${format(deadlineDate, "yyyy年M月d日", { locale: zhCN })} ${deadlineTime}`
                : "未设置"}
            </span>
          </div>
          {!isMeetingMaterialTask && (
            <div className="flex items-center justify-between border-b border-border py-2">
              <span className="text-muted-foreground">审核人</span>
              <span>{reviewerOptions.find((item) => item.id === reviewer)?.name || "未设置"}</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Label>分配清单</Label>
          {isMeetingMaterialTask ? (
          <div className="rounded-lg border border-border/50 bg-secondary/20 px-4 py-3 text-sm text-muted-foreground">
            任务创建后，请进入工作台完成部门分配。
          </div>
        ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium">执行人</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">负责页面</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">工作要求</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => {
                    const member = getMemberById(assignment.memberId);

                    return (
                      <tr key={assignment.memberId} className="border-t border-border">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-sm text-primary">
                                {member?.avatar}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-medium">{member?.name}</span>
                              <p className="text-xs text-muted-foreground">{member?.department}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {assignment.startPage && assignment.endPage ? (
                            <Badge variant="outline">
                              第 {assignment.startPage}-{assignment.endPage} 页
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {assignment.requirement || "未填写具体要求"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </>
  );
}
