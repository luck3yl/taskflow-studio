import { http } from "@/services/http/axios";

const { baseURL } = window.__requestConfig;
const filesURL = `${baseURL}/api/v1/files`;

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

export const getFileDownloadUrl = (fileId?: string, options?: { uaId?: string }) => {
  if (!fileId) return undefined;

  const url = new URL(`${filesURL}/${fileId}`);
  if (options?.uaId) {
    url.searchParams.set("ua_id", options.uaId);
  }

  return url.toString();
};
