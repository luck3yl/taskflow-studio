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
import { MessageSquare } from "lucide-react";

export function MeetingFeedbackTable() {
  const data = [
    {
      id: 2,
      time: "2025年12月4日",
      content: "炼铁厂检修第三方挂牌问题突出，需彻底整改",
      dept: "炼铁厂",
      person: "E72705 赵晓斌",
      deadline: "-",
      reporter: "D59429 戴明",
      status: "未完成",
      feedback: "暂无反馈",
      approval: "未提交",
    },
    {
      id: 3,
      time: "2025年12月4日",
      content: "CSP抓检维修受电噪声上限偏大等问题",
      dept: "热轧厂",
      person: "E72729 叶建",
      deadline: "-",
      reporter: "E84651 胡铁",
      status: "未完成",
      feedback: "暂无反馈",
      approval: "待确定",
    },
    {
      id: 4,
      time: "2025年12月4日",
      content: "热轧厂对备件质量管理及标外机组...",
      dept: "热轧厂",
      person: "E71009 殷红成",
      deadline: "-",
      reporter: "E84651 胡铁",
      status: "未完成",
      feedback: "暂无反馈",
      approval: "待提交",
    },
    {
      id: 5,
      time: "2025年12月4日",
      content: "持续推进吊车隐患整治",
      dept: "设备管理部",
      person: "E80080 章晓林",
      deadline: "-",
      reporter: "E82104  温荔",
      status: "未完成",
      feedback: "暂无反馈",
      approval: "未提交",
    },
  ];

  return (
    <div className="overflow-x-auto rounded-md border bg-white shadow-sm">
      <Table className="min-w-max shrink-0 text-xs">
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-12 text-center">序号</TableHead>
            <TableHead>设备例会时间</TableHead>
            <TableHead className="w-64">工作任务内容</TableHead>
            <TableHead>责任单位</TableHead>
            <TableHead>责任人</TableHead>
            <TableHead>完成时间</TableHead>
            <TableHead>填报人</TableHead>
            <TableHead>完成状态</TableHead>
            <TableHead>进度情况反馈(每月月底反馈)</TableHead>
            <TableHead>审批状态</TableHead>
            <TableHead className="w-24 text-center">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="text-center font-medium">{row.id}</TableCell>
              <TableCell>{row.time}</TableCell>
              <TableCell className="max-w-[250px] truncate" title={row.content}>
                {row.content}
              </TableCell>
              <TableCell>{row.dept}</TableCell>
              <TableCell>{row.person}</TableCell>
              <TableCell>{row.deadline}</TableCell>
              <TableCell>{row.reporter}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-muted-foreground">
                  {row.status}
                </Badge>
              </TableCell>
              <TableCell className="flex items-center gap-1 text-blue-500">
                <MessageSquare className="h-3 w-3" />
                {row.feedback}
              </TableCell>
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
