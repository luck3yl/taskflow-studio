import React, { createContext, useContext, useState, ReactNode } from "react";

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
    staffId: string;
    email: string;
    phone: string;
    lastLogin: string;
    online: boolean;
}

const DEPARTMENTS: Department[] = [
    { id: "dept-1", name: "技术部", description: "负责产品研发与运维" },
    { id: "dept-2", name: "产品部", description: "负责产品设计与规划" },
    { id: "dept-3", name: "市场部", description: "负责市场推广与销售" },
    { id: "dept-4", name: "运营部", description: "负责平台日常运营" },
    { id: "dept-5", name: "财务部", description: "负责财务预算与核算" },
];

const USERS: User[] = [
    { id: "user-1", name: "张明", avatar: "张", department: "技术部", role: "后端开发", staffId: "TX001", email: "zhangming@taskflow.cn", phone: "13800000001", lastLogin: "2026-03-16 10:00", online: true },
    { id: "user-2", name: "李华", avatar: "李", department: "技术部", role: "前端开发", staffId: "TX002", email: "lihua@taskflow.cn", phone: "13800000002", lastLogin: "2026-03-16 11:30", online: false },
    { id: "user-3", name: "王芳", avatar: "王", department: "产品部", role: "产品经理", staffId: "PD001", email: "wangfang@taskflow.cn", phone: "13800000003", lastLogin: "2026-03-15 14:00", online: true },
    { id: "user-4", name: "赵强", avatar: "赵", department: "市场部", role: "市场主管", staffId: "MK001", email: "zhaoqiang@taskflow.cn", phone: "13800000004", lastLogin: "2026-03-16 09:00", online: true },
    { id: "user-5", name: "陈静", avatar: "陈", department: "运营部", role: "运营专家", staffId: "OP001", email: "chenjing@taskflow.cn", phone: "13800000005", lastLogin: "2026-03-14 16:30", online: false },
    { id: "user-6", name: "刘洋", avatar: "刘", department: "产品部", role: "交互设计", staffId: "PD002", email: "liuyang@taskflow.cn", phone: "13800000006", lastLogin: "2026-03-16 13:00", online: true },
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
