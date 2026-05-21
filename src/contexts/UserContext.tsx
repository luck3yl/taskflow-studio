import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from "react";
import { getUsersApi } from "@/services/apis/users";
import { getAuthMeApi } from "@/services/apis/auth";
import { getDepartmentTreeApi } from "@/services/apis/departments";
import { getRolesApi } from "@/services/apis/roles";
import { setApiCurrentUser } from "@/services/http/axios";
import type {
  UserDto,
  MeResponse,
  DepartmentDto,
  RoleDto,
  Permission,
} from "@/types/user";

// ============================================================
// 权限相关工具函数
// ============================================================

/**
 * 判断用户是否拥有某个权限
 * admin 角色拥有全部权限
 */
export function hasPermission(me: MeResponse | null, permission: Permission): boolean {
  if (!me) return false;
  if (me.roles.includes("admin")) return true;
  return me.permissions.includes(permission);
}

/**
 * 判断用户是否为管理员
 */
export function isAdmin(me: MeResponse | null): boolean {
  if (!me) return false;
  return me.roles.includes("admin");
}

// 内置角色标签映射
export const ROLE_LABELS: Record<string, string> = {
  admin: "系统管理员",
  dept_leader: "部门领导",
  team_leader: "室主任",
  staff: "普通员工",
};

// 权限标识标签映射
export const PERMISSION_LABELS: Record<Permission, string> = {
  "process:deploy": "部署流程定义",
  "process:manage": "管理流程",
  "process:view_all": "查看所有流程实例",
  "process:view_dept": "查看本部门流程实例",
  "task:view_all": "查看所有任务",
  "user:manage": "用户管理",
  "dept:manage": "部门管理",
  "group:manage": "工作组管理",
  "role:manage": "角色与权限管理",
  "file:upload": "上传文件",
  "file:delete": "删除文件",
};

export function getRoleLabel(roleId: string): string {
  return ROLE_LABELS[roleId] || roleId;
}

export function formatUserName(user: Pick<UserDto, "name" | "username">): string {
  return user.name || user.username;
}

// ============================================================
// 部门树工具函数
// ============================================================

/** 扁平化部门树 */
export function flattenDepartmentTree(tree: DepartmentDto[]): DepartmentDto[] {
  const result: DepartmentDto[] = [];
  const walk = (nodes: DepartmentDto[]) => {
    for (const node of nodes) {
      result.push(node);
      if (node.children?.length) walk(node.children);
    }
  };
  walk(tree);
  return result;
}

/** 获取某部门及其所有子部门 ID */
export function getDescendantIds(tree: DepartmentDto[], deptId: string): string[] {
  const ids: string[] = [deptId];
  const walk = (nodes: DepartmentDto[]) => {
    for (const node of nodes) {
      if (node.parentId === deptId || ids.includes(node.parentId || "")) {
        ids.push(node.id);
      }
      if (node.children?.length) walk(node.children);
    }
  };
  walk(tree);
  return ids;
}

// ============================================================
// 兼容层：旧 User / Department 类型 + 旧工具函数
// 供尚未迁移的组件使用
// ============================================================

export interface Department {
  id: string;
  name: string;
  description?: string;
  managerId?: string;
  managerName?: string;
  parentId?: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  department: string;
  role: string;
  roles: string[];
  staffId: string;
  email: string;
}

/** 旧版能力标识（兼容） */
export type UserCapability =
  | "todo.execute"
  | "task.create"
  | "task.assign.department"
  | "task.assign.member"
  | "task.review.director"
  | "task.review.minister"
  | "task.merge"
  | "task.view.all";

/**
 * 兼容旧版 hasCapability
 * 将新权限模型映射到旧能力标识
 */
export function hasCapability(
  user: Pick<User, "role" | "roles"> | MeResponse | null,
  capability: UserCapability
): boolean {
  if (!user) return false;

  // 如果是 MeResponse（新模型），用 permissions 判断
  if ("permissions" in user) {
    const me = user as MeResponse;
    if (me.roles.includes("admin")) return true;
    switch (capability) {
      case "task.create":
        return me.roles.includes("admin") || me.roles.includes("dept_leader") || me.roles.includes("team_leader");
      case "task.assign.department":
        return me.permissions.includes("task:view_all") || me.roles.includes("dept_leader");
      case "task.assign.member":
        return me.roles.includes("team_leader") || me.roles.includes("dept_leader");
      case "task.review.director":
        return me.roles.includes("team_leader") || me.roles.includes("dept_leader");
      case "task.review.minister":
        return me.roles.includes("dept_leader") || me.roles.includes("admin");
      case "task.merge":
        return me.permissions.includes("task:view_all");
      case "task.view.all":
        return me.permissions.includes("task:view_all");
      case "todo.execute":
        return true;
      default:
        return false;
    }
  }

  // 旧模型兼容：基于角色名推断
  const roles = (user as User).roles || [(user as User).role];
  const isAdminRole = roles.includes("admin");
  if (isAdminRole) return true;

  const isDeptLeader = roles.includes("dept_leader");
  const isTeamLeader = roles.includes("team_leader");

  switch (capability) {
    case "task.create":
      return isDeptLeader || isTeamLeader;
    case "task.assign.department":
      return isDeptLeader;
    case "task.assign.member":
      return isTeamLeader || isDeptLeader;
    case "task.review.director":
      return isTeamLeader || isDeptLeader;
    case "task.review.minister":
      return isDeptLeader;
    case "task.merge":
      return isDeptLeader;
    case "task.view.all":
      return isDeptLeader;
    case "todo.execute":
      return true;
    default:
      return false;
  }
}

/**
 * 兼容旧版 isManagementUser
 */
export function isManagementUser(user: Pick<User, "role" | "roles"> | MeResponse | null): boolean {
  if (!user) return false;
  if ("permissions" in user) {
    const me = user as MeResponse;
    return me.roles.includes("admin") || me.roles.includes("dept_leader") || me.roles.includes("team_leader");
  }
  const roles = (user as User).roles || [(user as User).role];
  return roles.some(r => r === "admin" || r === "dept_leader" || r === "team_leader");
}

/**
 * 兼容旧版 summarizeUserRole
 */
export function summarizeUserRole(user: Pick<User, "role" | "roles"> | UserDto | MeResponse | null): string {
  if (!user) return "未设置";
  const roles = (user as any).roles as string[] | undefined;
  if (!roles || roles.length === 0) {
    const role = (user as any).role as string | undefined;
    return role ? getRoleLabel(role) : "未设置";
  }
  if (roles.length === 1) return getRoleLabel(roles[0]);
  return `${getRoleLabel(roles[0])} +${roles.length - 1}`;
}

/**
 * 兼容旧版 getUserRoleAssignments
 */
export function getUserRoleAssignments(user: Pick<User, "role" | "roles" | "department">): Array<{ role: string; department: string }> {
  const roles = user.roles?.length ? user.roles : [user.role].filter(Boolean);
  return roles.map(role => ({ role, department: user.department }));
}

/**
 * 兼容旧版 formatRoleAssignmentLabel
 */
export function formatRoleAssignmentLabel(assignment: { role: string; department: string }): string {
  return `${getRoleLabel(assignment.role)}（${assignment.department}）`;
}

// ============================================================
// 将新 DTO 转为旧 User 类型（兼容层）
// ============================================================

function userDtoToLegacyUser(dto: UserDto): User {
  return {
    id: dto.id,
    name: dto.name || `${dto.lastName || ""}${dto.firstName || ""}`,
    avatar: dto.avatar || (dto.name || dto.username || "?").charAt(0),
    department: dto.department || "",
    role: dto.roles?.[0] || "staff",
    roles: dto.roles || ["staff"],
    staffId: dto.staffId || "",
    email: dto.email || "",
  };
}

function meResponseToLegacyUser(me: MeResponse): User {
  return {
    id: me.id,
    name: me.name || `${me.lastName || ""}${me.firstName || ""}`,
    avatar: me.avatar || (me.name || me.username || "?").charAt(0),
    department: me.department?.name || "",
    role: me.roles?.[0] || "staff",
    roles: me.roles || ["staff"],
    staffId: me.staffId || "",
    email: me.email || "",
  };
}

function deptDtoToLegacyDepartment(dto: DepartmentDto): Department {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    managerId: dto.managerId || undefined,
    parentId: dto.parentId || undefined,
  };
}

// ============================================================
// Context 定义
// ============================================================

interface UserContextType {
  /** 当前登录用户完整信息（新模型，含权限） */
  me: MeResponse | null;
  /** 当前用户（旧兼容格式） */
  currentUser: User;
  /** 用户列表（旧兼容格式） */
  users: User[];
  /** 部门列表（旧兼容格式） */
  departments: Department[];
  /** 部门树（新模型） */
  departmentTree: DepartmentDto[];
  /** 角色列表（新模型） */
  roles: RoleDto[];
  /** 用户列表（新模型） */
  userDtos: UserDto[];
  /** 数据加载中 */
  loading: boolean;
  /** 切换当前用户（开发模式） */
  switchUser: (userId: string) => void;
  /** 刷新用户列表 */
  refreshUsers: () => Promise<void>;
  /** 刷新部门树 */
  refreshDepartments: () => Promise<void>;
  /** 刷新角色列表 */
  refreshRoles: () => Promise<void>;
  /** 刷新当前用户信息 */
  refreshMe: () => Promise<void>;
  /** 刷新所有数据（登录后调用） */
  refreshAll: () => Promise<void>;
  /** 权限检查快捷方法 */
  can: (permission: Permission) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// ============================================================
// Provider
// ============================================================

export function UserProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [userDtos, setUserDtos] = useState<UserDto[]>([]);
  const [departmentTree, setDepartmentTree] = useState<DepartmentDto[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 数据加载 ---

  const refreshMe = useCallback(async () => {
    try {
      const data = await getAuthMeApi();
      if (data?.id) {
        setMe(data);
        setApiCurrentUser({ id: data.id, name: data.name, department: data.department?.name });
      }
    } catch (error: any) {
      // 401 表示 token 无效，清除本地状态
      if (error?.status === 401) {
        setMe(null);
      }
      console.warn("GET /auth/me failed", error);
    }
  }, []);

  const refreshUsers = useCallback(async () => {
    try {
      const data = await getUsersApi();
      if (Array.isArray(data) && data.length > 0) {
        setUserDtos(data);
      }
    } catch (error) {
      console.error("Failed to load users", error);
    }
  }, []);

  const refreshDepartments = useCallback(async () => {
    try {
      const data = await getDepartmentTreeApi();
      if (Array.isArray(data) && data.length > 0) {
        setDepartmentTree(data);
      }
    } catch (error) {
      console.error("Failed to load department tree", error);
    }
  }, []);

  const refreshRoles = useCallback(async () => {
    try {
      const data = await getRolesApi();
      if (Array.isArray(data) && data.length > 0) {
        setRoles(data);
      }
    } catch (error) {
      console.error("Failed to load roles", error);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setLoading(true);
      await Promise.allSettled([
        refreshMe(),
        refreshUsers(),
        refreshDepartments(),
        refreshRoles(),
      ]);
      if (!cancelled) setLoading(false);
    };

    void init();
    return () => { cancelled = true; };
  }, [refreshMe, refreshUsers, refreshDepartments, refreshRoles]);

  // --- 兼容层：旧格式数据 ---

  const currentUser: User = useMemo(() => {
    if (me) return meResponseToLegacyUser(me);
    return { id: "", name: "加载中", avatar: "?", department: "", role: "staff", roles: ["staff"], staffId: "", email: "" };
  }, [me]);

  const users: User[] = useMemo(() => {
    return userDtos.map(userDtoToLegacyUser);
  }, [userDtos]);

  const departments: Department[] = useMemo(() => {
    return flattenDepartmentTree(departmentTree).map(deptDtoToLegacyDepartment);
  }, [departmentTree]);

  // --- 开发模式切换用户 ---

  const switchUser = useCallback((userId: string) => {
    const user = userDtos.find((u) => u.id === userId);
    if (!user) return;
    setApiCurrentUser({ id: user.id, name: user.name, department: user.department });
    void refreshMe();
  }, [userDtos, refreshMe]);

  // --- 登录后刷新所有数据 ---

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.allSettled([
      refreshMe(),
      refreshUsers(),
      refreshDepartments(),
      refreshRoles(),
    ]);
    setLoading(false);
  }, [refreshMe, refreshUsers, refreshDepartments, refreshRoles]);

  // --- 权限检查 ---

  const can = useCallback((permission: Permission) => {
    return hasPermission(me, permission);
  }, [me]);

  return (
    <UserContext.Provider
      value={{
        me,
        currentUser,
        users,
        departments,
        departmentTree,
        roles,
        userDtos,
        loading,
        switchUser,
        refreshUsers,
        refreshDepartments,
        refreshRoles,
        refreshMe,
        refreshAll,
        can,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
}
