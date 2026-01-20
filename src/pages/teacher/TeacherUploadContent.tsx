import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Edit,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Content {
  id: string;
  title: string;
  type: string;
  description: string | null;
  file_url: string;
  created_at: string;
}

const TeacherUploadContent = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const grade = searchParams.get("grade") || "";
  const section = searchParams.get("section") || null;
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [contents, setContents] = useState<Content[]>([]);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("");
  
  // Upload form state
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    type: "video",
    description: "",
    file: null as File | null,
  });

  useEffect(() => {
    if (user && grade) {
      loadTeacherData();
    }
  }, [user, grade, section]);

  const loadTeacherData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get teacher's assigned category
      const { data: teacherRequest, error: requestError } = await supabase
        .from("teacher_requests")
        .select("assigned_category")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .single();

      if (requestError) throw requestError;
      
      setCategory(teacherRequest.assigned_category || "");

      // Find or create subject for this grade/section/category
      let query = supabase
        .from("subjects")
        .select("id")
        .eq("grade", grade)
        .eq("category", teacherRequest.assigned_category);

      if (section) {
        query = query.eq("section", section);
      }

      const { data: subjects, error: subjectsError } = await query.limit(1);

      if (subjectsError) throw subjectsError;

      if (subjects && subjects.length > 0) {
        setSubjectId(subjects[0].id);
        await loadContents(subjects[0].id);
      }
    } catch (error) {
      console.error("Error loading teacher data:", error);
      toast({
        title: "خطأ في تحميل البيانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadContents = async (subjId: string) => {
    const { data, error } = await supabase
      .from("content")
      .select("*")
      .eq("subject_id", subjId)
      .eq("uploaded_by", user?.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading contents:", error);
      return;
    }

    setContents(data || []);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm(prev => ({ ...prev, file }));
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.title || !subjectId || !user) {
      toast({
        title: "يرجى ملء جميع الحقول",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Determine bucket based on type
      const bucket = uploadForm.type === "video" ? "videos" : 
                     uploadForm.type === "book" ? "books" : "exams";
      
      const fileExt = uploadForm.file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, uploadForm.file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      // Create content record
      const { error: contentError } = await supabase
        .from("content")
        .insert({
          subject_id: subjectId,
          title: uploadForm.title,
          type: uploadForm.type,
          description: uploadForm.description || null,
          file_url: urlData.publicUrl,
          uploaded_by: user.id,
        });

      if (contentError) throw contentError;

      toast({
        title: "تم رفع المحتوى بنجاح",
      });

      setShowUploadDialog(false);
      setUploadForm({ title: "", type: "video", description: "", file: null });
      await loadContents(subjectId);
    } catch (error) {
      console.error("Error uploading:", error);
      toast({
        title: "خطأ في رفع المحتوى",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (contentId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المحتوى؟")) return;

    try {
      const { error } = await supabase
        .from("content")
        .delete()
        .eq("id", contentId);

      if (error) throw error;

      toast({ title: "تم حذف المحتوى" });
      if (subjectId) {
        await loadContents(subjectId);
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast({
        title: "خطأ في حذف المحتوى",
        variant: "destructive",
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <FileVideo className="h-5 w-5 text-blue-500" />;
      case "book":
        return <Book className="h-5 w-5 text-green-500" />;
      default:
        return <FileText className="h-5 w-5 text-orange-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "video":
        return "فيديو";
      case "book":
        return "كتاب";
      case "summary":
        return "ملخص";
      case "exam":
        return "امتحان";
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/teacher")}>
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-bold text-lg">{grade}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{category}</span>
                {section && <Badge variant="secondary">{section}</Badge>}
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
        >
          <Plus className="h-5 w-5" />
          رفع محتوى جديد
        </Button>

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
              {contents.map((content) => (
                <Card key={content.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(content.type)}
                        <div>
                          <p className="font-medium">{content.title}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {getTypeLabel(content.type)}
                            </Badge>
                            <span>
                              {new Date(content.created_at).toLocaleDateString("ar-EG")}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(content.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {content.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {content.description}
                      </p>
                    )}
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
                onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>نوع المحتوى</Label>
              <Select
                value={uploadForm.type}
                onValueChange={(value) => setUploadForm(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">فيديو</SelectItem>
                  <SelectItem value="book">كتاب PDF</SelectItem>
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
                onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>الملف</Label>
              <Input
                type="file"
                accept={uploadForm.type === "video" ? "video/*" : ".pdf"}
                onChange={handleFileChange}
              />
              {uploadForm.file && (
                <p className="text-sm text-muted-foreground">
                  {uploadForm.file.name}
                </p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
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
