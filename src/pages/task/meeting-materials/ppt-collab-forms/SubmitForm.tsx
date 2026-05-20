import { useState } from "react";
import { Upload, FileText, Download, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useTaskContext } from "@/contexts/TaskContext";
import { useUserContext } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { uploadFileApi, getFileDownloadUrl } from "@/services/apis/files";
import { cn, formatPageRange } from "@/lib/utils";
import type { PptCollabFormProps } from "./types";
import type { MeetingMaterialUserAssignment } from "@/types/task";

// ---- AssignmentInfo ----
function AssignmentInfo({
  ua,
  deptName,
}: {
  ua: MeetingMaterialUserAssignment;
  deptName: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-secondary/20 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground/80">我的任务</span>
        <Badge variant="outline" className="text-xs">
          {deptName}
        </Badge>
      </div>
      <div className="text-sm text-foreground/70">
        负责第{" "}
        <span className="font-bold text-primary">{formatPageRange(ua.pages)}</span>{" "}
        页
      </div>
      {ua.taskDescription && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {ua.taskDescription}
        </p>
      )}
      {ua.status === "rejected" && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20 mt-2">
          <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
          <p className="text-xs text-destructive">
            上次提交已被驳回，请修改后重新提交
          </p>
        </div>
      )}
    </div>
  );
}

// ---- FileUploadArea ----
function FileUploadArea({
  file,
  onChange,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  return (
    <div>
      <Label className="text-xs font-medium">上传文件</Label>
      <input
        type="file"
        id="ppt-collab-submit-file"
        className="hidden"
        accept=".ppt,.pptx,.pdf"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      <label
        htmlFor="ppt-collab-submit-file"
        className={cn(
          "mt-1.5 flex items-center justify-center h-20 border-2 border-dashed rounded-xl cursor-pointer transition-colors",
          file
            ? "border-primary/50 bg-primary/5"
            : "border-border bg-muted/30 hover:border-primary/50"
        )}
      >
        <div className="text-center px-4">
          {file ? (
            <>
              <FileText className="h-5 w-5 text-primary mx-auto" />
              <p className="text-xs text-primary mt-1 font-medium truncate max-w-[200px]">
                {file.name}
              </p>
            </>
          ) : (
            <>
              <Upload className="h-5 w-5 text-muted-foreground mx-auto" />
              <p className="text-xs text-muted-foreground mt-1">
                点击上传 .pptx 文件
              </p>
            </>
          )}
        </div>
      </label>
    </div>
  );
}

// ---- SubmitForm ----
export function SubmitForm({ task, onSuccess, onError }: PptCollabFormProps) {
  const { completePptAction } = useTaskContext();
  const { currentUser } = useUserContext();
  const { toast } = useToast();

  const workflow = task.meetingMaterialWorkflow;

  // Find current user's pending/rejected assignment
  let myUa: MeetingMaterialUserAssignment | undefined;
  let myDeptName = "";
  let myUaId = "";

  if (workflow) {
    for (const dept of workflow.deptAssignments) {
      for (const ua of dept.userAssignments) {
        if (
          ua.userId === currentUser.id &&
          (ua.status === "pending" || ua.status === "rejected")
        ) {
          myUa = ua;
          myDeptName = dept.department;
          myUaId = ua.id;
          break;
        }
      }
      if (myUa) break;
    }
  }

  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute baseVersion: max version of pages I'm responsible for
  const baseVersion = myUa
    ? Math.max(
        0,
        ...myUa.pages.map((p) => workflow?.pageVersions[p] ?? 0)
      )
    : 0;

  // Template download URL with ua_id param
  const templateDownloadUrl = task.templateFileId
    ? getFileDownloadUrl(task.templateFileId, { uaId: myUaId })
    : task.templateFileUrl
    ? `${task.templateFileUrl}?ua_id=${myUaId}`
    : undefined;

  const handleSubmit = async () => {
    if (!myUa) return;

    if (!file) {
      toast({ title: "请先选择要提交的文件", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      // Step 1: upload file
      const uploaded = await uploadFileApi({
        file,
        category: "submission",
      });

      // Step 2: submit action
      const updatedTask = await completePptAction(task.id, {
        action: "submit",
        payload: {
          uaId: myUaId,
          fileId: uploaded.fileId,
          baseVersion,
          note: note.trim() || "",
        },
      });

      // Check for conflict in response
      const updatedWorkflow = updatedTask.meetingMaterialWorkflow;
      const updatedUa = updatedWorkflow?.deptAssignments
        .flatMap((d) => d.userAssignments)
        .find((ua) => ua.id === myUaId);
      const latestSub = updatedUa?.submissions[updatedUa.submissions.length - 1];

      if (latestSub?.hasConflict) {
        toast({
          title: "版本冲突",
          description:
            latestSub.conflictDescription ||
            "您负责的页面已有更新版本，请下载最新模板后重新提交。",
          variant: "destructive",
        });
        // Don't close form on conflict
        return;
      }

      toast({ title: "提交成功", description: "已提交，等待室主任审核" });
      setFile(null);
      setNote("");
      onSuccess(updatedTask);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      toast({
        title: "提交失败",
        description: err.message,
        variant: "destructive",
      });
      onError?.(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!myUa) {
    return (
      <div className="text-sm text-muted-foreground py-2">
        您当前没有待提交的任务。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-foreground">上传提交</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          上传您负责页面的 PPT 文件
        </p>
      </div>

      <AssignmentInfo ua={myUa} deptName={myDeptName} />

      {/* Template download */}
      {templateDownloadUrl && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/60 bg-secondary/20">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 text-blue-500 shrink-0" />
            <span className="text-xs text-foreground/80 truncate">
              {task.templateFileName || "模板文件"}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5 shrink-0"
            onClick={async () => {
              try {
                const resp = await fetch(templateDownloadUrl);
                const blob = await resp.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = task.templateFileName || "模板文件.pptx";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              } catch {
                // fallback
                window.location.href = templateDownloadUrl;
              }
            }}
          >
            <Download className="h-3.5 w-3.5" />
            下载我的页面
          </Button>
        </div>
      )}

      <FileUploadArea file={file} onChange={setFile} />

      <div>
        <Label className="text-xs font-medium">备注说明（选填）</Label>
        <Textarea
          className="mt-1.5 resize-none text-sm"
          rows={2}
          placeholder="填写本次修改说明..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <Button
        className="w-full h-10 font-semibold"
        disabled={isSubmitting || !file}
        onClick={handleSubmit}
      >
        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {myUa.status === "rejected" ? "重新提交" : "确认提交"}
      </Button>
    </div>
  );
}
