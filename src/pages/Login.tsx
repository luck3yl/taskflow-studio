import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FolderKanban,
  Sparkles,
  Loader2,
  Mail,
  Lock,
  User,
  UserPlus,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { loginApi, registerApi } from "@/services/apis/auth";
import { setTokens } from "@/services/http/axios";
import { useUserContext } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";

type AuthMode = "login" | "register";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { refreshAll } = useUserContext();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 登录后跳转到来源页面
  const from = (location.state as any)?.from?.pathname || "/";

  // Login form
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  // Register form
  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      toast({ title: "请填写邮箱和密码", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const response = await loginApi({
        email: loginForm.email,
        password: loginForm.password,
      });
      setTokens(response.access_token, response.refresh_token);
      // 登录后获取用户信息、权限及系统数据
      await refreshAll();
      toast({ title: "登录成功", description: "正在进入系统..." });
      navigate(from, { replace: true });
    } catch (error: any) {
      const msg =
        error.message === "Invalid credentials"
          ? "邮箱或密码错误"
          : error.message || "登录失败";
      toast({ title: "登录失败", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !registerForm.username ||
      !registerForm.email ||
      !registerForm.password ||
      !registerForm.name
    ) {
      toast({ title: "请填写完整信息", variant: "destructive" });
      return;
    }
    if (registerForm.password.length < 6) {
      toast({ title: "密码至少 6 位", variant: "destructive" });
      return;
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      toast({ title: "两次密码输入不一致", variant: "destructive" });
      return;
    }

    const fullName = registerForm.name.trim();
    const lastName = fullName.charAt(0);
    const firstName = fullName.slice(1) || fullName;

    setLoading(true);
    try {
      await registerApi({
        username: registerForm.username,
        email: registerForm.email,
        password: registerForm.password,
        name: fullName,
        firstName,
        lastName,
      });
      // 注册成功后切换到登录页，让用户手动登录
      toast({ title: "注册成功", description: "请使用邮箱和密码登录" });
      setLoginForm({ email: registerForm.email, password: "" });
      setMode("login");
    } catch (error: any) {
      toast({
        title: "注册失败",
        description: error.message || "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* 左侧品牌区域 */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700">
        {/* 装饰背景 */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/3 h-48 w-48 rounded-full bg-blue-300/10 blur-2xl" />
          {/* 网格装饰 */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        {/* 品牌内容 */}
        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm shadow-lg">
                <FolderKanban className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                  任务协同
                  <Sparkles className="h-6 w-6 text-amber-300" />
                </h1>
                <p className="text-blue-100 text-sm mt-0.5">
                  TaskFlow Studio
                </p>
              </div>
            </div>

            <div className="space-y-4 max-w-md">
              <h2 className="text-2xl font-semibold text-white leading-relaxed">
                高效协作，让工作流转更顺畅
              </h2>
              <p className="text-blue-100/90 leading-relaxed">
                集流程管理、任务分配、文档协作于一体的企业级工作流平台。
                支持多级审批、部门协同和实时进度追踪。
              </p>
            </div>

            {/* 特性列表 */}
            <div className="space-y-3 pt-4">
              {[
                "流程驱动 — 可视化 BPMN 流程引擎",
                "多级协作 — 部门分配、人员指派一键完成",
                "实时追踪 — 任务进度、审批状态一目了然",
              ].map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-3 text-blue-50/90"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-300 shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 右侧表单区域 */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 px-6 py-12">
        <div className="w-full max-w-[420px] space-y-8">
          {/* 移动端 Logo */}
          <div className="lg:hidden flex flex-col items-center gap-3 mb-4">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-600/25">
              <FolderKanban className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-1.5">
              任务协同
              <Sparkles className="h-4 w-4 text-amber-500" />
            </h1>
          </div>

          {/* 标题 */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              {mode === "login" ? "欢迎回来" : "创建账号"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {mode === "login"
                ? "输入邮箱和密码登录系统"
                : "填写信息注册新账号，即刻开始协作"}
            </p>
          </div>

          {/* 表单 */}
          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-sm font-medium">
                  邮箱
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your@email.com"
                    value={loginForm.email}
                    onChange={(e) =>
                      setLoginForm({ ...loginForm, email: e.target.value })
                    }
                    className="h-12 pl-10 rounded-xl border-border/60 bg-white dark:bg-slate-800 text-sm"
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="login-password"
                  className="text-sm font-medium"
                >
                  密码
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="输入密码"
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm({ ...loginForm, password: e.target.value })
                    }
                    className="h-12 pl-10 pr-10 rounded-xl border-border/60 bg-white dark:bg-slate-800 text-sm"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl gradient-primary shadow-lg shadow-blue-500/20 text-sm font-semibold gap-2"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                登录
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="reg-name" className="text-sm font-medium">
                    姓名
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reg-name"
                      placeholder="真实姓名"
                      value={registerForm.name}
                      onChange={(e) =>
                        setRegisterForm({
                          ...registerForm,
                          name: e.target.value,
                        })
                      }
                      className="h-11 pl-9 rounded-xl border-border/60 bg-white dark:bg-slate-800 text-sm"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="reg-username"
                    className="text-sm font-medium"
                  >
                    用户名
                  </Label>
                  <div className="relative">
                    <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reg-username"
                      placeholder="登录用户名"
                      value={registerForm.username}
                      onChange={(e) =>
                        setRegisterForm({
                          ...registerForm,
                          username: e.target.value,
                        })
                      }
                      className="h-11 pl-9 rounded-xl border-border/60 bg-white dark:bg-slate-800 text-sm"
                      autoComplete="username"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-email" className="text-sm font-medium">
                  邮箱
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="your@email.com"
                    value={registerForm.email}
                    onChange={(e) =>
                      setRegisterForm({
                        ...registerForm,
                        email: e.target.value,
                      })
                    }
                    className="h-11 pl-10 rounded-xl border-border/60 bg-white dark:bg-slate-800 text-sm"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label
                    htmlFor="reg-password"
                    className="text-sm font-medium"
                  >
                    密码
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="至少 6 位"
                      value={registerForm.password}
                      onChange={(e) =>
                        setRegisterForm({
                          ...registerForm,
                          password: e.target.value,
                        })
                      }
                      className="h-11 pl-9 pr-9 rounded-xl border-border/60 bg-white dark:bg-slate-800 text-sm"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-confirm" className="text-sm font-medium">
                    确认密码
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reg-confirm"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="再次输入"
                      value={registerForm.confirmPassword}
                      onChange={(e) =>
                        setRegisterForm({
                          ...registerForm,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="h-11 pl-9 pr-9 rounded-xl border-border/60 bg-white dark:bg-slate-800 text-sm"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl gradient-primary shadow-lg shadow-blue-500/20 text-sm font-semibold gap-2 mt-2"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                注册
              </Button>
            </form>
          )}

          {/* 切换模式 */}
          <div className="text-center pt-2">
            {mode === "login" ? (
              <p className="text-sm text-muted-foreground">
                还没有账号？{" "}
                <button
                  type="button"
                  className="text-primary font-medium hover:underline underline-offset-4 transition-colors"
                  onClick={() => setMode("register")}
                >
                  立即注册
                </button>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                已有账号？{" "}
                <button
                  type="button"
                  className="text-primary font-medium hover:underline underline-offset-4 transition-colors"
                  onClick={() => setMode("login")}
                >
                  返回登录
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
