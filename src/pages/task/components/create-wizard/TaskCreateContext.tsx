import { createContext, useContext, ReactNode } from "react";
import { useTaskCreate } from "@/pages/task/hooks/useTaskCreate";

type TaskCreateContextType = ReturnType<typeof useTaskCreate>;

const TaskCreateContext = createContext<TaskCreateContextType | undefined>(undefined);

export function TaskCreateProvider({ children }: { children: ReactNode }) {
  const logic = useTaskCreate();
  return (
    <TaskCreateContext.Provider value={logic}>
      {children}
    </TaskCreateContext.Provider>
  );
}

export function useTaskCreateContext() {
  const context = useContext(TaskCreateContext);
  if (!context) {
    throw new Error("useTaskCreateContext must be used within a TaskCreateProvider");
  }
  return context;
}
