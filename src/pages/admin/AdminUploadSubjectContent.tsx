import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import ContentUpsertDialog, { ContentItem, ContentType, extractStoragePathFromPublicUrl } from "@/components/content/ContentUpsertDialog";
import {
  BookOpen,
  ChevronLeft,
  Settings,
  LogOut,
  User,
  Upload,
  FileText,
  Video,
  Download,
  Play,
  Loader2,
  FileQuestion,
  Plus,
  Trash2,
  Edit,
  Eye,
  Bot,
  Sparkles,
} from "lucide-react";

type SubjectRow = {
  id: string;
  name: string;
  stage: string;
  grade: string;
  section: string | null;
};

type ContentRow = {
  id: string;
  title: string;
  type: string;
  file_url: string;
  description: string | null;
  created_at: string | null;
};

function stageLabel(stage: string) {
  if (stage === "preparatory") return "المرحلة الإعدادية";
  if (stage === "secondary") return "المرحلة الثانوية";
  return "";
}

function gradeLabel(grade: string) {
  if (grade === "first") return "الصف الأول";
  if (grade === "second") return "الصف الثاني";
  if (grade === "third") return "الصف الثالث";
  return "";
}

function sectionLabel(section: string | null) {
  if (section === "scientific") return "علمي";
  if (section === "literary") return "أدبي";
  return "";
}

const AdminUploadSubjectContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut } = useAuth();
  const { subjectId } = useParams();
  const [searchParams] = useSearchParams();

  const [subject, setSubject] = useState<SubjectRow | null>(null);
  const [content, setContent] = useState<ContentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // dialogs
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadType, setUploadType] = useState<ContentType>("video");
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<ContentItem | null>(null);

  const backTo = useMemo(() => {
    const stage = searchParams.get("stage");
    const grade = searchParams.get("grade");
    const section = searchParams.get("section");
    const category = searchParams.get("category");
    if (!stage || !grade || !category) return "/admin/upload";
    return `/admin/upload/subjects?stage=${stage}&grade=${grade}${section ? `&section=${section}` : ""}&category=${category}`;
  }, [searchParams]);

  const videos = useMemo(() => content.filter((c) => c.type === "video"), [content]);
  const books = useMemo(() => content.filter((c) => c.type === "pdf"), [content]);
  const summaries = useMemo(() => content.filter((c) => c.type === "summary"), [content]);
  const exams = useMemo(() => content.filter((c) => c.type === "exam"), [content]);

  // AI Sources state
  const [aiSources, setAiSources] = useState<{ id: string; file_name: string; file_url: string; created_at: string | null }[]>([]);
  const [aiUploadLoading, setAiUploadLoading] = useState(false);

  const fetchAiSources = async () => {
    if (!subjectId) return;
    const { data, error } = await supabase
      .from("ai_sources")
      .select("id, file_name, file_url, created_at")
      .eq("subject_id", subjectId)
      .order("created_at", { ascending: false });
    if (!error && data) {
      setAiSources(data);
    }
  };

  useEffect(() => {
    fetchAiSources();
  }, [subjectId]);

  const handleAiSourceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !subjectId) return;

    if (file.type !== "application/pdf") {
      toast({ title: "خطأ", description: "يجب أن يكون الملف PDF", variant: "destructive" });
      return;
    }

    setAiUploadLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      const fileName = `${subjectId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("ai-sources").upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from("ai-sources").getPublicUrl(fileName);

      const { error: insertError } = await supabase.from("ai_sources").insert({
        subject_id: subjectId,
        file_name: file.name,
        file_url: publicUrlData.publicUrl,
        uploaded_by: userId,
      });
      if (insertError) throw insertError;

      toast({ title: "تم", description: "تم رفع الملف بنجاح للمساعد الذكي" });
      fetchAiSources();
    } catch (err) {
      console.error(err);
      toast({ title: "خطأ", description: "فشل رفع الملف", variant: "destructive" });
    } finally {
      setAiUploadLoading(false);
      e.target.value = "";
    }
  };

  const handleDeleteAiSource = async (source: { id: string; file_url: string }) => {
    if (!confirm("هل أنت متأكد من حذف هذا الملف؟")) return;

    try {
      // Extract path from URL
      const url = new URL(source.file_url);
      const pathParts = url.pathname.split("/storage/v1/object/public/ai-sources/");
      if (pathParts[1]) {
        await supabase.storage.from("ai-sources").remove([decodeURIComponent(pathParts[1])]);
      }

      const { error } = await supabase.from("ai_sources").delete().eq("id", source.id);
      if (error) throw error;

      toast({ title: "تم", description: "تم حذف الملف" });
      fetchAiSources();
    } catch (err) {
      console.error(err);
      toast({ title: "خطأ", description: "فشل حذف الملف", variant: "destructive" });
    }
  };

  const fetchAll = async () => {
    if (!subjectId) return;
    setIsLoading(true);
    try {
      const [{ data: subjectData, error: subjectError }, { data: contentData, error: contentError }] = await Promise.all([
        supabase.from("subjects").select("id, name, stage, grade, section").eq("id", subjectId).maybeSingle(),
        supabase
          .from("content")
          .select("id, title, type, file_url, description, created_at")
          .eq("subject_id", subjectId)
          .eq("is_active", true)
          .order("created_at", { ascending: false }),
      ]);

      if (subjectError) throw subjectError;
      if (contentError) throw contentError;

      setSubject((subjectData as SubjectRow) || null);
      setContent((contentData as ContentRow[]) || []);
    } catch (e) {
      console.error(e);
      toast({ title: "خطأ", description: "فشل تحميل محتوى المادة", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [subjectId]);

  useEffect(() => {
    if (!subjectId) return;

    const channel = supabase
      .channel(`admin-subject-content-${subjectId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "content", filter: `subject_id=eq.${subjectId}` },
        () => {
          fetchAll();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [subjectId]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const openUpload = (type: ContentType) => {
    setUploadType(type);
    setUploadOpen(true);
  };

  const openEdit = (item: ContentRow) => {
    setEditItem({
      id: item.id,
      title: item.title,
      type: item.type,
      file_url: item.file_url,
      description: item.description,
    });
    setEditOpen(true);
  };

  const handleDelete = async (item: ContentRow) => {
    if (!confirm("هل أنت متأكد من حذف هذا المحتوى؟")) return;

    try {
      const parsed = extractStoragePathFromPublicUrl(item.file_url);
      if (parsed) {
        await supabase.storage.from(parsed.bucket).remove([parsed.path]);
      }

      const { error } = await supabase.from("content").update({ is_active: false }).eq("id", item.id);
      if (error) throw error;

      toast({ title: "تم", description: "تم حذف المحتوى" });
      fetchAll();
    } catch (e) {
      console.error(e);
      toast({ title: "خطأ", description: "فشل حذف المحتوى", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <h2 className="text-lg font-semibold">المادة غير موجودة</h2>
            <p className="text-muted-foreground mt-2">تأكد من رابط المادة أو ارجع لقائمة المواد.</p>
            <Button className="mt-4" onClick={() => navigate(backTo)}>
              رجوع
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const subtitle = `${stageLabel(subject.stage)} - ${gradeLabel(subject.grade)}${subject.section ? ` - ${sectionLabel(subject.section)}` : ""}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/admin" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-azhari shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-gradient-azhari">أزهاريون - رفع المحتوى</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
              <Upload className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">وضع الرفع</span>
            </div>

            <Button variant="ghost" size="icon" className="hover:bg-accent">
              <Settings className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent">
              <User className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">أدمن</span>
            </div>

            <Button variant="ghost" size="icon" onClick={handleSignOut} className="hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8">
        <Button variant="ghost" className="mb-6 hover:bg-accent" onClick={() => navigate(backTo)}>
          <ChevronLeft className="h-5 w-5 rotate-180 ml-1" />
          رجوع للمواد
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{subject.name}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>

        <Tabs defaultValue="books" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="books" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">كتب المادة</span>
              <span className="text-xs bg-muted px-1.5 rounded">{books.length}</span>
            </TabsTrigger>
            <TabsTrigger value="lessons" className="gap-2">
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">شرح الدروس</span>
              <span className="text-xs bg-muted px-1.5 rounded">{videos.length}</span>
            </TabsTrigger>
            <TabsTrigger value="summaries" className="gap-2">
              <FileQuestion className="h-4 w-4" />
              <span className="hidden sm:inline">الملخصات</span>
              <span className="text-xs bg-muted px-1.5 rounded">{summaries.length}</span>
            </TabsTrigger>
            <TabsTrigger value="exams" className="gap-2">
              <FileQuestion className="h-4 w-4" />
              <span className="hidden sm:inline">الامتحانات</span>
              <span className="text-xs bg-muted px-1.5 rounded">{exams.length}</span>
            </TabsTrigger>
            <TabsTrigger value="ai-assistant" className="gap-2">
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">المساعد الذكي</span>
              <span className="text-xs bg-muted px-1.5 rounded">{aiSources.length}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="books">
            <div className="space-y-4">
              <Button onClick={() => openUpload("pdf")} className="gap-2">
                <Plus className="h-5 w-5" />
                رفع كتاب PDF
              </Button>

              {books.length === 0 ? (
                <Card className="p-8 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">لا توجد كتب</h3>
                  <p className="text-muted-foreground">لم يتم رفع كتب لهذه المادة بعد</p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {books.map((book) => (
                    <Card key={book.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="p-3 rounded-lg bg-accent">
                            <FileText className="h-6 w-6 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-foreground truncate">{book.title}</h3>
                            {book.description && <p className="text-sm text-muted-foreground truncate">{book.description}</p>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button variant="outline" size="sm" asChild className="gap-2">
                            <a href={book.file_url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                              تحميل
                            </a>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(book)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(book)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="lessons">
            <div className="space-y-4">
              <Button onClick={() => openUpload("video")} className="gap-2">
                <Plus className="h-5 w-5" />
                رفع فيديو جديد
              </Button>

              {videos.length === 0 ? (
                <Card className="p-8 text-center">
                  <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">لا توجد فيديوهات</h3>
                  <p className="text-muted-foreground">لم يتم رفع فيديوهات لهذه المادة بعد</p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {videos.map((video, index) => (
                    <Card key={video.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="p-3 rounded-lg bg-primary text-primary-foreground">
                            <Play className="h-6 w-6" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-foreground truncate">{video.title}</h3>
                            <p className="text-sm text-muted-foreground truncate">
                              الدرس {index + 1} {video.description ? `• ${video.description}` : ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button variant="outline" size="sm" asChild className="gap-2">
                            <a href={video.file_url} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-4 w-4" />
                              مشاهدة
                            </a>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(video)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(video)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="summaries">
            <div className="space-y-4">
              <Button onClick={() => openUpload("summary")} className="gap-2">
                <Plus className="h-5 w-5" />
                رفع ملخص جديد
              </Button>

              {summaries.length === 0 ? (
                <Card className="p-8 text-center">
                  <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">لا توجد ملخصات</h3>
                  <p className="text-muted-foreground">لم يتم رفع ملخصات لهذه المادة بعد</p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {summaries.map((summary) => (
                    <Card key={summary.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="p-3 rounded-lg bg-accent">
                            <FileText className="h-6 w-6 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-foreground truncate">{summary.title}</h3>
                            {summary.description && <p className="text-sm text-muted-foreground truncate">{summary.description}</p>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button variant="outline" size="sm" asChild className="gap-2">
                            <a href={summary.file_url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                              تحميل
                            </a>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(summary)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(summary)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="exams">
            <div className="space-y-4">
              <Button onClick={() => openUpload("exam")} className="gap-2">
                <Plus className="h-5 w-5" />
                رفع امتحان جديد
              </Button>

              {exams.length === 0 ? (
                <Card className="p-8 text-center">
                  <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">لا توجد امتحانات</h3>
                  <p className="text-muted-foreground">لم يتم رفع امتحانات لهذه المادة بعد</p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {exams.map((exam) => (
                    <Card key={exam.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="p-3 rounded-lg bg-accent">
                            <FileQuestion className="h-6 w-6 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-foreground truncate">{exam.title}</h3>
                            {exam.description && <p className="text-sm text-muted-foreground truncate">{exam.description}</p>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button variant="outline" size="sm" asChild className="gap-2">
                            <a href={exam.file_url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                              تحميل
                            </a>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(exam)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(exam)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="ai-assistant">
            <div className="space-y-6">
              {/* Description Card */}
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/10">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-foreground">المساعد الذكي للمادة</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        المساعد الذكي يستخدم الكتب والملفات التي ترفعها هنا لمساعدة الطلاب في فهم المادة. 
                        يمكنه الإجابة على أسئلة الطلاب، شرح المفاهيم الصعبة، وتلخيص الدروس بناءً على محتوى الكتب المرفوعة.
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1 mt-3">
                        <li className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                          يجيب على أسئلة الطلاب من محتوى الكتب
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                          يشرح المفاهيم الصعبة بطريقة مبسطة
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                          يساعد في حل التمارين والمسائل
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                          يلخص الدروس ويستخرج النقاط المهمة
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Upload Button */}
              <div className="flex items-center gap-4">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleAiSourceUpload}
                    disabled={aiUploadLoading}
                  />
                  <Button asChild disabled={aiUploadLoading} className="gap-2">
                    <span>
                      {aiUploadLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Plus className="h-5 w-5" />
                      )}
                      رفع كتاب PDF للمساعد الذكي
                    </span>
                  </Button>
                </label>
              </div>

              {/* Sources List */}
              {aiSources.length === 0 ? (
                <Card className="p-8 text-center">
                  <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">لا توجد ملفات للمساعد الذكي</h3>
                  <p className="text-muted-foreground">ارفع كتب PDF ليتمكن المساعد الذكي من مساعدة الطلاب</p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {aiSources.map((source) => (
                    <Card key={source.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="p-3 rounded-lg bg-primary/10">
                            <FileText className="h-6 w-6 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-foreground truncate">{source.file_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {source.created_at ? new Date(source.created_at).toLocaleDateString("ar-SA") : ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button variant="outline" size="sm" asChild className="gap-2">
                            <a href={source.file_url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                              تحميل
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteAiSource(source)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Upload Dialog */}
      <ContentUpsertDialog
        mode="create"
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        subjectId={subjectId!}
        type={uploadType}
        onSuccess={fetchAll}
      />

      {/* Edit Dialog */}
      {editItem && (
        <ContentUpsertDialog
          mode="edit"
          open={editOpen}
          onOpenChange={setEditOpen}
          subjectId={subjectId!}
          item={editItem}
          onSuccess={fetchAll}
        />
      )}
    </div>
  );
};

export default AdminUploadSubjectContent;
