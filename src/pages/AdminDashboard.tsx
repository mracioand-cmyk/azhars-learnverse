import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/manualClient";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  GraduationCap,
  School,
  BookOpen,
  Bell,
  MessageSquare,
  Settings,
  Plus,
  UploadCloud,
  Trash2,
  Eye,
  Check,
  X,
  Menu,
  LogOut,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

/* ===================== TYPES ===================== */

type View =
  | "overview"
  | "students"
  | "teachers"
  | "content"
  | "notifications"
  | "support";

interface Subject {
  id: string;
  name: string;
  stage: string;
  grade: string;
}

interface ContentItem {
  id: string;
  title: string;
  type: "video" | "book";
  file_url: string;
  subject_id: string;
  created_at: string;
}

interface Student {
  id: string;
  full_name: string;
  email: string;
  student_code: string;
  stage: string;
  grade: string;
  is_banned: boolean;
}

interface TeacherRequest {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  school_name: string;
  status: "pending" | "approved" | "rejected";
}

interface SupportMessage {
  id: string;
  user_id: string;
  message: string;
  is_from_admin: boolean;
  is_read: boolean;
  created_at: string;
}

/* ===================== COMPONENT ===================== */

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [view, setView] = useState<View>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  /* ===================== DATA ===================== */

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teacherRequests, setTeacherRequests] = useState<TeacherRequest[]>([]);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);

  /* ===================== UPLOAD ===================== */

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    type: "video" as "video" | "book",
    stage: "",
    grade: "",
    subject_id: "",
    file: null as File | null,
  });

  /* ===================== NOTIFICATIONS ===================== */

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notification, setNotification] = useState({
    title: "",
    message: "",
  });

  /* ===================== SECURITY ===================== */

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

  /* ===================== FETCH ===================== */

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [
        { data: subjectsData },
        { data: contentData },
        { data: studentsData },
        { data: teachersData },
        { data: messagesData },
      ] = await Promise.all([
        supabase.from("subjects").select("*"),
        supabase.from("content").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*"),
        supabase.from("teacher_requests").select("*"),
        supabase.from("support_messages").select("*"),
      ]);

      setSubjects(subjectsData || []);
      setContent(contentData || []);
      setStudents(studentsData || []);
      setTeacherRequests(teachersData || []);
      setSupportMessages(messagesData || []);
    } catch (e) {
      toast.error("فشل تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };/* ===================== UPLOAD LOGIC ===================== */

  const handleUpload = async () => {
    if (!newItem.file || !newItem.title || !newItem.subject_id) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }

    setUploading(true);

    try {
      const bucket = newItem.type === "video" ? "videos" : "pdfs";
      const ext = newItem.file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()}.${ext}`;
      const path = `${newItem.subject_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, newItem.file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      const { error: insertError } = await supabase.from("content").insert({
        title: newItem.title,
        description: newItem.description,
        type: newItem.type,
        subject_id: newItem.subject_id,
        file_url: urlData.publicUrl,
      });

      if (insertError) throw insertError;

      toast.success("تم رفع المحتوى بنجاح");
      setUploadOpen(false);
      setNewItem({
        title: "",
        description: "",
        type: "video",
        stage: "",
        grade: "",
        subject_id: "",
        file: null,
      });

      fetchAll();
    } catch (err: any) {
      toast.error("فشل الرفع");
    } finally {
      setUploading(false);
    }
  };

  /* ===================== STUDENTS ===================== */

  const toggleBanStudent = async (student: Student) => {
    await supabase
      .from("profiles")
      .update({ is_banned: !student.is_banned })
      .eq("id", student.id);

    toast.success(student.is_banned ? "تم فك الحظر" : "تم حظر الطالب");
    fetchAll();
  };

  /* ===================== TEACHERS ===================== */

  const handleTeacher = async (
    req: TeacherRequest,
    action: "approved" | "rejected"
  ) => {
    await supabase
      .from("teacher_requests")
      .update({ status: action })
      .eq("id", req.id);

    if (action === "approved") {
      await supabase.from("user_roles").insert({
        user_id: req.user_id,
        role: "teacher",
      });
    }

    toast.success("تم تحديث الطلب");
    fetchAll();
  };

  /* ===================== NOTIFICATIONS ===================== */

  const sendNotification = async () => {
    if (!notification.title || !notification.message) {
      toast.error("يرجى إدخال العنوان والرسالة");
      return;
    }

    const { data: studentsRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "student");

    if (!studentsRoles?.length) return;

    await supabase.from("notifications").insert(
      studentsRoles.map((s) => ({
        user_id: s.user_id,
        title: notification.title,
        message: notification.message,
      }))
    );

    toast.success("تم إرسال الإشعارات");
    setNotification({ title: "", message: "" });
    setNotificationOpen(false);
  };

  /* ===================== SUPPORT ===================== */

  const groupedSupport = supportMessages.reduce<Record<string, SupportMessage[]>>(
    (acc, msg) => {
      if (!acc[msg.user_id]) acc[msg.user_id] = [];
      acc[msg.user_id].push(msg);
      return acc;
    },
    {}
  );

  /* ===================== HELPERS ===================== */

  const getSubjectName = (id: string) =>
    subjects.find((s) => s.id === id)?.name || "-";

  /* ===================== MENU ===================== */

  const menu = [
    { id: "overview", label: "نظرة عامة", icon: LayoutDashboard },
    { id: "students", label: "الطلاب", icon: GraduationCap },
    { id: "teachers", label: "المعلمين", icon: School },
    { id: "content", label: "المحتوى", icon: BookOpen },
    { id: "notifications", label: "الإشعارات", icon: Bell },
    { id: "support", label: "الدعم", icon: MessageSquare },
  ];return (
    <div className="min-h-screen flex bg-background" dir="rtl">
      {/* SIDEBAR */}
      <aside className="hidden md:flex w-64 border-l bg-card">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b font-bold text-lg">لوحة المطور</div>
          <div className="flex-1 p-2 space-y-1">
            {menu.map((m) => (
              <Button
                key={m.id}
                variant={view === m.id ? "secondary" : "ghost"}
                className="w-full justify-start gap-2"
                onClick={() => setView(m.id as View)}
              >
                <m.icon className="h-4 w-4" />
                {m.label}
              </Button>
            ))}
          </div>
          <Button
            variant="destructive"
            className="m-3"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4 ml-1" />
            خروج
          </Button>
        </div>
      </aside>

      {/* CONTENT */}
      <main className="flex-1 p-4 space-y-6 overflow-auto">
        {/* OVERVIEW */}
        {view === "overview" && (
          <div className="grid md:grid-cols-3 gap-4">
            <Card><CardContent>طلاب: {stats.students}</CardContent></Card>
            <Card><CardContent>معلمين: {stats.teachers}</CardContent></Card>
            <Card><CardContent>محتوى: {stats.videos + stats.books}</CardContent></Card>
          </div>
        )}

        {/* STUDENTS */}
        {view === "students" && (
          <Card>
            <CardHeader><CardTitle>الطلاب</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>الإيميل</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>إجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.full_name}</TableCell>
                      <TableCell>{s.email}</TableCell>
                      <TableCell>
                        {s.is_banned ? "محظور" : "نشط"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant={s.is_banned ? "default" : "destructive"}
                          onClick={() => toggleBanStudent(s)}
                        >
                          {s.is_banned ? "فك الحظر" : "حظر"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* TEACHERS */}
        {view === "teachers" && (
          <Card>
            <CardHeader><CardTitle>طلبات المعلمين</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>البريد</TableHead>
                    <TableHead>إجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teacherRequests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.full_name}</TableCell>
                      <TableCell>{r.email}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button size="sm" onClick={() => handleTeacher(r, "approved")}>
                          قبول
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleTeacher(r, "rejected")}>
                          رفض
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* CONTENT */}
        {view === "content" && (
          <>
            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 ml-1" />
                  رفع محتوى
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>رفع محتوى جديد</DialogTitle>
                </DialogHeader>

                <Input
                  placeholder="العنوان"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                />

                <Select
                  value={newItem.type}
                  onValueChange={(v) => setNewItem({ ...newItem, type: v as any })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">فيديو</SelectItem>
                    <SelectItem value="book">PDF</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={newItem.subject_id}
                  onValueChange={(v) => setNewItem({ ...newItem, subject_id: v })}
                >
                  <SelectTrigger><SelectValue placeholder="اختر المادة" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} – {s.stage} – {s.grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="file"
                  onChange={(e) =>
                    setNewItem({ ...newItem, file: e.target.files?.[0] || null })
                  }
                />

                <Button onClick={handleUpload} disabled={uploading}>
                  {uploading ? "جاري الرفع..." : "رفع"}
                </Button>
              </DialogContent>
            </Dialog>

            <Card>
              <CardHeader><CardTitle>المحتوى</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>العنوان</TableHead>
                      <TableHead>المادة</TableHead>
                      <TableHead>فتح</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {content.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>{c.title}</TableCell>
                        <TableCell>{getSubjectName(c.subject_id)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(c.file_url)}
                          >
                            عرض
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}

        {/* NOTIFICATIONS */}
        {view === "notifications" && (
          <Dialog open={notificationOpen} onOpenChange={setNotificationOpen}>
            <DialogTrigger asChild>
              <Button>إرسال إشعار</Button>
            </DialogTrigger>
            <DialogContent>
              <Input
                placeholder="العنوان"
                value={notification.title}
                onChange={(e) => setNotification({ ...notification, title: e.target.value })}
              />
              <Textarea
                placeholder="الرسالة"
                value={notification.message}
                onChange={(e) => setNotification({ ...notification, message: e.target.value })}
              />
              <Button onClick={sendNotification}>إرسال</Button>
            </DialogContent>
          </Dialog>
        )}

        {/* SUPPORT */}
        {view === "support" && (
          <Card>
            <CardHeader><CardTitle>الدعم</CardTitle></CardHeader>
            <CardContent>
              {Object.entries(groupedSupport).map(([uid, msgs]) => (
                <div key={uid} className="mb-4 border p-2 rounded">
                  <div className="font-bold">{msgs[0].profile?.full_name}</div>
                  {msgs.map((m) => (
                    <div key={m.id} className="text-sm">
                      {m.is_from_admin ? "🛠️" : "👤"} {m.message}
                    </div>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
