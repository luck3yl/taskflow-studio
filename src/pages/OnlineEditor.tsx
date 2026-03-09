import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTaskContext } from "@/contexts/TaskContext";
import { useUserContext } from "@/contexts/UserContext";
import {
    ONLYOFFICE_CONFIG,
    createEditorConfig,
    generateDocKey,
} from "@/lib/onlyoffice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, FileText, Users, Wifi, WifiOff } from "lucide-react";

declare global {
    interface Window {
        DocsAPI?: {
            DocEditor: new (
                id: string,
                config: ReturnType<typeof createEditorConfig>
            ) => { destroyEditor: () => void };
        };
    }
}

export default function OnlineEditor() {
    const { taskId, assigneeId } = useParams<{
        taskId: string;
        assigneeId: string;
    }>();
    const navigate = useNavigate();
    const { getTaskById } = useTaskContext();
    const { currentUser } = useUserContext();

    const editorRef = useRef<HTMLDivElement>(null);
    const editorInstanceRef = useRef<{ destroyEditor: () => void } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [scriptLoaded, setScriptLoaded] = useState(false);

    const task = taskId ? getTaskById(taskId) : undefined;
    const assignee = task?.assignees.find((a) => a.id === assigneeId);

    // 获取协作者列表（同一任务的其他负责人）
    const collaborators = task?.assignees.filter((a) => a.id !== assigneeId) || [];

    // 加载 OnlyOffice JS API 脚本
    useEffect(() => {
        const existingScript = document.querySelector(
            `script[src="${ONLYOFFICE_CONFIG.apiUrl}"]`
        );
        if (existingScript) {
            setScriptLoaded(true);
            return;
        }

        const script = document.createElement("script");
        script.src = ONLYOFFICE_CONFIG.apiUrl;
        script.async = true;
        script.onload = () => {
            setScriptLoaded(true);
        };
        script.onerror = () => {
            setError("无法连接到 OnlyOffice Document Server，请检查服务是否正常运行。");
            setLoading(false);
        };
        document.head.appendChild(script);

        return () => {
            // 不移除 script，避免重复加载
        };
    }, []);

    // 初始化编辑器
    useEffect(() => {
        if (!scriptLoaded || !task || !assignee) return;

        // 等待 DocsAPI 可用
        const initEditor = () => {
            if (!window.DocsAPI) {
                setError("OnlyOffice API 加载失败，请刷新页面重试。");
                setLoading(false);
                return;
            }

            const filename = task.templateFileName || "未命名文档.docx";
            const fileUrl = task.templateFileUrl || "";
            const docKey = generateDocKey(task.id, filename);

            if (!fileUrl) {
                setError("该任务没有关联的文档文件。");
                setLoading(false);
                return;
            }

            try {
                // 本地 Docker 容器和前端都在同一台机器（或者 Docker 宿主机网络）
                // 容器内访问宿主机的端口，在 Windows/Mac Docker 中可以使用 host.docker.internal
                // 动态获取当前前端所在的端口，确保回调地址正确
                const currentPort = window.location.port || "80";
                // 将文件名作为参数传递给回调接口，方便后端识别要保存到哪个文件
                const callbackUrl = `http://host.docker.internal:${currentPort}/api/onlyoffice/callback?filename=${encodeURIComponent(filename)}`;

                // 同样动态调整 fileUrl 中的端口，确保容器能正确抓取文件
                const adjustedFileUrl = fileUrl.replace("host.docker.internal:8080", `host.docker.internal:${currentPort}`);

                const config = createEditorConfig({
                    fileUrl: adjustedFileUrl,
                    filename,
                    docKey,
                    userId: currentUser.id,
                    userName: currentUser.name,
                    callbackUrl,
                    mode: "edit",
                });

                // 销毁已有的编辑器实例
                if (editorInstanceRef.current) {
                    editorInstanceRef.current.destroyEditor();
                }

                editorInstanceRef.current = new window.DocsAPI.DocEditor(
                    "onlyoffice-editor",
                    config
                );
                setLoading(false);
            } catch (err) {
                console.error("OnlyOffice editor init error:", err);
                setError("编辑器初始化失败，请检查 Document Server 配置。");
                setLoading(false);
            }
        };

        // 给 DocsAPI 一点时间加载
        const timer = setTimeout(initEditor, 500);

        return () => {
            clearTimeout(timer);
            if (editorInstanceRef.current) {
                try {
                    editorInstanceRef.current.destroyEditor();
                } catch {
                    // ignore
                }
                editorInstanceRef.current = null;
            }
        };
    }, [scriptLoaded, task, assignee, currentUser]);

    if (!task || !assignee) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
                    <h2 className="text-xl font-semibold text-foreground">任务不存在</h2>
                    <p className="text-muted-foreground">请从待办中心进入编辑页面</p>
                    <Button onClick={() => navigate("/todos")} variant="outline">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        返回待办中心
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-background">
            {/* 顶部工具栏 */}
            <div className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate("/todos")}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        返回
                    </Button>

                    <div className="h-6 w-px bg-border" />

                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="font-medium text-foreground text-sm">
                            {task.title}
                        </span>
                        {assignee.pageRange && (
                            <Badge
                                variant="outline"
                                className="text-xs text-primary border-primary/30"
                            >
                                第 {assignee.pageRange} 页
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* 协作者头像 */}
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div className="flex -space-x-2">
                            {/* 当前用户 */}
                            <Avatar className="h-7 w-7 border-2 border-background ring-2 ring-primary">
                                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                    {currentUser.avatar}
                                </AvatarFallback>
                            </Avatar>
                            {/* 其他协作者 */}
                            {collaborators.slice(0, 4).map((c) => (
                                <Avatar
                                    key={c.id}
                                    className="h-7 w-7 border-2 border-background"
                                >
                                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                                        {c.avatar}
                                    </AvatarFallback>
                                </Avatar>
                            ))}
                            {collaborators.length > 4 && (
                                <Avatar className="h-7 w-7 border-2 border-background">
                                    <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                                        +{collaborators.length - 4}
                                    </AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    </div>

                    {/* 连接状态 */}
                    <Badge
                        variant="outline"
                        className={
                            error
                                ? "text-destructive border-destructive/30"
                                : "text-success border-success/30"
                        }
                    >
                        {error ? (
                            <>
                                <WifiOff className="h-3 w-3 mr-1" />
                                未连接
                            </>
                        ) : (
                            <>
                                <Wifi className="h-3 w-3 mr-1" />
                                已连接
                            </>
                        )}
                    </Badge>
                </div>
            </div>

            {/* 编辑器区域 */}
            <div className="flex-1 relative">
                {/* 加载状态 */}
                {loading && !error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
                        <div className="text-center space-y-4">
                            <div className="h-12 w-12 mx-auto border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                            <p className="text-muted-foreground">正在加载编辑器...</p>
                        </div>
                    </div>
                )}

                {/* 错误状态 */}
                {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
                        <div className="text-center space-y-4 max-w-md px-6">
                            <div className="h-16 w-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                                <WifiOff className="h-8 w-8 text-destructive" />
                            </div>
                            <h2 className="text-xl font-semibold text-foreground">
                                连接失败
                            </h2>
                            <p className="text-muted-foreground">{error}</p>
                            <div className="flex gap-3 justify-center">
                                <Button
                                    variant="outline"
                                    onClick={() => navigate("/todos")}
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    返回待办中心
                                </Button>
                                <Button onClick={() => window.location.reload()}>
                                    重新连接
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* OnlyOffice 编辑器容器 */}
                <div
                    id="onlyoffice-editor"
                    ref={editorRef}
                    className="h-full w-full"
                />
            </div>
        </div>
    );
}
