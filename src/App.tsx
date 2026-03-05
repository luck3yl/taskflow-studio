import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TaskProvider } from "./contexts/TaskContext";
import { ProcessProvider } from "./contexts/ProcessContext";
import Index from "./pages/Index";
import TodoCenter from "./pages/TodoCenter";
import TaskCenter from "./pages/TaskCenter";
import TaskCreate from "./pages/TaskCreate";
import DocumentCenter from "./pages/DocumentCenter";
import ProcessCenter from "./pages/ProcessCenter";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ProcessProvider>
    </TaskProvider>
  </QueryClientProvider>
);

export default App;
