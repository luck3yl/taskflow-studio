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
// 示例PPT文件URL（公开可访问的示例文件）
const DEMO_PPT_URL = "https://scholar.harvard.edu/files/torber/files/sample-slides.pptx";

const initialTasks: Task[] = [
  {
    id: "task-1",
    title: "Q4季度汇报PPT",
    type: "年报",
    department: "技术部",
    createdAt: "2024-01-10",
    deadline: "2024-01-15 18:00",
    createdBy: "王总",
    createdByAvatar: "王",
    templateFileName: "Q4季度模板.pptx",
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
            submittedAt: "2024-01-13 14:30",
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
            submittedAt: "2024-01-12 10:00",
            status: "approved",
            feedback: "内容完整，准予通过",
            feedbackAt: "2024-01-12 15:00"
          }
        ]
      },
      {
        id: "a4",
        memberId: "4",
        name: "赵强",
        avatar: "赵",
        department: "市场部",
        taskDescription: "负责第10-12页：未来规划",
        pageRange: "10-12",
        status: "approved",
        submissions: [
          {
            id: "sub-3",
            fileName: "未来规划_赵强.pptx",
            fileSize: 1.8,
            fileUrl: DEMO_PPT_URL,
            submittedAt: "2024-01-11 16:45",
            status: "approved",
            feedback: "准予通过",
            feedbackAt: "2024-01-11 18:00"
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
            submittedAt: "2024-01-13 09:00",
            status: "rejected",
            feedback: "数据有误，请核实后重新提交",
            feedbackAt: "2024-01-13 11:00"
          }
        ]
      }
    ]
  },
  {
    id: "task-2",
    title: "产品功能演示",
    type: "月报",
    department: "产品部",
    createdAt: "2024-01-08",
    deadline: "2024-01-18 12:00",
    createdBy: "李经理",
    createdByAvatar: "李",
    templateFileName: "产品演示模板.pptx",
    templateFileSize: 3.2,
    templatePageCount: 12,
    templateFileUrl: DEMO_PPT_URL,
    totalAssignees: 3,
    completedCount: 1,
    status: "in_progress",
    assignees: [
      {
        id: "b1",
        memberId: "6",
        name: "刘洋",
        avatar: "刘",
        department: "产品部",
        taskDescription: "负责第1-4页：产品核心功能介绍",
        pageRange: "1-4",
        status: "approved",
        submissions: [
          {
            id: "sub-5",
            fileName: "核心功能_刘洋.pptx",
            fileSize: 2.1,
            fileUrl: DEMO_PPT_URL,
            submittedAt: "2024-01-12 11:30",
            status: "approved",
            feedback: "演示清晰，通过",
            feedbackAt: "2024-01-12 14:00"
          }
        ]
      },
      {
        id: "b2",
        memberId: "7",
        name: "周婷",
        avatar: "周",
        department: "产品部",
        taskDescription: "负责第5-8页：用户操作流程演示",
        pageRange: "5-8",
        status: "pending",
        submissions: []
      },
      {
        id: "b3",
        memberId: "8",
        name: "吴磊",
        avatar: "吴",
        department: "产品部",
        taskDescription: "负责第9-12页：竞品对比分析",
        pageRange: "9-12",
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
