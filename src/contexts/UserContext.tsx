import React, { createContext, useContext, useState, ReactNode } from "react";

// 部门层级职级
export type DeptLevel = "普通职员" | "室主任" | "分管副部长" | "设备部长";
// 厂级层级职级
export type FactoryLevel = "普通职员" | "设备组长" | "设备厂长";
// 所属体系
export type OrgSystem = "department" | "factory";

export interface Department {
    id: string;
    name: string;
    description?: string;
    managerId?: string;
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
    staffId: string;
    email: string;
    phone: string;
    lastLogin: string;
    online: boolean;
}

const DEPARTMENTS: Department[] = [
    { id: "dept-1", name: "设备部", description: "负责设备管理与维护" },
    { id: "dept-2", name: "设备室", description: "设备部下属科室" },
    { id: "dept-3", name: "生产厂", description: "厂级生产管理单位" },
    { id: "dept-4", name: "技术部", description: "负责技术研发" },
    { id: "dept-5", name: "运营部", description: "负责平台日常运营" },
];

const USERS: User[] = [
    { id: "user-1", name: "张明", avatar: "张", department: "设备部", role: "普通职员", orgSystem: "department", roles: ["普通职员"], staffId: "SB001", email: "zhangming@corp.cn", phone: "13800000001", lastLogin: "2026-04-20 10:00", online: true },
    { id: "user-2", name: "李华", avatar: "李", department: "设备部", role: "室主任", orgSystem: "department", roles: ["室主任"], staffId: "SB002", email: "lihua@corp.cn", phone: "13800000002", lastLogin: "2026-04-20 11:30", online: false },
    { id: "user-3", name: "王芳", avatar: "王", department: "设备部", role: "室主任", orgSystem: "department", roles: ["室主任", "设备部长"], staffId: "SB003", email: "wangfang@corp.cn", phone: "13800000003", lastLogin: "2026-04-19 14:00", online: true },
    { id: "user-4", name: "赵强", avatar: "赵", department: "设备部", role: "分管副部长", orgSystem: "department", roles: ["分管副部长"], staffId: "SB004", email: "zhaoqiang@corp.cn", phone: "13800000004", lastLogin: "2026-04-20 09:00", online: true },
    { id: "user-5", name: "陈静", avatar: "陈", department: "生产厂", role: "普通职员", orgSystem: "factory", roles: ["普通职员"], staffId: "SC001", email: "chenjing@corp.cn", phone: "13800000005", lastLogin: "2026-04-18 16:30", online: false },
    { id: "user-6", name: "刘洋", avatar: "刘", department: "生产厂", role: "设备组长", orgSystem: "factory", roles: ["设备组长"], staffId: "SC002", email: "liuyang@corp.cn", phone: "13800000006", lastLogin: "2026-04-20 13:00", online: true },
    { id: "user-7", name: "孙磊", avatar: "孙", department: "生产厂", role: "设备厂长", orgSystem: "factory", roles: ["设备厂长"], staffId: "SC003", email: "sunlei@corp.cn", phone: "13800000007", lastLogin: "2026-04-20 08:30", online: true },
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
