// OnlyOffice Document Server 配置
export const ONLYOFFICE_CONFIG = {
    // Document Server 地址 (本地 Dokcer)
    documentServerUrl: "http://localhost:9980",
    // JS API 脚本地址
    apiUrl: "http://localhost:9980/web-apps/apps/api/documents/api.js",
};

// 根据文件扩展名获取文档类型
export function getDocumentType(filename: string): "word" | "cell" | "slide" {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    if (["xlsx", "xls", "csv", "ods"].includes(ext)) return "cell";
    if (["pptx", "ppt", "odp"].includes(ext)) return "slide";
    return "word"; // docx, doc, odt, pdf, txt, etc.
}

// 根据文件扩展名获取 fileType
export function getFileType(filename: string): string {
    return filename.split(".").pop()?.toLowerCase() || "docx";
}

// 生成文档 key（同一文档使用固定 key，OnlyOffice 用来标识协作会话）
// 同一 key 的多个用户会进入同一个协作编辑会话
export function generateDocKey(taskId: string, filename: string): string {
    // 使用固定的 key，不加时间戳，这样同一文档的多个用户可以协作
    return `${taskId}-${filename.replace(/[^a-zA-Z0-9]/g, "_")}`;
}

// 生成 OnlyOffice 编辑器配置
export function createEditorConfig(options: {
    fileUrl: string;
    filename: string;
    docKey: string;
    userId: string;
    userName: string;
    callbackUrl?: string;
    mode?: "edit" | "view";
    lang?: string;
}) {
    const {
        fileUrl,
        filename,
        docKey,
        userId,
        userName,
        callbackUrl,
        mode = "edit",
        lang = "zh-CN",
    } = options;

    return {
        document: {
            fileType: getFileType(filename),
            key: docKey,
            title: filename,
            url: fileUrl,
            permissions: {
                comment: true,
                download: true,
                edit: mode === "edit",
                print: true,
                review: true,
            },
        },
        documentType: getDocumentType(filename),
        editorConfig: {
            // callbackUrl 是必须的，即使是 demo 也需要一个可响应的地址
            // Document Server 会向这个地址发 POST 请求
            // 如果没有真实后端，可以留空让编辑器以 "查看" 模式降级
            ...(callbackUrl ? { callbackUrl } : {}),
            lang,
            mode,
            user: {
                id: userId,
                name: userName,
            },
            customization: {
                autosave: true,
                chat: true,
                comments: true,
                compactHeader: false,
                compactToolbar: false,
                forcesave: false,
                help: false,
                hideRightMenu: false,
            },
        },
        type: "desktop" as const,
        height: "100%",
        width: "100%",
    };
}
