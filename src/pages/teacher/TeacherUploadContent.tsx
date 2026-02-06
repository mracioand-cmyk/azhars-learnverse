import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  Upload,
  FileVideo,
  FileText,
  Book,
  Loader2,
  Plus,
  Trash2,
  Eye,
  Lock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  gradeKeyFromArabicLabel,
  subjectFilterFromTeacherSelection,
  teacherSelectionLabel,
} from "@/lib/teacherSubjectUtils";

type ContentType = "video" | "pdf" | "summary" | "exam";

interface ContentRow {
  id: string;
  title: string;
  type: string;
  description: string | null;
  file_url: string;
  created_at: string;
}

type SubjectRow = {
  id: string;
  name: string;
  stage: string;
  grade: string;
  section: string | null;
  category: string;
};

type TeacherRequestRow = {
  assigned_category: string | null;
  assigned_grades: string[] | null;
  assigned_stages: string[] | null;
  status: string | null;
  created_at: string | null;
};

function extractStoragePathFromPublicUrl(url: string): { bucket: string; path: string } | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    // .../storage/v1/object/public/{bucket}/{path...}
    const publicIdx = parts.findIndex((p) => p === "public");
    if (publicIdx === -1) return null;
    const bucket = parts[publicIdx + 1];
    const path = parts.slice(publicIdx + 2).join("/");
    if (!bucket || !path) return null;
    return { bucket, path };
  } catch {
    return null;
  }
}

const TeacherUploadContent = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const subjectId = searchParams.get("subject_id") || "";
  const selection = searchParams.get("category") || ""; // for display + access check
  const gradeLabel = searchParams.get("grade") || ""; // for display only (arabic)
  const stageParam = searchParams.get("stage") || ""; // for display only

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [contents, setContents] = useState<ContentRow[]>([]);
  const [subject, setSubject] = useState<SubjectRow | null>(null);
  const [canManage, setCanManage] = useState(true);

  // Upload form state
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    type: "video" as ContentType,
    description: "",
    file: null as File | null,
  });

  const headerSubtitle = useMemo(() => {
    const parts: string[] = [];
    if (selection) parts.push(teacherSelectionLabel(selection));
    if (gradeLabel) parts.push(gradeLabel);
    if (stageParam) parts.push(stageParam === "secondary" ? "ثانوي" : stageParam === "preparatory" ? "إعدادي" : stageParam);
    return parts.filter(Boolean).join(" • ");
  }, [selection, gradeLabel, stageParam]);

  useEffect(() => {
    if (!user || !subjectId) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, subjectId]);

  const loadAll = async () => {
    if (!user || !subjectId) return;

    setLoading(true);
    try {
      const [{ data: subjectData, error: subjectError }, { data: reqData, error: reqError }] = await Promise.all([
        supabase
          .from("subjects")
          .select("id, name, stage, grade, section, category")
          .eq("id", subjectId)
          .maybeSingle(),
        supabase
          .from("teacher_requests")
          .select("assigned_category, assigned_grades, assigned_stages, status, created_at")
          .eq("user_id", user.id)
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (subjectError) throw subjectError;
      if (reqError) throw reqError;

      const subj = (subjectData as SubjectRow) || null;
      const req = (reqData as TeacherRequestRow) || null;

      setSubject(subj);

      // Access check (UI-level): ensure subject matches the approved request selection + grades.
      let allowed = true;
      if (!subj || !req || req.status !== "approved") {
        allowed = false;
      } else {
        const stageAllowed = req.assigned_stages?.[0];
        const gradeAllowedKeys = new Set(
          (req.assigned_grades || [])
            .map((g) => gradeKeyFromArabicLabel(g))
            .filter(Boolean) as Array<"first" | "second" | "third">
        );

        if (stageAllowed && subj.stage !== stageAllowed) allowed = false;
        if (gradeAllowedKeys.size > 0 && !gradeAllowedKeys.has(subj.grade as any)) allowed = false;

        const filter = subjectFilterFromTeacherSelection(req.assigned_category || "");
        if (!filter) {
          allowed = false;
        } else {
          if (subj.category !== filter.categoryKey) allowed = false;
          if (filter.subjectName && subj.name !== filter.subjectName) allowed = false;
        }
      }

      setCanManage(allowed);

      if (!allowed || !subj) {
        setContents([]);
        return;
      }

      await loadContents(subj.id);
    } catch (error) {
      console.error("Error loading teacher upload page:", error);
      toast({ title: "خطأ في تحميل البيانات", variant: "destructive" });
      setSubject(null);
      setContents([]);
      setCanManage(false);
    } finally {
      setLoading(false);
    }
  };

  const loadContents = async (subjId: string) => {
    const { data, error } = await supabase
      .from("content")
      .select("id, title, type, description, file_url, created_at")
      .eq("subject_id", subjId)
      .eq("uploaded_by", user?.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading contents:", error);
      return;
    }

    setContents((data as ContentRow[]) || []);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadForm((prev) => ({ ...prev, file }));
  };

  const bucketForType = (type: ContentType) => {
    if (type === "video") return "videos";
    if (type === "exam") return "exams";
    // pdf + summary => books
    return "books";
  };

  const handleUpload = async () => {
    if (!user || !subject?.id) return;
    if (!canManage) {
      toast({ title: "غير مسموح", description: "لا تملك صلاحية إدارة هذه المادة.", variant: "destructive" });
      return;
    }

    if (!uploadForm.file || !uploadForm.title.trim()) {
      toast({ title: "يرجى ملء جميع الحقول", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const bucket = bucketForType(uploadForm.type);
      const fileExt = uploadForm.file.name.split(".").pop();
      const safeExt = fileExt ? `.${fileExt}` : "";
      const fileName = `${user.id}/${Date.now()}${safeExt}`;

      const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, uploadForm.file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);

      const { error: contentError } = await supabase.from("content").insert({
        subject_id: subject.id,
        title: uploadForm.title.trim(),
        type: uploadForm.type,
        description: uploadForm.description?.trim() ? uploadForm.description.trim() : null,
        file_url: urlData.publicUrl,
        uploaded_by: user.id,
        is_active: true,
      });

      if (contentError) throw contentError;

      toast({ title: "تم رفع المحتوى بنجاح" });
      setShowUploadDialog(false);
      setUploadForm({ title: "", type: "video", description: "", file: null });
      await loadContents(subject.id);
    } catch (error) {
      console.error("Error uploading:", error);
      toast({ title: "خطأ في رفع المحتوى", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (row: ContentRow) => {
    if (!canManage) return;
    if (!confirm("هل أنت متأكد من حذف هذا المحتوى؟")) return;

    try {
      const parsed = extractStoragePathFromPublicUrl(row.file_url);
      if (parsed) {
        // best-effort removal
        await supabase.storage.from(parsed.bucket).remove([parsed.path]);
      }

      const { error } = await supabase
        .from("content")
        .update({ is_active: false })
        .eq("id", row.id)
        .eq("uploaded_by", user?.id);

      if (error) throw error;

      toast({ title: "تم حذف المحتوى" });
      if (subject?.id) await loadContents(subject.id);
    } catch (error) {
      console.error("Error deleting:", error);
      toast({ title: "خطأ في حذف المحتوى", variant: "destructive" });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <FileVideo className="h-5 w-5 text-primary" />;
      case "pdf":
        return <Book className="h-5 w-5 text-primary" />;
      default:
        return <FileText className="h-5 w-5 text-primary" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "video":
        return "فيديو";
      case "pdf":
        return "كتاب PDF";
      case "summary":
        return "ملخص";
      case "exam":
        return "امتحان";
      default:
        return type;
    }
  };

  if (!subjectId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-lg w-full">
          <CardContent className="p-6 text-center space-y-3">
            <p className="text-lg font-semibold">الرابط غير صحيح</p>
            <p className="text-muted-foreground">افتح صفحة المادة من لوحة المعلم ثم اختر الفرع.</p>
            <Button onClick={() => navigate("/teacher")}>الرجوع</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-lg w-full">
          <CardContent className="p-6 text-center space-y-3">
            <p className="text-lg font-semibold">المادة غير موجودة</p>
            <Button onClick={() => navigate("/teacher")}>الرجوع</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="font-bold text-lg truncate">{subject.name}</h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {headerSubtitle && <span>{headerSubtitle}</span>}
                {subject.section && <Badge variant="secondary">{subject.section}</Badge>}
                {!canManage && (
                  <Badge variant="destructive" className="gap-1">
                    <Lock className="h-3 w-3" />
                    غير مصرح
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Upload Button */}
        <Button
          onClick={() => setShowUploadDialog(true)}
          className="w-full gap-2"
          size="lg"
          disabled={!canManage}
        >
          <Plus className="h-5 w-5" />
          رفع محتوى جديد
        </Button>

        {!canManage && (
          <Card className="border-2 border-dashed">
            <CardContent className="p-6 text-center">
              <p className="font-semibold mb-2">لا تملك صلاحية إدارة هذه المادة</p>
              <p className="text-muted-foreground">ارجع للوحة المعلم واختر المادة/الصف الصحيحين.</p>
            </CardContent>
          </Card>
        )}

        {/* Contents List */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold">المحتوى المرفوع</h3>

          {contents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لم يتم رفع أي محتوى بعد</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {contents.map((row) => (
                <Card key={row.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {getTypeIcon(row.type)}
                        <div className="min-w-0">
                          <p className="font-medium truncate">{row.title}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {getTypeLabel(row.type)}
                            </Badge>
                            <span>{new Date(row.created_at).toLocaleDateString("ar-EG")}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(row.file_url, "_blank")}>
                          <Eye className="h-4 w-4" />
                          عرض
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(row)}
                          disabled={!canManage}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {row.description && <p className="text-sm text-muted-foreground mt-2">{row.description}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>رفع محتوى جديد</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>عنوان المحتوى</Label>
              <Input
                placeholder="أدخل عنوان المحتوى"
                value={uploadForm.title}
                onChange={(e) => setUploadForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>نوع المحتوى</Label>
              <Select
                value={uploadForm.type}
                onValueChange={(value) => setUploadForm((prev) => ({ ...prev, type: value as ContentType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">فيديو</SelectItem>
                  <SelectItem value="pdf">كتاب PDF</SelectItem>
                  <SelectItem value="summary">ملخص</SelectItem>
                  <SelectItem value="exam">امتحان</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>وصف (اختياري)</Label>
              <Textarea
                placeholder="أدخل وصفاً للمحتوى"
                value={uploadForm.description}
                onChange={(e) => setUploadForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>الملف</Label>
              <Input
                type="file"
                accept={uploadForm.type === "video" ? "video/*" : ".pdf"}
                onChange={handleFileChange}
              />
              {uploadForm.file && <p className="text-sm text-muted-foreground">{uploadForm.file.name}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpload} disabled={uploading || !canManage}>
              {uploading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              رفع
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherUploadContent;
