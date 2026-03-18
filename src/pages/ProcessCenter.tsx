import { useState, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Upload, Filter, PlayCircle, PauseCircle, Eye } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useProcess } from "@/contexts/ProcessContext";
import { useToast } from "@/components/ui/use-toast";
import { ProcessViewerDrawer } from "@/components/drawers/ProcessViewerDrawer";

const statusFilters = [
    { value: "all", label: "全部状态" },
    { value: "deployed", label: "已部署" },
    { value: "undeployed", label: "未部署" },
    { value: "suspended", label: "已停用" },
];

const statusStyles = {
    deployed: { bg: "bg-success/20", text: "text-success", label: "已部署" },
    undeployed: { bg: "bg-muted", text: "text-muted-foreground", label: "未部署" },
    suspended: { bg: "bg-destructive/20", text: "text-destructive", label: "已停用" },
};

export default function ProcessCenter() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedProcessId, setSelectedProcessId] = useState<string | undefined>(undefined);
    const [viewerOpen, setViewerOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { processes, uploadProcess, deployProcess, suspendProcess } = useProcess();
    const { toast } = useToast();

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const xmlContent = e.target?.result as string;
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlContent, "text/xml");

            const processElement = xmlDoc.getElementsByTagName("bpmn:process")[0] || xmlDoc.getElementsByTagName("process")[0];
            if (processElement) {
                const key = processElement.getAttribute("id") || file.name.replace('.xml', '');
                const name = processElement.getAttribute("name") || file.name;
                uploadProcess(xmlContent, key, name);
                toast({ title: "上传成功", description: `流程 ${name} 上传成功` });
            } else {
                toast({ title: "解析失败", description: "无效的 BPMN XML 文件，缺少 process 节点", variant: "destructive" });
            }
        };
        reader.readAsText(file);
        // Reset input
        event.target.value = '';
    };

    const handleViewProcess = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedProcessId(id);
        setViewerOpen(true);
    };

    const filteredProcesses = processes.filter((process) => {
        const matchesSearch =
            process.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            process.key.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || process.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <AppLayout title="流程中心">
            <div className="space-y-6">
                {/* Header and Actions */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex gap-3">
                        <input
                            type="file"
                            accept=".xml,.bpmn"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleUpload}
                        />
                        <Button
                            className="gradient-primary"
                            onClick={handleUploadClick}
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            上传流程定义
                        </Button>
                    </div>

                    <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-initial">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="搜索流程名称或Key..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 w-full sm:w-64"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-32">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {statusFilters.map((filter) => (
                                    <SelectItem key={filter.value} value={filter.value}>
                                        {filter.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Process List Table */}
                <Card className="shadow-card">
                    <CardHeader>
                        <CardTitle className="text-lg">流程列表</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>流程名称</TableHead>
                                    <TableHead>流程标识 (Key)</TableHead>
                                    <TableHead>版本</TableHead>
                                    <TableHead>状态</TableHead>
                                    <TableHead>上传时间</TableHead>
                                    <TableHead>操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProcesses.length > 0 ? (
                                    filteredProcesses.map((process) => (
                                        <TableRow key={process.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                                            <TableCell className="font-medium">{process.name}</TableCell>
                                            <TableCell className="text-muted-foreground">{process.key}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">V{process.version}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className={`${statusStyles[process.status].bg} ${statusStyles[process.status].text}`}>
                                                    {statusStyles[process.status].label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {new Date(process.createTime).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                    {process.status !== 'deployed' && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 text-success hover:bg-success/10 hover:text-success"
                                                            onClick={() => deployProcess(process.id)}
                                                        >
                                                            <PlayCircle className="h-4 w-4 mr-1" />
                                                            部署
                                                        </Button>
                                                    )}
                                                    {process.status === 'deployed' && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                            onClick={() => suspendProcess(process.id)}
                                                        >
                                                            <PauseCircle className="h-4 w-4 mr-1" />
                                                            停用
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8"
                                                        onClick={(e) => handleViewProcess(process.id, e)}
                                                    >
                                                        <Eye className="h-4 w-4 mr-1" />
                                                        详情
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            没有找到匹配的流程定义
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            <ProcessViewerDrawer
                open={viewerOpen}
                onOpenChange={setViewerOpen}
                processId={selectedProcessId}
            />
        </AppLayout>
    );
}
