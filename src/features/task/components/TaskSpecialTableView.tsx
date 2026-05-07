import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Eye, MessageSquare, Trash2 } from "lucide-react";

interface Props {
  type: string;
}

export function TaskSpecialTableView({ type }: Props) {
  if (type === "标杆机组评价") {
    return <BenchmarkEvaluationTable />;
  }
  if (type === "培训交流") {
    return <TrainingExchangeTable />;
  }
  if (type === "例会反馈") {
    return <MeetingFeedbackTable />;
  }
  if (type === "调研反馈") {
    return <ResearchFeedbackTable />;
  }
  if (type === "对标找差") {
    return <BenchmarkingTable />;
  }
  if (type === "体系能力评价") {
    return <SystemCapabilityEvaluationTable />;
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
      不支持的任务类型表格展示
    </div>
  );
}

function ActionButtons() {
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-500 hover:text-blue-700 hover:bg-blue-50"><Eye className="h-3.5 w-3.5" /></Button>
      <Button variant="ghost" size="icon" className="h-6 w-6 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50"><Edit className="h-3.5 w-3.5" /></Button>
      <Button variant="ghost" size="icon" className="h-6 w-6 text-amber-500 hover:text-amber-700 hover:bg-amber-50"><MessageSquare className="h-3.5 w-3.5" /></Button>
      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></Button>
    </div>
  );
}

function BenchmarkEvaluationTable() {
  const data = [
    { id: 1, unit: "炼铁厂", machine: "1#-6#CDQ", index: "干熄焦率", def: "干熄焦实际消耗/焦炭产量", expect: "极大", rule: "滚动累计", unitVal: "%", base: "95.69 (梅钢 99.0)", challenge: "20.0", score: "97.0", evalScore: "5.0", standard: "达到或超越行业标杆...", status: "详细交" },
    { id: 2, unit: "炼铁厂", machine: "1#烧结机", index: "利用系数", def: "660平方米...", expect: "极大", rule: "滚动累计", unitVal: "t/m2.d", base: "31.224 (宝山3DL 31.26)", challenge: "20.0", score: "31.1", evalScore: "-10.0", standard: "达到...", status: "详细交" },
    { id: 3, unit: "炼铁厂", machine: "2#烧结机", index: "利用系数", def: "550平方米...", expect: "极大", rule: "滚动累计", unitVal: "t/m2.d", base: "31.512 (梅钢SDL 34.615)", challenge: "20.0", score: "-", evalScore: "-", standard: "达到...", status: "详细交" },
  ];

  return (
    <div className="rounded-md border shadow-sm bg-white overflow-x-auto">
      <Table className="text-xs shrink-0 min-w-max">
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
            <TableHead className="text-center w-24">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="text-center font-medium">{row.id}</TableCell>
              <TableCell>{row.unit}</TableCell>
              <TableCell>{row.machine}</TableCell>
              <TableCell>{row.index}</TableCell>
              <TableCell className="max-w-[150px] truncate" title={row.def}>{row.def}</TableCell>
              <TableCell><Badge variant="outline" className="bg-green-50 text-green-700">{row.expect}</Badge></TableCell>
              <TableCell>{row.rule}</TableCell>
              <TableCell>{row.unitVal}</TableCell>
              <TableCell className="text-blue-600">{row.base}</TableCell>
              <TableCell className="text-blue-600">{row.challenge}</TableCell>
              <TableCell>{row.score}</TableCell>
              <TableCell>{row.evalScore}</TableCell>
              <TableCell className={row.evalScore.startsWith('-') ? "text-destructive font-bold" : "text-success font-bold"}>{row.evalScore}</TableCell>
              <TableCell className="max-w-[150px] text-muted-foreground text-[10px] truncate" title={row.standard}>{row.standard}</TableCell>
              <TableCell><Badge variant="secondary" className="bg-slate-100">{row.status}</Badge></TableCell>
              <TableCell><ActionButtons /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TrainingExchangeTable() {
  const data = [
    { id: 2, dept: "炼铁厂", content: "交流高炉、烧结机检修模型...", goal: "缩短定修时长", users: "高炉、烧结设备管理人员", time: "2025年11月30日", reporter: "E81406 魏维", status: "未完成", goalStatus: "暂无反馈", feedback: "暂无反馈", approval: "未提交" },
    { id: 3, dept: "炼铁厂", content: "设备聚焦问题应用条件下...", goal: "遏制干熄焦锅炉爆管故障改...", users: "焦化管理人员", time: "2025年11月30日", reporter: "E81406 魏维", status: "未完成", goalStatus: "暂无反馈", feedback: "暂无反馈", approval: "待提交" },
    { id: 4, dept: "炼铁厂", content: "计量设备基础知识、武钢计...", goal: "计量校准人员培训考证", users: "点检员、技术人员", time: "2026年12月31日", reporter: "E81406 魏维", status: "未完成", goalStatus: "暂无反馈", feedback: "暂无反馈", approval: "待提交" },
  ];

  return (
    <div className="rounded-md border shadow-sm bg-white overflow-x-auto">
      <Table className="text-xs shrink-0 min-w-max">
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
            <TableHead className="text-center w-24">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="text-center font-medium">{row.id}</TableCell>
              <TableCell>{row.dept}</TableCell>
              <TableCell className="max-w-[200px] truncate" title={row.content}>{row.content}</TableCell>
              <TableCell>{row.goal}</TableCell>
              <TableCell>{row.users}</TableCell>
              <TableCell>{row.time}</TableCell>
              <TableCell>{row.reporter}</TableCell>
              <TableCell><Badge variant="outline" className="text-muted-foreground">{row.status}</Badge></TableCell>
              <TableCell className="text-muted-foreground">{row.goalStatus}</TableCell>
              <TableCell className="text-blue-500">{row.feedback}</TableCell>
              <TableCell><Badge variant="secondary">{row.approval}</Badge></TableCell>
              <TableCell><ActionButtons /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function MeetingFeedbackTable() {
  const data = [
    { id: 2, time: "2025年12月4日", content: "炼铁厂检修第三方挂牌问题突出，需彻底整改", dept: "炼铁厂", person: "E72705 赵晓斌", deadline: "-", reporter: "D59429 戴明", status: "未完成", feedback: "暂无反馈", approval: "未提交" },
    { id: 3, time: "2025年12月4日", content: "CSP抓检维修受电噪声上限偏大等问题", dept: "热轧厂", person: "E72729 叶建", deadline: "-", reporter: "E84651 胡铁", status: "未完成", feedback: "暂无反馈", approval: "待确定" },
    { id: 4, time: "2025年12月4日", content: "热轧厂对备件质量管理及标外机组...", dept: "热轧厂", person: "E71009 殷红成", deadline: "-", reporter: "E84651 胡铁", status: "未完成", feedback: "暂无反馈", approval: "待提交" },
    { id: 5, time: "2025年12月4日", content: "持续推进吊车隐患整治", dept: "设备管理部", person: "E80080 章晓林", deadline: "-", reporter: "E82104  温荔", status: "未完成", feedback: "暂无反馈", approval: "未提交" },
  ];

  return (
    <div className="rounded-md border shadow-sm bg-white overflow-x-auto">
      <Table className="text-xs shrink-0 min-w-max">
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
            <TableHead className="text-center w-24">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="text-center font-medium">{row.id}</TableCell>
              <TableCell>{row.time}</TableCell>
              <TableCell className="max-w-[250px] truncate" title={row.content}>{row.content}</TableCell>
              <TableCell>{row.dept}</TableCell>
              <TableCell>{row.person}</TableCell>
              <TableCell>{row.deadline}</TableCell>
              <TableCell>{row.reporter}</TableCell>
              <TableCell><Badge variant="outline" className="text-muted-foreground">{row.status}</Badge></TableCell>
              <TableCell className="text-blue-500 flex items-center gap-1"><MessageSquare className="h-3 w-3"/>{row.feedback}</TableCell>
              <TableCell><Badge variant="secondary">{row.approval}</Badge></TableCell>
              <TableCell><ActionButtons /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ResearchFeedbackTable() {
  const data = [
    { id: 2, dept: "设备管理部", content: "锅炉障碍故障要遏制住，故障分析手段要全面...", respDept: "技术室", reporter: "章晓林", time: "2026年1月31日", status: "未完成", feedback: "暂无反馈", approval: "待提交" },
    { id: 3, dept: "设备管理部", content: "安全体系建设，加大“严管...”，近期正在找关键问题...", respDept: "检查室", reporter: "肖勉", time: "2025年12月31日", status: "未完成", feedback: "暂无反馈", approval: "待提交" },
    { id: 4, dept: "设备管理部", content: "1、对于供应商，“管教养”落脚点在哪...", respDept: "合同室", reporter: "肖矿泉", time: "2026年3月30日", status: "未完成", feedback: "暂无反馈", approval: "待提交" },
    { id: 6, dept: "设备管理部", content: "设备的修造要聚焦、具体可执行，设备系统...", respDept: "设备室", reporter: "许斌", time: "2025年12月19日", status: "未完成", feedback: "暂无反馈", approval: "待提交" },
  ];

  return (
    <div className="rounded-md border shadow-sm bg-white overflow-x-auto">
      <Table className="text-xs shrink-0 min-w-max">
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
            <TableHead className="text-center w-24">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="text-center font-medium">{row.id}</TableCell>
              <TableCell>{row.dept}</TableCell>
              <TableCell className="max-w-[250px] truncate" title={row.content}>{row.content}</TableCell>
              <TableCell>{row.respDept}</TableCell>
              <TableCell>{row.reporter}</TableCell>
              <TableCell>{row.time}</TableCell>
              <TableCell><Badge variant="outline" className="text-muted-foreground">{row.status}</Badge></TableCell>
              <TableCell className="text-blue-500">{row.feedback}</TableCell>
              <TableCell><Badge variant="secondary">{row.approval}</Badge></TableCell>
              <TableCell><ActionButtons /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function BenchmarkingTable() {
  const data = [
    { id: 1, dept: "炼铁厂", area: "全厂", target: "宝山东...", content: "炉役后期高炉炉身检修管理、定修模式、干熄焦...", reporter: "E81406 魏维", curr: "高炉休风率1.05%, 烧结机利用系数31.45...", standard: "高炉休风率0.78%, 烧结机利用系数31.45...", improve: "1、四、五、八高炉修补...", test: "test", time: "2026年6月1日", status: "未完成", implement: "暂无反馈", approval: "未提交" },
    { id: 2, dept: "炼铁厂", area: "四高炉", target: "韶钢", content: "炉役后期炉身检修管理、炉前设备管理...", reporter: "E81406 魏维", curr: "高炉休风率0.98%, 利用系数2.421", standard: "高炉休风率0.701%...", improve: "1、针对四高炉两个铁口出铁...", test: "无", time: "2026年12月1日", status: "未完成", implement: "暂无反馈", approval: "未提交" },
    { id: 3, dept: "炼铁厂", area: "五高炉", target: "韶钢", content: "炉役后期炉身检修管理、渣处理运行管理...", reporter: "E81406 魏维", curr: "高炉休风率0.64%, 利用系数2.41", standard: "高炉休风率0.5%...", improve: "1、五高炉渣处理系统主要问题在...", test: "无", time: "2026年10月1日", status: "未完成", implement: "暂无反馈", approval: "待提交" },
  ];

  return (
    <div className="rounded-md border shadow-sm bg-white overflow-x-auto">
      <Table className="text-xs shrink-0 min-w-max">
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
            <TableHead className="text-center w-24">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="text-center font-medium">{row.id}</TableCell>
              <TableCell>{row.dept}</TableCell>
              <TableCell>{row.area}</TableCell>
              <TableCell>{row.target}</TableCell>
              <TableCell className="max-w-[150px] truncate" title={row.content}>{row.content}</TableCell>
              <TableCell>{row.reporter}</TableCell>
              <TableCell className="max-w-[150px] truncate" title={row.curr}>{row.curr}</TableCell>
              <TableCell className="max-w-[150px] truncate" title={row.standard}>{row.standard}</TableCell>
              <TableCell className="max-w-[150px] truncate" title={row.improve}>{row.improve}</TableCell>
              <TableCell className="text-blue-500">{row.test}</TableCell>
              <TableCell>{row.time}</TableCell>
              <TableCell><Badge variant="outline" className="text-muted-foreground">{row.status}</Badge></TableCell>
              <TableCell className="text-blue-500">{row.implement}</TableCell>
              <TableCell><Badge variant="secondary">{row.approval}</Badge></TableCell>
              <TableCell><ActionButtons /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function SystemCapabilityEvaluationTable() {
  const data = [
    { id: 1, element: "组织架构", standard: "是否建立完善的设备管理组织架构及岗位职责体系构架文件？", scoreRule: "有扣0分，无扣2分，部分满足扣1分", maxScore: 5, selfScore: 5, finalScore: "-", dept: "管理室", files: "组织结构图.pdf", status: "待审核", submitter: "张三" },
    { id: 2, element: "制度体系", standard: "各项设备管理制度是否有效发布、落地执行及定期评估？", scoreRule: "每发现一处不符合扣1分，最多扣5分", maxScore: 5, selfScore: 4, finalScore: "-", dept: "档案室", files: "制度汇编.docx", status: "待复核", submitter: "李四" },
    { id: 3, element: "数据治理", standard: "设备基础台账真实率能否达到95%以上，并有持续迭代机制？", scoreRule: "真实率95%得满分，每降低1%扣1分", maxScore: 10, selfScore: 8, finalScore: "-", dept: "技术室", files: "台账核对报告.xlsx", status: "待提交", submitter: "王五" },
  ];

  return (
    <div className="rounded-md border shadow-sm bg-white overflow-x-auto">
      <Table className="text-xs shrink-0 min-w-max">
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
            <TableHead className="text-center w-24">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="text-center font-medium">{row.id}</TableCell>
              <TableCell>{row.element}</TableCell>
              <TableCell className="max-w-[200px] whitespace-normal" title={row.standard}>{row.standard}</TableCell>
              <TableCell className="text-muted-foreground">{row.scoreRule}</TableCell>
              <TableCell className="text-center font-bold text-slate-700">{row.maxScore}</TableCell>
              <TableCell className="text-center text-blue-600 font-bold">{row.selfScore}</TableCell>
              <TableCell className="text-center">{row.finalScore}</TableCell>
              <TableCell>{row.dept}</TableCell>
              <TableCell className="text-blue-500 cursor-pointer">{row.files}</TableCell>
              <TableCell>{row.submitter}</TableCell>
              <TableCell><Badge variant="outline" className="text-muted-foreground">{row.status}</Badge></TableCell>
              <TableCell><ActionButtons /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
