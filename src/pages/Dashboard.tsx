import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  BookOpen,
  ChevronLeft,
  GraduationCap,
  User,
  LogOut,
  Loader2,
  BookText,
  School,
  Lock
} from "lucide-react";

// تعريف المواد والألوان (نفس القديم)
const SUBJECTS_CONFIG: any = {
  arabic: { name: "لغة عربية", color: "from-green-500 to-emerald-700" },
  religious: { name: "مواد شرعية", color: "from-amber-500 to-orange-700" },
  english: { name: "لغة إنجليزية", color: "from-blue-500 to-indigo-700" },
  math: { name: "رياضيات", color: "from-red-500 to-pink-700" },
  science: { name: "علوم", color: "from-purple-500 to-violet-700" },
  history: { name: "تاريخ", color: "from-yellow-600 to-yellow-800" },
  geography: { name: "جغرافيا", color: "from-lime-600 to-lime-800" },
  physics: { name: "فيزياء", color: "from-cyan-600 to-blue-800" },
  chemistry: { name: "كيمياء", color: "from-teal-500 to-teal-700" },
  biology: { name: "أحياء", color: "from-rose-500 to-rose-700" },
  french: { name: "لغة فرنسية", color: "from-indigo-400 to-indigo-600" },
  philosophy: { name: "فلسفة", color: "from-fuchsia-600 to-purple-800" },
  geology: { name: "جيولوجيا", color: "from-stone-500 to-stone-700" }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [teacherAssignments, setTeacherAssignments] = useState<any[]>([]);

  // 1. التحقق من التوجيه
  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const checkTeacherStatus = async () => {
      if (role === 'teacher') {
        // التحقق من حالة الموافقة
        const { data: profile } = await supabase
          .from('teacher_profiles')
          .select('is_approved')
          .eq('teacher_id', user.id)
          .single();

        if (!profile?.is_approved) {
          navigate("/pending-approval");
          return;
        }

        // جلب تخصصات المعلم (المواد والصفوف)
        const { data: assignments } = await supabase
          .from('teacher_assignments')
          .select('*')
          .eq('teacher_id', user.id);
        
        setTeacherAssignments(assignments || []);
      }
      setLoading(false);
    };

    checkTeacherStatus();
  }, [user, role, navigate]);

  // دالة الخروج
  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  // --- واجهة المعلم (Teacher View) ---
  if (role === 'teacher') {
    return (
      <div className="min-h-screen bg-muted/30 p-4 font-cairo" dir="rtl">
        <header className="flex justify-between items-center mb-8 bg-card p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full"><User className="text-primary h-6 w-6" /></div>
            <div>
              <h1 className="text-xl font-bold">مرحباً، أستاذ {user?.user_metadata.full_name}</h1>
              <p className="text-sm text-muted-foreground">لوحة تحكم المعلم</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleSignOut}><LogOut className="ml-2 h-4 w-4" /> خروج</Button>
        </header>

        <main className="space-y-8">
          {teacherAssignments.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-muted-foreground">لم يتم تحديد مواد لك بعد.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {teacherAssignments.map((assignment, index) => {
                const subjectConfig = SUBJECTS_CONFIG[assignment.subject_category] || { name: assignment.subject_category, color: "from-gray-500 to-gray-700" };
                const gradeText = assignment.grade === 'first' ? 'الصف الأول' : assignment.grade === 'second' ? 'الصف الثاني' : 'الصف الثالث';
                const stageText = assignment.stage === 'secondary' ? 'الثانوي' : 'الإعدادي';

                return (
                  <Card key={index} className="overflow-hidden hover:shadow-lg transition-all border-0 group cursor-pointer"
                    onClick={() => navigate(`/subject/${assignment.subject_category}?grade=${assignment.grade}&stage=${assignment.stage}`)}
                  >
                    <div className={`h-32 bg-gradient-to-br ${subjectConfig.color} relative p-6 flex flex-col justify-between`}>
                      <BookOpen className="text-white/80 h-8 w-8 absolute top-4 left-4 group-hover:scale-110 transition-transform" />
                      <div>
                        <h3 className="text-white text-2xl font-bold">{subjectConfig.name}</h3>
                        <p className="text-white/90 text-sm">{gradeText} {stageText}</p>
                      </div>
                    </div>
                    <CardContent className="p-4 flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">اضغط لإدارة المحتوى</span>
                      <ChevronLeft className="h-5 w-5 text-primary group-hover:-translate-x-1 transition-transform" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>
    );
  }

  // --- واجهة الطالب (Student View - القديمة) ---
  return (
    <div className="min-h-screen bg-muted/30 p-4 font-cairo" dir="rtl">
       {/* (هنا الكود القديم الخاص بداشبورد الطالب كما هو لم يتغير) */}
       {/* سأضع لك مثالاً مبسطاً لعدم الإطالة، لكن في ملفك الحقيقي اترك كود الطالب كما كان */}
       <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-primary">لوحة الطالب</h1>
          <Button variant="ghost" onClick={handleSignOut}><LogOut className="ml-2 h-4 w-4" /> خروج</Button>
       </header>
       <div className="text-center p-10 bg-card rounded-xl shadow-sm">
         <h2 className="text-xl mb-4">أهلاً بك في رحلتك التعليمية</h2>
         <Button onClick={() => navigate('/subjects')}>تصفح المواد الدراسية</Button>
       </div>
    </div>
  );
};

export default Dashboard;
