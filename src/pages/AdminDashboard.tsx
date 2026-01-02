import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Video, FileText,
  Bell, MessageSquare, Settings, LogOut, Search, Ban, CheckCircle,
  XCircle, Plus, Trash2, Edit, Send, Loader2, Menu, X, Eye, EyeOff,
  Phone, Mail, User, Shield, Activity, ChevronLeft
} from "lucide-react";

// Types
interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  student_code: string | null;
  phone: string | null;
  is_banned: boolean | null;
  created_at: string | null;
}

interface TeacherRequest {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  specialization: string | null;
  experience: string | null;
  status: string | null;
  created_at: string | null;
}

interface Stage {
  id: string;
  name: string;
  name_ar: string;
  order_index: number | null;
}

interface Grade {
  id: string;
  stage_id: string | null;
  name: string;
  name_ar: string;
  order_index: number | null;
}

interface Subject {
  id: string;
  stage_id: string | null;
  grade_id: string | null;
  name: string;
  name_ar: string;
  description: string | null;
}

interface VideoItem {
  id: string;
  subject_id: string | null;
  title: string;
  description: string | null;
  video_url: string;
  order_index: number | null;
}

interface PdfItem {
  id: string;
  subject_id: string | null;
  title: string;
  description: string | null;
  file_url: string;
  order_index: number | null;
}

interface Notification {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  is_global: boolean | null;
  is_read: boolean | null;
  created_at: string | null;
}

interface SupportConversation {
  id: string;
  user_id: string | null;
  subject: string | null;
  status: string | null;
  created_at: string | null;
  profiles?: Profile;
  unread_count?: number;
}

interface SupportMessage {
  id: string;
  conversation_id: string | null;
  sender_id: string | null;
  message: string;
  is_admin: boolean | null;
  is_read: boolean | null;
  created_at: string | null;
}

interface PlatformSettings {
  id: string;
  platform_name: string | null;
  platform_description: string | null;
  contact_phone: string | null;
  whatsapp_support: string | null;
  maintenance_mode: boolean | null;
  maintenance_message: string | null;
  developer_name: string | null;
  developer_email: string | null;
  developer_phone: string | null;
  show_developer_info: boolean | null;
}

interface Stats {
  students: number;
  teachers: number;
  pendingRequests: number;
  subjects: number;
  videos: number;
  pdfs: number;
  unreadMessages: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Auth state
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Tab state
  const [activeTab, setActiveTab] = useState("overview");
  
  // Data state
  const [stats, setStats] = useState<Stats>({ students: 0, teachers: 0, pendingRequests: 0, subjects: 0, videos: 0, pdfs: 0, unreadMessages: 0 });
  const [students, setStudents] = useState<Profile[]>([]);
  const [teacherRequests, setTeacherRequests] = useState<TeacherRequest[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [pdfs, setPdfs] = useState<PdfItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<SupportConversation | null>(null);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  
  // Search/Filter state
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form state
  const [formLoading, setFormLoading] = useState(false);
  
  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/auth");
          return;
        }
        
        setCurrentUser(user);
        
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();
        
        if (roleError || !roleData) {
          toast({ title: "غير مصرح", description: "ليس لديك صلاحية الوصول", variant: "destructive" });
          navigate("/");
          return;
        }
        
        setIsAdmin(true);
        setLoading(false);
        loadAllData();
      } catch (error) {
        console.error("Auth error:", error);
        navigate("/");
      }
    };
    
    checkAdmin();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) navigate("/auth");
    });
    
    return () => subscription.unsubscribe();
  }, [navigate, toast]);
  
  // Load all data
  const loadAllData = async () => {
    await Promise.all([
      loadStats(),
      loadStudents(),
      loadTeacherRequests(),
      loadStages(),
      loadGrades(),
      loadSubjects(),
      loadVideos(),
      loadPdfs(),
      loadConversations(),
      loadSettings(),
    ]);
  };
  
  // Stats
  const loadStats = async () => {
    const [studentsRes, teachersRes, requestsRes, subjectsRes, videosRes, pdfsRes, messagesRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact" }),
      supabase.from("user_roles").select("id", { count: "exact" }).eq("role", "teacher"),
      supabase.from("teacher_requests").select("id", { count: "exact" }).eq("status", "pending"),
      supabase.from("subjects").select("id", { count: "exact" }),
      supabase.from("videos").select("id", { count: "exact" }),
      supabase.from("pdfs").select("id", { count: "exact" }),
      supabase.from("support_messages").select("id", { count: "exact" }).eq("is_read", false).eq("is_admin", false),
    ]);
    
    setStats({
      students: studentsRes.count || 0,
      teachers: teachersRes.count || 0,
      pendingRequests: requestsRes.count || 0,
      subjects: subjectsRes.count || 0,
      videos: videosRes.count || 0,
      pdfs: pdfsRes.count || 0,
      unreadMessages: messagesRes.count || 0,
    });
  };
  
  // Students
  const loadStudents = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setStudents(data || []);
  };
  
  const toggleBan = async (id: string, currentStatus: boolean | null) => {
    setFormLoading(true);
    const { error } = await supabase.from("profiles").update({ is_banned: !currentStatus }).eq("id", id);
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم", description: currentStatus ? "تم فك الحظر" : "تم الحظر" });
      loadStudents();
      loadStats();
    }
    setFormLoading(false);
  };
  
  // Teacher Requests
  const loadTeacherRequests = async () => {
    const { data } = await supabase.from("teacher_requests").select("*").order("created_at", { ascending: false });
    setTeacherRequests(data || []);
  };
  
  const handleTeacherRequest = async (request: TeacherRequest, approve: boolean) => {
    setFormLoading(true);
    try {
      if (approve && request.user_id) {
        // Update user role to teacher
        await supabase.from("user_roles").upsert({ user_id: request.user_id, role: "teacher" as const }, { onConflict: "user_id,role" });
      }
      
      // Update request status
      await supabase.from("teacher_requests").update({
        status: approve ? "approved" : "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: currentUser?.id,
      }).eq("id", request.id);
      
      toast({ title: "تم", description: approve ? "تم قبول الطلب" : "تم رفض الطلب" });
      loadTeacherRequests();
      loadStats();
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
    setFormLoading(false);
  };
  
  // Stages
  const loadStages = async () => {
    const { data } = await supabase.from("stages").select("*").order("order_index");
    setStages(data || []);
  };
  
  const addStage = async (name: string, nameAr: string) => {
    setFormLoading(true);
    const { error } = await supabase.from("stages").insert({ name, name_ar: nameAr, order_index: stages.length });
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم", description: "تمت إضافة المرحلة" });
      loadStages();
    }
    setFormLoading(false);
  };
  
  const deleteStage = async (id: string) => {
    setFormLoading(true);
    const { error } = await supabase.from("stages").delete().eq("id", id);
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم", description: "تم الحذف" });
      loadStages();
      loadGrades();
      loadSubjects();
    }
    setFormLoading(false);
  };
  
  // Grades
  const loadGrades = async () => {
    const { data } = await supabase.from("grades").select("*").order("order_index");
    setGrades(data || []);
  };
  
  const addGrade = async (stageId: string, name: string, nameAr: string) => {
    setFormLoading(true);
    const { error } = await supabase.from("grades").insert({ stage_id: stageId, name, name_ar: nameAr, order_index: grades.length });
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم", description: "تمت إضافة الصف" });
      loadGrades();
    }
    setFormLoading(false);
  };
  
  const deleteGrade = async (id: string) => {
    setFormLoading(true);
    const { error } = await supabase.from("grades").delete().eq("id", id);
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم", description: "تم الحذف" });
      loadGrades();
      loadSubjects();
    }
    setFormLoading(false);
  };
  
  // Subjects
  const loadSubjects = async () => {
    const { data } = await supabase.from("subjects").select("*").order("created_at", { ascending: false });
    setSubjects(data || []);
    loadStats();
  };
  
  const addSubject = async (stageId: string, gradeId: string, name: string, nameAr: string, description: string) => {
    setFormLoading(true);
    const { error } = await supabase.from("subjects").insert({ stage_id: stageId, grade_id: gradeId, name, name_ar: nameAr, description });
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم", description: "تمت إضافة المادة" });
      loadSubjects();
    }
    setFormLoading(false);
  };
  
  const deleteSubject = async (id: string) => {
    setFormLoading(true);
    const { error } = await supabase.from("subjects").delete().eq("id", id);
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم", description: "تم الحذف" });
      loadSubjects();
      loadVideos();
      loadPdfs();
    }
    setFormLoading(false);
  };
  
  // Videos
  const loadVideos = async () => {
    const { data } = await supabase.from("videos").select("*").order("order_index");
    setVideos(data || []);
    loadStats();
  };
  
  const addVideo = async (subjectId: string, title: string, description: string, videoUrl: string) => {
    setFormLoading(true);
    const { error } = await supabase.from("videos").insert({ subject_id: subjectId, title, description, video_url: videoUrl, order_index: videos.length });
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم", description: "تم رفع الفيديو" });
      loadVideos();
    }
    setFormLoading(false);
  };
  
  const deleteVideo = async (id: string) => {
    setFormLoading(true);
    const { error } = await supabase.from("videos").delete().eq("id", id);
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم", description: "تم الحذف" });
      loadVideos();
    }
    setFormLoading(false);
  };
  
  // PDFs
  const loadPdfs = async () => {
    const { data } = await supabase.from("pdfs").select("*").order("order_index");
    setPdfs(data || []);
    loadStats();
  };
  
  const addPdf = async (subjectId: string, title: string, description: string, fileUrl: string) => {
    setFormLoading(true);
    const { error } = await supabase.from("pdfs").insert({ subject_id: subjectId, title, description, file_url: fileUrl, order_index: pdfs.length });
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم", description: "تم رفع الملف" });
      loadPdfs();
    }
    setFormLoading(false);
  };
  
  const deletePdf = async (id: string) => {
    setFormLoading(true);
    const { error } = await supabase.from("pdfs").delete().eq("id", id);
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم", description: "تم الحذف" });
      loadPdfs();
    }
    setFormLoading(false);
  };
  
  // Notifications
  const sendNotification = async (title: string, message: string, studentCode?: string) => {
    setFormLoading(true);
    try {
      if (studentCode) {
        const { data: profile } = await supabase.from("profiles").select("id").eq("student_code", studentCode).maybeSingle();
        if (!profile) {
          toast({ title: "خطأ", description: "كود الطالب غير موجود", variant: "destructive" });
          setFormLoading(false);
          return;
        }
        await supabase.from("notifications").insert({ user_id: profile.id, title, message, is_global: false });
      } else {
        await supabase.from("notifications").insert({ title, message, is_global: true });
      }
      toast({ title: "تم", description: "تم إرسال الإشعار" });
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
    setFormLoading(false);
  };
  
  // Support
  const loadConversations = async () => {
    const { data } = await supabase
      .from("support_conversations")
      .select("*")
      .order("updated_at", { ascending: false });
    
    if (data) {
      // Get unread counts and profiles for each conversation
      const conversationsWithDetails = await Promise.all(
        data.map(async (conv) => {
          const { count } = await supabase
            .from("support_messages")
            .select("id", { count: "exact" })
            .eq("conversation_id", conv.id)
            .eq("is_read", false)
            .eq("is_admin", false);
          
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", conv.user_id)
            .maybeSingle();
          
          return { ...conv, unread_count: count || 0, profiles: profile };
        })
      );
      setConversations(conversationsWithDetails);
    }
  };
  
  const loadMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from("support_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at");
    setMessages(data || []);
    
    // Mark as read
    await supabase
      .from("support_messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .eq("is_admin", false);
    loadConversations();
    loadStats();
  };
  
  const sendMessage = async (conversationId: string, message: string) => {
    setFormLoading(true);
    const { error } = await supabase.from("support_messages").insert({
      conversation_id: conversationId,
      sender_id: currentUser?.id,
      message,
      is_admin: true,
    });
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      loadMessages(conversationId);
    }
    setFormLoading(false);
  };
  
  const deleteConversation = async (id: string) => {
    setFormLoading(true);
    await supabase.from("support_messages").delete().eq("conversation_id", id);
    await supabase.from("support_conversations").delete().eq("id", id);
    toast({ title: "تم", description: "تم حذف المحادثة" });
    setSelectedConversation(null);
    loadConversations();
    setFormLoading(false);
  };
  
  // Settings
  const loadSettings = async () => {
    const { data } = await supabase.from("platform_settings").select("*").limit(1).maybeSingle();
    setPlatformSettings(data);
  };
  
  const updateSettings = async (settings: Partial<PlatformSettings>) => {
    setFormLoading(true);
    if (platformSettings?.id) {
      const { error } = await supabase.from("platform_settings").update(settings).eq("id", platformSettings.id);
      if (error) {
        toast({ title: "خطأ", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "تم", description: "تم حفظ الإعدادات" });
        loadSettings();
      }
    }
    setFormLoading(false);
  };
  
  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };
  
  // Filter students
  const filteredStudents = students.filter((s) =>
    (s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.student_code?.toLowerCase().includes(searchTerm.toLowerCase())) ?? false
  );
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAdmin) {
    return null;
  }

  const menuItems = [
    { id: "overview", label: "لوحة التحكم", icon: LayoutDashboard },
    { id: "students", label: "الطلاب", icon: Users },
    { id: "teachers", label: "المعلمين", icon: GraduationCap },
    { id: "content", label: "المحتوى", icon: BookOpen },
    { id: "subjects", label: "المواد", icon: BookOpen },
    { id: "notifications", label: "الإشعارات", icon: Bell },
    { id: "support", label: "الدعم الفني", icon: MessageSquare },
    { id: "settings", label: "الإعدادات", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 right-0 z-50 w-64 gradient-dark text-white transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0 lg:w-20"}`}>
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          <h1 className={`font-bold text-lg ${!sidebarOpen && "lg:hidden"}`}>لوحة الأدمن</h1>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white hover:bg-white/10">
            {sidebarOpen ? <ChevronLeft /> : <Menu />}
          </Button>
        </div>
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === item.id ? "bg-white/20" : "hover:bg-white/10"}`}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className={!sidebarOpen ? "lg:hidden" : ""}>{item.label}</span>
              {item.id === "teachers" && stats.pendingRequests > 0 && (
                <Badge className="mr-auto bg-destructive">{stats.pendingRequests}</Badge>
              )}
              {item.id === "support" && stats.unreadMessages > 0 && (
                <Badge className="mr-auto bg-destructive">{stats.unreadMessages}</Badge>
              )}
            </button>
          ))}
          <Separator className="bg-white/10 my-4" />
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 text-red-300">
            <LogOut className="h-5 w-5" />
            <span className={!sidebarOpen ? "lg:hidden" : ""}>تسجيل الخروج</span>
          </button>
        </nav>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 lg:hidden z-40" onClick={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-card border-b p-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu />
          </Button>
          <h2 className="text-xl font-bold">{menuItems.find((m) => m.id === activeTab)?.label}</h2>
        </header>

        <div className="p-6 animate-fade-in">
          {/* Overview */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="stat-card gradient-primary">
                <Users className="h-8 w-8 mb-2" />
                <p className="text-3xl font-bold">{stats.students}</p>
                <p className="text-sm opacity-80">الطلاب</p>
              </div>
              <div className="stat-card gradient-success">
                <GraduationCap className="h-8 w-8 mb-2" />
                <p className="text-3xl font-bold">{stats.teachers}</p>
                <p className="text-sm opacity-80">المعلمين</p>
              </div>
              <div className="stat-card gradient-warning">
                <BookOpen className="h-8 w-8 mb-2" />
                <p className="text-3xl font-bold">{stats.subjects}</p>
                <p className="text-sm opacity-80">المواد</p>
              </div>
              <div className="stat-card gradient-danger">
                <Bell className="h-8 w-8 mb-2" />
                <p className="text-3xl font-bold">{stats.pendingRequests}</p>
                <p className="text-sm opacity-80">طلبات معلقة</p>
              </div>
              <div className="stat-card gradient-primary">
                <Video className="h-8 w-8 mb-2" />
                <p className="text-3xl font-bold">{stats.videos}</p>
                <p className="text-sm opacity-80">الفيديوهات</p>
              </div>
              <div className="stat-card gradient-success">
                <FileText className="h-8 w-8 mb-2" />
                <p className="text-3xl font-bold">{stats.pdfs}</p>
                <p className="text-sm opacity-80">ملفات PDF</p>
              </div>
              <div className="stat-card gradient-warning">
                <MessageSquare className="h-8 w-8 mb-2" />
                <p className="text-3xl font-bold">{stats.unreadMessages}</p>
                <p className="text-sm opacity-80">رسائل غير مقروءة</p>
              </div>
            </div>
          )}

          {/* Students */}
          {activeTab === "students" && (
            <Card>
              <CardHeader>
                <CardTitle>إدارة الطلاب</CardTitle>
                <div className="relative mt-4">
                  <Search className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input placeholder="بحث بالاسم / الإيميل / كود الطالب" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-10" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right p-3">الاسم</th>
                        <th className="text-right p-3">البريد</th>
                        <th className="text-right p-3">كود الطالب</th>
                        <th className="text-right p-3">الحالة</th>
                        <th className="text-right p-3">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student) => (
                        <tr key={student.id} className="border-b hover:bg-muted/50">
                          <td className="p-3">{student.full_name || "-"}</td>
                          <td className="p-3">{student.email || "-"}</td>
                          <td className="p-3 font-mono">{student.student_code || "-"}</td>
                          <td className="p-3">
                            {student.is_banned ? <Badge variant="destructive">محظور</Badge> : <Badge className="bg-success">نشط</Badge>}
                          </td>
                          <td className="p-3">
                            <Button variant={student.is_banned ? "outline" : "destructive"} size="sm" onClick={() => toggleBan(student.id, student.is_banned)} disabled={formLoading}>
                              {student.is_banned ? <CheckCircle className="h-4 w-4 ml-1" /> : <Ban className="h-4 w-4 ml-1" />}
                              {student.is_banned ? "فك الحظر" : "حظر"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredStudents.length === 0 && <p className="text-center py-8 text-muted-foreground">لا توجد نتائج</p>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Teachers */}
          {activeTab === "teachers" && (
            <Card>
              <CardHeader>
                <CardTitle>طلبات المعلمين</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teacherRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1">
                        <p className="font-semibold">{request.full_name}</p>
                        <p className="text-sm text-muted-foreground">{request.email}</p>
                        <p className="text-sm">{request.specialization}</p>
                        <Badge className={request.status === "pending" ? "bg-warning" : request.status === "approved" ? "bg-success" : "bg-destructive"}>
                          {request.status === "pending" ? "معلق" : request.status === "approved" ? "مقبول" : "مرفوض"}
                        </Badge>
                      </div>
                      {request.status === "pending" && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleTeacherRequest(request, true)} disabled={formLoading} className="bg-success hover:bg-success/90">
                            <CheckCircle className="h-4 w-4 ml-1" /> قبول
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleTeacherRequest(request, false)} disabled={formLoading}>
                            <XCircle className="h-4 w-4 ml-1" /> رفض
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  {teacherRequests.length === 0 && <p className="text-center py-8 text-muted-foreground">لا توجد طلبات</p>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content */}
          {activeTab === "content" && (
            <Tabs defaultValue="stages" className="space-y-4">
              <TabsList>
                <TabsTrigger value="stages">المراحل</TabsTrigger>
                <TabsTrigger value="grades">الصفوف</TabsTrigger>
                <TabsTrigger value="videos">الفيديوهات</TabsTrigger>
                <TabsTrigger value="pdfs">ملفات PDF</TabsTrigger>
              </TabsList>

              <TabsContent value="stages">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>المراحل الدراسية</CardTitle>
                    <AddStageDialog onAdd={addStage} loading={formLoading} />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stages.map((stage) => (
                        <div key={stage.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <span>{stage.name_ar}</span>
                          <Button variant="destructive" size="icon" onClick={() => deleteStage(stage.id)} disabled={formLoading}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {stages.length === 0 && <p className="text-center py-4 text-muted-foreground">لا توجد مراحل</p>}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="grades">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>الصفوف الدراسية</CardTitle>
                    <AddGradeDialog stages={stages} onAdd={addGrade} loading={formLoading} />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {grades.map((grade) => (
                        <div key={grade.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <span>{grade.name_ar}</span>
                            <span className="text-sm text-muted-foreground mr-2">({stages.find((s) => s.id === grade.stage_id)?.name_ar})</span>
                          </div>
                          <Button variant="destructive" size="icon" onClick={() => deleteGrade(grade.id)} disabled={formLoading}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {grades.length === 0 && <p className="text-center py-4 text-muted-foreground">لا توجد صفوف</p>}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="videos">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>الفيديوهات</CardTitle>
                    <AddVideoDialog subjects={subjects} onAdd={addVideo} loading={formLoading} />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {videos.map((video) => (
                        <div key={video.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <span className="font-medium">{video.title}</span>
                            <span className="text-sm text-muted-foreground mr-2">({subjects.find((s) => s.id === video.subject_id)?.name_ar})</span>
                          </div>
                          <Button variant="destructive" size="icon" onClick={() => deleteVideo(video.id)} disabled={formLoading}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {videos.length === 0 && <p className="text-center py-4 text-muted-foreground">لا توجد فيديوهات</p>}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pdfs">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>ملفات PDF</CardTitle>
                    <AddPdfDialog subjects={subjects} onAdd={addPdf} loading={formLoading} />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {pdfs.map((pdf) => (
                        <div key={pdf.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <span className="font-medium">{pdf.title}</span>
                            <span className="text-sm text-muted-foreground mr-2">({subjects.find((s) => s.id === pdf.subject_id)?.name_ar})</span>
                          </div>
                          <Button variant="destructive" size="icon" onClick={() => deletePdf(pdf.id)} disabled={formLoading}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {pdfs.length === 0 && <p className="text-center py-4 text-muted-foreground">لا توجد ملفات</p>}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {/* Subjects */}
          {activeTab === "subjects" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>المواد الدراسية</CardTitle>
                <AddSubjectDialog stages={stages} grades={grades} onAdd={addSubject} loading={formLoading} />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {subjects.map((subject) => (
                    <div key={subject.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <span className="font-medium">{subject.name_ar}</span>
                        <div className="text-sm text-muted-foreground">
                          {stages.find((s) => s.id === subject.stage_id)?.name_ar} - {grades.find((g) => g.id === subject.grade_id)?.name_ar}
                        </div>
                      </div>
                      <Button variant="destructive" size="icon" onClick={() => deleteSubject(subject.id)} disabled={formLoading}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {subjects.length === 0 && <p className="text-center py-8 text-muted-foreground">لا توجد مواد</p>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications */}
          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle>إرسال إشعار</CardTitle>
              </CardHeader>
              <CardContent>
                <NotificationForm onSend={sendNotification} loading={formLoading} />
              </CardContent>
            </Card>
          )}

          {/* Support */}
          {activeTab === "support" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>المحادثات</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[500px]">
                    {conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => { setSelectedConversation(conv); loadMessages(conv.id); }}
                        className={`w-full p-4 text-right border-b hover:bg-muted/50 transition-colors ${selectedConversation?.id === conv.id ? "bg-muted" : ""}`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-medium">{conv.profiles?.full_name || "مستخدم"}</span>
                          {(conv.unread_count ?? 0) > 0 && <Badge className="bg-destructive">{conv.unread_count}</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{conv.subject || "بدون موضوع"}</p>
                      </button>
                    ))}
                    {conversations.length === 0 && <p className="text-center py-8 text-muted-foreground">لا توجد محادثات</p>}
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{selectedConversation ? selectedConversation.profiles?.full_name || "محادثة" : "اختر محادثة"}</CardTitle>
                  {selectedConversation && (
                    <Button variant="destructive" size="sm" onClick={() => deleteConversation(selectedConversation.id)} disabled={formLoading}>
                      <Trash2 className="h-4 w-4 ml-1" /> حذف
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {selectedConversation ? (
                    <>
                      <ScrollArea className="h-[350px] mb-4 p-4 border rounded-lg">
                        {messages.map((msg) => (
                          <div key={msg.id} className={`mb-3 ${msg.is_admin ? "text-left" : "text-right"}`}>
                            <div className={`inline-block p-3 rounded-lg max-w-[80%] ${msg.is_admin ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                              {msg.message}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(msg.created_at || "").toLocaleString("ar")}
                            </p>
                          </div>
                        ))}
                      </ScrollArea>
                      <ChatInput onSend={(msg) => sendMessage(selectedConversation.id, msg)} loading={formLoading} />
                    </>
                  ) : (
                    <p className="text-center py-20 text-muted-foreground">اختر محادثة من القائمة</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Settings */}
          {activeTab === "settings" && platformSettings && (
            <Tabs defaultValue="general" className="space-y-4">
              <TabsList>
                <TabsTrigger value="general">عام</TabsTrigger>
                <TabsTrigger value="developer">المطور</TabsTrigger>
                <TabsTrigger value="admins">الأدمنات</TabsTrigger>
              </TabsList>

              <TabsContent value="general">
                <Card>
                  <CardHeader>
                    <CardTitle>الإعدادات العامة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <GeneralSettingsForm settings={platformSettings} onUpdate={updateSettings} loading={formLoading} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="developer">
                <Card>
                  <CardHeader>
                    <CardTitle>معلومات المطور</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DeveloperSettingsForm settings={platformSettings} onUpdate={updateSettings} loading={formLoading} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="admins">
                <Card>
                  <CardHeader>
                    <CardTitle>إدارة الأدمنات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AdminManagement currentUserId={currentUser?.id} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
    </div>
  );
};

// Dialog Components
const AddStageDialog = ({ onAdd, loading }: { onAdd: (name: string, nameAr: string) => void; loading: boolean }) => {
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  
  const handleSubmit = () => {
    if (name && nameAr) {
      onAdd(name, nameAr);
      setName("");
      setNameAr("");
    }
  };
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 ml-1" /> إضافة مرحلة</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إضافة مرحلة جديدة</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div><Label>الاسم (إنجليزي)</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>الاسم (عربي)</Label><Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
          <DialogClose asChild><Button onClick={handleSubmit} disabled={loading || !name || !nameAr}>إضافة</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AddGradeDialog = ({ stages, onAdd, loading }: { stages: Stage[]; onAdd: (stageId: string, name: string, nameAr: string) => void; loading: boolean }) => {
  const [stageId, setStageId] = useState("");
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  
  const handleSubmit = () => {
    if (stageId && name && nameAr) {
      onAdd(stageId, name, nameAr);
      setStageId("");
      setName("");
      setNameAr("");
    }
  };
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 ml-1" /> إضافة صف</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إضافة صف جديد</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>المرحلة</Label>
            <Select value={stageId} onValueChange={setStageId}>
              <SelectTrigger><SelectValue placeholder="اختر المرحلة" /></SelectTrigger>
              <SelectContent>
                {stages.map((s) => <SelectItem key={s.id} value={s.id}>{s.name_ar}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>الاسم (إنجليزي)</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>الاسم (عربي)</Label><Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
          <DialogClose asChild><Button onClick={handleSubmit} disabled={loading || !stageId || !name || !nameAr}>إضافة</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AddSubjectDialog = ({ stages, grades, onAdd, loading }: { stages: Stage[]; grades: Grade[]; onAdd: (stageId: string, gradeId: string, name: string, nameAr: string, description: string) => void; loading: boolean }) => {
  const [stageId, setStageId] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [description, setDescription] = useState("");
  
  const filteredGrades = grades.filter((g) => g.stage_id === stageId);
  
  const handleSubmit = () => {
    if (stageId && gradeId && name && nameAr) {
      onAdd(stageId, gradeId, name, nameAr, description);
      setStageId("");
      setGradeId("");
      setName("");
      setNameAr("");
      setDescription("");
    }
  };
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 ml-1" /> إضافة مادة</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إضافة مادة جديدة</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>المرحلة</Label>
            <Select value={stageId} onValueChange={(v) => { setStageId(v); setGradeId(""); }}>
              <SelectTrigger><SelectValue placeholder="اختر المرحلة" /></SelectTrigger>
              <SelectContent>
                {stages.map((s) => <SelectItem key={s.id} value={s.id}>{s.name_ar}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>الصف</Label>
            <Select value={gradeId} onValueChange={setGradeId} disabled={!stageId}>
              <SelectTrigger><SelectValue placeholder="اختر الصف" /></SelectTrigger>
              <SelectContent>
                {filteredGrades.map((g) => <SelectItem key={g.id} value={g.id}>{g.name_ar}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>الاسم (إنجليزي)</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>الاسم (عربي)</Label><Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} /></div>
          <div><Label>الوصف</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
          <DialogClose asChild><Button onClick={handleSubmit} disabled={loading || !stageId || !gradeId || !name || !nameAr}>إضافة</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AddVideoDialog = ({ subjects, onAdd, loading }: { subjects: Subject[]; onAdd: (subjectId: string, title: string, description: string, videoUrl: string) => void; loading: boolean }) => {
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  
  const handleSubmit = () => {
    if (subjectId && title && videoUrl) {
      onAdd(subjectId, title, description, videoUrl);
      setSubjectId("");
      setTitle("");
      setDescription("");
      setVideoUrl("");
    }
  };
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 ml-1" /> رفع فيديو</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>رفع فيديو جديد</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>المادة</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger><SelectValue placeholder="اختر المادة" /></SelectTrigger>
              <SelectContent>
                {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name_ar}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>العنوان</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div><Label>الوصف</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div><Label>رابط الفيديو</Label><Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." /></div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
          <DialogClose asChild><Button onClick={handleSubmit} disabled={loading || !subjectId || !title || !videoUrl}>رفع</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AddPdfDialog = ({ subjects, onAdd, loading }: { subjects: Subject[]; onAdd: (subjectId: string, title: string, description: string, fileUrl: string) => void; loading: boolean }) => {
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  
  const handleSubmit = () => {
    if (subjectId && title && fileUrl) {
      onAd