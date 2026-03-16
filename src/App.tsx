import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TaskProvider } from "./contexts/TaskContext";
import { ProcessProvider } from "./contexts/ProcessContext";
import { UserProvider } from "./contexts/UserContext";
import Index from "./pages/Index";
import TodoCenter from "./pages/TodoCenter";
import TaskCenter from "./pages/TaskCenter";
import TaskCreate from "./pages/TaskCreate";
import DocumentCenter from "./pages/DocumentCenter";
import ProcessCenter from "./pages/ProcessCenter";
import OnlineEditor from "./pages/OnlineEditor";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserProvider>
      <TaskProvider>
        <ProcessProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/todos" element={<TodoCenter />} />
                <Route path="/tasks" element={<TaskCenter />} />
                <Route path="/tasks/create" element={<TaskCreate />} />
                <Route path="/documents" element={<DocumentCenter />} />
                <Route path="/processes" element={<ProcessCenter />} />
                <Route path="/settings/users" element={<UserManagement />} />
                <Route path="/editor/:taskId/:assigneeId" element={<OnlineEditor />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ProcessProvider>
      </TaskProvider>
    </UserProvider>
  </QueryClientProvider>
);

export default App;
