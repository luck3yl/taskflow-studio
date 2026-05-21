import { http } from "@/services/http/axios";
import type {
  GroupDto,
  CreateGroupRequest,
  UpdateGroupRequest,
  GroupMemberDto,
} from "@/types/user";

const { baseURL } = window.__requestConfig;
const groupsURL = `${baseURL}/api/v1/groups`;

/** GET /groups */
export const getGroupsApi = (params?: {
  departmentId?: string;
  action?: string;
}) => {
  return http.get<GroupDto[]>(groupsURL, { params });
};

/** POST /groups — 需要 group:manage 权限 */
export const createGroupApi = (data: CreateGroupRequest) => {
  return http.post<GroupDto>(groupsURL, data);
};

/** PUT /groups/{groupId} — 需要 group:manage 权限 */
export const updateGroupApi = (groupId: string, data: UpdateGroupRequest) => {
  return http.put<GroupDto>(`${groupsURL}/${groupId}`, data);
};

/** DELETE /groups/{groupId} — 需要 group:manage 权限 */
export const deleteGroupApi = (groupId: string) => {
  return http.delete(`${groupsURL}/${groupId}`);
};

/** GET /groups/{groupId}/members */
export const getGroupMembersApi = (groupId: string) => {
  return http.get<GroupMemberDto[]>(`${groupsURL}/${groupId}/members`);
};

/** POST /groups/{groupId}/members — 需要 group:manage 权限 */
export const addGroupMemberApi = (groupId: string, userId: string) => {
  return http.post(`${groupsURL}/${groupId}/members`, { userId });
};

/** DELETE /groups/{groupId}/members/{userId} — 需要 group:manage 权限 */
export const removeGroupMemberApi = (groupId: string, userId: string) => {
  return http.delete(`${groupsURL}/${groupId}/members/${userId}`);
};

/** POST /groups/{groupId}/members/batch — 需要 group:manage 权限 */
export const batchAddGroupMembersApi = (groupId: string, userIds: string[]) => {
  return http.post(`${groupsURL}/${groupId}/members/batch`, { userIds });
};

/** DELETE /groups/{groupId}/members/batch — 需要 group:manage 权限 */
export const batchRemoveGroupMembersApi = (groupId: string, userIds: string[]) => {
  return http.delete(`${groupsURL}/${groupId}/members/batch`, {
    data: { userIds },
  });
};

/** PUT /groups/{groupId}/members — 需要 group:manage 权限（全量替换） */
export const replaceGroupMembersApi = (groupId: string, userIds: string[]) => {
  return http.put(`${groupsURL}/${groupId}/members`, { userIds });
};
