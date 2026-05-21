// ============================================================
// 用户与权限相关类型定义
// 对齐 API_DOCUMENTATION.md 和 IDENTITY_DESIGN.md
// ============================================================

// --- 权限标识 ---

export type Permission =
  | "process:deploy"
  | "process:manage"
  | "process:view_all"
  | "process:view_dept"
  | "task:view_all"
  | "user:manage"
  | "dept:manage"
  | "group:manage"
  | "role:manage"
  | "file:upload"
  | "file:delete";

// --- 内置角色 ---

export type BuiltinRoleId = "admin" | "dept_leader" | "team_leader" | "staff";

// --- 用户 ---

export interface UserDto {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  staffId: string;
  departmentId: string;
  department: string;
  avatar: string;
  isActive: boolean;
  roles: string[];
  groups: string[];
  createdAt: string;
}

export interface MeResponse {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  staffId: string;
  avatar: string;
  department: { id: string; name: string } | null;
  groups: string[];
  roles: string[];
  permissions: Permission[];
}

export interface CreateUserRequest {
  id?: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  staffId?: string;
  departmentId?: string;
  avatar?: string;
  roleIds?: string[];
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  staffId?: string;
  departmentId?: string;
  avatar?: string;
  isActive?: boolean;
}

// --- 认证 ---

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  name?: string;
  firstName?: string;
  lastName?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// --- 部门 ---

export interface DepartmentGroupDto {
  groupId: string;
  departmentId: string;
  isBuiltin: boolean;
  actions: string[];
}

export interface DepartmentDto {
  id: string;
  name: string;
  description?: string;
  parentId: string | null;
  managerId: string | null;
  sortOrder: number;
  level: number;
  path: string;
  isActive: boolean;
  createdAt: string;
  memberCount: number;
  groups: DepartmentGroupDto[];
  children: DepartmentDto[];
}

export interface CreateDepartmentRequest {
  id?: string;
  name: string;
  description?: string;
  parentId: string;
  managerId?: string;
  sortOrder?: number;
}

export interface UpdateDepartmentRequest {
  name?: string;
  description?: string;
  managerId?: string;
  sortOrder?: number;
}

export interface DepartmentMemberDto {
  id: string;
  username: string;
  name: string;
  staffId: string;
  avatar: string;
  email: string;
}

// --- 工作组 ---

export interface GroupDto {
  id: string;
  name: string;
  departmentId: string;
  isBuiltin: boolean;
  actions: string[];
  createdAt: string;
}

export interface CreateGroupRequest {
  id?: string;
  name: string;
  departmentId: string;
  actions?: string[];
}

export interface UpdateGroupRequest {
  name?: string;
  actions?: string[];
}

export interface GroupMemberDto {
  id: string;
  username: string;
  name: string;
  avatar: string;
}

// --- 角色 ---

export interface RoleDto {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateRoleRequest {
  id?: string;
  name: string;
  description?: string;
  permissions?: Permission[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface RoleUserDto {
  id: string;
  username: string;
  name: string;
  avatar: string;
}
