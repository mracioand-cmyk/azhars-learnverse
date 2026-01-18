import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/manualClient";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  Users,
  GraduationCap,
  Upload,
  BookOpen,
  Bell,
  Settings,
  LogOut,
  MessageSquare,
  User,
  Search,
  Ban,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Edit,
  Video,
  FileText,
  ClipboardList,
  Send,
  RefreshCw,
  Eye,
  EyeOff,
  Shield,
  Loader2,
  AlertTriangle,
  Save,
  Mail,
  Phone,
  Globe,
  Wrench,
  UserCog,
  Lock,
  Info,
  CreditCard,
} from "lucide-react";

// Types
interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  student_code: string | null;
  stage: string | null;
  grade: string | null;
  section: string | null;
  is_banned: boolean | null;
  created_at: string | null;
}

interface TeacherRequest {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  school_name: string | null;
  employee_id: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string | null;
}

interface Subject {
  id: string;
  name: string;
  stage: string;
  grade: string;
  section: string | null;
  category: string;
  description: string | null;
  is_active: boolean | null;
}

interface Content {
  id: string;
  title: string;
  type: string;
  file_url: string;
  subject_id: string | null;
  description: string | null;
  created_at: string | null;
  is_active: boolean | null;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  user_id: string | null;
  is_read: boolean | null;
  created_at: string | null;
}

interface SupportMessage {
  id: string;
  user_id: string;
  message: string;
  is_from_admin: boolean | null;
  is_read: boolean | null;
  created_at: string | null;
}

interface ChatConversation {
  user_id: string;
  user_name: string;
  user_email: string;
  unread_count: number;
  last_message: string;
  last_message_time: string | null;
}

interface PlatformSettings {
  [key: string]: string;
}

// Stage/Grade data
const stages = [
  { value: "ابتدائي", label: "ابتدائي" },
  { value: "اعدادي", label: "إعدادي" },
  { value: "ثانوي", label: "ثانوي" },
];

const gradesByStage: { [key: string]: { value: string; label: string }[] } = {
  ابتدائي: [
    { value: "الصف الأول", label: "الصف الأول" },
    { value: "الصف الثاني", label: "الصف الثاني" },
    { value: "الصف الثالث", label: "الصف الثالث" },
    { value: "الصف الرابع", label: "الصف الرابع" },
    { value: "الصف الخامس", label: "الصف الخامس" },
    { value: "الصف السادس", label: "الصف السادس" },
  ],
  اعدادي: [
    { value: "الصف الأول", label: "الصف الأول" },
    { value: "الصف الثاني", label: "الصف الثاني" },
    { value: "الصف الثالث", label: "الصف الثالث" },
  ],
  ثانوي: [
    { value: "الصف الأول", label: "الصف الأول" },
    { value: "الصف الثاني", label: "الصف الثاني" },
    { value: "الصف الثالث", label: "الصف الثالث" },
  ],
};

const sections = [
  { value: "علمي", label: "علمي" },
  { value: "أدبي", label: "أدبي" },
];

const contentCategories = [
  { value: "دروس", label: "دروس" },
  { value: "امتحانات", label: "امتحانات" },
  { value: "ملخصات", label: "ملخصات" },
  { value: "مراجعات", label: "مراجعات" },
];

const contentTypes = [
  { value: "video", label: "فيديو", icon: Video },
  { value: "pdf", label: "PDF", icon: FileText },
  { value: "exam", label: "امتحان", icon: ClipboardList },
  { value: "summary", label: "ملخص", icon: FileText },
];

// Sidebar Menu Items
const menuItems = [
  { id: "overview", label: "نظرة عامة", icon: BarChart3 },
  { id: "students", label: "الطلاب", icon: Users },
  { id: "teachers", label: "المعلمين", icon: GraduationCap },
  { id: "subscriptions", label: "الاشتراكات", icon: CreditCard },
  { id: "content", label: "المحتوى", icon: Upload },
  { id: "subjects", label: "المواد", icon: BookOpen },
  { id: "notifications", label: "الإشعارات", icon: Bell },
  { id: "support", label: "الدعم الفني", icon: MessageSquare },
  { id: "settings", label: "الإعدادات", icon: Settings },
];

// ============================================
// ADMIN DASHBOARD COMPONENT
// ============================================
const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check admin role
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (!roleData) {
        toast.error("ليس لديك صلاحية الوصول");
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    };

    checkAdmin();
  }, [user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex" dir="rtl">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 right-0 left-0 z-50 bg-card border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <BookOpen className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground text-sm">أزهاريون</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="h-8 w-8"
        >
          {sidebarOpen ? <XCircle className="h-5 w-5" /> : <BarChart3 className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed right-0 top-0 h-screen w-64 bg-card border-l border-border flex flex-col z-50 transition-transform duration-300",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="p-4 lg:p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 lg:h-10 lg:w-10 items-center justify-center rounded-lg bg-primary">
              <BookOpen className="h-4 w-4 lg:h-5 lg:w-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-foreground text-sm lg:text-base">أزهاريون</span>
              <p className="text-xs text-muted-foreground hidden lg:block">لوحة التحكم</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 lg:p-4 space-y-1 overflow-y-auto">
          {/* زر الرفع الخاص */}
          <button
            onClick={() => {
              navigate("/admin/upload");
              setSidebarOpen(false);
            }}
            className="w-full flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg text-xs lg:text-sm font-medium transition-all bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/30 mb-3 lg:mb-4"
          >
            <Upload className="h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0" />
            <span className="truncate">رفع المحتوى</span>
          </button>

          <Separator className="my-2 lg:my-3" />

          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSidebarOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg text-xs lg:text-sm font-medium transition-all",
                activeTab === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Admin Info */}
        <div className="p-3 lg:p-4 border-t border-border">
          <div className="flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg bg-accent/50 mb-2 lg:mb-3">
            <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 lg:h-5 lg:w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs lg:text-sm font-medium text-foreground truncate">المدير</p>
              <p className="text-xs text-muted-foreground truncate hidden lg:block">مدير النظام</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 lg:gap-3 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs lg:text-sm"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0" />
            <span className="truncate">تسجيل الخروج</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:mr-64 p-4 lg:p-8 pt-20 lg:pt-8 w-full max-w-full overflow-x-hidden">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "students" && <StudentsTab />}
        {activeTab === "teachers" && <TeachersTab />}
        {activeTab === "subscriptions" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">الاشتراكات</h2>
            <Button onClick={() => navigate("/admin/subscriptions")} className="gap-2">
              <CreditCard className="h-5 w-5" />
              إدارة الاشتراكات
            </Button>
          </div>
        )}
        {activeTab === "content" && <ContentTab />}
        {activeTab === "subjects" && <SubjectsTab />}
        {activeTab === "notifications" && <NotificationsTab />}
        {activeTab === "support" && <SupportTab />}
        {activeTab === "settings" && <SettingsTab />}
      </main>
    </div>
  );
};

// ============================================
// OVERVIEW TAB
// ============================================
const OverviewTab = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    pendingTeachers: 0,
    totalSubjects: 0,
    totalVideos: 0,
    totalPdfs: 0,
    unreadSupport: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get students count
        const { count: studentsCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        // Get teachers count (approved)
        const { count: teachersCount } = await supabase
          .from("user_roles")
          .select("*", { count: "exact", head: true })
          .eq("role", "teacher");

        // Get pending teacher requests
        const { count: pendingCount } = await supabase
          .from("teacher_requests")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");

        // Get subjects count
        const { count: subjectsCount } = await supabase
          .from("subjects")
          .select("*", { count: "exact", head: true });

        // Get videos count
        const { count: videosCount } = await supabase
          .from("content")
          .select("*", { count: "exact", head: true })
          .eq("type", "video");

        // Get PDFs count
        const { count: pdfsCount } = await supabase
          .from("content")
          .select("*", { count: "exact", head: true })
          .eq("type", "pdf");

        // Get unread support messages
        const { count: unreadCount } = await supabase
          .from("support_messages")
          .select("*", { count: "exact", head: true })
          .eq("is_from_admin", false)
          .eq("is_read", false);

        setStats({
          totalStudents: studentsCount || 0,
          totalTeachers: teachersCount || 0,
          pendingTeachers: pendingCount || 0,
          totalSubjects: subjectsCount || 0,
          totalVideos: videosCount || 0,
          totalPdfs: pdfsCount || 0,
          unreadSupport: unreadCount || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
        toast.error("خطأ في تحميل الإحصائيات");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { title: "إجمالي الطلاب", value: stats.totalStudents, icon: Users, color: "text-blue-500" },
    { title: "إجمالي المعلمين", value: stats.totalTeachers, icon: GraduationCap, color: "text-green-500" },
    { title: "طلبات المعلمين المعلقة", value: stats.pendingTeachers, icon: AlertTriangle, color: "text-yellow-500" },
    { title: "عدد المواد", value: stats.totalSubjects, icon: BookOpen, color: "text-purple-500" },
    { title: "عدد الفيديوهات", value: stats.totalVideos, icon: Video, color: "text-red-500" },
    { title: "عدد ملفات PDF", value: stats.totalPdfs, icon: FileText, color: "text-orange-500" },
    { title: "رسائل الدعم غير المقروءة", value: stats.unreadSupport, icon: MessageSquare, color: "text-pink-500" },
  ];

  if (loading) {
    return (
      <div className="space-y-4 lg:space-y-6 w-full max-w-full">
        <h2 className="text-xl lg:text-2xl font-bold">نظرة عامة</h2>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-24 lg:h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6 w-full max-w-full">
      <h2 className="text-xl lg:text-2xl font-bold flex items-center gap-2">
        <BarChart3 className="h-5 w-5 lg:h-6 lg:w-6 flex-shrink-0" />
        <span className="truncate">نظرة عامة</span>
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-3 lg:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs lg:text-sm text-muted-foreground truncate">{stat.title}</p>
                  <p className="text-xl lg:text-3xl font-bold mt-1 lg:mt-2">{stat.value}</p>
                </div>
                <stat.icon className={cn("h-6 w-6 lg:h-10 lg:w-10 flex-shrink-0", stat.color)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ============================================
// STUDENTS TAB
// ============================================
const StudentsTab = () => {
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchStudents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("خطأ في تحميل الطلاب");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const toggleBan = async (student: Profile) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_banned: !student.is_banned })
        .eq("id", student.id);

      if (error) throw error;

      toast.success(student.is_banned ? "تم فك حظر الطالب" : "تم حظر الطالب");
      fetchStudents();
    } catch (error) {
      console.error("Error toggling ban:", error);
      toast.error("خطأ في تحديث حالة الطالب");
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_code?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">إدارة الطلاب</h2>
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          إدارة الطلاب
        </h2>
        <Badge variant="secondary">{students.length} طالب</Badge>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="بحث بالاسم أو البريد أو كود الطالب..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">البريد الإلكتروني</TableHead>
                <TableHead className="text-right">كود الطالب</TableHead>
                <TableHead className="text-right">المرحلة</TableHead>
                <TableHead className="text-right">الصف</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    لا يوجد طلاب
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.full_name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{student.student_code || "-"}</Badge>
                    </TableCell>
                    <TableCell>{student.stage || "-"}</TableCell>
                    <TableCell>{student.grade || "-"}</TableCell>
                    <TableCell>
                      {student.is_banned ? (
                        <Badge variant="destructive">محظور</Badge>
                      ) : (
                        <Badge variant="default" className="bg-green-500">نشط</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant={student.is_banned ? "outline" : "destructive"}
                        size="sm"
                        onClick={() => toggleBan(student)}
                      >
                        {student.is_banned ? (
                          <>
                            <CheckCircle className="h-4 w-4 ml-1" />
                            فك الحظر
                          </>
                        ) : (
                          <>
                            <Ban className="h-4 w-4 ml-1" />
                            حظر
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

// ============================================
// TEACHERS TAB
// ============================================
const TeachersTab = () => {
  const [requests, setRequests] = useState<TeacherRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("teacher_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching teacher requests:", error);
      toast.error("خطأ في تحميل طلبات المعلمين");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (request: TeacherRequest) => {
    try {
      // Update teacher request status
      const { error: requestError } = await supabase
        .from("teacher_requests")
        .update({ status: "approved", reviewed_at: new Date().toISOString() })
        .eq("id", request.id);

      if (requestError) throw requestError;

      // Add teacher role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: request.user_id, role: "teacher" });

      if (roleError && !roleError.message.includes("duplicate")) {
        throw roleError;
      }

      toast.success("تم قبول المعلم بنجاح");
      fetchRequests();
    } catch (error) {
      console.error("Error approving teacher:", error);
      toast.error("خطأ في قبول المعلم");
    }
  };

  const handleReject = async (request: TeacherRequest) => {
    try {
      const { error } = await supabase
        .from("teacher_requests")
        .update({ status: "rejected", reviewed_at: new Date().toISOString() })
        .eq("id", request.id);

      if (error) throw error;

      toast.success("تم رفض الطلب");
      fetchRequests();
    } catch (error) {
      console.error("Error rejecting teacher:", error);
      toast.error("خطأ في رفض الطلب");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">معلق</Badge>;
      case "approved":
        return <Badge className="bg-green-500">مقبول</Badge>;
      case "rejected":
        return <Badge variant="destructive">مرفوض</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">إدارة المعلمين</h2>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="h-6 w-6" />
          إدارة المعلمين
        </h2>
        <Badge variant="secondary">
          {requests.filter((r) => r.status === "pending").length} طلب معلق
        </Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">البريد الإلكتروني</TableHead>
                <TableHead className="text-right">الهاتف</TableHead>
                <TableHead className="text-right">المدرسة</TableHead>
                <TableHead className="text-right">رقم الموظف</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    لا يوجد طلبات
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.full_name}</TableCell>
                    <TableCell>{request.email}</TableCell>
                    <TableCell>{request.phone || "-"}</TableCell>
                    <TableCell>{request.school_name || "-"}</TableCell>
                    <TableCell>{request.employee_id || "-"}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {request.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-green-500 hover:bg-green-600"
                            onClick={() => handleApprove(request)}
                          >
                            <CheckCircle className="h-4 w-4 ml-1" />
                            قبول
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleReject(request)}
                          >
                            <XCircle className="h-4 w-4 ml-1" />
                            رفض
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

// ============================================
// CONTENT TAB
// ============================================
const ContentTab = () => {
  const [contents, setContents] = useState<Content[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedStage, setSelectedStage] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: "",
    type: "",
    subject_id: "",
    description: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const [contentsRes, subjectsRes] = await Promise.all([
        supabase.from("content").select("*").order("created_at", { ascending: false }),
        supabase.from("subjects").select("*").eq("is_active", true),
      ]);

      if (contentsRes.error) throw contentsRes.error;
      if (subjectsRes.error) throw subjectsRes.error;

      setContents(contentsRes.data || []);
      setSubjects(subjectsRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get the appropriate bucket based on content type
  const getBucketName = (type: string): string => {
    switch (type) {
      case "video":
        return "videos";
      case "pdf":
      case "summary":
        return "books";
      case "exam":
        return "exams";
      default:
        return "books";
    }
  };

  // Get accepted file types based on content type
  const getAcceptedFileTypes = (type: string): string => {
    switch (type) {
      case "video":
        return "video/*";
      case "pdf":
      case "summary":
      case "exam":
        return ".pdf";
      default:
        return "*/*";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 50MB)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error("حجم الملف كبير جداً (الحد الأقصى 50MB)");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.title || !uploadForm.type || !selectedFile || !uploadForm.subject_id) {
      toast.error("يرجى ملء جميع الحقول المطلوبة واختيار ملف");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Generate unique file name
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const bucketName = getBucketName(uploadForm.type);
      const filePath = `${uploadForm.subject_id}/${fileName}`;

      // Upload file to Supabase Storage
      setUploadProgress(20);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setUploadProgress(70);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      const fileUrl = urlData.publicUrl;

      // Save content to database
      const { error: dbError } = await supabase.from("content").insert({
        title: uploadForm.title,
        type: uploadForm.type,
        file_url: fileUrl,
        subject_id: uploadForm.subject_id,
        description: uploadForm.description,
      });

      if (dbError) throw dbError;

      setUploadProgress(100);
      toast.success("تم رفع المحتوى بنجاح");
      setShowUploadDialog(false);
      setUploadForm({ title: "", type: "", subject_id: "", description: "" });
      setSelectedFile(null);
      setUploadProgress(0);
      fetchData();
    } catch (error: any) {
      console.error("Error uploading content:", error);
      toast.error(error.message || "خطأ في رفع المحتوى");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Get content to delete file from storage
      const contentToDelete = contents.find((c) => c.id === id);
      
      if (contentToDelete?.file_url) {
        // Extract file path from URL and delete from storage
        const url = new URL(contentToDelete.file_url);
        const pathParts = url.pathname.split("/storage/v1/object/public/");
        if (pathParts.length > 1) {
          const [bucket, ...filePathParts] = pathParts[1].split("/");
          const filePath = filePathParts.join("/");
          await supabase.storage.from(bucket).remove([filePath]);
        }
      }

      const { error } = await supabase.from("content").delete().eq("id", id);
      if (error) throw error;
      toast.success("تم حذف المحتوى");
      fetchData();
    } catch (error) {
      console.error("Error deleting content:", error);
      toast.error("خطأ في حذف المحتوى");
    }
  };

  // Reset file when type changes
  useEffect(() => {
    setSelectedFile(null);
  }, [uploadForm.type]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4" />;
      case "pdf":
      case "summary":
        return <FileText className="h-4 w-4" />;
      case "exam":
        return <ClipboardList className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const filteredSubjects = subjects.filter((s) => {
    if (selectedStage && s.stage !== selectedStage) return false;
    if (selectedGrade && s.grade !== selectedGrade) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">إدارة المحتوى</h2>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Upload className="h-6 w-6" />
          إدارة المحتوى
        </h2>
        <Button onClick={() => setShowUploadDialog(true)}>
          <Plus className="h-4 w-4 ml-2" />
          رفع محتوى جديد
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={selectedStage || "__all__"} onValueChange={(v) => { setSelectedStage(v === "__all__" ? "" : v); setSelectedGrade(""); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="المرحلة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">الكل</SelectItem>
            {stages.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedGrade || "__all__"} onValueChange={(v) => setSelectedGrade(v === "__all__" ? "" : v)} disabled={!selectedStage}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="الصف" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">الكل</SelectItem>
            {selectedStage && gradesByStage[selectedStage]?.map((g) => (
              <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">النوع</TableHead>
                <TableHead className="text-right">العنوان</TableHead>
                <TableHead className="text-right">المادة</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    لا يوجد محتوى
                  </TableCell>
                </TableRow>
              ) : (
                contents.map((content) => {
                  const subject = subjects.find((s) => s.id === content.subject_id);
                  return (
                    <TableRow key={content.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(content.type)}
                          <Badge variant="outline">{content.type}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{content.title}</TableCell>
                      <TableCell>{subject?.name || "-"}</TableCell>
                      <TableCell>
                        {content.created_at
                          ? new Date(content.created_at).toLocaleDateString("ar-EG")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a href={content.file_url} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-4 w-4" />
                            </a>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                                <AlertDialogDescription>
                                  هل أنت متأكد من حذف هذا المحتوى؟ لا يمكن التراجع عن هذا الإجراء.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(content.id)}>
                                  حذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>رفع محتوى جديد</DialogTitle>
            <DialogDescription>أضف فيديو أو ملف PDF أو امتحان أو ملخص</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>العنوان *</Label>
              <Input
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                placeholder="عنوان المحتوى"
              />
            </div>
            <div>
              <Label>نوع المحتوى *</Label>
              <Select
                value={uploadForm.type}
                onValueChange={(v) => setUploadForm({ ...uploadForm, type: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  {contentTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <div className="flex items-center gap-2">
                        <t.icon className="h-4 w-4" />
                        {t.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>المادة *</Label>
              <Select
                value={uploadForm.subject_id}
                onValueChange={(v) => setUploadForm({ ...uploadForm, subject_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المادة" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.length === 0 ? (
                    <SelectItem value="__no_subjects__" disabled>لا توجد مواد - أضف مادة أولاً</SelectItem>
                  ) : (
                    subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.stage} - {s.grade})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الملف *</Label>
              <div className="space-y-2">
                <Input
                  type="file"
                  accept={uploadForm.type ? getAcceptedFileTypes(uploadForm.type) : "*/*"}
                  onChange={handleFileChange}
                  disabled={!uploadForm.type}
                  className="cursor-pointer"
                />
                {!uploadForm.type && (
                  <p className="text-xs text-muted-foreground">اختر نوع المحتوى أولاً</p>
                )}
                {selectedFile && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>{selectedFile.name}</span>
                    <span className="text-xs">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                )}
                {uploading && uploadProgress > 0 && (
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label>الوصف (اختياري)</Label>
              <Textarea
                value={uploadForm.description}
                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                placeholder="وصف المحتوى"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpload} disabled={uploading || !selectedFile}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Upload className="h-4 w-4 ml-2" />}
              {uploading ? `جاري الرفع ${uploadProgress}%` : "رفع"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ============================================
// SUBJECTS TAB
// ============================================
const SubjectsTab = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const [form, setForm] = useState({
    name: "",
    stage: "",
    grade: "",
    section: "",
    category: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchSubjects = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .order("stage", { ascending: true });

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast.error("خطأ في تحميل المواد");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const resetForm = () => {
    setForm({ name: "", stage: "", grade: "", section: "", category: "", description: "" });
    setEditingSubject(null);
  };

  const handleSave = async () => {
    if (!form.name || !form.stage || !form.grade || !form.category) {
      toast.error("يرجى ملء الحقول المطلوبة");
      return;
    }

    setSaving(true);
    try {
      if (editingSubject) {
        const { error } = await supabase
          .from("subjects")
          .update({
            name: form.name,
            stage: form.stage,
            grade: form.grade,
            section: form.section || null,
            category: form.category,
            description: form.description || null,
          })
          .eq("id", editingSubject.id);

        if (error) throw error;
        toast.success("تم تحديث المادة");
      } else {
        const { error } = await supabase.from("subjects").insert({
          name: form.name,
          stage: form.stage,
          grade: form.grade,
          section: form.section || null,
          category: form.category,
          description: form.description || null,
        });

        if (error) throw error;
        toast.success("تمت إضافة المادة");
      }

      setShowAddDialog(false);
      resetForm();
      fetchSubjects();
    } catch (error) {
      console.error("Error saving subject:", error);
      toast.error("خطأ في حفظ المادة");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setForm({
      name: subject.name,
      stage: subject.stage,
      grade: subject.grade,
      section: subject.section || "",
      category: subject.category,
      description: subject.description || "",
    });
    setShowAddDialog(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("subjects").delete().eq("id", id);
      if (error) throw error;
      toast.success("تم حذف المادة");
      fetchSubjects();
    } catch (error) {
      console.error("Error deleting subject:", error);
      toast.error("خطأ في حذف المادة");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">إدارة المواد</h2>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          إدارة المواد
        </h2>
        <Button onClick={() => { resetForm(); setShowAddDialog(true); }}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة مادة جديدة
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">المادة</TableHead>
                <TableHead className="text-right">المرحلة</TableHead>
                <TableHead className="text-right">الصف</TableHead>
                <TableHead className="text-right">الشعبة</TableHead>
                <TableHead className="text-right">التصنيف</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    لا توجد مواد
                  </TableCell>
                </TableRow>
              ) : (
                subjects.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell className="font-medium">{subject.name}</TableCell>
                    <TableCell>{subject.stage}</TableCell>
                    <TableCell>{subject.grade}</TableCell>
                    <TableCell>{subject.section || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{subject.category}</Badge>
                    </TableCell>
                    <TableCell>
                      {subject.is_active ? (
                        <Badge className="bg-green-500">نشط</Badge>
                      ) : (
                        <Badge variant="secondary">معطل</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(subject)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                              <AlertDialogDescription>
                                هل أنت متأكد من حذف هذه المادة؟ سيتم حذف جميع المحتوى المرتبط بها.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(subject.id)}>
                                حذف
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSubject ? "تعديل المادة" : "إضافة مادة جديدة"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>اسم المادة *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="مثال: اللغة العربية"
              />
            </div>
            <div>
              <Label>المرحلة *</Label>
              <Select
                value={form.stage}
                onValueChange={(v) => setForm({ ...form, stage: v, grade: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المرحلة" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الصف *</Label>
              <Select
                value={form.grade}
                onValueChange={(v) => setForm({ ...form, grade: v })}
                disabled={!form.stage}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الصف" />
                </SelectTrigger>
                <SelectContent>
                  {form.stage && gradesByStage[form.stage]?.map((g) => (
                    <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الشعبة (للثانوي)</Label>
              <Select
                value={form.section || "__none__"}
                onValueChange={(v) => setForm({ ...form, section: v === "__none__" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الشعبة (اختياري)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">بدون شعبة</SelectItem>
                  {sections.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>التصنيف *</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر التصنيف" />
                </SelectTrigger>
                <SelectContent>
                  {contentCategories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الوصف (اختياري)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="وصف المادة"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Save className="h-4 w-4 ml-2" />}
              {editingSubject ? "تحديث" : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ============================================
// NOTIFICATIONS TAB
// ============================================
const NotificationsTab = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSendDialog, setShowSendDialog] = useState(false);

  const [form, setForm] = useState({
    title: "",
    message: "",
    targetType: "all" as "all" | "specific",
    studentCode: "",
  });
  const [sending, setSending] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("خطأ في تحميل الإشعارات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleSend = async () => {
    if (!form.title || !form.message) {
      toast.error("يرجى ملء العنوان والرسالة");
      return;
    }

    setSending(true);
    try {
      let userId: string | null = null;

      if (form.targetType === "specific") {
        if (!form.studentCode) {
          toast.error("يرجى إدخال كود الطالب");
          setSending(false);
          return;
        }

        const { data: student, error: studentError } = await supabase
          .from("profiles")
          .select("id")
          .eq("student_code", form.studentCode)
          .single();

        if (studentError || !student) {
          toast.error("لم يتم العثور على طالب بهذا الكود");
          setSending(false);
          return;
        }

        userId = student.id;
      }

      const { error } = await supabase.from("notifications").insert({
        title: form.title,
        message: form.message,
        user_id: userId,
      });

      if (error) throw error;

      toast.success(form.targetType === "all" ? "تم إرسال الإشعار للجميع" : "تم إرسال الإشعار للطالب");
      setShowSendDialog(false);
      setForm({ title: "", message: "", targetType: "all", studentCode: "" });
      fetchNotifications();
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("خطأ في إرسال الإشعار");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("notifications").delete().eq("id", id);
      if (error) throw error;
      toast.success("تم حذف الإشعار");
      fetchNotifications();
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("خطأ في حذف الإشعار");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">نظام الإشعارات</h2>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6" />
          نظام الإشعارات
        </h2>
        <Button onClick={() => setShowSendDialog(true)}>
          <Send className="h-4 w-4 ml-2" />
          إرسال إشعار
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">العنوان</TableHead>
                <TableHead className="text-right">الرسالة</TableHead>
                <TableHead className="text-right">المستهدف</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    لا توجد إشعارات
                  </TableCell>
                </TableRow>
              ) : (
                notifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell className="font-medium">{notification.title}</TableCell>
                    <TableCell className="max-w-xs truncate">{notification.message}</TableCell>
                    <TableCell>
                      {notification.user_id ? (
                        <Badge variant="outline">طالب محدد</Badge>
                      ) : (
                        <Badge>الجميع</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {notification.created_at
                        ? new Date(notification.created_at).toLocaleDateString("ar-EG")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من حذف هذا الإشعار؟
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(notification.id)}>
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Send Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إرسال إشعار</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>إرسال إلى</Label>
              <Select
                value={form.targetType}
                onValueChange={(v) => setForm({ ...form, targetType: v as "all" | "specific" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الطلاب</SelectItem>
                  <SelectItem value="specific">طالب محدد</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.targetType === "specific" && (
              <div>
                <Label>كود الطالب *</Label>
                <Input
                  value={form.studentCode}
                  onChange={(e) => setForm({ ...form, studentCode: e.target.value })}
                  placeholder="أدخل كود الطالب"
                />
              </div>
            )}
            <div>
              <Label>العنوان *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="عنوان الإشعار"
              />
            </div>
            <div>
              <Label>الرسالة *</Label>
              <Textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="نص الرسالة"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Send className="h-4 w-4 ml-2" />}
              إرسال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ============================================
// SUPPORT TAB
// ============================================
const SupportTab = () => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      // Get all support messages grouped by user
      const { data: messagesData, error } = await supabase
        .from("support_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group by user_id
      const groupedMap = new Map<string, SupportMessage[]>();
      messagesData?.forEach((msg) => {
        if (!groupedMap.has(msg.user_id)) {
          groupedMap.set(msg.user_id, []);
        }
        groupedMap.get(msg.user_id)!.push(msg);
      });

      // Get user profiles
      const userIds = Array.from(groupedMap.keys());
      if (userIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      // Build conversations
      const convs: ChatConversation[] = [];
      groupedMap.forEach((msgs, userId) => {
        const profile = profiles?.find((p) => p.id === userId);
        const unreadCount = msgs.filter((m) => !m.is_from_admin && !m.is_read).length;
        const lastMsg = msgs[0];

        convs.push({
          user_id: userId,
          user_name: profile?.full_name || "مستخدم",
          user_email: profile?.email || "",
          unread_count: unreadCount,
          last_message: lastMsg.message,
          last_message_time: lastMsg.created_at,
        });
      });

      // Sort by last message time
      convs.sort((a, b) => {
        if (!a.last_message_time) return 1;
        if (!b.last_message_time) return -1;
        return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
      });

      setConversations(convs);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("خطأ في تحميل المحادثات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();

    // Real-time subscription
    const channel = supabase
      .channel("support-messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_messages" },
        () => {
          fetchConversations();
          if (selectedUserId) {
            fetchMessages(selectedUserId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchConversations, selectedUserId]);

  const fetchMessages = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark as read
      await supabase
        .from("support_messages")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_from_admin", false);

      fetchConversations();
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSelectConversation = (userId: string) => {
    setSelectedUserId(userId);
    fetchMessages(userId);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUserId) return;

    setSending(true);
    try {
      const { error } = await supabase.from("support_messages").insert({
        user_id: selectedUserId,
        message: newMessage,
        is_from_admin: true,
      });

      if (error) throw error;

      setNewMessage("");
      fetchMessages(selectedUserId);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("خطأ في إرسال الرسالة");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteConversation = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("support_messages")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;

      toast.success("تم حذف المحادثة");
      setSelectedUserId(null);
      setMessages([]);
      fetchConversations();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("خطأ في حذف المحادثة");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">الدعم الفني</h2>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <MessageSquare className="h-6 w-6" />
        الدعم الفني
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
        {/* Conversations List */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">المحادثات</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[520px]">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  لا توجد محادثات
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.user_id}
                    className={cn(
                      "p-4 border-b cursor-pointer hover:bg-accent/50 transition-colors",
                      selectedUserId === conv.user_id && "bg-accent"
                    )}
                    onClick={() => handleSelectConversation(conv.user_id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{conv.user_name}</span>
                      {conv.unread_count > 0 && (
                        <Badge variant="destructive" className="rounded-full">
                          {conv.unread_count}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {conv.last_message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {conv.last_message_time
                        ? new Date(conv.last_message_time).toLocaleString("ar-EG")
                        : ""}
                    </p>
                  </div>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="md:col-span-2 flex flex-col">
          {selectedUserId ? (
            <>
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {conversations.find((c) => c.user_id === selectedUserId)?.user_name}
                  </CardTitle>
                  <CardDescription>
                    {conversations.find((c) => c.user_id === selectedUserId)?.user_email}
                  </CardDescription>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 ml-1" />
                      حذف المحادثة
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                      <AlertDialogDescription>
                        هل أنت متأكد من حذف هذه المحادثة؟
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteConversation(selectedUserId)}>
                        حذف
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-4">
                <ScrollArea className="flex-1 mb-4">
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "max-w-[80%] p-3 rounded-lg",
                          msg.is_from_admin
                            ? "bg-primary text-primary-foreground mr-auto"
                            : "bg-muted ml-auto"
                        )}
                      >
                        <p>{msg.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {msg.created_at
                            ? new Date(msg.created_at).toLocaleString("ar-EG")
                            : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="اكتب رسالتك..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              اختر محادثة للبدء
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

// ============================================
// SETTINGS TAB
// ============================================
const SettingsTab = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PlatformSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Password change
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("platform_settings").select("*");

      if (error) throw error;

      const settingsMap: PlatformSettings = {};
      data?.forEach((s) => {
        settingsMap[s.key] = s.value || "";
      });
      setSettings(settingsMap);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("خطأ في تحميل الإعدادات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
      }));

      for (const update of updates) {
        await supabase
          .from("platform_settings")
          .upsert({ key: update.key, value: update.value }, { onConflict: "key" });
      }

      toast.success("تم حفظ الإعدادات");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("خطأ في حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("كلمتا المرور غير متطابقتين");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) throw error;

      toast.success("تم تغيير كلمة المرور");
      setPasswordForm({ newPassword: "", confirmPassword: "" });
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("خطأ في تغيير كلمة المرور");
    } finally {
      setChangingPassword(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">الإعدادات</h2>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Settings className="h-6 w-6" />
        إعدادات المنصة
      </h2>

      <div className="grid gap-6">
        {/* Platform Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              معلومات المنصة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>اسم المنصة</Label>
              <Input
                value={settings.platform_name || ""}
                onChange={(e) => updateSetting("platform_name", e.target.value)}
              />
            </div>
            <div>
              <Label>وصف المنصة</Label>
              <Textarea
                value={settings.platform_description || ""}
                onChange={(e) => updateSetting("platform_description", e.target.value)}
              />
            </div>
            <div>
              <Label>رابط اللوجو</Label>
              <Input
                value={settings.platform_logo || ""}
                onChange={(e) => updateSetting("platform_logo", e.target.value)}
                placeholder="https://..."
                dir="ltr"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              بيانات التواصل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>البريد الإلكتروني للدعم</Label>
              <Input
                type="email"
                value={settings.support_email || ""}
                onChange={(e) => updateSetting("support_email", e.target.value)}
              />
            </div>
            <div>
              <Label>رقم الهاتف</Label>
              <Input
                value={settings.support_phone || ""}
                onChange={(e) => updateSetting("support_phone", e.target.value)}
              />
            </div>
            <div>
              <Label>رقم واتساب</Label>
              <Input
                value={settings.support_whatsapp || ""}
                onChange={(e) => updateSetting("support_whatsapp", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Mode */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              وضع الصيانة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>تفعيل وضع الصيانة</Label>
                <p className="text-sm text-muted-foreground">
                  عند التفعيل، لن يستطيع الطلاب الوصول للمنصة
                </p>
              </div>
              <Switch
                checked={settings.maintenance_mode === "true"}
                onCheckedChange={(checked) =>
                  updateSetting("maintenance_mode", checked ? "true" : "false")
                }
              />
            </div>
            <div>
              <Label>رسالة الصيانة</Label>
              <Textarea
                value={settings.maintenance_message || ""}
                onChange={(e) => updateSetting("maintenance_message", e.target.value)}
                placeholder="المنصة تحت الصيانة حاليًا..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Developer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              معلومات المطوّر
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>إظهار معلومات المطوّر في الموقع</Label>
              <Switch
                checked={settings.developer_visible === "true"}
                onCheckedChange={(checked) =>
                  updateSetting("developer_visible", checked ? "true" : "false")
                }
              />
            </div>
            <div>
              <Label>اسم المطوّر</Label>
              <Input
                value={settings.developer_name || ""}
                onChange={(e) => updateSetting("developer_name", e.target.value)}
              />
            </div>
            <div>
              <Label>بريد المطوّر</Label>
              <Input
                type="email"
                value={settings.developer_email || ""}
                onChange={(e) => updateSetting("developer_email", e.target.value)}
              />
            </div>
            <div>
              <Label>هاتف المطوّر</Label>
              <Input
                value={settings.developer_phone || ""}
                onChange={(e) => updateSetting("developer_phone", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              تغيير كلمة المرور
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>كلمة المرور الجديدة</Label>
              <Input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />
            </div>
            <div>
              <Label>تأكيد كلمة المرور</Label>
              <Input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              />
            </div>
            <Button onClick={handleChangePassword} disabled={changingPassword} variant="outline">
              {changingPassword ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <Lock className="h-4 w-4 ml-2" />
              )}
              تغيير كلمة المرور
            </Button>
          </CardContent>
        </Card>

        {/* Admin Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              بيانات حساب الأدمن
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm">
                <strong>البريد الإلكتروني الحالي:</strong> {user?.email}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                لتغيير البريد الإلكتروني، يرجى التواصل مع الدعم الفني
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin ml-2" />
          ) : (
            <Save className="h-4 w-4 ml-2" />
          )}
          حفظ جميع الإعدادات
        </Button>
      </div>
    </div>
  );
};

export default AdminDashboard;
