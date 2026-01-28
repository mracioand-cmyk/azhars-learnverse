import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  BookOpen, Mail, Lock, User, Eye, EyeOff, ChevronLeft, Loader2, Phone, Briefcase
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

type AuthMode = "login" | "register" | "register-teacher";

const SUBJECTS_LIST = [
  { id: "arabic", name: "لغة عربية", type: "general" },
  { id: "religious", name: "مواد شرعية", type: "general" },
  { id: "english", name: "لغة إنجليزية", type: "general" },
  { id: "math", name: "رياضيات", type: "general" },
  { id: "science", name: "علوم", type: "prep" },
  { id: "social", name: "دراسات اجتماعية", type: "prep" },
  { id: "physics", name: "فيزياء", type: "sec" },
  { id: "chemistry", name: "كيمياء", type: "sec" },
  { id: "biology", name: "أحياء", type: "sec" },
  { id: "history", name: "تاريخ", type: "sec" },
  { id: "geography", name: "جغرافيا", type: "sec" },
  { id: "philosophy", name: "فلسفة ومنطق", type: "sec" },
  { id: "french", name: "لغة فرنسية", type: "sec" },
  { id: "geology", name: "جيولوجيا", type: "sec" }
];

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signIn, signUp, signUpTeacher } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>((searchParams.get("mode") as AuthMode) || "login");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");

  // بيانات المعلم
  const [selectedStage, setSelectedStage] = useState<"preparatory" | "secondary" | "">("");
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [selectedSection, setSelectedSection] = useState<"scientific" | "literary" | "both" | "">("");
  const [teacherSubject, setTeacherSubject] = useState("");

  const toggleGrade = (grade: string) => {
    setSelectedGrades(prev => prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade]);
  };

  const filteredSubjects = SUBJECTS_LIST.filter(sub => {
    if (!selectedStage) return false;
    if (sub.type === "general") return true;
    if (selectedStage === "preparatory" && sub.type === "prep") return true;
    if (selectedStage === "secondary" && sub.type === "sec") return true;
    return false;
  });

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
        if (password !== confirmPassword) {
          toast.error("كلمة المرور غير متطابقة");
          setIsLoading(false); return;
        }

        if (mode === "register") {
          const { error } = await signUp({ email, password, fullName, phone, username });
          if (error) toast.error(error);
          else {
            toast.success("تم إنشاء الحساب بنجاح");
            navigate("/dashboard");
          }
        } 
        else if (mode === "register-teacher") {
          if (!selectedStage || selectedGrades.length === 0 || !teacherSubject) {
            toast.error("البيانات ناقصة");
            setIsLoading(false); return;
          }
          if (selectedStage === "secondary" && !selectedSection) {
            toast.error("اختر القسم");
            setIsLoading(false); return;
          }

          const assignments = selectedGrades.map(grade => ({
            subject: teacherSubject,
            stage: selectedStage,
            grade: grade,
            section: selectedStage === "secondary" ? selectedSection : null
          }));

          const { error } = await signUpTeacher({ email, password, fullName, phone, assignments });
          if (error) toast.error(error);
          else {
            toast.success("تم إرسال طلبك بنجاح");
            navigate("/pending-approval");
          }
        }
      }
    } catch (error) { toast.error("حدث خطأ"); } finally { setIsLoading(false); }
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
            <CardTitle className="text-xl text-center font-bold text-primary">
              {mode === "login" && "تسجيل الدخول"}
              {mode === "register" && "إنشاء حساب طالب"}
              {mode === "register-teacher" && "انضم كمعلم"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {(mode === "register" || mode === "register-teacher") && (
                <>
                  <div className="space-y-2">
                    <Label>الاسم الكامل</Label>
                    <Input placeholder="أدخل اسمك الكامل" className="pr-9" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  </div>
                  {mode === "register" && (
                    <div className="space-y-2">
                      <Label>اسم المستخدم (اختياري)</Label>
                      <Input placeholder="اختر اسم مستخدم" value={username} onChange={(e) => setUsername(e.target.value)} />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>البريد الإلكتروني</Label>
                    <Input type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>رقم الهاتف</Label>
                    <Input placeholder="01xxxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>كلمة المرور</Label>
                    <Input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>تأكيد كلمة المرور</Label>
                    <Input type="password" placeholder="أعد إدخال كلمة المرور" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                  </div>
                </>
              )}

              {mode === "login" && (
                <>
                  <div className="space-y-2">
                    <Label>البريد الإلكتروني</Label>
                    <Input placeholder="example@azhar.edu.eg" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>كلمة المرور</Label>
                    <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                </>
              )}

              {mode === "register-teacher" && (
                <div className="space-y-4 pt-4 border-t mt-4 bg-muted/20 p-4 rounded-lg">
                  <Label className="font-bold text-primary flex items-center gap-2">
                    <Briefcase className="h-4 w-4" /> بيانات التدريس
                  </Label>
                  
                  <div className="space-y-2">
                    <Label className="text-xs">المرحلة التعليمية</Label>
                    <div className="flex gap-2">
                      <Button type="button" variant={selectedStage === "preparatory" ? "default" : "outline"} size="sm" className="flex-1" onClick={() => {setSelectedStage("preparatory"); setSelectedGrades([]);}}>الإعدادية</Button>
                      <Button type="button" variant={selectedStage === "secondary" ? "default" : "outline"} size="sm" className="flex-1" onClick={() => {setSelectedStage("secondary"); setSelectedGrades([]);}}>الثانوية</Button>
                    </div>
                  </div>

                  {selectedStage && (
                    <div className="space-y-2 animate-fade-in">
                      <Label className="text-xs">الصفوف الدراسية</Label>
                      <div className="space-y-2">
                        {["first", "second", "third"].map((grd) => (
                          <div key={grd} className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox checked={selectedGrades.includes(grd)} onCheckedChange={() => toggleGrade(grd)} />
                            <label className="text-sm cursor-pointer select-none">
                              {grd === "first" ? "الصف الأول" : grd === "second" ? "الصف الثاني" : "الصف الثالث"}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedStage === "secondary" && (
                    <div className="space-y-2 animate-fade-in">
                      <Label className="text-xs">القسم</Label>
                      <Select value={selectedSection} onValueChange={(val: any) => setSelectedSection(val)}>
                        <SelectTrigger className="bg-background"><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scientific">علمي</SelectItem>
                          <SelectItem value="literary">أدبي</SelectItem>
                          <SelectItem value="both">كلاهما</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {(selectedStage === "preparatory" || (selectedStage === "secondary" && selectedSection)) && (
                    <div className="space-y-2 animate-fade-in">
                      <Label className="text-xs">المادة التي تدرسها</Label>
                      <Select value={teacherSubject} onValueChange={setTeacherSubject}>
                        <SelectTrigger className="bg-background"><SelectValue placeholder="اختر المادة" /></SelectTrigger>
                        <SelectContent>
                          {filteredSubjects.map((sub) => (
                            <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              <Button className="w-full mt-4" size="lg" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                {mode === "login" && "تسجيل الدخول"}
                {mode === "register" && "إنشاء الحساب"}
                {mode === "register-teacher" && "إرسال طلب الانضمام"}
              </Button>

              <div className="space-y-2 mt-4 text-center text-sm">
                {mode === "login" ? (
                  <>
                    <p className="text-muted-foreground">ليس لديك حساب؟ <button onClick={() => setMode("register")} className="text-primary hover:underline font-medium" type="button">سجّل كطالب</button></p>
                    <p className="text-muted-foreground">أنت معلم؟ <button onClick={() => setMode("register-teacher")} className="text-gold hover:underline font-medium" type="button">سجّل كمعلم</button></p>
                  </>
                ) : (
                  <p className="text-muted-foreground">لديك حساب بالفعل؟ <button onClick={() => setMode("login")} className="text-primary hover:underline font-medium" type="button">تسجيل الدخول</button></p>
                )}
                {mode === "register" && <p className="text-muted-foreground">أنت معلم؟ <button onClick={() => setMode("register-teacher")} className="text-gold hover:underline font-medium" type="button">سجّل كمعلم</button></p>}
                {mode === "register-teacher" && <p className="text-muted-foreground">أنت طالب؟ <button onClick={() => setMode("register")} className="text-primary hover:underline font-medium" type="button">سجّل كطالب</button></p>}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
