import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/manualClient";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Video,
  FileText,
  Bell,
  MessageSquare,
  Settings,
  LogOut,
  Plus,
  UploadCloud,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type View =
  | "overview"
  | "students"
  | "content"
  | "notifications"
  | "support";

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  /* ================== STATE ================== */
  const [view, setView] = useState<View>("overview");
  const [loading, setLoading] = useState(true);

  // 🔴 المشكلة كانت هنا — دلوقتي stats متعرفة صح
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    content: 0,
    messages: 0,
  });

  const [students, setStudents] = useState<any[]>([]);
  const [content, setContent] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newItem, setNewItem] = useState({
    title: "",
    type: "book",
    subject_id: "",
    file: null as File | null,
  });

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
  }, [user]);

  /* ================== LOAD DATA ================== */
  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [
        { count: studentsCount },
        { count: teachersCount },
        { count: contentCount },
        { count: messagesCount },
      ] = await Promise.all([
        supabase
          .from("user_roles")
          .select("*", { count: "exact", head: true })
          .eq("role", "student"),
        supabase
          .from("user_roles")
          .select("*", { count: "exact", head: true })
          .eq("role", "teacher"),
        supabase
          .from("content")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("support_messages")
          .select("*", { count: "exact", head: true })
          .eq("is_read", false),
      ]);

      setStats({
        students: studentsCount || 0,
        teachers: teachersCount || 0,
        content: contentCount || 0,
        messages: messagesCount || 0,
      });

      const [{ data: studentsData }, { data: contentData }, { data: subjectsData }] =
        await Promise.all([
          supabase.from("profiles").select("*"),
          supabase.from("content").select("*").order("created_at", { ascending: false }),
          supabase.from("subjects").select("*"),
        ]);

      setStudents(studentsData || []);
      setContent(contentData || []);
      setSubjects(subjectsData || []);
    } catch (e) {
      toast.error("خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  /* ================== UPLOAD ================== */
  const handleUpload = async () => {
    if (!newItem.file || !newItem.title || !newItem.subject_id) {
      toast.error("أكمل كل البيانات");
      return;
    }

    setUploading(true);
    try {
      const bucket = newItem.type === "video" ? "videos" : "books";
      const ext = newItem.file.name.split(".").pop();
      const fileName = `${Date.now()}.${ext}`;
      const path = `${user?.id}/${fileName}`;

      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, newItem.file);

      if (error) throw error;

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);

      await supabase.from("content").insert({
        title: newItem.title,
        type: newItem.type,
        subject_id: newItem.subject_id,
        file_url: data.publicUrl,
        uploaded_by: user?.id,
        is_active: true,
      });

      toast.success("تم الرفع بنجاح");
      setUploadOpen(false);
      setNewItem({ title: "", type: "book", subject_id: "", file: null });
      loadAll();
    } catch (e: any) {
      toast.error("فشل الرفع");
    } finally {
      setUploading(false);
    }
  };

  /* ================== UI ================== */
  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">لوحة الأدمن</h1>
        <Button variant="destructive" onClick={signOut}>
          <LogOut className="h-4 w-4 ml-2" /> خروج
        </Button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Stat title="الطلاب" value={stats.students} icon={<Users />} />
        <Stat title="المعلمين" value={stats.teachers} icon={<Users />} />
        <Stat title="المحتوى" value={stats.content} icon={<BookOpen />} />
        <Stat title="رسائل الدعم" value={stats.messages} icon={<MessageSquare />} />
      </div>

      {/* CONTENT */}
      <Card>
        <CardHeader className="flex flex-row justify-between">
          <CardTitle>المحتوى</CardTitle>
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-1" /> رفع محتوى
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>رفع محتوى</DialogTitle>
              </DialogHeader>

              <Input
                placeholder="العنوان"
                value={newItem.title}
                onChange={(e) =>
                  setNewItem({ ...newItem, title: e.target.value })
                }
              />

              <Select
                value={newItem.type}
                onValueChange={(v) =>
                  setNewItem({ ...newItem, type: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="book">كتاب PDF</SelectItem>
                  <SelectItem value="video">فيديو</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={newItem.subject_id}
                onValueChange={(v) =>
                  setNewItem({ ...newItem, subject_id: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المادة" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} - {s.grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="file"
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    file: e.target.files?.[0] || null,
                  })
                }
              />

              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? "جاري الرفع..." : "رفع"}
              </Button>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العنوان</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>الإجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {content.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.title}</TableCell>
                  <TableCell>{c.type}</TableCell>
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
    </div>
  );
}

/* ===== COMPONENT ===== */
function Stat({ title, value, icon }: any) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        {icon}
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
  }
