import type { Task } from "@/types/task";

export interface PptCollabFormProps {
  task: Task;
  onSuccess: (updatedTask?: Task) => void;
  onError?: (error: Error) => void;
  /** 模板文件总页数（由 DeptAssignPage 上传模板后传入） */
  totalPages?: number;
  /** 模板文件 ID（由 DeptAssignPage 上传模板后传入） */
  templateFileId?: string;
}
