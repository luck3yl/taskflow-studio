import { http } from "@/services/http/axios";

const { baseURL } = window.__requestConfig;
const filesURL = `${baseURL}/api/v1/files`;

/**
 * 从 fileUrl 中反解 fileId
 * fileUrl 形如：${baseURL}/api/v1/files/{fileId} 或 ${baseURL}/api/v1/files/{fileId}?ua_id=xxx
 */
export const extractFileIdFromUrl = (fileUrl?: string): string | undefined => {
  if (!fileUrl) return undefined;
  const match = fileUrl.match(/\/files\/([^/?#]+)/);
  return match?.[1];
};

export const uploadFileApi = (params: {
  file: File;
  category?: string;
  metadata?: Record<string, unknown>;
}) => {
  const formData = new FormData();
  formData.append("file", params.file);

  if (params.category) {
    formData.append("category", params.category);
  }

  if (params.metadata) {
    formData.append("metadata", JSON.stringify(params.metadata));
  }

  return http.post<{
    fileId: string;
    fileName: string;
    fileUrl?: string;
    fileSize?: number;
    contentType?: string;
    pageCount?: number;
    category?: string;
    uploadedAt?: string;
  }>(`${filesURL}/upload`, formData);
};

export const getFilePreviewApi = (fileId: string) => {
  return http.get<{
    preview_url?: string;
    previewUrl?: string;
    pageCount?: number;
  }>(`${filesURL}/${fileId}/preview`);
};

/**
 * 拉取文件预览的 PDF 流（后端把 ppt/pptx/doc 等转成 PDF 后通过此接口返回）
 * 返回 Blob，前端可用 URL.createObjectURL 套到 iframe 里渲染
 */
export const fetchFilePreviewBlob = async (fileId: string): Promise<Blob> => {
  return http.get<Blob>(`${filesURL}/${fileId}/preview`, {
    responseType: "blob",
  });
};

export const getFileDownloadUrl = (fileId?: string, options?: { uaId?: string }) => {
  if (!fileId) return undefined;

  const url = new URL(`${filesURL}/${fileId}`);
  if (options?.uaId) {
    url.searchParams.set("ua_id", options.uaId);
  }

  return url.toString();
};
