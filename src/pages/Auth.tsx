import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  BookOpen,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  ChevronLeft,
  Loader2,
  Check,
  Briefcase,
  GraduationCap,
  School
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// قائمة المواد للمعلمين
const TEACHER_SUBJECTS = [
  { id: "arabic", name: "لغة عربية" },
  { id: "religious", name: "مواد شرعية" },
  { id: "math", name: "رياضيات" },
  { id: "english", name: "لغة إنجليزية" },
  { id: "science", name: "علوم" },
  { id: "social", name: "دراسات اجتماعية" },
  { id: "physics", name: "فيزياء" },
  { id: "chemistry", name: "كيمياء" },
  { id: "biology", name: "أحياء" },
  { id: "history", name: "تاريخ" },
  { id: "geography", name: "جغرافيا" },
  { id: "philosophy", name: "فلسفة ومنطق" },
  { id: "french", name: "لغة فرنسية" },
];

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signIn, signUp, signUpTeacher } = useAuth();
  
  // الوضع الافتراضي (دخول، طالب، معلم)
  const defaultTab = searchParams.get("mode") === "register-teacher" ? "teacher" : 
                     searchParams.get("mode") === "register" ? "student" : "login";
  
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // --- بيانات النموذج المشتركة ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  // --- بيانات الطالب ---
  const [stage, setStage] = useState("");
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");

  // --- بيانات المعلم ---
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedStage, setSelectedStage] = useState<"preparatory" | "secondary" | "">("");
  const [assignments, setAssignments] = useState<Array<{subject: string, stage: string, grade: string}>>([]);

  // دوال مساعدة للمعلم
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

  // دالة الإرسال الموحدة
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. تسجيل الدخول
      if (activeTab === "login") {
        const { error } = await signIn(email, password);
        if (error) toast.error(error);
        else {
          toast.success("تم تسجيل الدخول بنجاح");
          navigate("/dashboard");
        }
      } 
      // 2. تسجيل طالب جديد
      else if (activeTab === "student") {
        if (!stage || !grade) {
          toast.error("يرجى اختيار المرحلة والصف");
          setIsLoading(false);
          return;
        }
        const { error } = await signUp({
          email,
          password,
          fullName,
          phone,
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
      // 3. تسجيل معلم جديد
      else if (activeTab === "teacher") {
        if (assignments.length === 0) {
          toast.error("يجب اختيار مادة وصف واحد على الأقل");
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
          toast.success("تم إرسال طلبك بنجاح، بانتظار الموافقة");
          navigate("/pending-approval");
        }
      }
    } catch (error) {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 pattern-islamic p-4 font-cairo">
      <div className="w-full max-w-lg animate-scale-in">
        
        {/* الشعار والهوية */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl gradient-azhari shadow-azhari mb-4">
            <BookOpen className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-gradient-azhari mb-1">أزهاريون</h1>
          <p className="text-muted-foreground text-sm">بوابة التعليم الأزهري الذكي</p>
        </div>

        <Card className="border-border shadow-xl bg-card/95 backdrop-blur overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            
            {/* شريط التبديل العلوي */}
            <div className="bg-muted/50 p-2 border-b">
              <TabsList className="grid w-full grid-cols-3 h-11">
                <TabsTrigger value="login" className="text-sm">دخول</TabsTrigger>
                <TabsTrigger value="student" className="text-sm">طالب جديد</TabsTrigger>
                <TabsTrigger value="teacher" className="text-sm">معلم جديد</TabsTrigger>
              </TabsList>
            </div>

            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* --- حقول تسجيل الدخول فقط --- */}
                {activeTab === "login" && (
                   <div className="text-center mb-4 animate-fade-in">
                     <h2 className="text-xl font-bold text-primary">مرحباً بعودتك</h2>
                     <p className="text-sm text-muted-foreground">أدخل بياناتك للمتابعة</p>
                   </div>
                )}

                {/* --- الحقول المشتركة (الاسم والهاتف) للتسجيل فقط --- */}
                {activeTab !== "login" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
                    <div className="space-y-2">
                      <Label>الاسم بالكامل</Label>
                      <div className="relative">
                        <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="الاسم رباعي" className="pr-9" required 
                          value={fullName} onChange={e => setFullName(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>رقم الهاتف</Label>
                      <div className="relative">
                        <Phone className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="01xxxxxxxxx" className="pr-9" required 
                          value={phone} onChange={e => setPhone(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* --- البريد وكلمة المرور (للجميع) --- */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>البريد الإلكتروني {activeTab === "login" ? "(أو الهاتف)" : ""}</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="email" placeholder="example@azhar.edu.eg" className="pr-9" required 
                        value={email} onChange={e => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" className="pr-9 pl-9" required 
                        value={password} onChange={e => setPassword(e.target.value)}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-3 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* --- خيارات الطالب (الشكل القديم البسيط) --- */}
                <TabsContent value="student" className="mt-0 space-y-4 animate-slide-up">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>المرحلة</Label>
                      <Select onValueChange={setStage}>
                        <SelectTrigger><SelectValue placeholder="اختر المرحلة" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="preparatory">الإعدادية</SelectItem>
                          <SelectItem value="secondary">الثانوية</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>الصف</Label>
                      <Select onValueChange={setGrade}>
                        <SelectTrigger><SelectValue placeholder="اختر الصف" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="first">الصف الأول</SelectItem>
                          <SelectItem value="second">الصف الثاني</SelectItem>
                          <SelectItem value="third">الصف الثالث</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {stage === "secondary" && (
                    <div className="space-y-2 animate-fade-in">
                      <Label>الشعبة</Label>
                      <Select onValueChange={setSection}>
                        <SelectTrigger><SelectValue placeholder="اختر الشعبة" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scientific">علمي</SelectItem>
                          <SelectItem value="literary">أدبي</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </TabsContent>

                {/* --- خيارات المعلم (الشكل الحديث والمبهر) --- */}
                <TabsContent value="teacher" className="mt-0 animate-slide-up">
                  <div className="bg-muted/30 border rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-2 text-primary font-bold border-b pb-2">
                      <Briefcase className="h-5 w-5" />
                      <span>بيانات التخصص</span>
                    </div>

                    {/* 1. اختيار المادة */}
                    <div className="space-y-2">
                      <Label>ما هي المادة التي تدرسها؟</Label>
                      <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                        <SelectTrigger className="bg-background h-12">
                          <SelectValue placeholder="اختر المادة من القائمة" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                          {TEACHER_SUBJECTS.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 2. اختيار المرحلة */}
                    {selectedSubject && (
                      <div className="space-y-2 animate-in slide-in-from-top-2">
                        <Label>اختر المرحلة الدراسية</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div 
                            className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${selectedStage === "preparatory" ? "bg-primary/10 border-primary ring-1 ring-primary" : "hover:bg-muted bg-background"}`}
                            onClick={() => setSelectedStage("preparatory")}
                          >
                            <School className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                            <span className="text-sm font-medium">الإعدادية</span>
                          </div>
                          <div 
                            className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${selectedStage === "secondary" ? "bg-primary/10 border-primary ring-1 ring-primary" : "hover:bg-muted bg-background"}`}
                            onClick={() => setSelectedStage("secondary")}
                          >
                            <GraduationCap className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                            <span className="text-sm font-medium">الثانوية</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. اختيار الصفوف */}
                    {selectedStage && (
                      <div className="space-y-2 animate-in slide-in-from-top-2">
                        <Label>حدد الصفوف (يمكنك اختيار أكثر من صف)</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {["first", "second", "third"].map((grd) => (
                            <div 
                              key={grd}
                              className={`
                                cursor-pointer rounded-md p-2 text-center text-sm border transition-all
                                ${isAssigned(selectedSubject, selectedStage, grd) 
                                  ? "bg-primary text-primary-foreground border-primary shadow-md transform scale-105" 
                                  : "bg-background hover:bg-muted"}
                              `}
                              onClick={() => toggleAssignment(selectedSubject, selectedStage, grd)}
                            >
                              {grd === "first" ? "الصف الأول" : grd === "second" ? "الصف الثاني" : "الصف الثالث"}
                              {isAssigned(selectedSubject, selectedStage, grd) && <Check className="h-3 w-3 inline mr-1" />}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* عرض التخصصات المختارة */}
                    {assignments.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t">
                        {assignments.map((a, i) => (
                          <Badge key={i} variant="secondary" className="px-2 py-1 text-xs">
                            {getSubjectName(a.subject)} 
                            <span className="mx-1 text-muted-foreground">|</span> 
                            {a.stage === "preparatory" ? "إعدادي" : "ثانوي"}
                            <span className="mx-1 text-muted-foreground">|</span>
                            {a.grade === "first" ? "1" : a.grade === "second" ? "2" : "3"}
                            <button onClick={() => toggleAssignment(a.subject, a.stage, a.grade)} className="mr-2 hover:text-red-500">×</button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* زر الإرسال */}
                <Button className="w-full h-11 text-lg font-bold mt-4 gradient-azhari hover:opacity-90 transition-opacity" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 
                    activeTab === "login" ? "تسجيل الدخول" : 
                    activeTab === "teacher" ? "إرسال طلب الانضمام" : "إنشاء حساب جديد"}
                </Button>

              </form>
            </CardContent>
          </Tabs>
        </Card>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary flex items-center justify-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Auth;
