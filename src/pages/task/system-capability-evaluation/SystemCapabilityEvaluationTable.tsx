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

export function SystemCapabilityEvaluationTable() {
  const data = [
    {
      id: 1,
      element: "组织架构",
      standard: "是否建立完善的设备管理组织架构及岗位职责体系构架文件？",
      scoreRule: "有扣0分，无扣2分，部分满足扣1分",
      maxScore: 5,
      selfScore: 5,
      finalScore: "-",
      dept: "管理室",
      files: "组织结构图.pdf",
      status: "待审核",
      submitter: "张三",
    },
    {
      id: 2,
      element: "制度体系",
      standard: "各项设备管理制度是否有效发布、落地执行及定期评估？",
      scoreRule: "每发现一处不符合扣1分，最多扣5分",
      maxScore: 5,
      selfScore: 4,
      finalScore: "-",
      dept: "档案室",
      files: "制度汇编.docx",
      status: "待复核",
      submitter: "李四",
    },
    {
      id: 3,
      element: "数据治理",
      standard: "设备基础台账真实率能否达到95%以上，并有持续迭代机制？",
      scoreRule: "真实率95%得满分，每降低1%扣1分",
      maxScore: 10,
      selfScore: 8,
      finalScore: "-",
      dept: "技术室",
      files: "台账核对报告.xlsx",
      status: "待提交",
      submitter: "王五",
    },
  ];

  return (
    <div className="overflow-x-auto rounded-md border bg-white shadow-sm">
      <Table className="min-w-max shrink-0 text-xs">
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-10 text-center">序号</TableHead>
            <TableHead>评价要素</TableHead>
            <TableHead className="w-64">评价细则及标准</TableHead>
            <TableHead className="w-48">评分规则</TableHead>
            <TableHead className="text-center">总分值</TableHead>
            <TableHead className="text-center">自评得分</TableHead>
            <TableHead className="text-center">复核得分</TableHead>
            <TableHead>责任归属组</TableHead>
            <TableHead>佐证材料</TableHead>
            <TableHead>提交人</TableHead>
            <TableHead>当前状态</TableHead>
            <TableHead className="w-24 text-center">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="text-center font-medium">{row.id}</TableCell>
              <TableCell>{row.element}</TableCell>
              <TableCell className="max-w-[200px] whitespace-normal" title={row.standard}>
                {row.standard}
              </TableCell>
              <TableCell className="text-muted-foreground">{row.scoreRule}</TableCell>
              <TableCell className="text-center font-bold text-slate-700">{row.maxScore}</TableCell>
              <TableCell className="text-center font-bold text-blue-600">{row.selfScore}</TableCell>
              <TableCell className="text-center">{row.finalScore}</TableCell>
              <TableCell>{row.dept}</TableCell>
              <TableCell className="cursor-pointer text-blue-500">{row.files}</TableCell>
              <TableCell>{row.submitter}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-muted-foreground">
                  {row.status}
                </Badge>
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
