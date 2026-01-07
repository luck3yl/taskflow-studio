import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Bell, Search } from "lucide-react";
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
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header */}
          <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
            <div className="h-full flex items-center justify-between px-4 gap-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
                {title && (
                  <h1 className="text-lg font-semibold text-foreground">{title}</h1>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="hidden md:flex relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="搜索任务、文档..." 
                    className="w-64 pl-9 bg-secondary/50 border-transparent focus:border-primary"
                  />
                </div>

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs gradient-accent border-0">
                    3
                  </Badge>
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
