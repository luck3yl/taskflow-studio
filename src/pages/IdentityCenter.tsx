import { AppLayout } from "@/components/layout/AppLayout";
import { useLocation } from "react-router-dom";
import { UsersTab } from "./identity/UsersTab";
import { DepartmentManagement } from "./identity/DepartmentManagement";
import { RoleManagementContent } from "./identity/RolesTabContent";

export default function IdentityCenter() {
  const location = useLocation();

  // 根据路由决定展示哪个模块
  const isUsers = location.pathname === "/settings/users";
  const isRoles = location.pathname === "/settings/roles";

  if (isUsers) {
    return (
      <AppLayout title="用户管理">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">用户管理</h2>
            <p className="text-sm text-muted-foreground">
              管理系统用户账号、部门归属和角色分配
            </p>
          </div>
          <UsersTab />
        </div>
      </AppLayout>
    );
  }

  if (isRoles) {
    return (
      <AppLayout title="角色管理">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">角色管理</h2>
            <p className="text-sm text-muted-foreground">
              管理系统角色、权限配置和用户关联
            </p>
          </div>
          <RoleManagementContent />
        </div>
      </AppLayout>
    );
  }

  // 部门管理（含工作组）— 默认
  return (
    <AppLayout title="部门管理">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold">部门管理</h2>
          <p className="text-sm text-muted-foreground">
            管理部门组织架构、成员归属，以及部门下的工作组配置
          </p>
        </div>
        <DepartmentManagement />
      </div>
    </AppLayout>
  );
}
