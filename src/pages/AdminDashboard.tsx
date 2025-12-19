import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/manualClient";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Video,
  Check,
  X,
  Plus,
  Trash2,
  UploadCloud,
  Menu,
  LogOut,
  MessageSquare,
  Bell,
  Settings,
  GraduationCap,
  FileText,
  TrendingUp,
  Clock,
  Eye,
  ChevronLeft,
  School,
  Send,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

type View = "overview" | "students" | "teachers" | "content" | "subjects" | "notifications" | "support" | "settings";

interface Subject {
  id: string;
  name: string;
  stage: string;
  grade: string;
  category: string;
}

interface ContentItem {
  id: string;
  title: string;
  type: string;
  file_url: string;
  subject_id: string;
  created_at: string;
  is_active: boolean;
}

interface Student {
  id: string;
  full_name: string;
  email: string;
  student_code: string;
  stage: string;
  grade: string;
  is_banned: boolean;
  created_at: string;
}

interface TeacherRequest {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  school_name: string;
  status: string;
  created_at: string;
}

interface SupportMessage {
  id: string;
  user_id: string;
  message: string;
  is_from_admin: boolean;
  is_read: boolean;
  created_at: string;
  profile?: { full_name: string; email: string; student_code: string } | null;
}

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<View>("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    pendingTeachers: 0,
    subjects: 0,
    videos: 0,
    books: 0,
    messages: 0,
  });

  // Data
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teacherRequests, setTeacherRequests] = useState<TeacherRequest[]>([]);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);

  // Upload Dialog
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    type: "book" as "book" | "video" | "exam",
    subject_id: "",
    file: null as File | null,
  });

  // Notification Dialog
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notification, setNotification] = useState({
    title: "",
    message: "",
    target: "all" as "all" | "specific",
    student_code: "",
  });
  const [sendingNotification, setSendingNotification] = useState(false);

  // Support Reply
  const [replyMessage, setReplyMessage] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  /* ================== SECURITY ================== */
  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const checkAdmin = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (data?.role !== "admin") {
        toast.error("غير مصرح لك بالدخول");
        navigate("/");
      }
    };

    checkAdmin();
  }, [user, navigate]);

  /* ================== FETCH ================== */
  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      // Fetch counts
      const [
        { count: studentCount },
        { count: teacherCount },
        { count: pendingCount },
        { count: subjectCount },
        { count: videoCount },
        { count: bookCount },
        { count: messageCount },
      ] = await Promise.all([
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "teacher"),
        supabase.from("teacher_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("subjects").select("*", { count: "exact", head: true }),
        supabase.from("content").select("*", { count: "exact", head: true }).eq("type", "video"),
        supabase.from("content").select("*", { count: "exact", head: true }).eq("type", "book"),
        supabase.from("support_messages").select("*", { count: "exact", head: true }).eq("is_read", false),
      ]);

      setStats({
        students: studentCount || 0,
        teachers: teacherCount || 0,
        pendingTeachers: pendingCount || 0,
        subjects: subjectCount || 0,
        videos: videoCount || 0,
        books: bookCount || 0,
        messages: messageCount || 0,
      });

      // Fetch data
      const [
        { data: subjectsData },
        { data: contentData },
        { data: studentsData },
        { data: requestsData },
        { data: messagesData },
      ] = await Promise.all([
        supabase.from("subjects").select("*").order("created_at", { ascending: false }),
        supabase.from("content").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("teacher_requests").select("*").order("created_at", { ascending: false }),
        supabase.from("support_messages")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      setSubjects(subjectsData || []);
      setContent(contentData || []);
      setStudents(studentsData || []);
      setTeacherRequests(requestsData || []);
      
      // Enrich support messages with profile data
      const enrichedMessages = (messagesData || []).map(msg => {
        const userProfile = studentsData?.find(s => s.id === msg.user_id);
        return {
          ...msg,
          profile: userProfile ? {
            full_name: userProfile.full_name,
            email: userProfile.email,
            student_code: userProfile.student_code,
          } : null,
        };
      });
      setSupportMessages(enrichedMessages);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("حدث خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  /* ================== UPLOAD ================== */
  const handleUpload = async () => {
    if (!user) {
      toast.error("يرجى تسجيل الدخول أولاً");
      return;
    }

    if (!newItem.file) {
      toast.error("يرجى اختيار ملف");
      return;
    }

    if (!newItem.title.trim()) {
      toast.error("يرجى إدخال عنوان المحتوى");
      return;
    }

    if (!newItem.subject_id) {
      toast.error("يرجى اختيار المادة");
      return;
    }

    setUploading(true);
    try {
      // Determine bucket based on type
      let bucket = "books";
      if (newItem.type === "video") bucket = "videos";
      if (newItem.type === "exam") bucket = "exams";

      const ext = newItem.file.name.split(".").pop();
      const fileName = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const path = `${user.id}/${fileName}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, newItem.file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(`فشل رفع الملف: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      
      if (!urlData?.publicUrl) {
        throw new Error("فشل في الحصول على رابط الملف");
      }

      // Insert content record
      const { error: insertError } = await supabase.from("content").insert({
        title: newItem.title,
        description: newItem.description || null,
        type: newItem.type,
        file_url: urlData.publicUrl,
        subject_id: newItem.subject_id,
        uploaded_by: user.id,
        is_active: true,
      });

      if (insertError) {
        console.error("Insert error:", insertError);
        // Try to delete uploaded file on failure
        await supabase.storage.from(bucket).remove([path]);
        throw new Error(`فشل حفظ المحتوى: ${insertError.message}`);
      }

      toast.success("تم رفع المحتوى بنجاح");
      setUploadOpen(false);
      setNewItem({ title: "", description: "", type: "book", subject_id: "", file: null });
      fetchAll();
    } catch (e: any) {
      console.error("Upload failed:", e);
      toast.error(e?.message || "حدث خطأ أثناء الرفع");
    } finally {
      setUploading(false);
    }
  };

  /* ================== DELETE CONTENT ================== */
  const deleteContent = async (item: ContentItem) => {
    if (!confirm("هل أنت متأكد من حذف هذا المحتوى؟")) return;

    try {
      // Parse storage path from URL
      const url = new URL(item.file_url);
      const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
      
      if (pathMatch) {
        const [, bucket, path] = pathMatch;
        await supabase.storage.from(bucket).remove([decodeURIComponent(path)]);
      }

      await supabase.from("content").delete().eq("id", item.id);
      toast.success("تم حذف المحتوى");
      fetchAll();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("حدث خطأ أثناء الحذف");
    }
  };

  /* ================== TEACHER ACTIONS ================== */
  const handleTeacherAction = async (request: TeacherRequest, action: "approved" | "rejected") => {
    try {
      await supabase
        .from("teacher_requests")
        .update({ 
          status: action,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq("id", request.id);

      if (action === "approved") {
        // Insert teacher role
        await supabase.from("user_roles").insert({
          user_id: request.user_id,
          role: "teacher",
        });
        toast.success("تم قبول طلب المعلم");
      } else {
        toast.success("تم رفض طلب المعلم");
      }

      fetchAll();
    } catch (error) {
      console.error("Teacher action error:", error);
      toast.error("حدث خطأ");
    }
  };

  /* ================== STUDENT BAN ================== */
  const toggleStudentBan = async (student: Student) => {
    try {
      await supabase
        .from("profiles")
        .update({ is_banned: !student.is_banned })
        .eq("id", student.id);

      toast.success(student.is_banned ? "تم إلغاء الحظر" : "تم حظر الطالب");
      fetchAll();
    } catch (error) {
      toast.error("حدث خطأ");
    }
  };

  /* ================== NOTIFICATIONS ================== */
  const sendNotification = async () => {
    if (!notification.title.trim() || !notification.message.trim()) {
      toast.error("يرجى إدخال العنوان والرسالة");
      return;
    }

    setSendingNotification(true);
    try {
      if (notification.target === "all") {
        // Send to all students
        const { data: studentRoles } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "student");

        if (studentRoles && studentRoles.length > 0) {
          const notifications = studentRoles.map((role) => ({
            user_id: role.user_id,
            title: notification.title,
            message: notification.message,
            created_by: user?.id,
          }));

          await supabase.from("notifications").insert(notifications);
          toast.success(`تم إرسال الإشعار إلى ${studentRoles.length} طالب`);
        } else {
          toast.error("لا يوجد طلاب لإرسال الإشعار إليهم");
        }
      } else {
        // Send to specific student by code
        const { data: student } = await supabase
          .from("profiles")
          .select("id")
          .eq("student_code", notification.student_code)
          .single();

        if (student) {
          await supabase.from("notifications").insert({
            user_id: student.id,
            title: notification.title,
            message: notification.message,
            created_by: user?.id,
          });
          toast.success("تم إرسال الإشعار");
        } else {
          toast.error("لم يتم العثور على الطالب");
        }
      }

      setNotificationOpen(false);
      setNotification({ title: "", message: "", target: "all", student_code: "" });
    } catch (error) {
      console.error("Notification error:", error);
      toast.error("حدث خطأ في إرسال الإشعار");
    } finally {
      setSendingNotification(false);
    }
  };

  /* ================== SUPPORT REPLY ================== */
  const sendSupportReply = async () => {
    if (!replyMessage.trim() || !selectedConversation) return;

    try {
      await supabase.from("support_messages").insert({
        user_id: selectedConversation,
        message: replyMessage,
        is_from_admin: true,
      });

      // Mark messages as read
      await supabase
        .from("support_messages")
        .update({ is_read: true })
        .eq("user_id", selectedConversation)
        .eq("is_from_admin", false);

      toast.success("تم إرسال الرد");
      setReplyMessage("");
      fetchAll();
    } catch (error) {
      toast.error("حدث خطأ");
    }
  };

  /* ================== HELPERS ================== */
  const getSubjectName = (id: string) => subjects.find((s) => s.id === id)?.name || "-";

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "book": return "كتاب PDF";
      case "video": return "فيديو";
      case "exam": return "امتحان";
      default: return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "book": return <FileText className="h-4 w-4" />;
      case "video": return <Video className="h-4 w-4" />;
      case "exam": return <BookOpen className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student_code?.includes(searchQuery)
  );

  const groupedMessages = supportMessages.reduce((acc, msg) => {
    const key = msg.user_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(msg);
    return acc;
  }, {} as Record<string, SupportMessage[]>);

  /* ================== MENU ITEMS ================== */
  const menuItems = [
    { id: "overview", label: "نظرة عامة", icon: LayoutDashboard },
    { id: "students", label: "الطلاب", icon: GraduationCap, badge: stats.students },
    { id: "teachers", label: "طلبات المعلمين", icon: School, badge: stats.pendingTeachers },
    { id: "content", label: "المحتوى", icon: BookOpen },
    { id: "subjects", label: "المواد", icon: FileText },
    { id: "notifications", label: "الإشعارات", icon: Bell },
    { id: "support", label: "الدعم", icon: MessageSquare, badge: stats.messages },
    { id: "settings", label: "الإعدادات", icon: Settings },
  ];

  /* ================== SIDEBAR ================== */
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-azhari flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          {!sidebarCollapsed && (
            <div>
              <h1 className="font-bold text-lg text-foreground">أزهاريون</h1>
              <p className="text-xs text-muted-foreground">لوحة التحكم</p>
            </div>
          )}
        </div>
      </div>

      {/* Menu */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-3">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={view === item.id ? "secondary" : "ghost"}
              className={`w-full justify-start gap-3 h-11 ${
                view === item.id
                  ? "bg-primary/10 text-primary hover:bg-primary/15"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              onClick={() => {
                setView(item.id as View);
                setMobileOpen(false);
              }}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 text-right">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <Badge variant="destructive" className="h-5 min-w-5 text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Button>
          ))}
        </nav>
      </ScrollArea>

      {/* User & Logout */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={signOut}
        >
          <LogOut className="h-5 w-5" />
          {!sidebarCollapsed && <span>تسجيل الخروج</span>}
        </Button>
      </div>
    </div>
  );

  /* ================== STATS CARDS ================== */
  const statsCards = [
    { label: "إجمالي الطلاب", value: stats.students, icon: GraduationCap, color: "text-primary", bg: "bg-primary/10" },
    { label: "المعلمين", value: stats.teachers, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "طلبات معلقة", value: stats.pendingTeachers, icon: Clock, color: "text-orange-600", bg: "bg-orange-100" },
    { label: "المواد", value: stats.subjects, icon: BookOpen, color: "text-purple-600", bg: "bg-purple-100" },
    { label: "الفيديوهات", value: stats.videos, icon: Video, color: "text-red-600", bg: "bg-red-100" },
    { label: "الكتب", value: stats.books, icon: FileText, color: "text-green-600", bg: "bg-green-100" },
  ];

  return (
    <div className="min-h-screen flex bg-background" dir="rtl">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-card border-l border-border transition-all duration-300 ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="p-0 w-72">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <ChevronLeft className={`h-5 w-5 transition-transform ${sidebarCollapsed ? "rotate-180" : ""}`} />
            </Button>
            <h2 className="text-lg font-semibold text-foreground">
              {menuItems.find((m) => m.id === view)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={fetchAll}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-6 overflow-auto">
          {/* Overview */}
          {view === "overview" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {statsCards.map((stat, i) => (
                  <Card key={i} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">أحدث المحتوى</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {content.slice(0, 5).map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            {getTypeIcon(item.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{getSubjectName(item.subject_id)}</p>
                          </div>
                          <Badge variant="outline" className="shrink-0">
                            {getTypeLabel(item.type)}
                          </Badge>
                        </div>
                      ))}
                      {content.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">لا يوجد محتوى</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">طلبات المعلمين المعلقة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {teacherRequests.filter((r) => r.status === "pending").slice(0, 5).map((req) => (
                        <div key={req.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                            <Users className="h-4 w-4 text-orange-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{req.full_name}</p>
                            <p className="text-xs text-muted-foreground">{req.email}</p>
                          </div>
                          <Badge variant="secondary">معلق</Badge>
                        </div>
                      ))}
                      {teacherRequests.filter((r) => r.status === "pending").length === 0 && (
                        <p className="text-center text-muted-foreground py-4">لا توجد طلبات معلقة</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Students */}
          {view === "students" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <Input
                  placeholder="بحث بالاسم أو الإيميل أو الكود..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الاسم</TableHead>
                        <TableHead>البريد</TableHead>
                        <TableHead>الكود</TableHead>
                        <TableHead>المرحلة</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.full_name}</TableCell>
                          <TableCell className="text-muted-foreground">{student.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{student.student_code || "-"}</Badge>
                          </TableCell>
                          <TableCell>{student.stage || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={student.is_banned ? "destructive" : "default"}>
                              {student.is_banned ? "محظور" : "نشط"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant={student.is_banned ? "default" : "destructive"}
                              onClick={() => toggleStudentBan(student)}
                            >
                              {student.is_banned ? "إلغاء الحظر" : "حظر"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredStudents.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            لا يوجد طلاب
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Teachers */}
          {view === "teachers" && (
            <div className="space-y-4 animate-fade-in">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الاسم</TableHead>
                        <TableHead>البريد</TableHead>
                        <TableHead>الهاتف</TableHead>
                        <TableHead>المدرسة</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teacherRequests.map((req) => (
                        <TableRow key={req.id}>
                          <TableCell className="font-medium">{req.full_name}</TableCell>
                          <TableCell className="text-muted-foreground">{req.email}</TableCell>
                          <TableCell>{req.phone || "-"}</TableCell>
                          <TableCell>{req.school_name || "-"}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                req.status === "approved"
                                  ? "default"
                                  : req.status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {req.status === "approved" ? "مقبول" : req.status === "rejected" ? "مرفوض" : "معلق"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {req.status === "pending" && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleTeacherAction(req, "approved")}
                                >
                                  <Check className="h-4 w-4 ml-1" />
                                  قبول
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleTeacherAction(req, "rejected")}
                                >
                                  <X className="h-4 w-4 ml-1" />
                                  رفض
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {teacherRequests.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            لا توجد طلبات
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Content */}
          {view === "content" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center">
                <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      إضافة محتوى
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>رفع محتوى جديد</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>العنوان *</Label>
                        <Input
                          placeholder="أدخل عنوان المحتوى"
                          value={newItem.title}
                          onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>الوصف (اختياري)</Label>
                        <Textarea
                          placeholder="أدخل وصف المحتوى"
                          value={newItem.description}
                          onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>نوع المحتوى *</Label>
                        <Select
                          value={newItem.type}
                          onValueChange={(v: "book" | "video" | "exam") => setNewItem({ ...newItem, type: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر نوع المحتوى" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="book">كتاب PDF</SelectItem>
                            <SelectItem value="video">فيديو</SelectItem>
                            <SelectItem value="exam">امتحان</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>المادة *</Label>
                        <Select
                          value={newItem.subject_id}
                          onValueChange={(v) => setNewItem({ ...newItem, subject_id: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر المادة" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects.length > 0 ? (
                              subjects.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name} - {s.stage} - {s.grade}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="__no_subjects" disabled>
                                لا توجد مواد - يرجى إضافة مواد أولاً
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        {subjects.length === 0 && (
                          <Button
                            type="button"
                            variant="link"
                            className="h-auto p-0"
                            onClick={() => {
                              setUploadOpen(false);
                              navigate("/admin/subjects");
                            }}
                          >
                            إضافة مادة الآن
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>الملف *</Label>
                        <Input
                          type="file"
                          accept={
                            newItem.type === "video"
                              ? "video/*"
                              : ".pdf,.doc,.docx"
                          }
                          onChange={(e) => setNewItem({ ...newItem, file: e.target.files?.[0] || null })}
                          className="cursor-pointer"
                        />
                        {newItem.file && (
                          <p className="text-xs text-muted-foreground">
                            الملف المحدد: {newItem.file.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setUploadOpen(false)}>
                        إلغاء
                      </Button>
                      <Button
                        onClick={handleUpload}
                        disabled={uploading || !newItem.title || !newItem.subject_id || !newItem.file}
                        className="gap-2"
                      >
                        {uploading ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            جاري الرفع...
                          </>
                        ) : (
                          <>
                            <UploadCloud className="h-4 w-4" />
                            رفع
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>العنوان</TableHead>
                        <TableHead>النوع</TableHead>
                        <TableHead>المادة</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {content.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="gap-1">
                              {getTypeIcon(item.type)}
                              {getTypeLabel(item.type)}
                            </Badge>
                          </TableCell>
                          <TableCell>{getSubjectName(item.subject_id)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString("ar-EG")}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(item.file_url, "_blank")}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteContent(item)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {content.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            لا يوجد محتوى
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Subjects */}
          {view === "subjects" && (
            <div className="space-y-4 animate-fade-in">
              <Button onClick={() => navigate("/admin/subjects")} className="gap-2">
                <Settings className="h-4 w-4" />
                إدارة المواد
              </Button>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>اسم المادة</TableHead>
                        <TableHead>المرحلة</TableHead>
                        <TableHead>الصف</TableHead>
                        <TableHead>التصنيف</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjects.map((subject) => (
                        <TableRow key={subject.id}>
                          <TableCell className="font-medium">{subject.name}</TableCell>
                          <TableCell>{subject.stage}</TableCell>
                          <TableCell>{subject.grade}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{subject.category}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {subjects.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            لا توجد مواد
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Notifications */}
          {view === "notifications" && (
            <div className="space-y-4 animate-fade-in">
              <Dialog open={notificationOpen} onOpenChange={setNotificationOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Bell className="h-4 w-4" />
                    إرسال إشعار
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>إرسال إشعار</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>الهدف</Label>
                      <Select
                        value={notification.target}
                        onValueChange={(v: "all" | "specific") =>
                          setNotification({ ...notification, target: v })
                        }
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

                    {notification.target === "specific" && (
                      <div className="space-y-2">
                        <Label>كود الطالب</Label>
                        <Input
                          placeholder="أدخل كود الطالب (6 أرقام)"
                          value={notification.student_code}
                          onChange={(e) =>
                            setNotification({ ...notification, student_code: e.target.value })
                          }
                          maxLength={6}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>العنوان *</Label>
                      <Input
                        placeholder="عنوان الإشعار"
                        value={notification.title}
                        onChange={(e) => setNotification({ ...notification, title: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>الرسالة *</Label>
                      <Textarea
                        placeholder="نص الإشعار"
                        value={notification.message}
                        onChange={(e) => setNotification({ ...notification, message: e.target.value })}
                        rows={4}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setNotificationOpen(false)}>
                      إلغاء
                    </Button>
                    <Button onClick={sendNotification} disabled={sendingNotification} className="gap-2">
                      {sendingNotification ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          جاري الإرسال...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          إرسال
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Card>
                <CardHeader>
                  <CardTitle>كيفية استخدام الإشعارات</CardTitle>
                  <CardDescription>
                    يمكنك إرسال إشعارات لجميع الطلاب أو لطالب محدد باستخدام كود الطالب
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          )}

          {/* Support */}
          {view === "support" && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid md:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
                {/* Conversations List */}
                <Card className="md:col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">المحادثات</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                    <ScrollArea className="h-[calc(100vh-300px)]">
                      <div className="space-y-1">
                        {Object.entries(groupedMessages).map(([userId, messages]) => {
                          const firstMsg = messages[0];
                          const unreadCount = messages.filter((m) => !m.is_read && !m.is_from_admin).length;

                          return (
                            <Button
                              key={userId}
                              variant={selectedConversation === userId ? "secondary" : "ghost"}
                              className="w-full justify-start h-auto py-3 px-3"
                              onClick={() => setSelectedConversation(userId)}
                            >
                              <div className="flex-1 text-right">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium text-sm">
                                    {firstMsg.profile?.full_name || "مجهول"}
                                  </p>
                                  {unreadCount > 0 && (
                                    <Badge variant="destructive" className="h-5 min-w-5 text-xs">
                                      {unreadCount}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  {firstMsg.profile?.email}
                                </p>
                              </div>
                            </Button>
                          );
                        })}
                        {Object.keys(groupedMessages).length === 0 && (
                          <p className="text-center text-muted-foreground py-8 text-sm">
                            لا توجد محادثات
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Messages */}
                <Card className="md:col-span-2">
                  <CardHeader className="pb-2 border-b">
                    <CardTitle className="text-base">
                      {selectedConversation
                        ? groupedMessages[selectedConversation]?.[0]?.profile?.full_name || "المحادثة"
                        : "اختر محادثة"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 flex flex-col h-[calc(100vh-350px)]">
                    {selectedConversation ? (
                      <>
                        <ScrollArea className="flex-1 mb-4">
                          <div className="space-y-3">
                            {groupedMessages[selectedConversation]
                              ?.slice()
                              .reverse()
                              .map((msg) => (
                                <div
                                  key={msg.id}
                                  className={`p-3 rounded-lg max-w-[80%] ${
                                    msg.is_from_admin
                                      ? "bg-primary/10 mr-auto"
                                      : "bg-muted ml-auto"
                                  }`}
                                >
                                
