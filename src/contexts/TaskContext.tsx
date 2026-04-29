import { formatPageRange } from "@/lib/utils";
import React, { createContext, useContext, useState, ReactNode } from "react";

// ===================== PPT 拆分合并工作流类型 =====================

export interface PptPageSubmission {
  id: string;
  submittedBy: string;
  submittedById: string;
  department: string;
  submittedAt: string;
  fileName: string;
  fileSize: number;
  fileUrl?: string;
  note?: string;
  /** 本次提交生成的版本号 */
  version: number;
  /** 提交时基于的版本（0=原始模板，用于冲突检测） */
  baseVersion: number;
  status: "pending" | "approved" | "rejected";
  feedback?: string;
  feedbackAt?: string;
  hasConflict: boolean;
  conflictDescription?: string;
}

export interface PptUserAssignment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  department: string;
  /** 负责的页面（支持跳跃式，如 [1,3,5,7,9]） */
  pages: number[];
  /** 任务描述 */
  taskDescription?: string;
  status: "pending" | "in_progress" | "submitted" | "dept_approved" | "final_approved" | "rejected";
  submissions: PptPageSubmission[];
}

export interface PptDeptAssignment {
  id: string;
  department: string;
  /** 该部门负责的页面 */
  pages: number[];
  requirement?: string;
  headUserId?: string;
  headUserName?: string;
  status: "pending" | "in_progress" | "dept_approved" | "final_approved";
  userAssignments: PptUserAssignment[];
}

export type PptStage =
  | "dept_assignment"   // 创建者分配页面给部门
  | "user_assignment"   // 部门负责人分配给员工
  | "in_progress"       // 员工编辑中
  | "dept_reviewing"    // 部门负责人审核员工提交
  | "final_reviewing"   // 主管最终审批
  | "approved"          // 全部通过
  | "merged";           // 已合并

export interface PptWorkflow {
  stage: PptStage;
  totalPages: number;
  deptAssignments: PptDeptAssignment[];
  /** pageNumber -> 当前最新版本号（0=未提交过） */
  pageVersions: Record<number, number>;
  /** 审核人（各部门负责人审核完成后，由此人做阶段性汇总审核） */
  reviewerId?: string;
  reviewerName?: string;
  /** 审批人（最终合并前的终审批准人） */
  approverId?: string;
  approverName?: string;
  mergedFileUrl?: string;
}

// ===================== 原有类型 =====================

export interface Submission {
  id: string;
  fileName: string;
  fileSize: number;
  fileUrl?: string; // 文件的URL，用于预览
  submittedAt: string;
  note?: string;
  status: "pending" | "approved" | "rejected";
  feedback?: string;
  feedbackAt?: string;
}

export interface Assignee {
  id: string;
  memberId: string;
  name: string;
  avatar: string;
  department: string;
  taskDescription: string;
  pageRange?: string; // e.g., "1-3" or "4-6"
  status: "pending" | "submitted" | "approved" | "rejected";
  submissions: Submission[];
}

export type TaskType = "调研反馈" | "例会反馈" | "标杆机组评价" | "体系能力评价" | "对标找差" | "培训交流" | "例会资料";

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  department: string;
  createdAt: string;
  deadline: string;
  createdBy: string;
  createdByAvatar: string;
  templateFileName?: string;
  templateFileSize?: number;
  templatePageCount?: number;
  templateFileUrl?: string; // 模板文件的URL，用于预览
  totalAssignees: number;
  completedCount: number;
  status: "in_progress" | "completed";
  assignees: Assignee[];
  /** 例会资料工作流（仅type="例会资料"时使用） */
  pptWorkflow?: PptWorkflow;
}

function derivePptStage(ppt: PptWorkflow): PptStage {
  if (ppt.stage === "merged") {
    return "merged";
  }

  const userAssignments = ppt.deptAssignments.flatMap(dept => dept.userAssignments);
  const allAssigned = ppt.deptAssignments.every(dept => dept.userAssignments.length > 0);

  if (userAssignments.length === 0) {
    return ppt.deptAssignments.length > 0 ? "user_assignment" : "dept_assignment";
  }

  if (userAssignments.every(ua => ua.status === "final_approved")) {
    return "approved";
  }

  if (userAssignments.some(ua => ua.status === "dept_approved")) {
    return "final_reviewing";
  }

  if (userAssignments.some(ua => ua.status === "submitted")) {
    return "dept_reviewing";
  }

  if (allAssigned) {
    return "in_progress";
  }

  return "user_assignment";
}

function syncPptTask(task: Task): Task {
  if (!task.pptWorkflow) {
    return task;
  }

  const totalUserAssignments = task.pptWorkflow.deptAssignments.flatMap(dept => dept.userAssignments).length;
  const finalApprovedCount = task.pptWorkflow.deptAssignments
    .flatMap(dept => dept.userAssignments)
    .filter(ua => ua.status === "final_approved").length;
  const nextStage = derivePptStage(task.pptWorkflow);

  return {
    ...task,
    totalAssignees: totalUserAssignments || task.totalAssignees,
    completedCount: finalApprovedCount,
    status: totalUserAssignments > 0 && finalApprovedCount === totalUserAssignments ? "completed" : "in_progress",
    pptWorkflow: {
      ...task.pptWorkflow,
      stage: nextStage,
    },
  };
}

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, "id" | "createdAt" | "completedCount" | "status">) => string;
  getTaskById: (taskId: string) => Task | undefined;
  getTasksForEmployee: (employeeName: string) => { task: Task; assignee: Assignee }[];
  submitWork: (taskId: string, assigneeId: string, submission: Omit<Submission, "id" | "status">) => void;
  reviewSubmission: (taskId: string, assigneeId: string, submissionId: string, approved: boolean, feedback?: string) => void;
  deleteTask: (taskId: string) => void;
  // PPT 工作流操作
  submitPptWork: (taskId: string, deptId: string, userAssignmentId: string, data: {
    fileName: string; fileSize: number; fileUrl?: string; note?: string; baseVersion: number;
  }) => { hasConflict: boolean; conflictDescription?: string };
  reviewPptWork: (taskId: string, deptId: string, userAssignmentId: string, submissionId: string, approved: boolean, feedback?: string) => void;
  finalApprovePptWork: (taskId: string, deptId: string, userAssignmentId: string, approved: boolean, feedback?: string) => void;
  assignPptPagesToUser: (taskId: string, deptId: string, assignment: Omit<PptUserAssignment, "id" | "status" | "submissions">) => void;
  advancePptStage: (taskId: string, toStage: PptStage) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

// Initial demo data
// 模板文件URL（本地服务可访问）
const DEMO_PPT_URL = "http://host.docker.internal:8080/data/集团战略发展规划演示文稿模板.pptx";
const DEMO_Q1_PPT_URL = "http://host.docker.internal:8080/data/集团Q1季度总结演示文稿模板.pptx";
const DEMO_WORD_URL = "http://host.docker.internal:8080/data/业务流程数字化转型实施指南模板.docx";
const DEMO_EXCEL_URL = "http://host.docker.internal:8080/data/预算汇总模板.xlsx";

const initialTasks: Task[] = [
  {
    id: "task-1",
    title: "2026年度集团战略发展规划演示文稿",
    type: "例会资料",
    department: "全公司",
    createdAt: "2026-03-01",
    deadline: "2026-03-30 18:00",
    createdBy: "王总",
    createdByAvatar: "王",
    templateFileName: "集团战略发展规划演示文稿模板.pptx",
    templateFileSize: 5.8,
    templatePageCount: 30,
    templateFileUrl: DEMO_PPT_URL,
    totalAssignees: 6,
    completedCount: 2,
    status: "in_progress",
    assignees: [
      {
        id: "a1",
        memberId: "user-1",
        name: "张明",
        avatar: "张",
        department: "技术部",
        taskDescription: "负责第1-5页：数字化转型核心技术架构方案",
        pageRange: "1-5",
        status: "submitted",
        submissions: [{
          id: "sub-1",
          fileName: "技术架构_张明.pptx",
          fileSize: 1.2,
          fileUrl: DEMO_PPT_URL,
          submittedAt: "2026-03-08 14:30",
          note: "已完成初步架构设计",
          status: "pending"
        }]
      },
      {
        id: "a2",
        memberId: "user-2",
        name: "李华",
        avatar: "李",
        department: "技术部",
        taskDescription: "负责第6-10页：AI实验室建设及研发资源投入规划",
        pageRange: "6-10",
        status: "pending",
        submissions: []
      },
      {
        id: "a3",
        memberId: "user-3",
        name: "王芳",
        avatar: "王",
        department: "产品部",
        taskDescription: "负责第11-15页：核心产品演进路线与市场竞争分析",
        pageRange: "11-15",
        status: "approved",
        submissions: [{
          id: "sub-2",
          fileName: "产品路线_王芳.pptx",
          fileSize: 1.5,
          fileUrl: DEMO_PPT_URL,
          submittedAt: "2026-03-05 10:00",
          status: "approved",
          feedback: "规划清晰，准予通过",
          feedbackAt: "2026-03-05 15:00"
        }]
      },
      {
        id: "a4",
        memberId: "user-4",
        name: "赵强",
        avatar: "赵",
        department: "市场部",
        taskDescription: "负责第16-20页：全球全渠道营销策略及品牌建设",
        pageRange: "16-20",
        status: "pending",
        submissions: []
      },
      {
        id: "a5",
        memberId: "user-5",
        name: "陈静",
        avatar: "陈",
        department: "运营部",
        taskDescription: "负责第21-25页：精细化运营体系与用户留存方案",
        pageRange: "21-25",
        status: "pending",
        submissions: []
      },
      {
        id: "a6",
        memberId: "user-6",
        name: "刘洋",
        avatar: "刘",
        department: "产品部",
        taskDescription: "负责第26-30页：年度经营目标拆解与各中心里程碑",
        pageRange: "26-30",
        status: "pending",
        submissions: []
      }
    ],
    // PPT 拆分合并工作流数据
    pptWorkflow: {
      stage: "in_progress",
      totalPages: 30,
      // 当前各页最新版本（0=未提交）
      pageVersions: {
        1:1, 2:1, 3:1, 4:1, 5:1, 6:1, 7:1, 8:1, 9:1, 10:1,  // 张明+李华已提交
        11:1, 12:1, 13:1, 14:1,                                 // 陈静已提交
        15:1,                                                    // 李华提交了v1（冲突中心）
        16:1, 17:1, 18:1, 19:1, 20:1,                          // 刘洋已提交
      },
      deptAssignments: [
        {
          id: "da-1",
          department: "设备室",
          // 注意：页面15在两个部门都有分配（冲突场景）
          pages: [1,2,3,4,5,6,7,8,9,10,15],
          headUserId: "user-3",
          headUserName: "王芳",
          status: "in_progress",
          userAssignments: [
            {
              id: "ua-1",
              userId: "user-1",
              userName: "张明",
              userAvatar: "张",
              department: "设备室",
              pages: [1,3,5,7,9],  // 跳跃式分配：第1、3、5、7、9页
              taskDescription: "负责设备管理系统架构设计",
              status: "dept_approved",
              submissions: [{
                id: "ps-1",
                submittedBy: "张明",
                submittedById: "user-1",
                department: "设备室",
                submittedAt: "2026-04-20 10:30",
                fileName: "张明_第1357910页_初稿.pptx",
                fileSize: 1.2,
                version: 1,
                baseVersion: 0,
                status: "approved",
                feedback: "内容完整，格式规范，室主任审核通过",
                feedbackAt: "2026-04-21 09:00",
                hasConflict: false,
              }]
            },
            {
              id: "ua-2",
              userId: "user-2",
              userName: "李华",
              userAvatar: "李",
              department: "设备室",
              pages: [2,4,6,8,10,15],
              taskDescription: "负责设备维护流程优化方案",
              status: "submitted",
              submissions: [
                {
                  id: "ps-2",
                  submittedBy: "李华",
                  submittedById: "user-2",
                  department: "设备室",
                  submittedAt: "2026-04-18 15:00",
                  fileName: "李华_第2468010页.pptx",
                  fileSize: 1.5,
                  version: 1,
                  baseVersion: 0,
                  status: "pending",
                  hasConflict: false,
                },
                {
                  id: "ps-3",
                  submittedBy: "李华",
                  submittedById: "user-2",
                  department: "设备室",
                  submittedAt: "2026-04-19 11:00",
                  fileName: "李华_第15页_封面设计.pptx",
                  fileSize: 0.8,
                  version: 1,
                  baseVersion: 0,
                  status: "pending",
                  hasConflict: false,
                }
              ]
            }
          ]
        },
        {
          id: "da-2",
          department: "生产厂",
          // 页面15也在这里：制造冲突场景
          pages: [11,12,13,14,15,16,17,18,19,20],
          headUserId: "user-6",
          headUserName: "刘洋",
          status: "in_progress",
          userAssignments: [
            {
              id: "ua-3",
              userId: "user-5",
              userName: "陈静",
              userAvatar: "陈",
              department: "生产厂",
              pages: [11,12,13,14],
              status: "submitted",
              submissions: [{
                id: "ps-4",
                submittedBy: "陈静",
                submittedById: "user-5",
                department: "生产厂",
                submittedAt: "2026-04-20 14:00",
                fileName: "陈静_第11到14页.pptx",
                fileSize: 1.1,
                version: 1,
                baseVersion: 0,
                status: "pending",
                hasConflict: false,
              }]
            },
            {
              id: "ua-4",
              userId: "user-6",
              userName: "刘洋",
              userAvatar: "刘",
              department: "生产厂",
              pages: [15,16,17,18,19,20],
              status: "submitted",
              submissions: [
                {
                  id: "ps-5",
                  submittedBy: "刘洋",
                  submittedById: "user-6",
                  department: "生产厂",
                  submittedAt: "2026-04-20 16:00",
                  fileName: "刘洋_第16到20页.pptx",
                  fileSize: 1.3,
                  version: 1,
                  baseVersion: 0,
                  status: "pending",
                  hasConflict: false,
                },
                {
                  id: "ps-6",
                  submittedBy: "刘洋",
                  submittedById: "user-6",
                  department: "生产厂",
                  submittedAt: "2026-04-20 16:35",
                  fileName: "刘洋_第15页_生产厂版本.pptx",
                  fileSize: 0.9,
                  version: 2,  // 这将成为第15页的v2（若合并将覆盖李华的v1）
                  baseVersion: 0,  // 基于原始模板v0，但李华已提交v1！
                  status: "pending",
                  hasConflict: true,
                  conflictDescription: "⚠️ 第15页已由 李华（设备部）于 2026-04-19 11:00 提交 v1 版本。本次提交基于原始模板（v0），若合并将直接覆盖设备部已审批通过的内容，存在数据丢失风险。建议先下载最新版本后再编辑。",
                }
              ]
            }
          ]
        },
        {
          id: "da-3",
          department: "综合管理组",
          pages: [21,22,23,24,25,26,27,28,29,30],
          headUserId: "user-4",
          headUserName: "赵强",
          status: "pending",
          userAssignments: []
        }
      ]
    }
  },
  {
    id: "task-2",
    title: "2026年度业务流程数字化转型实施指南",
    type: "对标找差",
    department: "全公司",
    createdAt: "2026-03-02",
    deadline: "2026-04-10 12:00",
    createdBy: "李经理",
    createdByAvatar: "李",
    templateFileName: "业务流程数字化转型实施指南模板.docx",
    templateFileSize: 2.1,
    templatePageCount: 12,
    templateFileUrl: DEMO_WORD_URL,
    totalAssignees: 6,
    completedCount: 1,
    status: "in_progress",
    assignees: [
      {
        id: "b1",
        memberId: "user-1",
        name: "张明",
        avatar: "张",
        department: "技术部",
        taskDescription: "负责自动化办公系统集成标准说明",
        status: "approved",
        submissions: [{
          id: "sub-3",
          fileName: "集成标准_张明.docx",
          fileSize: 0.8,
          fileUrl: DEMO_WORD_URL,
          submittedAt: "2026-03-06 11:30",
          status: "approved",
          feedback: "方案详尽，通过",
          feedbackAt: "2026-03-06 14:00"
        }]
      },
      { id: "b2", memberId: "user-2", name: "李华", avatar: "李", department: "技术部", taskDescription: "负责数据隐私保护与合规性审查指引", status: "pending", submissions: [] },
      { id: "b3", memberId: "user-3", name: "王芳", avatar: "王", department: "产品部", taskDescription: "负责产品开发闭环管理流程优化说明", status: "pending", submissions: [] },
      { id: "b4", memberId: "user-4", name: "赵强", avatar: "赵", department: "市场部", taskDescription: "负责市场营销活动数字化监测标准", status: "pending", submissions: [] },
      { id: "b5", memberId: "user-5", name: "陈静", avatar: "陈", department: "运营部", taskDescription: "负责跨部门协同效率提升考核指标", status: "pending", submissions: [] },
      { id: "b6", memberId: "user-6", name: "刘洋", avatar: "刘", department: "产品部", taskDescription: "负责用户反馈快速响应机制说明", status: "pending", submissions: [] }
    ]
  },
  {
    id: "task-3",
    title: "2026年度集团全业务线研发与运营预算汇总表",
    type: "标杆机组评价",
    department: "财务部",
    createdAt: "2026-03-05",
    deadline: "2026-03-25 10:00",
    createdBy: "陈总",
    createdByAvatar: "陈",
    templateFileName: "预算汇总模板.xlsx",
    templateFileUrl: DEMO_EXCEL_URL,
    totalAssignees: 6,
    completedCount: 0,
    status: "in_progress",
    assignees: [
      { id: "c1", memberId: "user-1", name: "张明", avatar: "张", department: "技术部", taskDescription: "汇报：运维部年度服务器及算力开支明细", status: "pending", submissions: [] },
      { id: "c2", memberId: "user-2", name: "李华", avatar: "李", department: "技术部", taskDescription: "汇报：智能实验室设备采购及硬件耗材清单", status: "pending", submissions: [] },
      { id: "c3", memberId: "user-3", name: "王芳", avatar: "王", department: "产品部", taskDescription: "汇报：产品线第三方专业咨询与技术服务费", status: "pending", submissions: [] },
      { id: "c4", memberId: "user-4", name: "赵强", avatar: "赵", department: "市场部", taskDescription: "汇报：年度全球巡展与广告渠道投放预算", status: "pending", submissions: [] },
      { id: "c5", memberId: "user-5", name: "陈静", avatar: "陈", department: "运营部", taskDescription: "汇报：运营系统支撑及外包服务人力成本", status: "pending", submissions: [] },
      { id: "c6", memberId: "user-6", name: "刘洋", avatar: "刘", department: "产品部", taskDescription: "汇报：差旅与业务公关预算汇总说明", status: "pending", submissions: [] }
    ]
  }
];

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(() => initialTasks.map(syncPptTask));

  const addTask = (taskData: Omit<Task, "id" | "createdAt" | "completedCount" | "status">): string => {
    const newId = `task-${Date.now()}`;
    const autoWorkflow: PptWorkflow | undefined = taskData.type === "例会资料"
      ? {
          stage: "dept_assignment",
          totalPages: taskData.templatePageCount ?? 10,
          deptAssignments: (taskData.pptWorkflow?.deptAssignments ?? []),
          pageVersions: {},
        }
      : undefined;
    const newTask: Task = {
      ...taskData,
      id: newId,
      createdAt: new Date().toISOString().split('T')[0],
      completedCount: 0,
      status: "in_progress",
      pptWorkflow: autoWorkflow ?? taskData.pptWorkflow,
    };
    setTasks(prev => [syncPptTask(newTask), ...prev]);
    return newId;
  };

  const getTaskById = (taskId: string) => {
    return tasks.find(t => t.id === taskId);
  };

  const getTasksForEmployee = (employeeName: string) => {
    const result: { task: Task; assignee: Assignee }[] = [];
    tasks.forEach(task => {
      const assignee = task.assignees.find(a => a.name === employeeName);
      if (assignee) {
        result.push({ task, assignee });
      }
    });
    return result;
  };

  const submitWork = (taskId: string, assigneeId: string, submission: Omit<Submission, "id" | "status">) => {
    setTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task;

      return {
        ...task,
        assignees: task.assignees.map(assignee => {
          if (assignee.id !== assigneeId) return assignee;

          return {
            ...assignee,
            status: "submitted" as const,
            submissions: [
              ...assignee.submissions,
              {
                ...submission,
                id: `sub-${Date.now()}`,
                status: "pending" as const,
              }
            ]
          };
        })
      };
    }));
  };

  const reviewSubmission = (
    taskId: string,
    assigneeId: string,
    submissionId: string,
    approved: boolean,
    feedback?: string
  ) => {
    setTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task;

      let newCompletedCount = task.completedCount;

      const updatedAssignees = task.assignees.map(assignee => {
        if (assignee.id !== assigneeId) return assignee;

        const updatedSubmissions = assignee.submissions.map(sub => {
          if (sub.id !== submissionId) return sub;
          return {
            ...sub,
            status: approved ? "approved" as const : "rejected" as const,
            feedback: feedback || (approved ? "准予通过" : ""),
            feedbackAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          };
        });

        const newStatus = approved ? "approved" as const : "rejected" as const;

        // Update completed count
        if (approved && assignee.status !== "approved") {
          newCompletedCount++;
        }

        return {
          ...assignee,
          status: newStatus,
          submissions: updatedSubmissions,
        };
      });

      return {
        ...task,
        completedCount: newCompletedCount,
        assignees: updatedAssignees,
      };
    }));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  // ===================== PPT 工作流操作 =====================

  const submitPptWork = (
    taskId: string,
    deptId: string,
    userAssignmentId: string,
    data: { fileName: string; fileSize: number; fileUrl?: string; note?: string; baseVersion: number }
  ): { hasConflict: boolean; conflictDescription?: string } => {
    let hasConflict = false;
    let conflictDescription: string | undefined;

    setTasks(prev => prev.map(task => {
      if (task.id !== taskId || !task.pptWorkflow) return task;
      const ppt = task.pptWorkflow;

      const updatedDepts = ppt.deptAssignments.map(dept => {
        if (dept.id !== deptId) return dept;
        const updatedUsers = dept.userAssignments.map(ua => {
          if (ua.id !== userAssignmentId) return ua;

          // 冲突检测：检查当前用户的任意页面是否已被他人提交更高版本
          const conflictPages: number[] = [];
          for (const page of ua.pages) {
            const currentVer = ppt.pageVersions[page] || 0;
            if (currentVer > data.baseVersion) {
              // 找出谁提交了这一页的当前版本
              const conflictUser = findPageSubmitter(ppt, page, ua.userId);
              conflictPages.push(page);
              if (!hasConflict) {
                hasConflict = true;
                conflictDescription = `⚠️ 第${formatPageRange(conflictPages)}页已由 ${conflictUser} 提交了更新版本（v${currentVer}），您的提交基于 v${data.baseVersion}，可能覆盖已有内容。建议下载最新版本后重新编辑。`;
              }
            }
          }

          const newVersion = Math.max(...ua.pages.map(p => ppt.pageVersions[p] || 0)) + 1;
          const newSubmission: PptPageSubmission = {
            id: `ps-${Date.now()}`,
            submittedBy: ua.userName,
            submittedById: ua.userId,
            department: dept.department,
            submittedAt: new Date().toLocaleString("zh-CN"),
            fileName: data.fileName,
            fileSize: data.fileSize,
            fileUrl: data.fileUrl,
            note: data.note,
            version: newVersion,
            baseVersion: data.baseVersion,
            status: "pending",
            hasConflict,
            conflictDescription: hasConflict ? conflictDescription : undefined,
          };

          return {
            ...ua,
            status: "submitted" as const,
            submissions: [...ua.submissions, newSubmission],
          };
        });

        return { ...dept, status: "in_progress" as const, userAssignments: updatedUsers };
      });

      // 更新 pageVersions（提交的用户的页面版本+1）
      const submitter = ppt.deptAssignments
        .find(d => d.id === deptId)?.userAssignments
        .find(ua => ua.id === userAssignmentId);
      const newVersions = { ...ppt.pageVersions };
      if (submitter) {
        for (const page of submitter.pages) {
          newVersions[page] = (newVersions[page] || 0) + 1;
        }
      }

      return syncPptTask({
        ...task,
        pptWorkflow: { ...ppt, deptAssignments: updatedDepts, pageVersions: newVersions },
      });
    }));

    return { hasConflict, conflictDescription };
  };

  function findPageSubmitter(ppt: PptWorkflow, page: number, excludeUserId: string): string {
    for (const dept of ppt.deptAssignments) {
      for (const ua of dept.userAssignments) {
        if (ua.userId === excludeUserId) continue;
        for (const sub of ua.submissions) {
          if (ua.pages.includes(page) && sub.status !== "rejected") {
            return `${ua.userName}（${dept.department}）`;
          }
        }
      }
    }
    return "其他人员";
  }

  const reviewPptWork = (
    taskId: string,
    deptId: string,
    userAssignmentId: string,
    submissionId: string,
    approved: boolean,
    feedback?: string
  ) => {
    setTasks(prev => prev.map(task => {
      if (task.id !== taskId || !task.pptWorkflow) return task;
      const ppt = task.pptWorkflow;
      const updatedDepts = ppt.deptAssignments.map(dept => {
        if (dept.id !== deptId) return dept;
        const updatedUsers = dept.userAssignments.map(ua => {
          if (ua.id !== userAssignmentId) return ua;
          const updatedSubs = ua.submissions.map(sub => {
            if (sub.id !== submissionId) return sub;
            return {
              ...sub,
              status: approved ? "approved" as const : "rejected" as const,
              feedback: feedback || (approved ? "审核通过" : ""),
              feedbackAt: new Date().toLocaleString("zh-CN"),
            };
          });
          // 室主任审核通过后，状态变为 dept_approved（等待部长审批）
          // 驳回：直接退回给提交人，状态重置为 "rejected"（提交人可重新提交）
          const newStatus = approved ? "dept_approved" as const : "rejected" as const;
          return { ...ua, status: newStatus, submissions: updatedSubs };
        });
        // 检查部门所有用户是否都已通过室主任审核
        const allDeptApproved = updatedUsers.every(ua => ua.status === "dept_approved" || ua.status === "final_approved");
        return {
          ...dept,
          status: allDeptApproved ? "dept_approved" as const : "in_progress" as const,
          userAssignments: updatedUsers,
        };
      });
      return syncPptTask({ ...task, pptWorkflow: { ...ppt, deptAssignments: updatedDepts } });
    }));
  };

  const finalApprovePptWork = (
    taskId: string,
    deptId: string,
    userAssignmentId: string,
    approved: boolean,
    feedback?: string
  ) => {
    setTasks(prev => prev.map(task => {
      if (task.id !== taskId || !task.pptWorkflow) return task;
      const ppt = task.pptWorkflow;
      const updatedDepts = ppt.deptAssignments.map(dept => {
        if (dept.id !== deptId) return dept;
        const updatedUsers = dept.userAssignments.map(ua => {
          if (ua.id !== userAssignmentId) return ua;
          // 部长审批：通过则 final_approved，驳回则退回 rejected
          const newStatus = approved ? "final_approved" as const : "rejected" as const;
          // 更新最新提交的审核状态
          const updatedSubs = ua.submissions.map((sub, idx, arr) => {
            if (idx !== arr.length - 1) return sub; // 只更新最新一条
            return {
              ...sub,
              status: approved ? "approved" as const : "rejected" as const,
              feedback: feedback || (approved ? "部长审批通过" : ""),
              feedbackAt: new Date().toLocaleString("zh-CN"),
            };
          });
          return { ...ua, status: newStatus, submissions: updatedSubs };
        });
        const allFinalApproved = updatedUsers.every(ua => ua.status === "final_approved");
        return {
          ...dept,
          status: allFinalApproved ? "final_approved" as const : "in_progress" as const,
          userAssignments: updatedUsers,
        };
      });
      return syncPptTask({ ...task, pptWorkflow: { ...ppt, deptAssignments: updatedDepts } });
    }));
  };

  const assignPptPagesToUser = (
    taskId: string,
    deptId: string,
    assignment: Omit<PptUserAssignment, "id" | "status" | "submissions">
  ) => {
    setTasks(prev => prev.map(task => {
      if (task.id !== taskId || !task.pptWorkflow) return task;
      const ppt = task.pptWorkflow;
      const updatedDepts = ppt.deptAssignments.map(dept => {
        if (dept.id !== deptId) return dept;
        // 检查是否已有该用户的分配
        const exists = dept.userAssignments.find(ua => ua.userId === assignment.userId);
        const newAssignment: PptUserAssignment = {
          ...assignment,
          id: `ua-${Date.now()}`,
          status: "pending",
          submissions: [],
        };
        return {
          ...dept,
          status: "in_progress" as const,
          userAssignments: exists
            ? dept.userAssignments.map(ua => ua.userId === assignment.userId ? {
                ...ua,
                pages: assignment.pages,
                taskDescription: assignment.taskDescription,
              } : ua)
            : [...dept.userAssignments, newAssignment],
        };
      });
      return syncPptTask({ ...task, pptWorkflow: { ...ppt, deptAssignments: updatedDepts } });
    }));
  };

  const advancePptStage = (taskId: string, toStage: PptStage) => {
    setTasks(prev => prev.map(task => {
      if (task.id !== taskId || !task.pptWorkflow) return task;

      const mergedPreviewUrl = toStage === "merged"
        ? task.pptWorkflow.deptAssignments
            .flatMap(dept => dept.userAssignments)
            .filter(ua => ua.status === "final_approved")
            .flatMap(ua => ua.submissions)
            .map(sub => sub.fileUrl)
            .filter((fileUrl): fileUrl is string => !!fileUrl)
            .slice(-1)[0] || task.pptWorkflow.templateFileUrl || task.pptWorkflow.mergedFileUrl
        : task.pptWorkflow.mergedFileUrl;

      return syncPptTask({
        ...task,
        pptWorkflow: {
          ...task.pptWorkflow,
          stage: toStage,
          mergedFileUrl: mergedPreviewUrl,
        },
      });
    }));
  };

  return (
    <TaskContext.Provider value={{
      tasks,
      addTask,
      getTaskById,
      getTasksForEmployee,
      submitWork,
      reviewSubmission,
      deleteTask,
      submitPptWork,
      reviewPptWork,
      finalApprovePptWork,
      assignPptPagesToUser,
      advancePptStage,
    }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTaskContext must be used within a TaskProvider");
  }
  return context;
}
