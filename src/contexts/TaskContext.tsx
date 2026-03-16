import React, { createContext, useContext, useState, ReactNode } from "react";

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

export interface Task {
  id: string;
  title: string;
  type: "周报" | "月报" | "年报" | "专项报告";
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
}

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, "id" | "createdAt" | "completedCount" | "status">) => void;
  getTaskById: (taskId: string) => Task | undefined;
  getTasksForEmployee: (employeeName: string) => { task: Task; assignee: Assignee }[];
  submitWork: (taskId: string, assigneeId: string, submission: Omit<Submission, "id" | "status">) => void;
  reviewSubmission: (taskId: string, assigneeId: string, submissionId: string, approved: boolean, feedback?: string) => void;
  deleteTask: (taskId: string) => void;
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
    type: "专项报告",
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
    ]
  },
  {
    id: "task-2",
    title: "2026年度业务流程数字化转型实施指南",
    type: "月报",
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
    type: "专项报告",
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
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const addTask = (taskData: Omit<Task, "id" | "createdAt" | "completedCount" | "status">) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      completedCount: 0,
      status: "in_progress",
    };
    setTasks(prev => [newTask, ...prev]);
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

  return (
    <TaskContext.Provider value={{
      tasks,
      addTask,
      getTaskById,
      getTasksForEmployee,
      submitWork,
      reviewSubmission,
      deleteTask
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
