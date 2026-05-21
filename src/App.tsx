import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TaskProvider } from "./contexts/TaskContext";
import { ProcessProvider } from "./contexts/ProcessContext";
import { UserProvider } from "./contexts/UserContext";
import { AuthGuard } from "./components/layout/AuthGuard";
import Login from "./pages/Login";
import Index from "./pages/Index";
import TodoCenter from "./pages/TodoCenter";
import TaskCenter from "./pages/TaskCenter";
import TaskCreate from "./pages/TaskCreate";
import TaskDetail from "./pages/TaskDetail";
import DocumentCenter from "./pages/DocumentCenter";
import ProcessCenter from "./pages/ProcessCenter";
import OnlineEditor from "./pages/OnlineEditor";
import DeptAssignPage from "./pages/task/meeting-materials/DeptAssignPage";
import AssignPagesPage from "./pages/task/meeting-materials/AssignPagesPage";
import UserManagement from "./pages/UserManagement";
import RoleManagement from "./pages/RoleManagement";
import GroupManagement from "./pages/GroupManagement";
import IdentityCenter from "./pages/IdentityCenter";

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
                {/* 公开路由 */}
                <Route path="/login" element={<Login />} />

                {/* 需要认证的路由 */}
                <Route path="/" element={<AuthGuard><Index /></AuthGuard>} />
                <Route path="/todos" element={<AuthGuard><TodoCenter /></AuthGuard>} />
                <Route path="/tasks" element={<AuthGuard><TaskCenter /></AuthGuard>} />
                <Route path="/tasks/:taskType" element={<AuthGuard><TaskCenter /></AuthGuard>} />
                <Route path="/tasks/create" element={<AuthGuard><TaskCreate /></AuthGuard>} />
                <Route path="/tasks/create/:taskType" element={<AuthGuard><TaskCreate /></AuthGuard>} />
                <Route path="/tasks/detail/:taskId" element={<AuthGuard><TaskDetail /></AuthGuard>} />
                <Route path="/documents" element={<AuthGuard><DocumentCenter /></AuthGuard>} />
                <Route path="/processes" element={<AuthGuard><ProcessCenter /></AuthGuard>} />
                <Route path="/settings/users" element={<AuthGuard><IdentityCenter /></AuthGuard>} />
                <Route path="/settings/roles" element={<AuthGuard><IdentityCenter /></AuthGuard>} />
                <Route path="/settings/groups" element={<AuthGuard><IdentityCenter /></AuthGuard>} />
                <Route path="/settings/identity" element={<AuthGuard><IdentityCenter /></AuthGuard>} />
                <Route path="/settings/departments" element={<AuthGuard><IdentityCenter /></AuthGuard>} />
                <Route path="/editor/:taskId/:assigneeId" element={<AuthGuard><OnlineEditor /></AuthGuard>} />
                <Route path="/tasks/:taskId/assign" element={<AuthGuard><DeptAssignPage /></AuthGuard>} />
                <Route path="/tasks/:taskId/assign-pages" element={<AuthGuard><AssignPagesPage /></AuthGuard>} />

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
