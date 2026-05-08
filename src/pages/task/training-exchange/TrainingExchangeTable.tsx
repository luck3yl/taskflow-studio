import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableActionButtons } from "@/pages/task/shared/TableActionButtons";

export function TrainingExchangeTable() {
  const data = [
    {
      id: 2,
      dept: "炼铁厂",
      content: "交流高炉、烧结机检修模型...",
      goal: "缩短定修时长",
      users: "高炉、烧结设备管理人员",
      time: "2025年11月30日",
      reporter: "E81406 魏维",
      status: "未完成",
      goalStatus: "暂无反馈",
      feedback: "暂无反馈",
      approval: "未提交",
    },
    {
      id: 3,
      dept: "炼铁厂",
      content: "设备聚焦问题应用条件下...",
      goal: "遏制干熄焦锅炉爆管故障改...",
      users: "焦化管理人员",
      time: "2025年11月30日",
      reporter: "E81406 魏维",
      status: "未完成",
      goalStatus: "暂无反馈",
      feedback: "暂无反馈",
      approval: "待提交",
    },
    {
      id: 4,
      dept: "炼铁厂",
      content: "计量设备基础知识、武钢计...",
      goal: "计量校准人员培训考证",
      users: "点检员、技术人员",
      time: "2026年12月31日",
      reporter: "E81406 魏维",
      status: "未完成",
      goalStatus: "暂无反馈",
      feedback: "暂无反馈",
      approval: "待提交",
    },
  ];

  return (
    <div className="overflow-x-auto rounded-md border bg-white shadow-sm">
      <Table className="min-w-max shrink-0 text-xs">
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-12 text-center">序号</TableHead>
            <TableHead>责任单位</TableHead>
            <TableHead className="w-48">培训、交流内容</TableHead>
            <TableHead>培训、交流目标</TableHead>
            <TableHead>培训、交流人员</TableHead>
            <TableHead>计划时间</TableHead>
            <TableHead>填报人</TableHead>
            <TableHead>完成状态</TableHead>
            <TableHead>目标完成情况</TableHead>
            <TableHead>进度情况反馈</TableHead>
            <TableHead>审批状态</TableHead>
            <TableHead className="w-24 text-center">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="text-center font-medium">{row.id}</TableCell>
              <TableCell>{row.dept}</TableCell>
              <TableCell className="max-w-[200px] truncate" title={row.content}>
                {row.content}
              </TableCell>
              <TableCell>{row.goal}</TableCell>
              <TableCell>{row.users}</TableCell>
              <TableCell>{row.time}</TableCell>
              <TableCell>{row.reporter}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-muted-foreground">
                  {row.status}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{row.goalStatus}</TableCell>
              <TableCell className="text-blue-500">{row.feedback}</TableCell>
              <TableCell>
                <Badge variant="secondary">{row.approval}</Badge>
              </TableCell>
              <TableCell>
                <TableActionButtons />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
