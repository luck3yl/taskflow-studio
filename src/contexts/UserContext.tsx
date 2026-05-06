import React, { createContext, useContext, useState, ReactNode } from "react";

// 部门层级职级
export type DeptLevel = "普通职员" | "室主任" | "分管副部长" | "设备部长";
// 厂级层级职级
export type FactoryLevel = "普通职员" | "设备组长" | "设备厂长";
// 所属体系
export type OrgSystem = "department" | "factory";
export type UserPosition = DeptLevel | FactoryLevel;
export interface UserRoleAssignment {
    role: UserPosition;
    department: string;
}
export type UserCapability =
    | "todo.execute"
    | "task.create"
    | "task.assign.department"
    | "task.assign.member"
    | "task.review.director"
    | "task.review.minister"
    | "task.merge"
    | "task.view.all";

const POSITION_CAPABILITY_MAP: Record<UserPosition, UserCapability[]> = {
    "普通职员": ["todo.execute"],
    "室主任": ["task.create", "task.assign.member", "task.review.director"],
    "分管副部长": ["task.create", "task.review.minister"],
    "设备部长": ["task.create", "task.assign.department", "task.review.minister", "task.merge", "task.view.all"],
    "设备组长": ["task.create", "task.assign.member", "task.review.director"],
    "设备厂长": ["task.create", "task.assign.department", "task.review.minister", "task.merge", "task.view.all"],
};

export const CAPABILITY_LABELS: Record<UserCapability, string> = {
    "todo.execute": "待办执行",
    "task.create": "创建任务",
    "task.assign.department": "分配至科室",
    "task.assign.member": "科室二次拆分",
    "task.review.director": "主任审核",
    "task.review.minister": "部长审批",
    "task.merge": "结果合并",
    "task.view.all": "全局查看",
};

export interface Department {
    id: string;
    name: string;
    description?: string;
    managerId?: string;
    parentId?: string;
}

export interface User {
    id: string;
    name: string;
    avatar: string;
    department: string;
    role: string;
    // 所属体系：department = 部门层级，factory = 厂级层级
    orgSystem: OrgSystem;
    // 支持多角色兼任（如室主任兼部长）
    roles: string[];
    roleAssignments?: UserRoleAssignment[];
    staffId: string;
    email: string;
    phone: string;
    lastLogin: string;
    online: boolean;
}

export function getUserRoleAssignments(
    user: Pick<User, "department" | "role" | "roles"> & Partial<Pick<User, "roleAssignments">>
): UserRoleAssignment[] {
    if (user.roleAssignments?.length) {
        const uniqueAssignments = new Map<string, UserRoleAssignment>();

        user.roleAssignments.forEach((assignment) => {
            uniqueAssignments.set(`${assignment.role}-${assignment.department}`, assignment);
        });

        return [...uniqueAssignments.values()];
    }

    const roles = user.roles?.length ? user.roles : [user.role];
    return roles.filter(Boolean).map((role) => ({
        role: role as UserPosition,
        department: user.department,
    }));
}

export function getUserRoles(
    user: Pick<User, "department" | "role" | "roles"> & Partial<Pick<User, "roleAssignments">>
): UserPosition[] {
    return [...new Set(getUserRoleAssignments(user).map((assignment) => assignment.role))];
}

export function getPrimaryRole(
    user: Pick<User, "department" | "role" | "roles"> & Partial<Pick<User, "roleAssignments">>
): UserPosition {
    return (user.role || getUserRoles(user)[0] || "普通职员") as UserPosition;
}

export function getUserCapabilities(
    user: Pick<User, "department" | "role" | "roles"> & Partial<Pick<User, "roleAssignments">>
): UserCapability[] {
    return [...new Set(getUserRoles(user).flatMap((role) => POSITION_CAPABILITY_MAP[role] ?? []))];
}

export function hasCapability(
    user: Pick<User, "department" | "role" | "roles"> & Partial<Pick<User, "roleAssignments">>,
    capability: UserCapability
): boolean {
    return getUserCapabilities(user).includes(capability);
}

export function isManagementUser(
    user: Pick<User, "department" | "role" | "roles"> & Partial<Pick<User, "roleAssignments">>
): boolean {
    return getUserCapabilities(user).some((capability) => capability !== "todo.execute");
}

export function getCapabilityLabels(capabilities: UserCapability[]): string[] {
    return capabilities.map((capability) => CAPABILITY_LABELS[capability]);
}

export function summarizeUserRole(user: Pick<User, "role" | "roles">): string {
    const roles = getUserRoles(user);
    if (roles.length === 0) {
        return "未设置岗位";
    }

    return roles.length === 1 ? roles[0] : `${roles[0]} +${roles.length - 1}兼岗`;
}

export function formatRoleAssignmentLabel(assignment: UserRoleAssignment): string {
    return `${assignment.role}（${assignment.department}）`;
}

const DEPARTMENTS: Department[] = [
    { id: "dept-1", name: "武钢有限" },
    { id: "dept-2", name: "设备管理部" },
    { id: "dept-3", name: "综合组", parentId: "dept-2" },
    { id: "dept-4", name: "设备室", parentId: "dept-2" },
    { id: "dept-5", name: "技术室", parentId: "dept-2" },
    { id: "dept-6", name: "能环部" },
    { id: "dept-7", name: "运输部" },
    { id: "dept-8", name: "炼铁厂" },
    // { id: "dept-9", name: "炼钢厂" },
    // { id: "dept-10", name: "热轧厂" },
    // { id: "dept-11", name: "条材厂" },
    // { id: "dept-12", name: "冷轧厂" },
    // { id: "dept-13", name: "硅钢部" },
    // { id: "dept-14", name: "质检中心" },
    // { id: "dept-15", name: "钢电公司" },
    // { id: "dept-16", name: "WINSteel"     },
];

const USERS: User[] = [
    { id: "user-1", name: "张明", avatar: "张", department: "技术室", role: "普通职员", orgSystem: "department", roles: ["普通职员"], roleAssignments: [{ role: "普通职员", department: "技术室" }], staffId: "SB001", email: "zhangming@corp.cn", phone: "13800000001", lastLogin: "2026-04-20 10:00", online: true },
    { id: "user-2", name: "李华", avatar: "李", department: "综合组", role: "普通职员", orgSystem: "department", roles: ["普通职员"], roleAssignments: [{ role: "普通职员", department: "综合组" }], staffId: "SB002", email: "lihua@corp.cn", phone: "13800000002", lastLogin: "2026-04-20 11:30", online: false },
    { id: "user-3", name: "王芳", avatar: "王", department: "技术室", role: "室主任", orgSystem: "department", roles: ["室主任"], roleAssignments: [{ role: "室主任", department: "技术室" }], staffId: "SB003", email: "wangfang@corp.cn", phone: "13800000003", lastLogin: "2026-04-19 14:00", online: true },
    { id: "user-4", name: "赵强", avatar: "赵", department: "设备管理部", role: "设备部长", orgSystem: "department", roles: ["设备部长", "室主任"], roleAssignments: [{ role: "设备部长", department: "设备管理部" }, { role: "室主任", department: "设备室" }], staffId: "SB004", email: "zhaoqiang@corp.cn", phone: "13800000004", lastLogin: "2026-04-20 09:00", online: true },
    { id: "user-8", name: "周凯", avatar: "周", department: "设备管理部", role: "分管副部长", orgSystem: "department", roles: ["分管副部长"], roleAssignments: [{ role: "分管副部长", department: "设备管理部" }], staffId: "SB005", email: "zhoukai@corp.cn", phone: "13800000008", lastLogin: "2026-04-20 15:20", online: true },
    { id: "user-5", name: "陈静", avatar: "陈", department: "炼铁厂", role: "普通职员", orgSystem: "factory", roles: ["普通职员"], roleAssignments: [{ role: "普通职员", department: "炼铁厂" }], staffId: "SC001", email: "chenjing@corp.cn", phone: "13800000005", lastLogin: "2026-04-18 16:30", online: false },
    { id: "user-6", name: "刘洋", avatar: "刘", department: "热轧厂", role: "设备组长", orgSystem: "factory", roles: ["设备组长"], roleAssignments: [{ role: "设备组长", department: "热轧厂" }], staffId: "SC002", email: "liuyang@corp.cn", phone: "13800000006", lastLogin: "2026-04-20 13:00", online: true },
    { id: "user-7", name: "孙磊", avatar: "孙", department: "武钢有限", role: "设备厂长", orgSystem: "factory", roles: ["设备厂长"], roleAssignments: [{ role: "设备厂长", department: "武钢有限" }], staffId: "SC003", email: "sunlei@corp.cn", phone: "13800000007", lastLogin: "2026-04-20 08:30", online: true },
];

interface UserContextType {
    currentUser: User;
    users: User[];
    departments: Department[];
    switchUser: (userId: string) => void;
    addUser: (user: Omit<User, "id">) => void;
    updateUser: (userId: string, updates: Partial<User>) => void;
    deleteUser: (userId: string) => void;
    addDepartment: (dept: Omit<Department, "id">) => void;
    updateDepartment: (deptId: string, updates: Partial<Department>) => void;
    deleteDepartment: (deptId: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User>(USERS[0]);
    const [users, setUsers] = useState<User[]>(USERS);
    const [departments, setDepartments] = useState<Department[]>(DEPARTMENTS);

    const switchUser = (userId: string) => {
        const user = users.find((u) => u.id === userId);
        if (user) setCurrentUser(user);
    };

    const addUser = (userData: Omit<User, "id">) => {
        const newUser: User = { ...userData, id: `user-${Date.now()}` };
        setUsers(prev => [...prev, newUser]);
    };

    const updateUser = (userId: string, updates: Partial<User>) => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
        if (currentUser.id === userId) {
            setCurrentUser(prev => ({ ...prev, ...updates }));
        }
    };

    const deleteUser = (userId: string) => {
        setUsers(prev => prev.filter(u => u.id !== userId));
    };

    const addDepartment = (deptData: Omit<Department, "id">) => {
        const newDept: Department = { ...deptData, id: `dept-${Date.now()}` };
        setDepartments(prev => [...prev, newDept]);
    };

    const updateDepartment = (deptId: string, updates: Partial<Department>) => {
        setDepartments(prev => prev.map(d => d.id === deptId ? { ...d, ...updates } : d));
    };

    const deleteDepartment = (deptId: string) => {
        setDepartments(prev => prev.filter(d => d.id !== deptId));
    };

    return (
        <UserContext.Provider value={{
            currentUser,
            users,
            departments,
            switchUser,
            addUser,
            updateUser,
            deleteUser,
            addDepartment,
            updateDepartment,
            deleteDepartment
        }}>
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
