import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { BookOpen, Mail, Lock, User, Eye, EyeOff, ChevronLeft, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type AuthMode = "login" | "register";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>(
    (searchParams.get("mode") as AuthMode) || "login"
  );
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  
  // حقول الطالب القديمة
  const [stage, setStage] = useState("");
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) toast.error(error);
        else {
          toast.success("تم تسجيل الدخول بنجاح");
          navigate("/dashboard");
        }
      } else {
        const { error } = await signUp({
          email,
          password,
          fullName,
          stage,
          grade,
          section: stage === "secondary" ? section : undefined,
        });
        if (error) toast.error(error);
        else {
          toast.success("تم إنشاء الحساب بنجاح");
          navigate("/dashboard");
        }
      }
    } catch (error) {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 pattern-islamic p-4">
      <div className="w-full max-w-md animate-scale-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl gradient-azhari shadow-azhari mb-4">
            <BookOpen className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-gradient-azhari mb-2">أزهاريون</h1>
          <p className="text-muted-foreground">منصة التعليم الأزهري الذكية</p>
        </div>

        <Card className="border-border shadow-lg bg-card/95 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl text-center">
              {mode === "login" ? "تسجيل الدخول" : "إنشاء حساب جديد"}
            </CardTitle>
            <CardDescription className="text-center">
              {mode === "login" ? "أدخل بياناتك للمتابعة" : "ابدأ رحلتك التعليمية معنا"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div className="space-y-2">
                  <Label>الاسم بالكامل</Label>
                  <div className="relative">
                    <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="الاسم رباعي" className="pr-9" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input type="email" placeholder="email@example.com" className="pr-9" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label>كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input type={showPassword ? "text" : "password"} placeholder="••••••••" className="pr-9 pl-9" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-3 text-muted-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {mode === "register" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>المرحلة</Label>
                    <Select onValueChange={setStage} required>
                      <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="preparatory">إعدادي</SelectItem>
                        <SelectItem value="secondary">ثانوي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>الصف</Label>
                    <Select onValueChange={setGrade} required>
                      <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="first">أول</SelectItem>
                        <SelectItem value="second">ثاني</SelectItem>
                        <SelectItem value="third">ثالث</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {stage === "secondary" && (
                    <div className="col-span-2 space-y-2">
                      <Label>القسم</Label>
                      <Select onValueChange={setSection} required>
                        <SelectTrigger><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scientific">علمي</SelectItem>
                          <SelectItem value="literary">أدبي</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              <Button className="w-full" size="lg" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                {mode === "login" ? "دخول" : "إنشاء حساب"}
              </Button>

              <div className="space-y-2 mt-4 text-center text-sm">
                {mode === "login" ? (
                  <p className="text-muted-foreground">
                    ليس لديك حساب؟ <button type="button" onClick={() => setMode("register")} className="text-primary hover:underline font-medium">سجّل الآن</button>
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    لديك حساب بالفعل؟ <button type="button" onClick={() => setMode("login")} className="text-primary hover:underline font-medium">تسجيل الدخول</button>
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
        
        <div className="mt-8 text-center">
            <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
            <ChevronLeft className="h-4 w-4 ml-1" /> العودة للرئيسية
            </Link>
        </div>
      </div>
    </div>
  );
};

export default Auth;
