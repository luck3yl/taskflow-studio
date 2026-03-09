import React, { createContext, useContext, useState, ReactNode } from "react";

export interface User {
    id: string;
    name: string;
    avatar: string;
    department: string;
}

const USERS: User[] = [
    { id: "user-1", name: "张明", avatar: "张", department: "技术部" },
    { id: "user-2", name: "李华", avatar: "李", department: "技术部" },
    { id: "user-3", name: "王芳", avatar: "王", department: "产品部" },
    { id: "user-4", name: "赵强", avatar: "赵", department: "市场部" },
    { id: "user-5", name: "陈静", avatar: "陈", department: "运营部" },
    { id: "user-6", name: "刘洋", avatar: "刘", department: "产品部" },
];

interface UserContextType {
    currentUser: User;
    users: User[];
    switchUser: (userId: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User>(USERS[0]);

    const switchUser = (userId: string) => {
        const user = USERS.find((u) => u.id === userId);
        if (user) setCurrentUser(user);
    };

    return (
        <UserContext.Provider value={{ currentUser, users: USERS, switchUser }}>
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
