import { http } from "@/services/http/axios";

const { baseURL } = window.__requestConfig;
const filesURL = `${baseURL}/api/v1/files`;

// ─── 类型定义 ───────────────────────────────────────────────

export interface UploadFileResponse {
  fileId: string;
  fileName: string;
  fileUrl?: string;
  fileSize?: number;
  contentType?: string;
  pageCount?: number;
  category?: string;
  uploadedAt?: string;
}

// ─── 工具函数 ───────────────────────────────────────────────

/**
 * 从 fileUrl 中反解 fileId
 */
export const extractFileIdFromUrl = (fileUrl?: string): string | undefined => {
  if (!fileUrl) return undefined;
  const match = fileUrl.match(/\/files\/([^/?#]+)/);
  return match?.[1];
};

/**
 * 获取文件下载 URL
 */
export const getFileDownloadUrl = (fileId?: string, options?: { uaId?: string }) => {
  if (!fileId) return undefined;

  const base = `${filesURL}/${fileId}`;
  if (options?.uaId) {
    return `${base}?ua_id=${encodeURIComponent(options.uaId)}`;
  }

  return base;
};

/**
 * 获取文件预览 URL（PDF 流，可直接嵌入 iframe）
 */
export const getFilePreviewUrl = (fileId: string) => {
  return `${filesURL}/${fileId}/preview`;
};

// ─── API 接口 ───────────────────────────────────────────────

/**
 * 上传文件
 * POST /api/v1/files/upload
 */
export const uploadFileApi = (params: {
  file: File;
  category?: string;
}) => {
  const formData = new FormData();
  formData.append("file", params.file);

  if (params.category) {
    formData.append("category", params.category);
  }

  return http.post<UploadFileResponse>(`${filesURL}/upload`, formData);
};

/**
 * 下载文件
 * GET /api/v1/files/{file_id}
 */
export const downloadFileApi = (fileId: string) => {
  return http.get<Blob>(`${filesURL}/${fileId}`, {
    responseType: "blob",
  });
};

/**
 * 预览文件（返回 PDF Blob）
 * GET /api/v1/files/{file_id}/preview
 */
export const fetchFilePreviewBlob = async (fileId: string): Promise<Blob> => {
  return http.get<Blob>(`${filesURL}/${fileId}/preview`, {
    responseType: "blob",
  });
};

/**
 * 删除文件
 * DELETE /api/v1/files/{file_id}
 */
export const deleteFileApi = (fileId: string) => {
  return http.delete<void>(`${filesURL}/${fileId}`);
};
