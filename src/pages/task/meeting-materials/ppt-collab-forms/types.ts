import type { Task } from "@/types/task";

export interface PptCollabFormProps {
  task: Task;
  onSuccess: (updatedTask?: Task) => void;
  onError?: (error: Error) => void;
  /** 模板文件总页数（由 DeptAssignPage 上传模板后传入） */
  totalPages?: number;
  /** 模板文件 ID（由 DeptAssignPage 上传模板后传入） */
  templateFileId?: string;
  /** 只读模式：当前用户不是 assignee，不能操作 */
  readOnly?: boolean;
  /** 切换左侧预览文件（合并节点用，传入 fileId） */
  onPreviewFile?: (fileId: string) => void;
}
