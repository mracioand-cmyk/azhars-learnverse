import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type View = "overview" | "content" | "teachers" | "support";

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const [view, setView] = useState<View>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);

  const [stats, setStats] = useState({ students: 0, teachers: 0, content: 0 });
  const [subjects, setSubjects] = useState<any[]>([]);
  const [content, setContent] = useState<any[]>([]);
  const [teacherRequests, setTeacherRequests] = useState<any[]>([]);
  const [supportMessages, setSupportMessages] = useState<any[]>([]);

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
    if (!user) return;

    const checkAdmin = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (data?.role !== "admin") {
        toast.error("غير مصرح لك بالدخول");
        window.location.href = "/";
      }
    };

    checkAdmin();
  }, [user]);

  /* ================== FETCH ================== */
  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [{ count: students }, { count: teachers }, { count: contents }] =
      await Promise.all([
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
      ]);

    setStats({
      students: students || 0,
      teachers: teachers || 0,
      content: contents || 0,
    });

    const { data: subs } = await supabase.from("subjects").select("*");
    setSubjects(subs || []);

    const { data: cont } = await supabase.from("content").select("*").order("created_at", { ascending: false });
    setContent(cont || []);

    const { data: reqs } = await supabase.from("teacher_requests").select("*").eq("status", "pending");
    setTeacherRequests(reqs || []);

    const { data: support } = await supabase
      .from("support_messages")
      .select("*, profiles(full_name, email)")
      .order("created_at", { ascending: false });
    setSupportMessages(support || []);
  };

  /* ================== UPLOAD ================== */
  const handleUpload = async () => {
    if (!newItem.file || !newItem.title || !newItem.subject_id) {
      toast.error("أكمل البيانات");
      return;
    }

    setUploading(true);
    try {
      const bucket = newItem.type === "book" ? "pdfs" : "videos";
      const ext = newItem.file.name.split(".").pop();
      const path = `${user!.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

      await supabase.storage.from(bucket).upload(path, newItem.file);

      const { data: url } = supabase.storage.from(bucket).getPublicUrl(path);

      await supabase.from("content").insert({
        title: newItem.title,
        type: newItem.type,
        url: url.publicUrl,
        storage_bucket: bucket,
        storage_path: path,
        subject_id: newItem.subject_id,
        created_by: user!.id,
        is_published: true,
      });

      toast.success("تم رفع المحتوى");
      setUploadOpen(false);
      setNewItem({ title: "", type: "book", subject_id: "", file: null });
      fetchAll();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  /* ================== DELETE ================== */
  const deleteContent = async (item: any) => {
    if (!confirm("حذف المحتوى؟")) return;

    await supabase.storage
      .from(item.storage_bucket)
      .remove([item.storage_path]);

    await supabase.from("content").delete().eq("id", item.id);
    toast.success("تم الحذف");
    fetchAll();
  };

  /* ================== APPROVE TEACHER ================== */
  const approveTeacher = async (req: any) => {
    await supabase
      .from("teacher_requests")
      .update({ status: "approved" })
      .eq("id", req.id);

    await supabase
      .from("user_roles")
      .update({ role: "teacher" })
      .eq("user_id", req.user_id);

    toast.success("تم قبول المعلم");
    fetchAll();
  };

  /* ================== LAYOUT ================== */
  const Sidebar = () => (
    <div className="h-full flex flex-col p-4 gap-2 bg-card">
      <Button variant="ghost" onClick={() => setView("overview")}>
        <LayoutDashboard /> نظرة عامة
      </Button>
      <Button variant="ghost" onClick={() => setView("content")}>
        <BookOpen /> المحتوى
      </Button>
      <Button variant="ghost" onClick={() => setView("teachers")}>
        <Users /> طلبات المعلمين
      </Button>
      <Button variant="ghost" onClick={() => setView("support")}>
        <MessageSquare /> الدعم
      </Button>
      <Button variant="destructive" onClick={signOut}>
        <LogOut /> خروج
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background" dir="rtl">
      <aside className="hidden md:block w-64 border-l">
        <Sidebar />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" className="md:hidden fixed top-4 right-4">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="right">
          <Sidebar />
        </SheetContent>
      </Sheet>

      <main className="flex-1 p-6 space-y-6">
        {view === "overview" && (
          <div className="grid grid-cols-3 gap-4">
            <Card><CardContent>طلاب: {stats.students}</CardContent></Card>
            <Card><CardContent>معلمين: {stats.teachers}</CardContent></Card>
            <Card><CardContent>محتوى: {stats.content}</CardContent></Card>
          </div>
        )}

        {view === "content" && (
          <>
            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogTrigger asChild>
                <Button><Plus /> إضافة محتوى</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>رفع محتوى</DialogTitle></DialogHeader>
                <Input placeholder="العنوان" value={newItem.title}
                  onChange={e => setNewItem({ ...newItem, title: e.target.value })} />
                <Select value={newItem.type} onValueChange={v => setNewItem({ ...newItem, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="book">PDF</SelectItem>
                    <SelectItem value="video">فيديو</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={newItem.subject_id} onValueChange={v => setNewItem({ ...newItem, subject_id: v })}>
                  <SelectTrigger><SelectValue placeholder="المادة" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="file" onChange={e => setNewItem({ ...newItem, file: e.target.files?.[0] || null })} />
                <Button onClick={handleUpload} disabled={uploading}>
                  <UploadCloud /> نشر
                </Button>
              </DialogContent>
            </Dialog>

            {content.map(c => (
              <Card key={c.id}>
                <CardContent className="flex justify-between">
                  <span>{c.title}</span>
                  <Button variant="destructive" onClick={() => deleteContent(c)}>
                    <Trash2 />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </>
        )}

        {view === "teachers" && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>الإجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teacherRequests.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{r.full_name}</TableCell>
                  <TableCell>
                    <Button onClick={() => approveTeacher(r)}>
                      <Check /> قبول
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {view === "support" && (
          <>
            {supportMessages.map(m => (
              <Card key={m.id}>
                <CardHeader>
                  <CardTitle>{m.profiles?.full_name}</CardTitle>
                </CardHeader>
                <CardContent>{m.message}</CardContent>
              </Card>
            ))}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
