import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "@/services/http/axios";

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * 路由守卫：未认证时跳转到登录页
 * 使用 JWT Bearer Token 鉴权
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
