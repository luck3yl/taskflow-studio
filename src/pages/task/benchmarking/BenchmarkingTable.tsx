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

export function BenchmarkingTable() {
  const data = [
    {
      id: 1,
      dept: "炼铁厂",
      area: "全厂",
      target: "宝山东...",
      content: "炉役后期高炉炉身检修管理、定修模式、干熄焦...",
      reporter: "E81406 魏维",
      curr: "高炉休风率1.05%, 烧结机利用系数31.45...",
      standard: "高炉休风率0.78%, 烧结机利用系数31.45...",
      improve: "1、四、五、八高炉修补...",
      test: "test",
      time: "2026年6月1日",
      status: "未完成",
      implement: "暂无反馈",
      approval: "未提交",
    },
    {
      id: 2,
      dept: "炼铁厂",
      area: "四高炉",
      target: "韶钢",
      content: "炉役后期炉身检修管理、炉前设备管理...",
      reporter: "E81406 魏维",
      curr: "高炉休风率0.98%, 利用系数2.421",
      standard: "高炉休风率0.701%...",
      improve: "1、针对四高炉两个铁口出铁...",
      test: "无",
      time: "2026年12月1日",
      status: "未完成",
      implement: "暂无反馈",
      approval: "未提交",
    },
    {
      id: 3,
      dept: "炼铁厂",
      area: "五高炉",
      target: "韶钢",
      content: "炉役后期炉身检修管理、渣处理运行管理...",
      reporter: "E81406 魏维",
      curr: "高炉休风率0.64%, 利用系数2.41",
      standard: "高炉休风率0.5%...",
      improve: "1、五高炉渣处理系统主要问题在...",
      test: "无",
      time: "2026年10月1日",
      status: "未完成",
      implement: "暂无反馈",
      approval: "待提交",
    },
  ];

  return (
    <div className="overflow-x-auto rounded-md border bg-white shadow-sm">
      <Table className="min-w-max shrink-0 text-xs">
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-10 text-center">序号</TableHead>
            <TableHead>责任单位</TableHead>
            <TableHead>区域</TableHead>
            <TableHead>对标单位</TableHead>
            <TableHead className="w-48">主要对标内容</TableHead>
            <TableHead>填报人</TableHead>
            <TableHead className="w-48">现状(与标杆比)</TableHead>
            <TableHead className="w-48">行业标杆指标</TableHead>
            <TableHead className="w-48">改进措施</TableHead>
            <TableHead>指标实绩</TableHead>
            <TableHead>完成时间</TableHead>
            <TableHead>完结状态</TableHead>
            <TableHead>措施实施情况</TableHead>
            <TableHead>审批状态</TableHead>
            <TableHead className="w-24 text-center">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="text-center font-medium">{row.id}</TableCell>
              <TableCell>{row.dept}</TableCell>
              <TableCell>{row.area}</TableCell>
              <TableCell>{row.target}</TableCell>
              <TableCell className="max-w-[150px] truncate" title={row.content}>
                {row.content}
              </TableCell>
              <TableCell>{row.reporter}</TableCell>
              <TableCell className="max-w-[150px] truncate" title={row.curr}>
                {row.curr}
              </TableCell>
              <TableCell className="max-w-[150px] truncate" title={row.standard}>
                {row.standard}
              </TableCell>
              <TableCell className="max-w-[150px] truncate" title={row.improve}>
                {row.improve}
              </TableCell>
              <TableCell className="text-blue-500">{row.test}</TableCell>
              <TableCell>{row.time}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-muted-foreground">
                  {row.status}
                </Badge>
              </TableCell>
              <TableCell className="text-blue-500">{row.implement}</TableCell>
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
