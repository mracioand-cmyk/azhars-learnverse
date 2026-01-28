import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  BookOpen,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ChevronLeft,
  Loader2,
  Phone,
  Check
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

type AuthMode = "login" | "register" | "register-teacher";

const TEACHER_SUBJECTS = [
  { id: "arabic", name: "مواد عربية" },
  { id: "religious", name: "مواد شرعية" },
  { id: "math", name: "رياضيات" },
  { id: "english", name: "لغة إنجليزية" },
  { id: "biology", name: "أحياء" },
  { id: "physics", name: "فيزياء" },
  { id: "chemistry", name: "كيمياء" },
  { id: "history", name: "تاريخ" },
  { id: "science", name: "علوم" },
  { id: "social", name: "دراسات اجتماعية" },
  { id: "french", name: "لغة فرنسية" },
  { id: "geology", name: "جيولوجيا" },
  { id: "philosophy", name: "فلسفة ومنطق" },
];

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signIn, signUp, signUpTeacher } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>(
    (searchParams.get("mode") as AuthMode) || "login"
  );
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // حقول البيانات المشتركة
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");

  // حقول المعلم
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedStage, setSelectedStage] = useState<"preparatory" | "secondary" | "">("");
  const [assignments, setAssignments] = useState<Array<{subject: string, stage: string, grade: string}>>([]);

  // حساب قوة كلمة المرور
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length > 7) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const passwordStrength = getPasswordStrength(password);

  // دالة مساعدة لرسم شريط القوة
  const renderPasswordStrengthBar = () => {
    if (!password) return null;
    return (
      <div className="flex gap-1 mt-2 h-1.5">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`flex-1 rounded-full transition-all duration-300 ${
              passwordStrength >= level
                ? passwordStrength <= 2
                  ? "bg-red-500"
                  : passwordStrength === 3
                  ? "bg-yellow-500"
                  : "bg-green-500"
                : "bg-muted"
            }`}
          />
        ))}
      </div>
    );
  };

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
        // التحقق من كلمة المرور للتسجيل (طالب ومعلم)
        if (password !== confirmPassword) {
          toast.error("كلمة المرور غير متطابقة");
          setIsLoading(false);
          return;
        }

        if (mode === "register") {
          const { error } = await signUp({
            email,
            password,
            fullName,
            phone,
            username,
          });
          if (error) toast.error(error);
          else {
            toast.success("تم إنشاء الحساب بنجاح");
            navigate("/dashboard");
          }
        } else if (mode === "register-teacher") {
          if (assignments.length === 0) {
            toast.error("يجب اختيار مادة وصف دراسي واحد على الأقل");
            setIsLoading(false);
            return;
          }
          const { error } = await signUpTeacher({
            email,
            password,
            fullName,
            phone,
            assignments,
          });
          if (error) toast.error(error);
          else {
            toast.success("تم إرسال طلبك بنجاح");
            navigate("/pending-approval");
          }
        }
      }
    } catch (error) {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setIsLoading(false);
    }
  };

  // دوال المعلم
  const toggleAssignment = (subj: string, stg: string, grd: string) => {
    const exists = assignments.some(a => a.subject === subj && a.stage === stg && a.grade === grd);
    if (exists) {
      setAssignments(prev => prev.filter(a => !(a.subject === subj && a.stage === stg && a.grade === grd)));
    } else {
      setAssignments(prev => [...prev, { subject: subj, stage: stg, grade: grd }]);
    }
  };

  const isAssigned = (subj: string, stg: string, grd: string) => {
    return assignments.some(a => a.subject === subj && a.stage === stg && a.grade === grd);
  };

  const getSubjectName = (id: string) => TEACHER_SUBJECTS.find(s => s.id === id)?.name || id;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 pattern-islamic p-4">
      <div className="w-full max-w-md animate-scale-in">
        
        {/* الشعار */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl gradient-azhari shadow-azhari mb-4">
            <BookOpen className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-gradient-azhari mb-2">أزهاريون</h1>
          <p className="text-muted-foreground">منصة التعليم الأزهري الذكية</p>
        </div>

        <Card className="border-border shadow-lg bg-card/95 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl text-center font-bold text-primary">
              {mode === "login" && "تسجيل الدخول"}
              {mode === "register" && "إنشاء حساب طالب"}
              {mode === "register-teacher" && "انضم كمعلم"}
            </CardTitle>
            <CardDescription className="text-center text-sm">
              {mode === "login" && "أدخل بياناتك للمتابعة"}
              {mode === "register" && "أنشئ حسابك وابدأ رحلتك التعليمية"}
              {mode === "register-teacher" && "شارك في بناء مستقبل التعليم الأزهري"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* === تسجيل طالب أو معلم (البيانات الأساسية) === */}
              {(mode === "register" || mode === "register-teacher") && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">الاسم الكامل</Label>
                    <div className="relative">
                      <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        placeholder="أدخل اسمك الكامل"
                        className="pr-9"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {mode === "register" && (
                    <div className="space-y-2">
                      <Label htmlFor="username">اسم المستخدم (اختياري)</Label>
                      <Input
                        id="username"
                        placeholder="اختر اسم مستخدم"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        className="pr-9"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <div className="relative">
                      <Phone className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        placeholder="01xxxxxxxxx"
                        className="pr-9"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pr-9 pl-9"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {/* شريط قوة كلمة المرور */}
                    {renderPasswordStrengthBar()}
                    <p className="text-[10px] text-muted-foreground text-right mt-1">
                      {passwordStrength === 0 ? "" :
                       passwordStrength <= 2 ? "كلمة مرور ضعيفة" :
                       passwordStrength === 3 ? "كلمة مرور متوسطة" : "كلمة مرور قوية"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="أعد إدخال كلمة المرور"
                        className="pr-9"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {/* === تسجيل الدخول === */}
              {mode === "login" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني أو رقم الهاتف</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        placeholder="example@azhar.edu.eg"
                        className="pr-9"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pr-9 pl-9"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* === بيانات إضافية للمعلم فقط === */}
              {mode === "register-teacher" && (
                <div className="space-y-4 pt-4 border-t mt-4 bg-muted/20 p-4 rounded-lg">
                  <Label className="font-bold text-primary flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    بيانات التخصص
                  </Label>
                  
                  <div className="space-y-2">
                    <Label className="text-xs">المادة التي تدرسها</Label>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                      <SelectTrigger className="bg-background"><SelectValue placeholder="اختر المادة" /></SelectTrigger>
                      <SelectContent>
                        {TEACHER_SUBJECTS.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedSubject && (
                    <div className="space-y-2 animate-fade-in">
                      <Label className="text-xs">المرحلة الدراسية</Label>
                      <div className="flex gap-2">
                        <Button type="button" variant={selectedStage === "preparatory" ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setSelectedStage("preparatory")}>الإعدادية</Button>
                        <Button type="button" variant={selectedStage === "secondary" ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setSelectedStage("secondary")}>الثانوية</Button>
                      </div>
                    </div>
                  )}

                  {selectedStage && (
                    <div className="space-y-2 animate-fade-in">
                      <Label className="text-xs">الصفوف (يمكن اختيار أكثر من صف)</Label>
                      {["first", "second", "third"].map((grd) => (
                        <div key={grd} className="flex items-center space-x-2 space-x-reverse">
                          <Checkbox 
                            id={`grade-${grd}`} 
                            checked={isAssigned(selectedSubject, selectedStage, grd)}
                            onCheckedChange={() => toggleAssignment(selectedSubject, selectedStage, grd)}
                          />
                          <label htmlFor={`grade-${grd}`} className="text-sm cursor-pointer select-none">
                            {grd === "first" ? "الصف الأول" : grd === "second" ? "الصف الثاني" : "الصف الثالث"}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {assignments.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {assignments.map((a, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {getSubjectName(a.subject)} 
                          <span className="mr-1 cursor-pointer hover:text-red-500" onClick={() => toggleAssignment(a.subject, a.stage, a.grade)}>×</span>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* الأزرار الرئيسية */}
              <Button className="w-full mt-4" size="lg" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                {mode === "login" && "تسجيل الدخول"}
                {mode === "register" && "إنشاء الحساب"}
                {mode === "register-teacher" && "إرسال طلب الانضمام"}
              </Button>

              {/* زر جوجل (معطل) */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">أو</span>
                </div>
              </div>

              <Button variant="outline" type="button" disabled className="w-full">
                التسجيل بواسطة Google (قريباً)
              </Button>

              {/* روابط التبديل */}
              <div className="space-y-2 mt-4 text-center text-sm">
                {mode === "login" && (
                  <>
                    <p className="text-muted-foreground">
                      ليس لديك حساب؟{" "}
                      <button onClick={() => setMode("register")} className="text-primary hover:underline font-medium" type="button">
                        سجّل كطالب
                      </button>
                    </p>
                    <p className="text-muted-foreground">
                      أنت معلم؟{" "}
                      <button onClick={() => setMode("register-teacher")} className="text-gold hover:underline font-medium" type="button">
                        سجّل كمعلم
                      </button>
                    </p>
                  </>
                )}

                {(mode === "register" || mode === "register-teacher") && (
                  <p className="text-muted-foreground">
                    لديك حساب بالفعل؟{" "}
                    <button onClick={() => setMode("login")} className="text-primary hover:underline font-medium" type="button">
                      تسجيل الدخول
                    </button>
                  </p>
                )}
                
                {mode === "register" && (
                  <p className="text-muted-foreground">
                    أنت معلم؟{" "}
                    <button onClick={() => setMode("register-teacher")} className="text-gold hover:underline font-medium" type="button">
                      سجّل كمعلم
                    </button>
                  </p>
                )}

                {mode === "register-teacher" && (
                  <p className="text-muted-foreground">
                    أنت طالب؟{" "}
                    <button onClick={() => setMode("register")} className="text-primary hover:underline font-medium" type="button">
                      سجّل كطالب
                    </button>
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
            <ChevronLeft className="h-4 w-4 ml-1" />
            العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Auth;
