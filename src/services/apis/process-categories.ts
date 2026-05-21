import { http } from "@/services/http/axios";

const { baseURL } = window.__requestConfig;
const categoriesURL = `${baseURL}/api/v1/process-categories`;

/** 流程类别项 */
export interface ProcessCategoryItem {
  code: string;
  name: string;
  processKey: string;
  processDefinitionId?: string;
  scoreSchema?: Record<string, unknown> | null;
  outputFormats?: string[];
  sortOrder: number;
}

/** 分组后的流程类别 */
export interface ProcessCategoryGroup {
  menuGroup: string;
  items: ProcessCategoryItem[];
}

/**
 * 按菜单分组获取流程类别
 * GET /process-categories/grouped?activeOnly=true
 */
export const getProcessCategoriesGroupedApi = (params?: {
  activeOnly?: boolean;
}) => {
  return http.get<ProcessCategoryGroup[]>(`${categoriesURL}/grouped`, {
    params: { activeOnly: params?.activeOnly ?? true },
  });
};
