import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  BookOpen,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ChevronLeft,
  Loader2,
  GraduationCap,
  UserCog,
  Clock,
} from "lucide-react";

type AuthMode = "login" | "register" | "register-teacher";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // حالة النموذج
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    username: "",
    school: "",
    employeeId: "",
    phone: "",
  });

  // التحقق من قوة كلمة المرور
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const passwordStrengthLabels = ["ضعيفة جداً", "ضعيفة", "متوسطة", "قوية", "ممتازة"];
  const passwordStrengthColors = ["bg-destructive", "bg-orange-500", "bg-yellow-500", "bg-primary", "bg-green-500"];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // محاكاة عملية التسجيل
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (mode === "login") {
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "جاري تحويلك للوحة التحكم...",
      });
      navigate("/dashboard");
    } else if (mode === "register") {
      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: "يمكنك الآن تسجيل الدخول والبدء في التعلم",
      });
      setMode("login");
    } else if (mode === "register-teacher") {
      toast({
        title: "تم إرسال طلبك",
        description: "سيتم مراجعة طلبك وإشعارك عند القبول",
      });
      navigate("/pending-approval");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 pattern-islamic p-4">
      <div className="w-full max-w-md">
        {/* الشعار */}
        <Link to="/" className="flex items-center justify-center gap-3 mb-8 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-azhari shadow-azhari transition-transform duration-300 group-hover:scale-105">
            <BookOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-gradient-azhari">أزهاريون</span>
        </Link>

        <Card className="shadow-lg animate-scale-in">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">
              {mode === "login" && "تسجيل الدخول"}
              {mode === "register" && "إنشاء حساب طالب"}
              {mode === "register-teacher" && "تسجيل معلم"}
            </CardTitle>
            <CardDescription>
              {mode === "login" && "أدخل بياناتك للوصول لحسابك"}
              {mode === "register" && "أنشئ حسابك وابدأ رحلتك التعليمية"}
              {mode === "register-teacher" && "قدم طلبك للانضمام كمعلم"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* حقول التسجيل */}
              {mode !== "login" && (
                <div className="space-y-2">
                  <Label htmlFor="name">الاسم الكامل</Label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="name"
                      name="name"
                      placeholder="أدخل اسمك الكامل"
                      className="pr-10"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              )}

              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="username">اسم المستخدم (اختياري)</Label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="username"
                      name="username"
                      placeholder="اختر اسم مستخدم"
                      className="pr-10"
                      value={formData.username}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              )}

              {mode === "register-teacher" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="school">جهة العمل / المدرسة</Label>
                    <Input
                      id="school"
                      name="school"
                      placeholder="أدخل اسم المدرسة أو الجهة"
                      value={formData.school}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">الرقم الوظيفي</Label>
                    <Input
                      id="employeeId"
                      name="employeeId"
                      placeholder="أدخل رقمك الوظيفي"
                      value={formData.employeeId}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="أدخل رقم هاتفك"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </>
              )}

              {/* البريد الإلكتروني */}
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="example@email.com"
                    className="pr-10"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              {/* كلمة المرور */}
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="أدخل كلمة المرور"
                    className="pr-10 pl-10"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {/* مؤشر قوة كلمة المرور */}
                {mode !== "login" && formData.password && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            i < passwordStrength ? passwordStrengthColors[passwordStrength] : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      قوة كلمة المرور: {passwordStrengthLabels[passwordStrength]}
                    </p>
                  </div>
                )}
              </div>

              {/* تأكيد كلمة المرور */}
              {mode !== "login" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="أعد إدخال كلمة المرور"
                      className="pr-10"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              )}

              {/* رابط نسيت كلمة المرور */}
              {mode === "login" && (
                <div className="text-left">
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                    نسيت كلمة المرور؟
                  </Link>
                </div>
              )}

              {/* زر الإرسال */}
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    {mode === "login" && "تسجيل الدخول"}
                    {mode === "register" && "إنشاء الحساب"}
                    {mode === "register-teacher" && "إرسال الطلب"}
                    <ChevronLeft className="h-5 w-5 mr-1" />
                  </>
                )}
              </Button>

              {/* تسجيل الدخول بـ Google */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">أو</span>
                </div>
              </div>

              <Button type="button" variant="outline" className="w-full" size="lg">
                <svg className="h-5 w-5 ml-2" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                التسجيل بواسطة Google
              </Button>
            </form>

            {/* التبديل بين الأوضاع */}
            <div className="mt-6 space-y-3 text-center text-sm">
              {mode === "login" && (
                <>
                  <p className="text-muted-foreground">
                    ليس لديك حساب؟{" "}
                    <button
                      onClick={() => setMode("register")}
                      className="text-primary hover:underline font-medium"
                    >
                      سجّل كطالب
                    </button>
                  </p>
                  <p className="text-muted-foreground">
                    أنت معلم؟{" "}
                    <button
                      onClick={() => setMode("register-teacher")}
                      className="text-gold hover:underline font-medium"
                    >
                      سجّل كمعلم
                    </button>
                  </p>
                </>
              )}

              {mode === "register" && (
                <>
                  <p className="text-muted-foreground">
                    لديك حساب بالفعل؟{" "}
                    <button
                      onClick={() => setMode("login")}
                      className="text-primary hover:underline font-medium"
                    >
                      تسجيل الدخول
                    </button>
                  </p>
                  <p className="text-muted-foreground">
                    أنت معلم؟{" "}
                    <button
                      onClick={() => setMode("register-teacher")}
                      className="text-gold hover:underline font-medium"
                    >
                      سجّل كمعلم
                    </button>
                  </p>
                </>
              )}

              {mode === "register-teacher" && (
                <>
                  <p className="text-muted-foreground">
                    لديك حساب؟{" "}
                    <button
                      onClick={() => setMode("login")}
                      className="text-primary hover:underline font-medium"
                    >
                      تسجيل الدخول
                    </button>
                  </p>
                  <p className="text-muted-foreground">
                    أنت طالب؟{" "}
                    <button
                      onClick={() => setMode("register")}
                      className="text-primary hover:underline font-medium"
                    >
                      سجّل كطالب
                    </button>
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* رابط العودة */}
        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            ← العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Auth;
