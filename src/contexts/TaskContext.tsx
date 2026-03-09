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
const DEMO_PPT_URL = "http://host.docker.internal:8080/data/工作报告ppt模板.pptx";
const DEMO_WORD_URL = "http://host.docker.internal:8080/data/国家电网公司关于电网建设项目档案管理情况的汇报.doc";
const DEMO_EXCEL_URL = "http://host.docker.internal:8080/data/电力技术文档问答对及其上下文.xlsx";

const initialTasks: Task[] = [
  {
    id: "task-1",
    title: "Q1季度汇报PPT",
    type: "专项报告",
    department: "技术部",
    createdAt: "2026-03-01",
    deadline: "2026-03-30 18:00",
    createdBy: "王总",
    createdByAvatar: "王",
    templateFileName: "Q1季度模板.pptx",
    templateFileSize: 2.5,
    templatePageCount: 15,
    templateFileUrl: DEMO_PPT_URL,
    totalAssignees: 5,
    completedCount: 2,
    status: "in_progress",
    assignees: [
      {
        id: "a1",
        memberId: "1",
        name: "张明",
        avatar: "张",
        department: "技术部",
        taskDescription: "负责第1-3页：公司简介与业务概述",
        pageRange: "1-3",
        status: "submitted",
        submissions: [
          {
            id: "sub-1",
            fileName: "公司简介_张明.pptx",
            fileSize: 1.2,
            fileUrl: DEMO_PPT_URL,
            submittedAt: "2026-03-10 14:30",
            note: "已完成公司简介部分",
            status: "pending",
          }
        ]
      },
      {
        id: "a2",
        memberId: "2",
        name: "李华",
        avatar: "李",
        department: "技术部",
        taskDescription: "负责第4-6页：财务数据与分析",
        pageRange: "4-6",
        status: "pending",
        submissions: []
      },
      {
        id: "a3",
        memberId: "3",
        name: "王芳",
        avatar: "王",
        department: "产品部",
        taskDescription: "负责第7-9页：市场趋势分析",
        pageRange: "7-9",
        status: "approved",
        submissions: [
          {
            id: "sub-2",
            fileName: "市场分析_王芳.pptx",
            fileSize: 1.5,
            fileUrl: DEMO_PPT_URL,
            submittedAt: "2026-03-05 10:00",
            status: "approved",
            feedback: "内容完整，准予通过",
            feedbackAt: "2026-03-05 15:00"
          }
        ]
      },
      {
        id: "a5",
        memberId: "5",
        name: "陈静",
        avatar: "陈",
        department: "运营部",
        taskDescription: "负责第13-15页：总结与致谢",
        pageRange: "13-15",
        status: "rejected",
        submissions: [
          {
            id: "sub-4",
            fileName: "总结_陈静.pptx",
            fileSize: 0.8,
            fileUrl: DEMO_PPT_URL,
            submittedAt: "2026-03-07 09:00",
            status: "rejected",
            feedback: "数据有误，请核实后重新提交",
            feedbackAt: "2026-03-07 11:00"
          }
        ]
      }
    ]
  },
  // {
  //   id: "task-2",
  //   title: "产品功能演示",
  //   type: "月报",
  //   department: "产品部",
  //   createdAt: "2026-03-02",
  //   deadline: "2026-05-20 12:00",
  //   createdBy: "李经理",
  //   createdByAvatar: "李",
  //   templateFileName: "产品演示模板.pptx",
  //   templateFileSize: 3.2,
  //   templatePageCount: 12,
  //   templateFileUrl: DEMO_PPT_URL,
  //   totalAssignees: 3,
  //   completedCount: 1,
  //   status: "in_progress",
  //   assignees: [
  //     {
  //       id: "b1",
  //       memberId: "6",
  //       name: "刘洋",
  //       avatar: "刘",
  //       department: "产品部",
  //       taskDescription: "负责第1-4页：产品核心功能介绍",
  //       pageRange: "1-4",
  //       status: "approved",
  //       submissions: [
  //         {
  //           id: "sub-5",
  //           fileName: "核心功能_刘洋.pptx",
  //           fileSize: 2.1,
  //           fileUrl: DEMO_PPT_URL,
  //           submittedAt: "2026-03-08 11:30",
  //           status: "approved",
  //           feedback: "演示清晰，通过",
  //           feedbackAt: "2026-03-08 14:00"
  //         }
  //       ]
  //     },
  //     {
  //       id: "b2",
  //       memberId: "7",
  //       name: "周婷",
  //       avatar: "周",
  //       department: "产品部",
  //       taskDescription: "负责第5-8页：用户操作流程演示",
  //       pageRange: "5-8",
  //       status: "pending",
  //       submissions: []
  //     }
  //   ]
  // },
  {
    id: "task-3",
    title: "电网建设项目档案管理汇报",
    type: "专项报告",
    department: "技术部",
    createdAt: "2026-03-05",
    deadline: "2026-05-25 18:00",
    createdBy: "张总",
    createdByAvatar: "张",
    templateFileName: "档案管理汇报.doc",
    templateFileUrl: DEMO_WORD_URL,
    totalAssignees: 2,
    completedCount: 0,
    status: "in_progress",
    assignees: [
      {
        id: "c1",
        memberId: "1",
        name: "张明",
        avatar: "张",
        department: "技术部",
        taskDescription: "负责完善文档内容",
        status: "pending",
        submissions: []
      },
      {
        id: "c2",
        memberId: "2",
        name: "李华",
        avatar: "李",
        department: "技术部",
        taskDescription: "负责校对文档格式",
        status: "pending",
        submissions: []
      }
    ]
  },
  {
    id: "task-4",
    title: "电力技术文档问答数据分析",
    type: "月报",
    department: "数据部",
    createdAt: "2026-03-10",
    deadline: "2026-05-30 10:00",
    createdBy: "刘经理",
    createdByAvatar: "刘",
    templateFileName: "问答数据分析.xlsx",
    templateFileUrl: DEMO_EXCEL_URL,
    totalAssignees: 2,
    completedCount: 0,
    status: "in_progress",
    assignees: [
      {
        id: "d1",
        memberId: "1",
        name: "张明",
        avatar: "张",
        department: "技术部",
        taskDescription: "负责数据清洗与汇总",
        status: "pending",
        submissions: []
      },
      {
        id: "d2",
        memberId: "2",
        name: "李华",
        avatar: "李",
        department: "技术部",
        taskDescription: "负责数据图表分析",
        status: "pending",
        submissions: []
      }
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
