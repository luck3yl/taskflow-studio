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

export function BenchmarkEvaluationTable() {
  const data = [
    {
      id: 1,
      unit: "炼铁厂",
      machine: "1#-6#CDQ",
      index: "干熄焦率",
      def: "干熄焦实际消耗/焦炭产量",
      expect: "极大",
      rule: "滚动累计",
      unitVal: "%",
      base: "95.69 (梅钢 99.0)",
      challenge: "20.0",
      score: "97.0",
      evalScore: "5.0",
      standard: "达到或超越行业标杆...",
      status: "详细交",
    },
    {
      id: 2,
      unit: "炼铁厂",
      machine: "1#烧结机",
      index: "利用系数",
      def: "660平方米...",
      expect: "极大",
      rule: "滚动累计",
      unitVal: "t/m2.d",
      base: "31.224 (宝山3DL 31.26)",
      challenge: "20.0",
      score: "31.1",
      evalScore: "-10.0",
      standard: "达到...",
      status: "详细交",
    },
    {
      id: 3,
      unit: "炼铁厂",
      machine: "2#烧结机",
      index: "利用系数",
      def: "550平方米...",
      expect: "极大",
      rule: "滚动累计",
      unitVal: "t/m2.d",
      base: "31.512 (梅钢SDL 34.615)",
      challenge: "20.0",
      score: "-",
      evalScore: "-",
      standard: "达到...",
      status: "详细交",
    },
  ];

  return (
    <div className="overflow-x-auto rounded-md border bg-white shadow-sm">
      <Table className="min-w-max shrink-0 text-xs">
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-12 text-center">序号</TableHead>
            <TableHead>评价单位</TableHead>
            <TableHead>机组</TableHead>
            <TableHead>评价指标</TableHead>
            <TableHead>指标定义及计算公式</TableHead>
            <TableHead>期望</TableHead>
            <TableHead>统计规则</TableHead>
            <TableHead>指标单位</TableHead>
            <TableHead>基础目标(行业标杆)</TableHead>
            <TableHead>挑战目标</TableHead>
            <TableHead>总分值</TableHead>
            <TableHead>当年实绩</TableHead>
            <TableHead>评价得分</TableHead>
            <TableHead className="w-48">评价标准</TableHead>
            <TableHead>审批状态</TableHead>
            <TableHead className="w-24 text-center">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="text-center font-medium">{row.id}</TableCell>
              <TableCell>{row.unit}</TableCell>
              <TableCell>{row.machine}</TableCell>
              <TableCell>{row.index}</TableCell>
              <TableCell className="max-w-[150px] truncate" title={row.def}>
                {row.def}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {row.expect}
                </Badge>
              </TableCell>
              <TableCell>{row.rule}</TableCell>
              <TableCell>{row.unitVal}</TableCell>
              <TableCell className="text-blue-600">{row.base}</TableCell>
              <TableCell className="text-blue-600">{row.challenge}</TableCell>
              <TableCell>{row.score}</TableCell>
              <TableCell>{row.evalScore}</TableCell>
              <TableCell
                className={
                  row.evalScore.startsWith("-")
                    ? "font-bold text-destructive"
                    : "font-bold text-success"
                }
              >
                {row.evalScore}
              </TableCell>
              <TableCell
                className="max-w-[150px] truncate text-[10px] text-muted-foreground"
                title={row.standard}
              >
                {row.standard}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="bg-slate-100">
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
