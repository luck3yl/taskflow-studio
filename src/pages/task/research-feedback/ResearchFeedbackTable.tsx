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

export function ResearchFeedbackTable() {
  const data = [
    {
      id: 2,
      dept: "设备管理部",
      content: "锅炉障碍故障要遏制住，故障分析手段要全面...",
      respDept: "技术室",
      reporter: "章晓林",
      time: "2026年1月31日",
      status: "未完成",
      feedback: "暂无反馈",
      approval: "待提交",
    },
    {
      id: 3,
      dept: "设备管理部",
      content: "安全体系建设，加大“严管...”，近期正在找关键问题...",
      respDept: "检查室",
      reporter: "肖勉",
      time: "2025年12月31日",
      status: "未完成",
      feedback: "暂无反馈",
      approval: "待提交",
    },
    {
      id: 4,
      dept: "设备管理部",
      content: "1、对于供应商，“管教养”落脚点在哪...",
      respDept: "合同室",
      reporter: "肖矿泉",
      time: "2026年3月30日",
      status: "未完成",
      feedback: "暂无反馈",
      approval: "待提交",
    },
    {
      id: 6,
      dept: "设备管理部",
      content: "设备的修造要聚焦、具体可执行，设备系统...",
      respDept: "设备室",
      reporter: "许斌",
      time: "2025年12月19日",
      status: "未完成",
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
            <TableHead>调研单位</TableHead>
            <TableHead className="w-64">工作任务内容</TableHead>
            <TableHead>责任单位</TableHead>
            <TableHead>填报人</TableHead>
            <TableHead>完成时间</TableHead>
            <TableHead>是否完成</TableHead>
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
              <TableCell className="max-w-[250px] truncate" title={row.content}>
                {row.content}
              </TableCell>
              <TableCell>{row.respDept}</TableCell>
              <TableCell>{row.reporter}</TableCell>
              <TableCell>{row.time}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-muted-foreground">
                  {row.status}
                </Badge>
              </TableCell>
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
