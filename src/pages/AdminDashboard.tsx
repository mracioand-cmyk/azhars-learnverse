import { useEffect, useState, useRef, ChangeEvent } from "react";
// ⚠️ IMPORTANT: Using the existing project Supabase client.
// DO NOT CHANGE THIS PATH unless your project uses a different specific path.
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, BookOpen, Video, FileText, Bell, MessageSquare, 
  Settings, LogOut, Search, Check, X, Plus, Trash2, 
  LayoutDashboard, GraduationCap, RefreshCcw, Menu, AlertCircle, Loader2, UploadCloud
} from "lucide-react";

// ============================================================================
// 1. TYPE DEFINITIONS & INTERFACES (Defensive Schema)
// ============================================================================

// We define interfaces that are loose enough to handle potential schema variations
// but strict enough for TypeScript to be helpful.

interface Profile {
  id: string;
  first_name?: string; // Optional because schema might use full_name
  last_name?: string;
  full_name?: string;  // Fallback
  email?: string;
  role: 'student' | 'teacher' | 'admin';
  is_banned?: boolean; // Some schemas might use 'banned'
  student_code?: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
}

interface TeacherRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  school?: string;
  experience?: string;
  subject?: string;
  created_at: string;
  // Join structure
  profiles?: Profile; 
}

interface Subject {
  id: string;
  name: string;
  stage: string;
  grade: string;
  term?: string;
  created_at?: string;
}

interface Content {
  id: string;
  title: string;
  type: 'video' | 'pdf' | 'quiz' | 'summary';
  url: string;
  subject_id: string;
  created_at: string;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id?: string;
  message: string; // Or 'content' or 'body'
  created_at: string;
  is_read?: boolean; // Or 'read'
}

type ViewState = 'overview' | 'students' | 'teachers' | 'subjects' | 'notifications' | 'support' | 'settings';

// ============================================================================
// 2. UTILITY FUNCTIONS
// ============================================================================

// Safe Name Getter (Handles first_name/last_name vs full_name mismatch)
const getSafeName = (profile: any) => {
  if (!profile) return "مستخدم غير معروف";
  if (profile.first_name && profile.last_name) return `${profile.first_name} ${profile.last_name}`;
  if (profile.full_name) return profile.full_name;
  if (profile.first_name) return profile.first_name;
  return profile.email?.split('@')[0] || "مستخدم";
};

// ============================================================================
// 3. MAIN COMPONENT
// ============================================================================

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // --- AUTH & SECURITY CHECK ---
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        setLoading(true);
        // 1. Get User
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        
        if (authErr || !user) {
          throw new Error("يرجى تسجيل الدخول");
        }

        // 2. Get Profile & Check Role
        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileErr) {
           console.error("Profile Error:", profileErr);
           throw new Error("لم يتم العثور على ملف المستخدم");
        }

        if (profile?.role !== 'admin') {
          throw new Error("ليس لديك صلاحية الوصول لهذه الصفحة");
        }

        setIsAdmin(true);
      } catch (err: any) {
        console.error("Admin Auth Error:", err);
        setAuthError(err.message);
        // Redirect logic - wrapped in timeout to allow UI to render error briefly if needed, 
        // or effectively redirect immediately.
        setTimeout(() => {
           window.location.href = "/";
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, []);

  // --- RENDERING LOADING / ERROR STATES ---

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50" dir="rtl">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">جاري التحقق من الصلاحيات...</p>
      </div>
    );
  }

  if (authError || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-4" dir="rtl">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">خطأ في الصلاحيات</h1>
        <p className="text-gray-600">{authError || "يتم توجيهك للصفحة الرئيسية..."}</p>
      </div>
    );
  }

  // --- MAIN UI ---

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-right" dir="rtl">
      
      {/* Sidebar - Mobile Toggle */}
      <div className="md:hidden bg-white p-4 flex justify-between items-center shadow-sm sticky top-0 z-20">
        <span className="font-bold text-lg text-blue-900">لوحة التحكم</span>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-gray-100 rounded">
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar Content */}
      <aside className={`
        fixed inset-y-0 right-0 z-30 w-64 bg-white border-l border-gray-200 shadow-lg transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
        md:relative md:translate-x-0 md:shadow-none
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-gray-100 hidden md:block">
            <h1 className="text-2xl font-extrabold text-blue-900">لوحة الأدمن</h1>
            <p className="text-xs text-gray-500 mt-1">إدارة المنصة التعليمية</p>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            <SidebarItem icon={<LayoutDashboard size={20}/>} label="نظرة عامة" active={currentView === 'overview'} onClick={() => setCurrentView('overview')} />
            <SidebarItem icon={<Users size={20}/>} label="الطلاب" active={currentView === 'students'} onClick={() => setCurrentView('students')} />
            <SidebarItem icon={<GraduationCap size={20}/>} label="المعلمون" active={currentView === 'teachers'} onClick={() => setCurrentView('teachers')} />
            <SidebarItem icon={<BookOpen size={20}/>} label="المواد والمحتوى" active={currentView === 'subjects'} onClick={() => setCurrentView('subjects')} />
            <SidebarItem icon={<Bell size={20}/>} label="الإشعارات" active={currentView === 'notifications'} onClick={() => setCurrentView('notifications')} />
            <SidebarItem icon={<MessageSquare size={20}/>} label="الدعم الفني" active={currentView === 'support'} onClick={() => setCurrentView('support')} />
            <SidebarItem icon={<Settings size={20}/>} label="الإعدادات" active={currentView === 'settings'} onClick={() => setCurrentView('settings')} />
          </nav>

          <div className="p-4 border-t border-gray-100">
            <button 
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/";
              }}
              className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
            >
              <LogOut size={20} className="ml-3" />
              تسجيل الخروج
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto min-h-[500px]">
          {currentView === 'overview' && <OverviewSection />}
          {currentView === 'students' && <StudentsSection />}
          {currentView === 'teachers' && <TeachersSection />}
          {currentView === 'subjects' && <SubjectsContentSection />}
          {currentView === 'notifications' && <NotificationsSection />}
          {currentView === 'support' && <SupportSection />}
          {currentView === 'settings' && <SettingsSection />}
        </div>
      </main>
    </div>
  );
}

// --- Sidebar Helper ---
function SidebarItem({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={() => { onClick(); window.scrollTo(0,0); }}
      className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium ${
        active ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
      }`}
    >
      <span className={`ml-3 ${active ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'}`}>{icon}</span>
      {label}
    </button>
  );
}

// ============================================================================
// SECTION 1: OVERVIEW (Stats)
// ============================================================================

function OverviewSection() {
  const [stats, setStats] = useState({
    students: 0, teachers: 0, requests: 0, subjects: 0, content: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      // Use count: 'exact', head: true for performance
      const { count: s } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student');
      const { count: t } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher');
      const { count: r } = await supabase.from('teacher_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      const { count: sub } = await supabase.from('subjects').select('*', { count: 'exact', head: true });
      const { count: c } = await supabase.from('content').select('*', { count: 'exact', head: true });

      setStats({
        students: s || 0,
        teachers: t || 0,
        requests: r || 0,
        subjects: sub || 0,
        content: c || 0
      });
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-gray-800 border-b pb-4">لوحة المعلومات</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="الطلاب المسجلين" value={stats.students} color="blue" icon={<Users />} />
        <StatCard title="المعلمون المعتمدون" value={stats.teachers} color="green" icon={<GraduationCap />} />
        <StatCard title="طلبات المعلمين" value={stats.requests} color="yellow" icon={<AlertCircle />} />
        <StatCard title="المواد التعليمية" value={stats.subjects} color="purple" icon={<BookOpen />} />
      </div>
    </div>
  );
}

function StatCard({ title, value, color, icon }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    yellow: "bg-yellow-50 text-yellow-600 border-yellow-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
  };
  return (
    <div className={`p-6 rounded-xl border ${colors[color]} shadow-sm flex items-center justify-between`}>
      <div>
        <p className="text-sm font-medium opacity-80 mb-1">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
      </div>
      <div className={`p-3 rounded-full bg-white bg-opacity-60`}>{icon}</div>
    </div>
  );
}

// ============================================================================
// SECTION 2: STUDENTS
// ============================================================================

function StudentsSection() {
  const [students, setStudents] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    let query = supabase.from('profiles').select('*').eq('role', 'student').order('created_at', { ascending: false }).limit(50);
    
    // Search logic - careful with column names
    if (search.trim()) {
      // Trying to be smart about search columns based on typical Supabase schemas
      // Using 'or' filter safely
      query = query.or(`email.ilike.%${search}%, first_name.ilike.%${search}%`); 
    }

    const { data, error } = await query;
    if (error) console.error("Error fetching students:", error);
    if (data) setStudents(data as unknown as Profile[]);
    setLoading(false);
  };

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => fetchStudents(), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const toggleBan = async (id: string, currentStatus: boolean | undefined) => {
    if (!confirm(`هل أنت متأكد من ${currentStatus ? 'فك الحظر عن' : 'حظر'} هذا الطالب؟`)) return;
    
    // Use 'is_banned' as standard, fall back if DB uses 'banned' (handled by TS ignore if needed, but we assume is_banned)
    const { error } = await supabase.from('profiles').update({ is_banned: !currentStatus }).eq('id', id);
    if (error) {
      alert("حدث خطأ أثناء التحديث");
    } else {
      fetchStudents();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">إدارة الطلاب</h2>
        <div className="relative w-full md:w-64">
          <input 
            type="text" 
            placeholder="بحث بالاسم أو البريد..." 
            className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b">
              <tr>
                <th className="p-4">اسم الطالب</th>
                <th className="p-4">بيانات الاتصال</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-500"><Loader2 className="animate-spin inline mx-2"/> جاري التحميل...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-500">لا يوجد طلاب مطابقين للبحث</td></tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-semibold text-gray-800">{getSafeName(student)}</td>
                    <td className="p-4 text-gray-600">
                      <div className="flex flex-col">
                        <span>{student.email}</span>
                        {student.phone && <span className="text-xs text-gray-400">{student.phone}</span>}
                        {student.student_code && <span className="text-xs text-blue-500 bg-blue-50 w-fit px-1 rounded mt-1">{student.student_code}</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${student.is_banned ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {student.is_banned ? 'محظور' : 'نشط'}
                      </span>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => toggleBan(student.id, student.is_banned)}
                        className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                          student.is_banned 
                          ? 'border-green-600 text-green-600 hover:bg-green-50' 
                          : 'border-red-600 text-red-600 hover:bg-red-50'
                        }`}
                      >
                        {student.is_banned ? 'فك الحظر' : 'حظر الطالب'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SECTION 3: TEACHERS (Fixing the "Pending" Bug)
// ============================================================================

function TeachersSection() {
  const [requests, setRequests] = useState<TeacherRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    // Explicitly select columns to avoid errors if structure varies slightly
    const { data, error } = await supabase
      .from('teacher_requests')
      .select(`
        *,
        profiles:user_id ( id, first_name, last_name, email, phone )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Fetch Teachers Error:", error);
      alert("خطأ في جلب البيانات. يرجى مراجعة الاتصال.");
    } else {
      setRequests(data as unknown as TeacherRequest[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleAction = async (request: TeacherRequest, action: 'approve' | 'reject') => {
    if (!confirm(action === 'approve' ? "هل أنت متأكد من قبول المعلم؟" : "هل أنت متأكد من رفض الطلب؟")) return;

    try {
      if (action === 'approve') {
        // TRANSACTION-LIKE LOGIC (Sequential)
        
        // 1. Update Profile Role
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role: 'teacher' })
          .eq('id', request.user_id);

        if (profileError) throw new Error(`فشل تحديث ملف المستخدم: ${profileError.message}`);

        // 2. Update Request Status
        const { error: reqError } = await supabase
          .from('teacher_requests')
          .update({ status: 'approved' })
          .eq('id', request.id);

        if (reqError) throw new Error(`تم تحديث الصلاحية ولكن فشل تحديث حالة الطلب: ${reqError.message}`);

      } else {
        // Reject logic
        const { error } = await supabase
          .from('teacher_requests')
          .update({ status: 'rejected' })
          .eq('id', request.id);
        
        if (error) throw error;
      }
      
      // Refresh UI
      fetchRequests();

    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">طلبات المعلمين</h2>
        <button onClick={fetchRequests} className="p-2 bg-white border rounded-full hover:bg-gray-50 shadow-sm"><RefreshCcw size={18}/></button>
      </div>

      <div className="space-y-4">
        {loading && <p className="text-center text-gray-500 py-8">جاري التحميل...</p>}
        {!loading && requests.length === 0 && <p className="text-center text-gray-500 py-8 bg-white rounded-lg border">لا توجد طلبات جديدة</p>}
        
        {requests.map((req) => (
          <div key={req.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-gray-900">{getSafeName(req.profiles)}</h3>
                <span className={`text-xs px-2 py-0.5 rounded border ${
                  req.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                  req.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 
                  'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {req.status === 'pending' ? 'انتظار' : req.status === 'approved' ? 'مقبول' : 'مرفوض'}
                </span>
              </div>
              <div className="text-sm text-gray-600 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                <p>📧 {req.profiles?.email}</p>
                <p>📞 {req.profiles?.phone || 'غير متوفر'}</p>
                <p>🏫 {req.school || 'مدرسة غير محددة'}</p>
                <p>📚 {req.subject || 'مادة غير محددة'}</p>
                {req.experience && <p className="col-span-2 text-gray-500 mt-1">💼 الخبرة: {req.experience}</p>}
              </div>
            </div>

            {req.status === 'pending' && (
              <div className="flex gap-2 w-full lg:w-auto mt-2 lg:mt-0">
                <button 
                  onClick={() => handleAction(req, 'approve')}
                  className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
                >
                  <Check size={16} /> قبول
                </button>
                <button 
                  onClick={() => handleAction(req, 'reject')}
                  className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium text-sm"
                >
                  <X size={16} /> رفض
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// SECTION 4: SUBJECTS & CONTENT (Critical Logic)
// ============================================================================

function SubjectsContentSection() {
  const [mode, setMode] = useState<'subjects' | 'content'>('subjects');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [contents, setContents] = useState<Content[]>([]);
  
  // Modals
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);

  // --- Fetching ---
  const fetchSubjects = async () => {
    const { data } = await supabase.from('subjects').select('*').order('created_at', { ascending: true });
    if (data) setSubjects(data as Subject[]);
  };

  const fetchContent = async (subjectId: string) => {
    const { data } = await supabase.from('content').select('*').eq('subject_id', subjectId).order('created_at', { ascending: false });
    if (data) setContents(data as Content[]);
  };

  useEffect(() => { fetchSubjects(); }, []);

  // --- Navigation ---
  const enterSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    fetchContent(subject.id);
    setMode('content');
  };

  const backToSubjects = () => {
    setSelectedSubject(null);
    setMode('subjects');
  };

  const handleDeleteContent = async (id: string) => {
    if (!confirm("حذف هذا المحتوى نهائياً؟")) return;
    await supabase.from('content').delete().eq('id', id);
    if (selectedSubject) fetchContent(selectedSubject.id);
  };

  // --- Render Subjects ---
  if (mode === 'subjects') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">المواد الدراسية</h2>
          <button 
            onClick={() => setShowSubjectModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
          >
            <Plus size={18} /> إضافة مادة
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map(sub => (
            <div 
              key={sub.id} 
              onClick={() => enterSubject(sub)}
              className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-400 cursor-pointer shadow-sm hover:shadow-md transition-all"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-blue-600">{sub.name}</h3>
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>{sub.stage}</span>
                <span>{sub.grade}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Modal: Add Subject */}
        {showSubjectModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-6">
              <h3 className="text-lg font-bold mb-4">إضافة مادة جديدة</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const name = (form.elements.namedItem('name') as HTMLInputElement).value;
                const stage = (form.elements.namedItem('stage') as HTMLInputElement).value;
                const grade = (form.elements.namedItem('grade') as HTMLInputElement).value;
                
                if (!name || !stage || !grade) return alert("جميع الحقول مطلوبة");
                
                const { error } = await supabase.from('subjects').insert([{ name, stage, grade }]);
                if (error) alert("خطأ في الإضافة: " + error.message);
                else { setShowSubjectModal(false); fetchSubjects(); }
              }} className="space-y-4">
                <input name="name" placeholder="اسم المادة" className="w-full border p-2 rounded" required />
                <input name="stage" placeholder="المرحلة (مثال: الثانوية)" className="w-full border p-2 rounded" required />
                <input name="grade" placeholder="الصف (مثال: الأول الثانوي)" className="w-full border p-2 rounded" required />
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowSubjectModal(false)} className="px-4 py-2 text-gray-600">إلغاء</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">حفظ</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- Render Content ---
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
        <button onClick={backToSubjects} className="hover:text-blue-600">المواد</button>
        <span>/</span>
        <span className="text-gray-800 font-bold">{selectedSubject?.name}</span>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">محتوى المادة</h2>
        <button 
          onClick={() => setShowContentModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
        >
          <UploadCloud size={18} /> رفع محتوى
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {contents.length === 0 ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center">
            <BookOpen size={48} className="mb-4 opacity-20" />
            <p>لا يوجد محتوى في هذه المادة حتى الآن</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {contents.map(item => (
              <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${
                    item.type === 'video' ? 'bg-red-100 text-red-600' :
                    item.type === 'pdf' ? 'bg-orange-100 text-orange-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {item.type === 'video' ? <Video size={20}/> : <FileText size={20}/>}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{item.title}</h4>
                    <div className="flex gap-4 mt-1 text-xs text-gray-500">
                      <span className="bg-gray-100 px-2 py-0.5 rounded uppercase">{item.type}</span>
                      <a href={item.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">عرض الملف/الرابط</a>
                    </div>
                  </div>
                </div>
                <button onClick={() => handleDeleteContent(item.id)} className="text-gray-400 hover:text-red-600 p-2">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal (Complex Logic) */}
      {showContentModal && selectedSubject && (
        <UploadModal 
          subjectId={selectedSubject.id} 
          onClose={() => setShowContentModal(false)} 
          onSuccess={() => { setShowContentModal(false); fetchContent(selectedSubject.id); }} 
        />
      )}
    </div>
  );
}

// Helper: Upload Modal to handle Storage
function UploadModal({ subjectId, onClose, onSuccess }: { subjectId: string, onClose: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ title: '', type: 'video', url: '' });
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async () => {
    try {
      if (!formData.title) return alert("يرجى كتابة عنوان");
      setLoading(true);

      let finalUrl = formData.url;

      // Handle File Upload
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `${subjectId}/${fileName}`; // Organize by subject

        // Try standard buckets
        let bucketName = 'materials'; // Default guess
        
        // Try uploading
        const { error: uploadError } = await supabase.storage.from(bucketName).upload(filePath, file);
        
        if (uploadError) {
          // If 'materials' fails, maybe 'content'?
          // NOTE: In a real scenario, we should know the bucket name. 
          // We will try to throw specific error if it's a bucket not found.
          if (uploadError.message.includes("Bucket not found")) {
             throw new Error("خطأ في النظام: Bucket 'materials' غير موجود. يرجى مراجعة إعدادات Supabase.");
          }
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(filePath);
        finalUrl = publicUrl;
      }

      if (!finalUrl) throw new Error("يرجى إدخال رابط أو رفع ملف");

      // Insert into Content Table
      const { error: dbError } = await supabase.from('content').insert([{
        title: formData.title,
        type: formData.type,
        url: finalUrl,
        subject_id: subjectId
      }]);

      if (dbError) throw dbError;

      onSuccess();
    } catch (err: any) {
      alert("خطأ: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-4">
        <h3 className="text-lg font-bold">رفع محتوى جديد</h3>
        
        <div>
          <label className="text-sm font-medium text-gray-700">العنوان</label>
          <input 
            className="w-full border p-2 rounded mt-1" 
            value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} 
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">النوع</label>
          <select 
            className="w-full border p-2 rounded mt-1"
            value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}
          >
            <option value="video">فيديو</option>
            <option value="pdf">ملف PDF</option>
            <option value="quiz">امتحان</option>
            <option value="summary">ملخص</option>
          </select>
        </div>

        <div className="border-t pt-4">
          <label className="text-sm font-medium text-gray-700 block mb-2">الملف أو الرابط</label>
          
          <div className="space-y-3">
             <input 
               type="text" 
               placeholder="رابط خارجي (Youtube, Drive...)" 
               className="w-full border p-2 rounded text-sm"
               value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})}
               disabled={!!file}
             />
             <div className="text-center text-sm text-gray-400">- أو -</div>
             <input 
               type="file" 
               className="w-full text-sm"
               onChange={e => setFile(e.target.files?.[0] || null)}
               disabled={!!formData.url}
             />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 text-gray-600">إلغاء</button>
          <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2">
            {loading && <Loader2 size={16} className="animate-spin"/>}
            {loading ? 'جاري الرفع...' : 'نشر المحتوى'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SECTION 5: NOTIFICATIONS
// ============================================================================

function NotificationsSection() {
  const [sending, setSending] = useState(false);
  const [target, setTarget] = useState<'all' | 'one'>('all');
  const [targetCode, setTargetCode] = useState('');
  const [form, setForm] = useState({ title: '', body: '' });

  const handleSend = async () => {
    if (!form.title || !form.body) return alert("املأ جميع الحقول");
    setSending(true);

    try {
      let recipients: string[] = [];

      if (target === 'all') {
        const { data } = await supabase.from('profiles').select('id').eq('role', 'student');
        if (data) recipients = data.map(d => d.id);
      } else {
        // Find by Student Code if exists, otherwise fallback to email maybe?
        // Prompt implies student_code exists.
        if (!targetCode) throw new Error("أدخل كود الطالب");
        
        // Defensive: Check if column exists by trying to select it first or assume strict schema
        const { data, error } = await supabase.from('profiles').select('id').eq('student_code', targetCode).single();
        if (error || !data) throw new Error("لم يتم العثور على طالب بهذا الكود");
        recipients = [data.id];
      }

      if (recipients.length === 0) throw new Error("لا يوجد مستلمين");

      const notifications = recipients.map(uid => ({
        user_id: uid,
        title: form.title,
        body: form.body, // or 'message' depending on schema
        is_read: false
      }));

      const { error } = await supabase.from('notifications').insert(notifications);
      if (error) throw error;

      alert("تم الإرسال بنجاح");
      setForm({ title: '', body: '' });
      setTargetCode('');

    } catch (err: any) {
      alert("خطأ: " + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="text-yellow-500" />
        <h2 className="text-2xl font-bold text-gray-800">إرسال تنبيهات</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">لمن تريد الإرسال؟</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-lg w-full hover:bg-gray-50">
              <input type="radio" name="target" checked={target === 'all'} onChange={() => setTarget('all')} />
              <span>جميع الطلاب</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-lg w-full hover:bg-gray-50">
              <input type="radio" name="target" checked={target === 'one'} onChange={() => setTarget('one')} />
              <span>طالب محدد (كود)</span>
            </label>
          </div>
        </div>

        {target === 'one' && (
          <input 
            className="w-full border p-3 rounded-lg bg-gray-50" 
            placeholder="أدخل كود الطالب..."
            value={targetCode}
            onChange={e => setTargetCode(e.target.value)}
          />
        )}

        <input 
          className="w-full border p-3 rounded-lg" 
          placeholder="عنوان الإشعار"
          value={form.title}
          onChange={e => setForm({...form, title: e.target.value})}
        />
        
        <textarea 
          className="w-full border p-3 rounded-lg h-32 resize-none" 
          placeholder="نص الرسالة..."
          value={form.body}
          onChange={e => setForm({...form, body: e.target.value})}
        />

        <button 
          onClick={handleSend}
          disabled={sending}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2"
        >
          {sending && <Loader2 className="animate-spin" />}
          {sending ? 'جاري الإرسال...' : 'إرسال الآن'}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// SECTION 6: SUPPORT CHAT
// ============================================================================

function SupportSection() {
  const [threads, setThreads] = useState<any[]>([]); // Using any to be flexible with join results
  const [activeUser, setActiveUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [adminId, setAdminId] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get Admin ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setAdminId(data.user.id);
    });
  }, []);

  // Fetch Threads (Simulated by grouping messages)
  const fetchThreads = async () => {
    // We select messages, order by time, then distinct sender_id on client
    // Note: In real huge apps, this needs a 'conversations' table.
    // Here we query distinct sender_ids who are not admin
    const { data } = await supabase
      .from('support_messages')
      .select('sender_id, created_at, is_read, profiles:sender_id(first_name, last_name, email)')
      .order('created_at', { ascending: false });

    if (data && adminId) {
      const unique = new Map();
      data.forEach((msg: any) => {
        if (msg.sender_id !== adminId && !unique.has(msg.sender_id)) {
           unique.set(msg.sender_id, msg);
        }
      });
      setThreads(Array.from(unique.values()));
    }
  };

  useEffect(() => { fetchThreads(); }, [adminId]);

  // Load Chat
  const loadChat = async (userId: string) => {
    setActiveUser(userId);
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: true });
    
    if (data) setMessages(data as ChatMessage[]);
    
    // Mark as read
    await supabase.from('support_messages').update({ is_read: true }).eq('sender_id', userId).eq('receiver_id', adminId);
    
    // Scroll down
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const sendReply = async () => {
    if (!replyText.trim() || !activeUser) return;
    
    const { error } = await supabase.from('support_messages').insert([{
      sender_id: adminId,
      receiver_id: activeUser,
      message: replyText,
      is_read: false
    }]);

    if (!error) {
      setReplyText("");
      loadChat(activeUser); // Refresh
    }
  };

  const deleteThread = async () => {
    if (!activeUser || !confirm("حذف المحادثة بالكامل؟ لا يمكن التراجع.")) return;
    await supabase.from('support_messages').delete().or(`sender_id.eq.${activeUser},receiver_id.eq.${activeUser}`);
    setActiveUser(null);
    fetchThreads();
  };

  return (
    <div className="h-[calc(100vh-140px)] bg-white rounded-xl shadow border border-gray-200 flex overflow-hidden">
      {/* Sidebar List */}
      <div className="w-80 border-l border-gray-200 bg-gray-50 flex flex-col">
        <div className="p-4 border-b bg-white font-bold text-gray-700 flex justify-between items-center">
          <span>الرسائل</span>
          <button onClick={fetchThreads}><RefreshCcw size={16} className="text-gray-400 hover:text-blue-600"/></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 && <p className="p-4 text-center text-gray-400 text-sm">لا توجد رسائل</p>}
          {threads.map(t => (
            <div 
              key={t.sender_id} 
              onClick={() => loadChat(t.sender_id)}
              className={`p-4 border-b cursor-pointer transition-colors ${activeUser === t.sender_id ? 'bg-white border-r-4 border-r-blue-600' : 'hover:bg-gray-100'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-sm text-gray-800">{getSafeName(t.profiles)}</span>
                {!t.is_read && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
              </div>
              <p className="text-xs text-gray-500 truncate">{t.profiles?.email}</p>
              <p className="text-xs text-gray-400 mt-1">{new Date(t.created_at).toLocaleDateString('ar-EG')}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {!activeUser ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <MessageSquare size={48} className="opacity-20 mb-2"/>
            <p>اختر محادثة للبدء</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
               <span className="font-bold text-gray-700">المحادثة الحالية</span>
               <button onClick={deleteThread} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={18}/></button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(msg => {
                const isMe = msg.sender_id === adminId;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
