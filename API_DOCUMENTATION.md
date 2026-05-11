# 后端接口文档

> Base URL: `/api/v1`  
> 认证方式: `Authorization: Bearer <token>`

---

## 一、流程管理

### 1.1 获取流程定义列表

**GET** `/processes`

**描述**: 获取所有已部署的流程定义

**请求参数**: 无

**响应**:
```json
{
  "data": [
    {
      "id": "process-def-id",
      "key": "BudgetReport",
      "name": "预算报告审批流程",
      "version": 1,
      "deployed_at": "2026-03-01T10:00:00Z"
    }
  ]
}
```

---

### 1.2 上传流程定义

**POST** `/processes/upload`

**描述**: 上传 BPMN 流程定义文件

**请求** (multipart/form-data):
```
file: .bpmn20.xml 文件
name: 流程名称
key: 流程键（唯一标识）
```

**响应**:
```json
{
  "id": "process-def-id",
  "key": "BudgetReport",
  "name": "预算报告审批流程",
  "version": 1
}
```

---

### 1.3 部署流程

**POST** `/processes/{process_id}/deploy`

**描述**: 部署流程定义，使其可用

**请求参数**: 无

**响应**:
```json
{
  "success": true,
  "deployment_id": "deploy-uuid",
  "deployed_at": "2026-03-01T10:00:00Z"
}
```

---

### 1.4 停用流程

**POST** `/processes/{process_id}/suspend`

**描述**: 停用流程定义，不再允许启动新实例

**请求参数**: 无

**响应**:
```json
{
  "success": true,
  "suspended_at": "2026-03-01T10:00:00Z"
}
```

---

### 1.5 启动流程实例

**POST** `/processes/{key}/start`

**描述**: 启动一个流程实例

**请求**:
```json
{
  "variables": {
    "applicant": "张三",
    "amount": 5000
  },
  "business_key": "optional-business-key"
}
```

**响应**:
```json
{
  "process_instance_id": "proc-instance-uuid",
  "started_at": "2026-03-01T10:00:00Z"
}
```

---

### 1.6 获取流程实例列表

**GET** `/processes/instances`

**描述**: 获取流程实例列表

**请求参数**:
- `status` (可选): `active` / `completed` / `suspended`
- `process_key` (可选): 流程键

**响应**:
```json
{
  "data": [
    {
      "id": "proc-instance-uuid",
      "process_key": "BudgetReport",
      "status": "active",
      "started_at": "2026-03-01T10:00:00Z"
    }
  ]
}
```

---

### 1.7 删除流程实例

**DELETE** `/processes/instances/{id}`

**描述**: 删除流程实例

**请求参数**: 无

**响应**:
```json
{
  "success": true
}
```

---

## 二、任务管理

### 2.1 获取任务列表

**GET** `/tasks`

**描述**: 获取任务列表（支持过滤）

**请求参数**:
- `type` (可选): 任务类型，枚举值见下方约定
- `department` (可选): 部门
- `status` (可选): `pending` / `in_progress` / `completed`
- `search` (可选): 关键词搜索 - 

按照工作组，个人任务进行过滤

**响应**:
```json
{
  "data": [
    {
      "id": "task-uuid",
      "name": "填写PPT材料",
      "formKey": "ppt_collab",
      "assignee": "user-1",
      "due": "2026-03-30T18:00:00Z",
      "created": "2026-03-01T10:00:00Z"
    }
  ]
}
```

---

### 2.2 获取任务详情

**GET** `/tasks/{task_id}`

**描述**: 获取任务详情，包含工作流状态和允许的动作

**请求参数**: 无

**响应**:
```json
{
  "id": "task-uuid",
  "name": "填写PPT材料",
  "formKey": "ppt_collab",
  "assignee": "user-1",
  "due": "2026-03-30T18:00:00Z",
  "created": "2026-03-01T10:00:00Z",
  
  "workflowState": { ###流程变量和任务变量，返回任务的变量和流程的信息
    "stage": "in_progress",
    "totalPages": 30,
    "deptAssignments": [...]
  },
  
  "allowedActions": ["submit", "assign_pages", "review"]
}
```

**说明**:
- `workflowState` 结构由 `formKey` 决定
- `allowedActions` 由后端根据当前用户角色和任务阶段计算

---

### 2.3 任务类型与工作流约定

**任务类型（type）枚举**:

| type | form_key | 说明 |
|---|---|---|
| `例会资料` | `ppt_collab` | PPT 多部门协同编辑，含分页分配、多级审批 |
| `调研反馈` | `simple_submit` | 普通文件提交审核 |
| `对标找差` | `simple_submit` | 普通文件提交审核 |
| `培训交流` | `simple_submit` | 普通文件提交审核 |
| `动态表单` | `form_dynamic` | 通用审批流程（请假、报销等） |

**说明**:
- 前端创建任务时，根据用户选择的 `type` 自动确定 `form_key`
- `form_key` 决定后端使用哪个 Handler，也决定前端渲染哪个组件
- `workflow_config` 的结构由 `form_key` 决定，见下方示例

---

### 2.4 创建任务 ###启动流程

**POST** `/tasks`

**描述**: 创建新任务

**请求** (multipart/form-data):
```
title: 任务标题
description: 任务描述
type: 任务类型
department: 部门
deadline: 截止时间 (2026-03-30 18:00)
formKey: 工作流类型 (ppt_collab / simple_submit / form_dynamic)
workflowConfig: JSON 字符串（初始配置）
templateFile: 模板文件（可选）
```

**workflowConfig 示例（ppt_collab）**:
```json
{
  "totalPages": 30,
  "templateFileId": "file-001",
  "reviewerId": "user-reviewer",
  "approverId": "user-approver",
  "deptAssignments": [
    {
      "department": "设备室",
      "pages": [1,2,3,4,5],
      "headUserId": "user-3",
      "requirement": "负责设备管理相关内容"
    }
  ]
}
```

**workflowConfig 示例（simple_submit）**:
```json
{
  "assignees": [
    {
      "userId": "user-1",
      "taskDescription": "负责自动化办公系统集成标准说明"
    }
  ]
}
```

**响应**:
```json
{
  "id": "task-uuid",
  "title": "2026年度集团战略发展规划演示文稿",
  "formKey": "ppt_collab",
  "workflowState": {...},
  "allowedActions": [],
  "createdAt": "2026-03-01T10:00:00Z"
}
```

---

### 2.5 删除任务

**DELETE** `/tasks/{task_id}`

**描述**: 删除任务

**请求参数**: 无

**响应**:
```json
{
  "success": true
}
```

---

### 2.6 获取我的待办

**GET** `/tasks/my-todos`

**描述**: 获取当前用户在所有任务中的待办项

**请求参数**:
- `user_id` (可选): 用户ID（默认当前用户）

**响应**:
```json
{
  "data": [
    {
      "task": {
        "id": "task-uuid",
        "title": "2026年度集团战略发展规划演示文稿",
        "form_key": "ppt_collab",
        "deadline": "2026-03-30 18:00"
      },
      "assignee": {...},
      "user_assignment": {...},
      "dept_assignment": {...}
    }
  ]
}
```

---

### 2.7 执行工作流动作 ###提交任务

**POST** `/tasks/{task_id}/action`

**描述**: 执行工作流动作（通用接口，所有任务类型共用）

**请求**:
```json
{
  "action": "submit",
  "payload": {
    "fileId": "file-uuid",
    "note": "初稿完成"
  }
}
```

**响应**:
```json
{
  "success": true,
  "result": {
    "submissionId": "sub-uuid"
  },
  "workflowState": {...}
}
```
###参考flowable的接口，业务无关，任务的接口跟任务无关，不可以出现

**支持的 action（ppt_collab）**:
- `assign_pages` - 分配页面给员工
  ```json
  {
    "action": "assign_pages",
    "payload": {
      "deptId": "da-uuid",
      "assignments": [
        {
          "userId": "user-1",
          "pages": [1,3,5,7,9],
          "taskDescription": "负责设备管理系统架构设计"
        }
      ]
    }
  }
  ```

- `submit` - 员工提交 PPT
  ```json
  {
    "action": "submit",
    "payload": {
      "deptId": "da-uuid",
      "uaId": "ua-uuid",
      "fileId": "file-uuid",
      "baseVersion": 0,
      "note": "初稿完成"
    }
  }
  ```

- `review` - 室主任审核
  ```json
  {
    "action": "review",
    "payload": {
      "deptId": "da-uuid",
      "uaId": "ua-uuid",
      "submissionId": "sub-uuid",
      "approved": true,
      "feedback": "审核通过"
    }
  }
  ```

- `final_approve` - 部长终审
  ```json
  {
    "action": "final_approve",
    "payload": {
      "deptId": "da-uuid",
      "uaId": "ua-uuid",
      "approved": true,
      "feedback": "部长审批通过"
    }
  }
  ```

- `mark_merged` - 标记合并完成
  ```json
  {
    "action": "mark_merged",
    "payload": {
      "mergedFileId": "file-uuid"
    }
  }
  ```

**支持的 action（simple_submit）**:

| action | 说明 | payload 参数 |
|---|---|---|
| `assign` | 分配任务给员工 | `assignees`: `[{ userId, taskDescription }]` |
| `submit` | 员工提交文件 | `assigneeId`, `fileId`, `note?` |
| `review` | 审核人审核提交 | `assigneeId`, `submissionId`, `approved`, `feedback?` |

**示例（simple_submit - assign）**:
```json
{
  "action": "assign",
  "payload": {
    "assignees": [
      {
        "userId": "user-1",
        "taskDescription": "负责自动化办公系统集成标准说明"
      }
    ]
  }
}
```

**示例（simple_submit - submit）**:
```json
{
  "action": "submit",
  "payload": {
    "assigneeId": "assignee-uuid",
    "fileId": "file-uuid",
    "note": "初稿完成"
  }
}
```

**示例（simple_submit - review）**:
```json
{
  "action": "review",
  "payload": {
    "assigneeId": "assignee-uuid",
    "submissionId": "sub-uuid",
    "approved": true,
    "feedback": "审核通过"
  }
}
```

**支持的 action（form_dynamic）**:

| action | 说明 | payload 参数 |
|---|---|---|
| `submit` | 提交表单数据 | `formData`: `{ fieldId: value }` |
| `approve` | 审批表单 | `approved`, `feedback?` |

**示例（form_dynamic - submit）**:
```json
{
  "action": "submit",
  "payload": {
    "formData": {
      "reason": "参加技术培训",
      "amount": 5000,
      "attachments": "file-uuid"
    }
  }
}
```

**示例（form_dynamic - approve）**:
```json
{
  "action": "approve",
  "payload": {
    "approved": true,
    "feedback": "同意申请"
  }
}
```

---

### 2.8 认领任务

**POST** `/tasks/{task_id}/claim`

**描述**: 认领任务

**请求**:
```json
{
  "assignee": "user-1"
}
```

**响应**:
```json
{
  "success": true
}
```

---

### 2.9 完成任务

**POST** `/tasks/{task_id}/complete`

**描述**: 完成任务

**请求**:
```json
{
  "variables": {
    "approved": true,
    "comment": "审批通过"
  }
}
```

**响应**:
```json
{
  "success": true
}
```

---

## 三、文件管理

### 3.1 上传文件

**POST** `/files/upload`

**描述**: 通用文件上传（与任务解耦）

**请求** (multipart/form-data):
```
file: 文件
category: 文件分类 (template / submission / attachment)
metadata: JSON 字符串（可选，如 {"task_id": "xxx"}）
```

**响应**:
```json
{
  "fileId": "file-uuid",
  "fileName": "集团战略发展规划.pptx",
  "fileUrl": "/files/file-uuid",
  "fileSize": 5.8,
  "contentType": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "pageCount": 30,
  "category": "template",
  "uploadedAt": "2026-03-01T10:00:00Z"
}
```

**说明**: `page_count` 仅对 PPT 文件有效

---

### 3.2 下载文件

**GET** `/files/{file_id}`

**描述**: 下载文件

**请求参数**:
- `ua_id` (可选): 用户分配ID（用于 PPT 页码裁剪）

**响应**: 文件流

---

### 3.3 预览文件

**GET** `/files/{file_id}/preview`

**描述**: 获取文件预览 URL

**请求参数**: 无

**响应**:
```json
{
  "preview_url": "https://preview-service/file-uuid",
  "pageCount": 30
}
```

---

### 3.4 删除文件

**DELETE** `/files/{file_id}`

**描述**: 删除文件

**请求参数**: 无

**响应**:
```json
{
  "success": true
}
```

---

## 四、用户管理

### 4.1 获取用户列表

**GET** `/users`

**描述**: 获取用户列表

**请求参数**:
- `department` (可选): 部门
- `search` (可选): 关键词搜索

**响应**:
```json
{
  "data": [
    {
      "id": "user-uuid",
      "username": "zhangming",
      "name": "张明",
      "avatar": "张",
      "email": "zhangming@example.com",
      "department": "设备室",
      "role": "工程师",
      "staffId": "E001"
    }
  ]
}
```

---

### 4.2 获取用户详情

**GET** `/users/{user_id}`

**描述**: 获取用户详情

**请求参数**: 无

**响应**:
```json
{
  "id": "user-uuid",
  "username": "zhangming",
  "name": "张明",
  "avatar": "张",
  "email": "zhangming@example.com",
  "department": "设备室",
  "role": "工程师",
  "staffId": "E001",
  "roles": ["employee", "reviewer"],
  "createdAt": "2026-01-01T00:00:00Z"
}
```

---

### 4.3 创建用户

**POST** `/users`

**描述**: 创建新用户

**请求**:
```json
{
  "username": "zhangming",
  "name": "张明",
  "avatar": "张",
  "email": "zhangming@example.com",
  "department": "设备室",
  "role": "工程师",
  "staffId": "E001"
}
```

**响应**:
```json
{
  "id": "user-uuid",
  "username": "zhangming",
  "name": "张明",
  "createdAt": "2026-03-01T10:00:00Z"
}
```

---

### 4.4 更新用户

**PUT** `/users/{user_id}`

**描述**: 更新用户信息

**请求**:
```json
{
  "name": "张明",
  "email": "new-email@example.com",
  "department": "生产厂"
}
```

**响应**:
```json
{
  "id": "user-uuid",
  "username": "zhangming",
  "name": "张明",
  "email": "new-email@example.com",
  "department": "生产厂"
}
```

---

### 4.5 删除用户

**DELETE** `/users/{user_id}`

**描述**: 删除用户

**请求参数**: 无

**响应**:
```json
{
  "success": true
}
```

---

## 五、部门管理

### 5.1 获取部门列表

**GET** `/departments`

**描述**: 获取部门列表

**请求参数**: 无

**响应**:
```json
{
  "data": [
    {
      "id": "dept-uuid",
      "name": "设备室",
      "description": "负责设备管理",
      "managerId": "user-uuid",
      "managerName": "王芳",
      "parentId": null
    }
  ]
}
```

---

### 5.2 创建部门

**POST** `/departments`

**描述**: 创建新部门

**请求**:
```json
{
  "name": "设备室",
  "description": "负责设备管理",
  "managerId": "user-uuid",
  "parentId": null
}
```

**响应**:
```json
{
  "id": "dept-uuid",
  "name": "设备室",
  "createdAt": "2026-03-01T10:00:00Z"
}
```

---

### 5.3 更新部门

**PUT** `/departments/{dept_id}`

**描述**: 更新部门信息

**请求**:
```json
{
  "name": "设备室",
  "description": "负责设备管理与维护",
  "managerId": "user-uuid"
}
```

**响应**:
```json
{
  "id": "dept-uuid",
  "name": "设备室",
  "description": "负责设备管理与维护"
}
```

---

### 5.4 删除部门

**DELETE** `/departments/{dept_id}`

**描述**: 删除部门

**请求参数**: 无

**响应**:
```json
{
  "success": true
}
```

---

## 六、工作组管理

### 6.1 获取工作组列表

**GET** `/workgroups`

**描述**: 获取工作组列表

**请求参数**: 无

**响应**:
```json
{
  "data": [
    {
      "id": "group-uuid",
      "name": "设备维护小组",
      "description": "负责设备日常维护",
      "createdBy": "user-uuid",
      "memberCount": 5
    }
  ]
}
```

---

### 6.2 创建工作组

**POST** `/workgroups`

**描述**: 创建新工作组

**请求**:
```json
{
  "name": "设备维护小组",
  "description": "负责设备日常维护"
}
```

**响应**:
```json
{
  "id": "group-uuid",
  "name": "设备维护小组",
  "createdAt": "2026-03-01T10:00:00Z"
}
```

---

### 6.3 添加工作组成员

**POST** `/workgroups/{group_id}/members`

**描述**: 添加成员到工作组

**请求**:
```json
{
  "userId": "user-uuid",
  "role": "member"
}
```

**响应**:
```json
{
  "success": true
}
```

---

## 七、文档中心

### 7.1 获取文档列表

**GET** `/documents`

**描述**: 获取文档列表（独立于任务的文档管理）

**请求参数**:
- `department` (可选): 部门
- `search` (可选): 关键词搜索

**响应**:
```json
{
  "data": [
    {
      "id": "doc-uuid",
      "name": "设备管理规范.pdf",
      "fileId": "file-uuid",
      "fileUrl": "/files/file-uuid",
      "department": "设备室",
      "description": "设备管理相关规范文档",
      "uploadedBy": "user-uuid",
      "uploadedByName": "张明",
      "createdAt": "2026-03-01T10:00:00Z"
    }
  ]
}
```

---

### 7.2 上传文档

**POST** `/documents/upload`

**描述**: 上传文档到文档中心

**请求** (multipart/form-data):
```
file: 文件
department: 部门
description: 描述
```

**响应**:
```json
{
  "id": "doc-uuid",
  "name": "设备管理规范.pdf",
  "fileId": "file-uuid",
  "fileUrl": "/files/file-uuid",
  "createdAt": "2026-03-01T10:00:00Z"
}
```

---

### 7.3 删除文档

**DELETE** `/documents/{doc_id}`

**描述**: 删除文档

**请求参数**: 无

**响应**:
```json
{
  "success": true
}
```

---

## 八、错误响应

所有接口在出错时返回统一格式：

```json
{
  "error": {
    "code": "INVALID_PAGES",
    "message": "分配的页码超出部门负责范围",
    "detail": {
      "occupied_pages": [3, 5],
      "occupied_by": "张明"
    }
  }
}
```

**常见错误码**:
- `INVALID_PAGES` - 页码无效
- `PAGES_OCCUPIED` - 页码已被占用
- `FORBIDDEN` - 无操作权限
- `NOT_FOUND` - 资源不存在
- `WRONG_STATUS` - 当前状态不允许此操作
- `VALIDATION_ERROR` - 参数验证失败

---

## 九、前端对接说明

### 9.1 根据 form_key 渲染组件

```typescript
switch (task.form_key) {
  case "ppt_collab":
    return <PptTaskDrawer task={task} />
  case "simple_submit":
    return <SimpleTaskDrawer task={task} />
  case "form_dynamic":
    return <DynamicFormDrawer task={task} />
}
```

### 9.2 按钮显示由 allowed_actions 控制

```typescript
{task.allowed_actions.includes("submit") && (
  <Button onClick={() => executeAction("submit", payload)}>
    提交
  </Button>
)}
```

### 9.3 文件上传流程

```typescript
// 1. 上传文件
const fileRes = await fetch('/api/v1/files/upload', {
  method: 'POST',
  body: formData
})
const { file_id } = await fileRes.json()

// 2. 提交任务时传 file_id
await fetch(`/api/v1/tasks/${taskId}/action`, {
  method: 'POST',
  body: JSON.stringify({
    action: 'submit',
    payload: { file_id, note: '初稿完成' }
  })
})
```

### 9.4 统一的工作流动作调用

```typescript
async function executeAction(taskId: string, action: string, payload: any) {
  const res = await fetch(`/api/v1/tasks/${taskId}/action`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ action, payload })
  })
  return await res.json()
}
```
