import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  BookOpen, ChevronLeft, User, LogOut, Loader2, Home, Library, MessageSquare, Menu
} from "lucide-react";

// مكون الشريط السفلي (استعادة الشريط المفقود)
const MobileNav = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-6 md:hidden z-50">
      <div className="flex justify-around items-center">
        <Link to="/dashboard" className="flex flex-col items-center gap-1 text-primary">
          <Home className="h-6 w-6" />
          <span className="text-[10px] font-bold">الرئيسية</span>
        </Link>
        <Link to="/subjects" className="flex flex-col items-center gap-1 text-gray-400 hover:text-primary transition-colors">
          <Library className="h-6 w-6" />
          <span className="text-[10px] font-medium">المواد</span>
        </Link>
        <Link to="/ai-chat" className="flex flex-col items-center gap-1 text-gray-400 hover:text-primary transition-colors">
          <MessageSquare className="h-6 w-6" />
          <span className="text-[10px] font-medium">مساعدك</span>
        </Link>
        <Link to="/settings" className="flex flex-col items-center gap-1 text-gray-400 hover:text-primary transition-colors">
          <User className="h-6 w-6" />
          <span className="text-[10px] font-medium">حسابي</span>
        </Link>
      </div>
    </div>
  );
};

// تعريف المواد والألوان
const SUBJECTS_CONFIG: any = {
  arabic: { name: "لغة عربية", color: "from-green-500 to-emerald-700" },
  religious: { name: "مواد شرعية", color: "from-amber-500 to-orange-700" },
  english: { name: "لغة إنجليزية", color: "from-blue-500 to-indigo-700" },
  math: { name: "رياضيات", color: "from-red-500 to-pink-700" },
  science: { name: "علوم", color: "from-purple-500 to-violet-700" },
  history: { name: "تاريخ", color: "from-yellow-600 to-yellow-800" },
  physics: { name: "فيزياء", color: "from-cyan-600 to-blue-800" },
  chemistry: { name: "كيمياء", color: "from-teal-500 to-teal-700" },
  biology: { name: "أحياء", color: "from-rose-500 to-rose-700" },
  french: { name: "لغة فرنسية", color: "from-indigo-400 to-indigo-600" },
  philosophy: { name: "فلسفة", color: "from-fuchsia-600 to-purple-800" },
  geology: { name: "جيولوجيا", color: "from-stone-500 to-stone-700" },
  social: { name: "دراسات اجتماعية", color: "from-orange-600 to-red-800" },
  geography: { name: "جغرافيا", color: "from-lime-600 to-lime-800" }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [teacherAssignments, setTeacherAssignments] = useState<any[]>([]);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }

    const checkStatus = async () => {
      if (role === 'teacher') {
        const { data: profile } = await supabase.from('teacher_profiles').select('is_approved').eq('teacher_id', user.id).single();
        if (!profile || profile.is_approved !== true) {
          navigate("/pending-approval");
          return;
        }
        const { data: assignments } = await supabase.from('teacher_assignments').select('*').eq('teacher_id', user.id);
        setTeacherAssignments(assignments || []);
      }
      setLoading(false);
    };
    checkStatus();
  }, [user, role, navigate]);

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  // --- واجهة المعلم ---
  if (role === 'teacher') {
    return (
      <div className="min-h-screen bg-muted/30 pb-20 font-cairo" dir="rtl">
        <header className="bg-card p-4 shadow-sm flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full"><User className="text-primary h-6 w-6" /></div>
            <div>
              <h1 className="text-xl font-bold">لوحة المعلم</h1>
              <p className="text-sm text-muted-foreground">{user?.user_metadata.full_name}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleSignOut}><LogOut className="h-5 w-5 ml-1" /> خروج</Button>
        </header>

        <main className="container mx-auto px-4 space-y-6">
          <h2 className="text-lg font-bold mb-4">موادك الدراسية</h2>
          {teacherAssignments.length === 0 ? (
            <p className="text-muted-foreground text-center">لا توجد مواد مسندة إليك.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {teacherAssignments.map((assignment, index) => {
                const conf = SUBJECTS_CONFIG[assignment.subject_id] || { name: assignment.subject_id, color: "from-gray-500 to-gray-700" };
                const grade = assignment.grade === 'first' ? 'الأول' : assignment.grade === 'second' ? 'الثاني' : 'الثالث';
                const stage = assignment.stage === 'secondary' ? 'ثانوي' : 'إعدادي';
                
                return (
                  <Card key={index} className="overflow-hidden hover:shadow-lg transition-all cursor-pointer border-0"
                    onClick={() => navigate(`/subject/${assignment.subject_id}?grade=${assignment.grade}&stage=${assignment.stage}&section=${assignment.section || ''}`)}>
                    <div className={`h-24 bg-gradient-to-r ${conf.color} p-4 flex justify-between items-center text-white`}>
                      <div>
                        <h3 className="text-xl font-bold">{conf.name}</h3>
                        <p className="text-sm opacity-90">الصف {grade} {stage}</p>
                      </div>
                      <BookOpen className="h-8 w-8 opacity-80" />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
        <MobileNav />
      </div>
    );
  }

  // --- واجهة الطالب (استعادة عرض المواد) ---
  return (
    <div className="min-h-screen bg-muted/30 pb-20 font-cairo" dir="rtl">
       <header className="bg-card p-4 shadow-sm flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <img src="/lovable-uploads/logo.png" alt="Logo" className="h-8 w-8" onError={(e) => e.currentTarget.style.display='none'} />
            <h1 className="text-xl font-bold text-primary">أزهاريون</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}><LogOut className="h-4 w-4" /></Button>
       </header>

       <main className="container mx-auto px-4">
         <div className="bg-gradient-to-r from-primary to-emerald-600 rounded-2xl p-6 text-white mb-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-2">مرحباً بك 👋</h2>
            <p className="opacity-90">نتمنى لك عاماً دراسياً مليئاً بالتفوق.</p>
         </div>

         <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
           <BookOpen className="h-5 w-5 text-gold" /> المواد الدراسية
         </h3>
         
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(SUBJECTS_CONFIG).map(([key, val]: any) => (
              <Card key={key} className="overflow-hidden hover:shadow-md transition-all cursor-pointer border-0"
                    onClick={() => navigate(`/subject/${key}`)}>
                <div className={`h-20 bg-gradient-to-br ${val.color} flex items-center justify-center`}>
                  <BookOpen className="text-white h-8 w-8" />
                </div>
                <CardContent className="p-3 text-center">
                  <span className="font-bold text-sm">{val.name}</span>
                </CardContent>
              </Card>
            ))}
         </div>
       </main>
       
       <MobileNav />
    </div>
  );
};

export default Dashboard;
