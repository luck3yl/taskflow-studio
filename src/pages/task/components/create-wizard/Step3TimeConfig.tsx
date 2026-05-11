import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTaskCreateContext } from "./TaskCreateContext";

export function Step3TimeConfig() {
  const {
    taskType,
    deadlineDate,
    setDeadlineDate,
    deadlineTime,
    setDeadlineTime,
    reviewer,
    setReviewer,
    reviewerOptions,
  } = useTaskCreateContext();

  const isMeetingMaterialTask = taskType === "例会资料";

  return (
    <>
      <CardHeader>
        <CardTitle>时限配置</CardTitle>
        <CardDescription>
          {isMeetingMaterialTask ? "设置截止时间" : "设置截止时间和指定审核人"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>截止日期</Label>
          <div className="flex gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[200px] justify-start text-left font-normal",
                    !deadlineDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadlineDate
                    ? format(deadlineDate, "yyyy年M月d日", { locale: zhCN })
                    : "选择日期"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={deadlineDate}
                  onSelect={setDeadlineDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <Input
              type="time"
              value={deadlineTime}
              onChange={(event) => setDeadlineTime(event.target.value)}
              className="w-[120px]"
            />
          </div>
        </div>

        {!isMeetingMaterialTask && (
          <div className="space-y-2">
            <Label>审核人</Label>
            <Select value={reviewer} onValueChange={setReviewer}>
              <SelectTrigger>
                <SelectValue placeholder="选择审核人" />
              </SelectTrigger>
              <SelectContent>
                {reviewerOptions.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    <span className="font-medium">{item.name}</span>
                    <span className="ml-2 text-muted-foreground">({item.title})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </>
  );
}
