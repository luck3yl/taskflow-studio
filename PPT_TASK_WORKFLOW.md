# PPT 任务全流程接口调用指南

> 本文档描述前端如何通过接口完成一个 PPT 协同任务的完整生命周期

---

## 📋 流程概览

```
1. 创建任务（发布人）
   ↓
2. 部门负责人分配页面给员工
   ↓
3. 员工提交 PPT
   ↓
4. 部门负责人审核
   ↓
5. 审核人汇总审核
   ↓
6. 审批人终审
   ↓
7. 标记合并完成
```

---

## 阶段一：创建任务

### 角色：发布人（如：办公室主任）

### 1.1 上传模板文件

**接口**: `POST /api/v1/files/upload`

**请求** (multipart/form-data):
```
file: 集团战略发展规划.pptx
category: template
metadata: {"task_type": "ppt_collab"}
```

**响应**:
```json
{
  "fileId": "file-001",
  "fileName": "集团战略发展规划.pptx",
  "fileUrl": "/files/file-001",
  "fileSize": 5.8,
  "pageCount": 30,
  "category": "template",
  "uploadedAt": "2026-03-01T10:00:00Z"
}
```

**前端处理**:
- 用户选择文件后**立即调用此接口上传**，不要等到点"下一步"再上传
- 后端解析 PPT/PDF 页数，通过 `pageCount` 返回给前端
- 前端保存 `fileId` 和 `pageCount`，用于后续步骤的页面分配
- 前端显示"共 X 页"即来自此响应的 `pageCount`，**不要硬编码**

---

### 1.2 创建 PPT 任务

**接口**: `POST /api/v1/tasks`

**请求** (multipart/form-data):
```
title: 2026年度集团战略发展规划演示文稿
description: 请各部门按照分配的页面完成相关内容，截止时间 3月30日 18:00
type: 例会资料
department: 全公司
deadline: 2026-03-30 18:00
form_key: ppt_collab
workflow_config: {
  "totalPages": 30,
  "templateFileId": "file-001",
  "reviewerId": "user-reviewer",
  "approverId": "user-approver",
  "deptAssignments": [
    {
      "department": "设备室",
      "pages": [1,2,3,4,5],
      "headUserId": "user-head-1",
      "requirement": "负责设备管理系统架构设计及运维流程"
    },
    {
      "department": "生产厂",
      "pages": [6,7,8,9,10],
      "headUserId": "user-head-2",
      "requirement": "负责生产线自动化改造方案"
    }
  ]
}
```

**响应**:
```json
{
  "id": "task-001",
  "title": "2026年度集团战略发展规划演示文稿",
  "formKey": "ppt_collab",
  "workflowState": {
    "stage": "dept_assignment",
    "totalPages": 30,
    "templateFileId": "file-001",
    "deptAssignments": [
      {
        "id": "da-001",
        "department": "设备室",
        "pages": [1,2,3,4,5],
        "headUserId": "user-head-1",
        "headUserName": "王芳",
        "requirement": "负责设备管理系统架构设计及运维流程",
        "status": "pending",
        "userAssignments": []
      },
      {
        "id": "da-002",
        "department": "生产厂",
        "pages": [6,7,8,9,10],
        "headUserId": "user-head-2",
        "headUserName": "李强",
        "requirement": "负责生产线自动化改造方案",
        "status": "pending",
        "userAssignments": []
      }
    ],
    "pageVersions": {},
    "reviewerId": "user-reviewer",
    "reviewerName": "张总",
    "approverId": "user-approver",
    "approverName": "陈总"
  },
  "allowedActions": [],
  "createdAt": "2026-03-01T10:00:00Z"
}
```

**说明**:
- `reviewerId` / `approverId` 来自 `GET /api/v1/users` 返回的用户 `id`，前端在用户选择弹窗中选取，无需额外接口
- `templateFileId` 来自上一步 1.1 上传模板文件后返回的 `fileId`
- `totalPages` 来自上一步 1.1 上传模板文件后返回的 `pageCount`

---


## 阶段二：部门负责人分配页面

### 角色：部门负责人（如：设备室主任 王芳）

### 2.1 查看任务详情

**接口**: `GET /api/v1/tasks/task-001`

**响应**:
```json
{
  "id": "task-001",
  "title": "2026年度集团战略发展规划演示文稿",
  "formKey": "ppt_collab",
  "workflowState": {
    "stage": "dept_assignment",
    "totalPages": 30,
    "deptAssignments": [
      {
        "id": "da-001",
        "department": "设备室",
        "pages": [1,2,3,4,5],
        "headUserId": "user-head-1",
        "requirement": "负责设备管理系统架构设计及运维流程",
        "status": "pending",
        "userAssignments": []
      }
    ]
  },
  "allowedActions": ["assign_pages"]
}
```

**说明**:
- `allowed_actions: ["assign_pages"]` 表示当前用户（部门负责人）可以分配页面

---

### 2.2 分配页面给员工

**接口**: `POST /api/v1/tasks/task-001/action`

**请求**:
```json
{
  "action": "assign_pages",
  "payload": {
    "deptId": "da-001",
    "assignments": [
      {
        "userId": "user-001",
        "pages": [1, 2],
        "taskDescription": "负责设备管理系统架构设计"
      },
      {
        "userId": "user-002",
        "pages": [3, 4, 5],
        "taskDescription": "负责设备运维流程优化"
      }
    ]
  }
}
```

**响应**:
```json
{
  "success": true,
  "result": {
    "assignedCount": 2
  },
  "workflowState": {
    "stage": "in_progress",
    "deptAssignments": [
      {
        "id": "da-001",
        "department": "设备室",
        "status": "in_progress",
        "userAssignments": [
          {
            "id": "ua-001",
            "userId": "user-001",
            "userName": "张明",
            "pages": [1, 2],
            "taskDescription": "负责设备管理系统架构设计",
            "status": "pending",
            "submissions": []
          },
          {
            "id": "ua-002",
            "userId": "user-002",
            "userName": "李华",
            "pages": [3, 4, 5],
            "taskDescription": "负责设备运维流程优化",
            "status": "pending",
            "submissions": []
          }
        ]
      }
    ]
  }
}
```

**说明**:
- `stage` 从 `dept_assignment` 变为 `in_progress`
- 员工会在"我的待办"中看到分配给自己的页面

---


## 阶段三：员工提交 PPT

### 角色：员工（如：张明）

### 3.1 查看我的待办

**接口**: `GET /api/v1/tasks/my-todos?user_id=user-001`

**响应**:
```json
{
  "data": [
    {
      "task": {
        "id": "task-001",
        "title": "2026年度集团战略发展规划演示文稿",
        "formKey": "ppt_collab",
        "deadline": "2026-03-30 18:00"
      },
      "user_assignment": {
        "id": "ua-001",
        "pages": [1, 2],
        "taskDescription": "负责设备管理系统架构设计",
        "status": "pending"
      },
      "dept_assignment": {
        "id": "da-001",
        "department": "设备室"
      }
    }
  ]
}
```

---

### 3.2 下载模板文件（裁剪指定页面）

**接口**: `GET /api/v1/files/file-001?ua_id=ua-001`

**说明**:
- 传入 `ua_id` 参数，后端会自动裁剪出该员工负责的页面（第 1-2 页）
- 返回裁剪后的 PPT 文件流

---

### 3.3 上传完成的 PPT

**接口**: `POST /api/v1/files/upload`

**请求** (multipart/form-data):
```
file: 设备管理系统架构_张明.pptx
category: submission
metadata: {"task_id": "task-001", "uaId": "ua-001"}
```

**响应**:
```json
{
  "fileId": "file-002",
  "fileName": "设备管理系统架构_张明.pptx",
  "fileUrl": "/files/file-002",
  "pageCount": 2,
  "uploadedAt": "2026-03-05T14:30:00Z"
}
```

---

### 3.4 提交 PPT

**接口**: `POST /api/v1/tasks/task-001/action`

**请求**:
```json
{
  "action": "submit",
  "payload": {
    "deptId": "da-001",
    "uaId": "ua-001",
    "fileId": "file-002",
    "baseVersion": 0,
    "note": "初稿完成，包含系统架构图和技术选型说明"
  }
}
```

**响应**:
```json
{
  "success": true,
  "result": {
    "submissionId": "sub-001",
    "version": 1,
    "hasConflict": false
  },
  "workflowState": {
    "stage": "in_progress",
    "pageVersions": {
      "1": 1,
      "2": 1
    },
    "deptAssignments": [
      {
        "id": "da-001",
        "userAssignments": [
          {
            "id": "ua-001",
            "status": "submitted",
            "submissions": [
              {
                "id": "sub-001",
                "fileId": "file-002",
                "version": 1,
                "baseVersion": 0,
                "hasConflict": false,
                "note": "初稿完成，包含系统架构图和技术选型说明",
                "submittedAt": "2026-03-05T14:30:00Z",
                "status": "pending"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

**说明**:
- `status` 从 `pending` 变为 `submitted`
- `page_versions` 记录了第 1-2 页的当前版本为 1
- `has_conflict: false` 表示无版本冲突
- 部门负责人会收到待审核通知

---


## 阶段四：部门负责人审核

### 角色：部门负责人（如：设备室主任 王芳）

### 4.1 查看待审核提交

**接口**: `GET /api/v1/tasks/task-001`

**响应**:
```json
{
  "id": "task-001",
  "workflowState": {
    "stage": "dept_reviewing",
    "deptAssignments": [
      {
        "id": "da-001",
        "status": "reviewing",
        "userAssignments": [
          {
            "id": "ua-001",
            "userName": "张明",
            "status": "submitted",
            "submissions": [
              {
                "id": "sub-001",
                "fileId": "file-002",
                "fileName": "设备管理系统架构_张明.pptx",
                "status": "pending"
              }
            ]
          }
        ]
      }
    ]
  },
  "allowedActions": ["review"]
}
```

---

### 4.2 审核通过

**接口**: `POST /api/v1/tasks/task-001/action`

**请求**:
```json
{
  "action": "review",
  "payload": {
    "deptId": "da-001",
    "uaId": "ua-001",
    "submissionId": "sub-001",
    "approved": true,
    "feedback": "内容完整，架构图清晰，通过审核"
  }
}
```

**响应**:
```json
{
  "success": true,
  "result": {
    "reviewedAt": "2026-03-06T09:00:00Z"
  },
  "workflowState": {
    "stage": "dept_reviewing",
    "deptAssignments": [
      {
        "id": "da-001",
        "userAssignments": [
          {
            "id": "ua-001",
            "status": "dept_approved",
            "submissions": [
              {
                "id": "sub-001",
                "status": "approved",
                "reviewedAt": "2026-03-06T09:00:00Z",
                "feedback": "内容完整，架构图清晰，通过审核"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

**说明**:
- `status` 从 `submitted` 变为 `dept_approved`
- 如果所有员工都通过部门审核，`stage` 会自动变为 `final_reviewing`

---

### 4.3 审核驳回（可选）

**请求**:
```json
{
  "action": "review",
  "payload": {
    "deptId": "da-001",
    "uaId": "ua-001",
    "submissionId": "sub-001",
    "approved": false,
    "feedback": "架构图缺少数据流向说明，请补充"
  }
}
```

**说明**:
- 驳回后员工需要重新提交
- `status` 变为 `rejected`，员工可以再次上传

---


## 阶段五：审核人汇总审核

### 角色：审核人（如：张总）

### 5.1 查看任务状态

**接口**: `GET /api/v1/tasks/task-001`

**响应**:
```json
{
  "id": "task-001",
  "workflowState": {
    "stage": "final_reviewing",
    "deptAssignments": [
      {
        "id": "da-001",
        "department": "设备室",
        "status": "dept_approved",
        "userAssignments": [
          {
            "id": "ua-001",
            "status": "dept_approved"
          },
          {
            "id": "ua-002",
            "status": "dept_approved"
          }
        ]
      },
      {
        "id": "da-002",
        "department": "生产厂",
        "status": "dept_approved"
      }
    ]
  },
  "allowedActions": ["final_approve"]
}
```

**说明**:
- 所有部门都完成审核后，`stage` 变为 `final_reviewing`
- 审核人可以执行 `final_approve` 动作

---

### 5.2 终审通过

**接口**: `POST /api/v1/tasks/task-001/action`

**请求**:
```json
{
  "action": "final_approve",
  "payload": {
    "approved": true,
    "feedback": "各部门内容质量良好，同意进入合并阶段"
  }
}
```

**响应**:
```json
{
  "success": true,
  "result": {
    "approved_at": "2026-03-10T10:00:00Z"
  },
  "workflowState": {
    "stage": "approved",
    "finalApprovedAt": "2026-03-10T10:00:00Z",
    "finalFeedback": "各部门内容质量良好，同意进入合并阶段"
  }
}
```

**说明**:
- `stage` 从 `final_reviewing` 变为 `approved`
- 任务进入合并阶段

---


## 阶段六：标记合并完成

### 角色：发布人或指定合并人

### 6.1 下载所有已审核的 PPT

**接口**: `GET /api/v1/tasks/task-001`

**说明**:
- 从 `workflow_state.dept_assignments[].user_assignments[].submissions[]` 中获取所有 `status: approved` 的 `file_id`
- 逐个调用 `GET /api/v1/files/{file_id}` 下载

---

### 6.2 手动合并 PPT

**说明**:
- 前端或后端工具将各部门的 PPT 按页码顺序合并成最终版本
- 上传合并后的文件

**接口**: `POST /api/v1/files/upload`

**请求** (multipart/form-data):
```
file: 2026年度集团战略发展规划_最终版.pptx
category: submission
metadata: {"task_id": "task-001", "is_merged": true}
```

**响应**:
```json
{
  "fileId": "file-merged-001",
  "fileName": "2026年度集团战略发展规划_最终版.pptx",
  "pageCount": 30,
  "uploadedAt": "2026-03-12T16:00:00Z"
}
```

---

### 6.3 标记任务完成

**接口**: `POST /api/v1/tasks/task-001/action`

**请求**:
```json
{
  "action": "mark_merged",
  "payload": {
    "mergedFileId": "file-merged-001"
  }
}
```

**响应**:
```json
{
  "success": true,
  "result": {
    "mergedAt": "2026-03-12T16:00:00Z"
  },
  "workflowState": {
    "stage": "merged",
    "mergedFileId": "file-merged-001",
    "merged_file_name": "2026年度集团战略发展规划_最终版.pptx",
    "mergedAt": "2026-03-12T16:00:00Z"
  }
}
```

**说明**:
- `stage` 变为 `merged`，任务完成
- 所有参与人员可以下载最终版本

---


## 📊 阶段状态流转图

```
dept_assignment (部门负责人分配)
    ↓
in_progress (员工制作中)
    ↓
dept_reviewing (部门审核中)
    ↓
final_reviewing (终审中)
    ↓
approved (审批通过)
    ↓
merged (合并完成)
```

---

## 🔄 常见场景

### 场景 1：版本冲突处理

**情况**: 员工 A 基于版本 0 提交，但页面已被更新到版本 1

**响应**:
```json
{
  "success": false,
  "error": {
    "code": "VERSION_CONFLICT",
    "message": "页面版本冲突，请下载最新版本后重新编辑",
    "detail": {
      "conflicted_pages": [1, 2],
      "current_versions": {"1": 1, "2": 1},
      "submitted_base_version": 0
    }
  }
}
```

**处理流程**:
1. 提示用户下载最新版本
2. 用户合并内容后重新提交，`base_version` 设为当前版本

---

### 场景 2：员工重新提交

**情况**: 部门负责人驳回后，员工修改并重新提交

**请求**:
```json
{
  "action": "submit",
  "payload": {
    "deptId": "da-001",
    "uaId": "ua-001",
    "fileId": "file-003",
    "baseVersion": 1,
    "note": "已补充数据流向说明"
  }
}
```

**说明**:
- 新提交会创建 version 2
- 旧提交保留在历史记录中

---

### 场景 3：查询任务进度

**接口**: `GET /api/v1/tasks/task-001`

**前端展示逻辑**:
```typescript
const getProgress = (workflow_state) => {
  const total = workflow_state.dept_assignments.reduce((sum, dept) => 
    sum + dept.user_assignments.length, 0
  );
  
  const completed = workflow_state.dept_assignments.reduce((sum, dept) => 
    sum + dept.user_assignments.filter(ua => 
      ua.status === 'dept_approved' || ua.status === 'final_approved'
    ).length, 0
  );
  
  return { completed, total, percentage: (completed / total * 100).toFixed(0) };
};
```

---


## 📋 接口速查表

| 阶段 | 角色 | 接口 | 说明 |
|---|---|---|---|
| 创建 | 发布人 | `POST /files/upload` | 上传模板 |
| 创建 | 发布人 | `POST /tasks` | 创建任务 |
| 分配 | 部门负责人 | `GET /tasks/{id}` | 查看任务 |
| 分配 | 部门负责人 | `POST /tasks/{id}/action` (assign_pages) | 分配页面 |
| 制作 | 员工 | `GET /tasks/my-todos` | 查看待办 |
| 制作 | 员工 | `GET /files/{id}?ua_id=xxx` | 下载模板 |
| 制作 | 员工 | `POST /files/upload` | 上传 PPT |
| 制作 | 员工 | `POST /tasks/{id}/action` (submit) | 提交 PPT |
| 审核 | 部门负责人 | `POST /tasks/{id}/action` (review) | 审核提交 |
| 终审 | 审核人 | `POST /tasks/{id}/action` (final_approve) | 终审 |
| 合并 | 发布人 | `POST /files/upload` | 上传合并文件 |
| 合并 | 发布人 | `POST /tasks/{id}/action` (mark_merged) | 标记完成 |

---

## ⚠️ 注意事项

### 1. 权限控制
- 后端通过 `allowed_actions` 返回当前用户可执行的动作
- 前端根据 `allowed_actions` 显示/隐藏按钮
- 不要依赖前端判断权限，后端会二次校验

### 2. 版本冲突
- 员工提交时必须传 `base_version`
- 如果 `base_version` 小于当前版本，后端返回冲突错误
- 前端提示用户下载最新版本重新编辑

### 3. 文件上传
- 先调用 `POST /files/upload` 获取 `file_id`
- 再调用 `POST /tasks/{id}/action` 提交任务时传 `file_id`
- 不要在 action 接口中直接上传文件

### 4. 页面裁剪
- 下载模板时传 `ua_id` 参数，后端自动裁剪
- 员工只能看到自己负责的页面
- 合并时需要下载所有已审核的文件

### 5. 状态轮询
- 不需要轮询，使用 WebSocket 或 SSE 推送状态变更
- 或者在用户操作时主动调用 `GET /tasks/{id}` 刷新

---

## 🎯 前端实现建议

### 1. 状态管理
```typescript
interface PptTask {
  id: string;
  title: string;
  form_key: 'ppt_collab';
  workflow_state: {
    stage: 'dept_assignment' | 'in_progress' | 'dept_reviewing' | 'final_reviewing' | 'approved' | 'merged';
    total_pages: number;
    dept_assignments: DeptAssignment[];
    page_versions: Record<number, number>;
  };
  allowed_actions: string[];
}
```

### 2. 组件拆分
- `PptTaskCreate.tsx` - 创建任务
- `PptTaskDetail.tsx` - 任务详情（根据 stage 显示不同内容）
- `PptDeptAssign.tsx` - 部门负责人分配页面
- `PptEmployeeSubmit.tsx` - 员工提交
- `PptReview.tsx` - 审核界面

### 3. 接口封装
```typescript
class PptTaskApi {
  static async create(data: CreateTaskDto) { ... }
  static async assignPages(taskId: string, payload: AssignPagesDto) { ... }
  static async submit(taskId: string, payload: SubmitDto) { ... }
  static async review(taskId: string, payload: ReviewDto) { ... }
  static async finalApprove(taskId: string, payload: ApproveDto) { ... }
  static async markMerged(taskId: string, payload: MergedDto) { ... }
}
```

---

## 📞 联系方式

如有疑问，请参考：
- 完整接口文档：`API_DOCUMENTATION.md`
- 系统设计文档：`SYSTEM_DESIGN.md`
- 工作流设计文档：`WORKFLOW_DESIGN.md`

