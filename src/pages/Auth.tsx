import { useState } from "react";
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

// قائمة المواد (للمعلم فقط)
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
  
  // نفس نظام التنقل القديم
  const [mode, setMode] = useState<AuthMode>(
    (searchParams.get("mode") as AuthMode) || "login"
  );
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState(""); // تمت الإضافة كما طلبت

  // Student specific
  const [stage, setStage] = useState("");
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");

  // Teacher specific (New Logic inside Old Design)
  const [schoolName, setSchoolName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedStage, setSelectedStage] = useState<"preparatory" | "secondary" | "">("");
  const [assignments, setAssignments] = useState<Array<{subject: string, stage: string, grade: string}>>([]);

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
      } else if (mode === "register") {
        const { error } = await signUp({
          email,
          password,
          fullName,
          phone,
          stage,
          grade,
          section,
        });
        if (error) toast.error(error);
        else {
          toast.success("تم إنشاء الحساب بنجاح");
          navigate("/dashboard");
        }
      } else if (mode === "register-teacher") {
        // التحقق من اختيار التخصصات
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
          schoolName,
          employeeId,
          assignments,
        });
        
        if (error) toast.error(error);
        else {
          toast.success("تم إرسال طلبك بنجاح");
          navigate("/pending-approval");
        }
      }
    } catch (error) {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions for teacher selection
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
        
        {/* الشعار القديم - لم يتم تغييره */}
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
              {mode === "login" && "تسجيل الدخول"}
              {mode === "register" && "إنشاء حساب طالب"}
              {mode === "register-teacher" && "انضم كمعلم"}
            </CardTitle>
            <CardDescription className="text-center">
              {mode === "login" && "أهلاً بك مجدداً في رحلتك التعليمية"}
              {mode === "register" && "ابدأ رحلة التفوق مع أزهاريون"}
              {mode === "register-teacher" && "شارك في بناء مستقبل التعليم الأزهري"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* الحقول المشتركة للتسجيل (الاسم والهاتف) */}
              {(mode === "register" || mode === "register-teacher") && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">الاسم بالكامل</Label>
                    <div className="relative">
                      <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        placeholder="اكتب اسمك رباعي"
                        className="pr-9"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  {/* تمت إضافة الهاتف هنا بناء على طلبك */}
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
                </>
              )}

              {/* البريد وكلمة المرور (موجودة في الكل) */}
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
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
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* حقول الطالب فقط (نفس القديم) */}
              {mode === "register" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>المرحلة</Label>
                    <Select onValueChange={setStage} required>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المرحلة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="preparatory">الإعدادية</SelectItem>
                        <SelectItem value="secondary">الثانوية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>الصفوف</Label>
                    <Select onValueChange={setGrade} required>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الصف" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="first">الصف الأول</SelectItem>
                        <SelectItem value="second">الصف الثاني</SelectItem>
                        <SelectItem value="third">الصف الثالث</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {stage === "secondary" && (
                    <div className="col-span-2 space-y-2 animate-fade-in">
                      <Label>القسم</Label>
                      <Select onValueChange={setSection} required>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر القسم (علمي / أدبي)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scientific">علمي</SelectItem>
                          <SelectItem value="literary">أدبي</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              {/* حقول المعلم (التحديث الجديد داخل التصميم القديم) */}
              {mode === "register-teacher" && (
                <div className="space-y-4 pt-2 border-t mt-2">
                  <div className="space-y-2">
                    <Label>المادة التي تدرسها</Label>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المادة" />
                      </SelectTrigger>
                      <SelectContent>
                        {TEACHER_SUBJECTS.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedSubject && (
                    <div className="space-y-2 animate-fade-in">
                      <Label>المرحلة</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={selectedStage === "preparatory" ? "default" : "outline"}
                          size="sm"
                          className="flex-1"
                          onClick={() => setSelectedStage("preparatory")}
                        >
                          الإعدادية
                        </Button>
                        <Button
                          type="button"
                          variant={selectedStage === "secondary" ? "default" : "outline"}
                          size="sm"
                          className="flex-1"
                          onClick={() => setSelectedStage("secondary")}
                        >
                          الثانوية
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedStage && (
                    <div className="space-y-2 animate-fade-in bg-muted/20 p-3 rounded-md border">
                      <Label className="text-xs mb-2 block">حدد الصفوف:</Label>
                      {["first", "second", "third"].map((grd) => (
                        <div key={grd} className="flex items-center space-x-2 space-x-reverse mb-1">
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
                    <div className="flex flex-wrap gap-1">
                      {assignments.map((a, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {getSubjectName(a.subject)} ({a.grade === "first" ? "1" : a.grade === "second" ? "2" : "3"})
                          <span className="mr-1 cursor-pointer hover:text-red-500" onClick={() => toggleAssignment(a.subject, a.stage, a.grade)}>×</span>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Button className="w-full" size="lg" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                {mode === "login" && "دخول"}
                {mode === "register" && "إنشاء حساب"}
                {mode === "register-teacher" && "إرسال الطلب"}
              </Button>

              {/* الروابط القديمة للتبديل بين الصفحات */}
              <div className="space-y-2 mt-4 text-center text-sm">
                {mode === "login" && (
                  <>
                    <p className="text-muted-foreground">
                      ليس لديك حساب؟{" "}
                      <button
                        onClick={() => setMode("register")}
                        className="text-primary hover:underline font-medium"
                        type="button"
                      >
                        سجّل كطالب
                      </button>
                    </p>
                    <p className="text-muted-foreground">
                      أو{" "}
                      <button
                        onClick={() => setMode("register-teacher")}
                        className="text-gold hover:underline font-medium"
                        type="button"
                      >
                        انضم كمعلم
                      </button>
                    </p>
                  </>
                )}

                {(mode === "register" || mode === "register-teacher") && (
                  <p className="text-muted-foreground">
                    لديك حساب بالفعل؟{" "}
                    <button
                      onClick={() => setMode("login")}
                      className="text-primary hover:underline font-medium"
                      type="button"
                    >
                      تسجيل الدخول
                    </button>
                  </p>
                )}
                
                {mode === "register" && (
                  <p className="text-muted-foreground">
                    أنت معلم؟{" "}
                    <button
                      onClick={() => setMode("register-teacher")}
                      className="text-gold hover:underline font-medium"
                      type="button"
                    >
                      سجّل كمعلم
                    </button>
                  </p>
                )}

                {mode === "register-teacher" && (
                  <p className="text-muted-foreground">
                    أنت طالب؟{" "}
                    <button
                      onClick={() => setMode("register")}
                      className="text-primary hover:underline font-medium"
                      type="button"
                    >
                      سجّل كطالب
                    </button>
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="h-4 w-4 ml-1" />
            العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Auth;
