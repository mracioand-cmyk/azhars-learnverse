import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Info,
  MessageSquare,
  FileText,
  Video,
  Download,
  Play,
  Bot,
  Send,
  Loader2,
  FileQuestion,
  Plus,
  Trash2,
  Edit,
  Eye,
  File,
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

const SubjectPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, role, signOut } = useAuth();
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

  // AI chat with Gemini
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Initialize welcome message when subject loads
  useEffect(() => {
    if (subject) {
      setChatMessages([
        { 
          role: "assistant", 
          content: `مرحباً! 👋 أنا مساعدك الذكي في مادة "${subject.name}".\n\nاسألني أي سؤال عن المادة وسأساعدك في الفهم والشرح! 📚✨` 
        },
      ]);
    }
  }, [subject]);

  const backTo = useMemo(() => {
    const stage = searchParams.get("stage");
    const grade = searchParams.get("grade");
    const section = searchParams.get("section");
    if (!stage || !grade) return "/subjects";
    return `/subjects?stage=${stage}&grade=${grade}${section ? `&section=${section}` : ""}`;
  }, [searchParams]);

  const videos = useMemo(() => content.filter((c) => c.type === "video"), [content]);
  const books = useMemo(() => content.filter((c) => c.type === "pdf"), [content]);
  const summaries = useMemo(() => content.filter((c) => c.type === "summary"), [content]);
  const exams = useMemo(() => content.filter((c) => c.type === "exam"), [content]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  useEffect(() => {
    if (!subjectId) return;

    const channel = supabase
      .channel(`subject-content-${subjectId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "content", filter: `subject_id=eq.${subjectId}` },
        () => {
          // Any change => refresh
          fetchAll();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (role !== "admin") return;
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

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage = chatInput.trim();
    const nextMessages = [...chatMessages, { role: "user" as const, content: userMessage }];

    setChatInput("");
    setChatMessages(nextMessages);
    setIsChatLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // function is public (verify_jwt=false) but we still pass publishable key for compatibility
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          // Keep recent context only
          messages: nextMessages.slice(-16),
          subjectName: subject?.name,
          stage: subject?.stage,
          grade: subject?.grade,
          section: subject?.section,
        }),
      });

      const raw = await response.text();
      const parsed = (() => {
        try {
          return JSON.parse(raw);
        } catch {
          return {} as any;
        }
      })();

      if (!response.ok) {
        const msg = parsed?.error || "فشل الاتصال بالمساعد الذكي";
        throw new Error(msg);
      }

      const aiText = parsed?.response as string | undefined;
      setChatMessages((prev) => [...prev, { role: "assistant", content: aiText || "عذراً، لم أتمكن من الرد." }]);
    } catch (error) {
      console.error("AI chat error:", error);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى. 🔄",
        },
      ]);
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل الاتصال بالمساعد",
        variant: "destructive",
      });
    } finally {
      setIsChatLoading(false);
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

  const isAdmin = role === "admin";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-azhari shadow-azhari">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-gradient-azhari">أزهاريون</span>
          </Link>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/about-platform">
                <Info className="h-5 w-5" />
              </Link>
            </Button>

            <Button variant="ghost" size="icon" asChild>
              <Link to="/support">
                <MessageSquare className="h-5 w-5" />
              </Link>
            </Button>

            {isAdmin && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                <span className="text-sm font-medium text-primary">وضع الرفع</span>
              </div>
            )}

            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>

            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate(backTo)}>
          <ChevronLeft className="h-5 w-5 rotate-180 ml-1" />
          رجوع للمواد
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{subject.name}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>

        <Tabs defaultValue="books" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
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
            <TabsTrigger value="resources" className="gap-2">
              <FileQuestion className="h-4 w-4" />
              <span className="hidden sm:inline">ملخصات وامتحانات</span>
              <span className="text-xs bg-muted px-1.5 rounded">{summaries.length + exams.length}</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">المساعد الذكي</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="books">
            <div className="space-y-4">
              {isAdmin && (
                <Button onClick={() => openUpload("pdf")} className="gap-2">
                  <Plus className="h-5 w-5" />
                  رفع كتاب PDF
                </Button>
              )}

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

                          {isAdmin && (
                            <>
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
                            </>
                          )}
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
              {isAdmin && (
                <Button onClick={() => openUpload("video")} className="gap-2">
                  <Plus className="h-5 w-5" />
                  رفع فيديو جديد
                </Button>
              )}

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

                          {isAdmin && (
                            <>
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
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="resources">
            <div className="space-y-8">
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">الملخصات</h2>
                  {isAdmin && (
                    <Button variant="outline" size="sm" onClick={() => openUpload("summary")} className="gap-2">
                      <Plus className="h-4 w-4" />
                      رفع ملخص
                    </Button>
                  )}
                </div>

                {summaries.length === 0 ? (
                  <Card className="p-6 text-center">
                    <FileQuestion className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">لا توجد ملخصات</p>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {summaries.map((s) => (
                      <Card key={s.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="p-3 rounded-lg bg-gold/10">
                              <FileQuestion className="h-6 w-6 text-gold" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-foreground truncate">{s.title}</h3>
                              {s.description && <p className="text-sm text-muted-foreground truncate">{s.description}</p>}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Button variant="outline" size="sm" asChild className="gap-2">
                              <a href={s.file_url} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4" />
                                تحميل
                              </a>
                            </Button>

                            {isAdmin && (
                              <>
                                <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleDelete(s)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">الامتحانات</h2>
                  {isAdmin && (
                    <Button variant="outline" size="sm" onClick={() => openUpload("exam")} className="gap-2">
                      <Plus className="h-4 w-4" />
                      رفع امتحان
                    </Button>
                  )}
                </div>

                {exams.length === 0 ? (
                  <Card className="p-6 text-center">
                    <File className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">لا توجد امتحانات</p>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {exams.map((ex) => (
                      <Card key={ex.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="p-3 rounded-lg bg-accent">
                              <File className="h-6 w-6 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-foreground truncate">{ex.title}</h3>
                              {ex.description && <p className="text-sm text-muted-foreground truncate">{ex.description}</p>}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Button variant="outline" size="sm" asChild className="gap-2">
                              <a href={ex.file_url} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4" />
                                تحميل
                              </a>
                            </Button>

                            {isAdmin && (
                              <>
                                <Button variant="ghost" size="icon" onClick={() => openEdit(ex)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleDelete(ex)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </TabsContent>

          <TabsContent value="ai">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  المساعد الذكي - {subject.name}
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((message, index) => (
                  <div key={index} className={`flex ${message.role === "user" ? "justify-start" : "justify-end"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl p-4 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-muted text-foreground rounded-tl-none"
                      }`}
                    >
                      <p className="whitespace-pre-line text-sm leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                ))}

                {isChatLoading && (
                  <div className="flex justify-end">
                    <div className="bg-muted rounded-2xl rounded-tl-none p-4">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  </div>
                )}
              </CardContent>

              <div className="border-t p-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="اكتب سؤالك هنا..."
                    className="flex-1"
                    disabled={isChatLoading}
                  />
                  <Button type="submit" disabled={isChatLoading || !chatInput.trim()}>
                    <Send className="h-5 w-5" />
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  مدعوم بـ Gemini AI - اسأل أي سؤال عن المادة 🤖
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {subjectId && isAdmin && (
        <ContentUpsertDialog
          mode="create"
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          subjectId={subjectId}
          type={uploadType}
          uploadedBy={user?.id}
          onSuccess={fetchAll}
        />
      )}

      {subjectId && isAdmin && editItem && (
        <ContentUpsertDialog
          mode="edit"
          open={editOpen}
          onOpenChange={setEditOpen}
          subjectId={subjectId}
          item={editItem}
          onSuccess={fetchAll}
        />
      )}
    </div>
  );
};

export default SubjectPage;

