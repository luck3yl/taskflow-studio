import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Upload,
  FolderOpen,
  FileText,
  FileImage,
  FilePieChart,
  Download,
  MoreHorizontal,
  ChevronRight,
  Grid,
  List
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const folders = [
  { id: "1", name: "技术部", count: 24, color: "bg-primary" },
  { id: "2", name: "产品部", count: 18, color: "bg-success" },
  { id: "3", name: "市场部", count: 12, color: "bg-warning" },
  { id: "4", name: "运营部", count: 8, color: "bg-accent" },
];

const files = [
  {
    id: "1",
    name: "Q4季度汇报PPT.pptx",
    type: "ppt",
    size: "2.4 MB",
    uploader: "张明",
    uploadedAt: "2024-01-10",
    department: "技术部",
  },
  {
    id: "2",
    name: "产品功能演示.pdf",
    type: "pdf",
    size: "5.1 MB",
    uploader: "李华",
    uploadedAt: "2024-01-09",
    department: "产品部",
  },
  {
    id: "3",
    name: "市场调研报告.docx",
    type: "doc",
    size: "1.2 MB",
    uploader: "王芳",
    uploadedAt: "2024-01-08",
    department: "市场部",
  },
  {
    id: "4",
    name: "数据分析图表.xlsx",
    type: "excel",
    size: "856 KB",
    uploader: "赵强",
    uploadedAt: "2024-01-07",
    department: "技术部",
  },
  {
    id: "5",
    name: "公司宣传册.pptx",
    type: "ppt",
    size: "8.3 MB",
    uploader: "陈静",
    uploadedAt: "2024-01-06",
    department: "市场部",
  },
  {
    id: "6",
    name: "年度工作总结.pdf",
    type: "pdf",
    size: "3.7 MB",
    uploader: "刘洋",
    uploadedAt: "2024-01-05",
    department: "运营部",
  },
];

const fileIcons = {
  ppt: FilePieChart,
  pdf: FileText,
  doc: FileText,
  excel: FileImage,
};

const fileColors = {
  ppt: "text-orange-500",
  pdf: "text-red-500",
  doc: "text-blue-500",
  excel: "text-green-500",
};

export default function DocumentCenter() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.uploader.includes(searchQuery);
    const matchesFolder = !selectedFolder || file.department === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  return (
    <AppLayout title="文档中心">
      <div className="flex gap-6">
        {/* Sidebar - Folder Tree */}
        <div className="hidden lg:block w-64 shrink-0 space-y-4">
          <Card className="shadow-card">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">部门目录</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedFolder(null)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                    !selectedFolder 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-secondary text-muted-foreground"
                  }`}
                >
                  <FolderOpen className="h-4 w-4" />
                  <span className="flex-1">全部文档</span>
                  <Badge variant="secondary" className="text-xs">
                    {files.length}
                  </Badge>
                </button>
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder.name)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                      selectedFolder === folder.name 
                        ? "bg-primary/10 text-primary" 
                        : "hover:bg-secondary text-muted-foreground"
                    }`}
                  >
                    <div className={`h-4 w-4 rounded ${folder.color}`} />
                    <span className="flex-1">{folder.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {folder.count}
                    </Badge>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-3">
              <Button className="gradient-primary">
                <Upload className="h-4 w-4 mr-2" />
                上传文件
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索文件..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <div className="flex border border-border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="rounded-none"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="rounded-none"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <button 
              onClick={() => setSelectedFolder(null)}
              className="hover:text-foreground transition-colors"
            >
              全部文档
            </button>
            {selectedFolder && (
              <>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground">{selectedFolder}</span>
              </>
            )}
          </div>

          {/* File Grid/List */}
          {viewMode === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredFiles.map((file, index) => {
                const FileIcon = fileIcons[file.type as keyof typeof fileIcons] || FileText;
                const iconColor = fileColors[file.type as keyof typeof fileColors] || "text-muted-foreground";
                
                return (
                  <Card 
                    key={file.id}
                    className="shadow-card hover:shadow-elevated transition-all duration-200 hover:border-primary/30 cursor-pointer group animate-slide-up"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center">
                        <div className="h-16 w-16 rounded-xl bg-secondary/50 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                          <FileIcon className={`h-8 w-8 ${iconColor}`} />
                        </div>
                        <p className="font-medium text-foreground text-sm truncate w-full">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {file.size} · {file.uploader}
                        </p>
                        <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Download className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>预览</DropdownMenuItem>
                              <DropdownMenuItem>重命名</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">删除</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="shadow-card">
              <div className="divide-y divide-border">
                {filteredFiles.map((file, index) => {
                  const FileIcon = fileIcons[file.type as keyof typeof fileIcons] || FileText;
                  const iconColor = fileColors[file.type as keyof typeof fileColors] || "text-muted-foreground";
                  
                  return (
                    <div 
                      key={file.id}
                      className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors animate-slide-up"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div className="h-10 w-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                        <FileIcon className={`h-5 w-5 ${iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {file.department} · {file.uploader} · {file.uploadedAt}
                        </p>
                      </div>
                      <span className="text-sm text-muted-foreground hidden sm:block">
                        {file.size}
                      </span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Download className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>预览</DropdownMenuItem>
                            <DropdownMenuItem>重命名</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">删除</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {filteredFiles.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground">暂无文件</h3>
              <p className="text-sm text-muted-foreground mt-1">当前筛选条件下没有找到文件</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
