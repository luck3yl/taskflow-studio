import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Bell, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full gradient-page">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header */}
          <header className="h-16 border-b border-border/50 header-blur sticky top-0 z-40">
            <div className="h-full flex items-center justify-between px-6 gap-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
                {title && (
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-semibold text-foreground">{title}</h1>
                    <Sparkles className="h-4 w-4 text-primary/60" />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="hidden md:flex relative group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input 
                    placeholder="搜索任务、文档..." 
                    className="w-72 pl-10 bg-white/60 dark:bg-white/5 border-border/50 rounded-xl focus:border-primary/50 focus:bg-white dark:focus:bg-white/10 transition-all duration-300 shadow-sm"
                  />
                </div>

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-white/60 dark:hover:bg-white/10 transition-all">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <span className="absolute -top-0.5 -right-0.5 h-5 w-5 flex items-center justify-center">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-accent text-[10px] font-bold text-accent-foreground items-center justify-center">
                      3
                    </span>
                  </span>
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
