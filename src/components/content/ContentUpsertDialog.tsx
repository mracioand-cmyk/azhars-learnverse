import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";

export type ContentType = "video" | "pdf" | "summary" | "exam";

export type ContentItem = {
  id: string;
  title: string;
  type: string;
  file_url: string;
  description: string | null;
};

function getBucketName(type: ContentType) {
  switch (type) {
    case "video":
      return "videos";
    case "exam":
      return "exams";
    case "pdf":
    case "summary":
    default:
      return "books";
  }
}

function getAcceptedFileTypes(type: ContentType) {
  switch (type) {
    case "video":
      return "video/*";
    case "pdf":
    case "summary":
    case "exam":
    default:
      return ".pdf";
  }
}

export function extractStoragePathFromPublicUrl(fileUrl: string): { bucket: string; path: string } | null {
  // Example: .../storage/v1/object/public/<bucket>/<path>
  const marker = "/storage/v1/object/public/";
  const idx = fileUrl.indexOf(marker);
  if (idx === -1) return null;

  const after = fileUrl.slice(idx + marker.length);
  const [bucket, ...rest] = after.split("/");
  if (!bucket || rest.length === 0) return null;
  return { bucket, path: rest.join("/") };
}

type Props =
  | {
      mode: "create";
      open: boolean;
      onOpenChange: (open: boolean) => void;
      subjectId: string;
      type: ContentType;
      uploadedBy?: string;
      onSuccess?: () => void;
    }
  | {
      mode: "edit";
      open: boolean;
      onOpenChange: (open: boolean) => void;
      subjectId: string;
      item: ContentItem;
      onSuccess?: () => void;
    };

export default function ContentUpsertDialog(props: Props) {
  const { toast } = useToast();

  const isCreate = props.mode === "create";

  const initial = useMemo(() => {
    if (props.mode === "edit") {
      return {
        title: props.item.title,
        description: props.item.description ?? "",
      };
    }
    return { title: "", description: "" };
  }, [props]);

  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Reset when opening changes
  useEffect(() => {
    if (!props.open) return;
    setTitle(initial.title);
    setDescription(initial.description);
    setSelectedFile(null);
    setUploadProgress(0);
    setIsSaving(false);
  }, [props.open, initial.title, initial.description]);

  const accepted = isCreate ? getAcceptedFileTypes(props.type) : undefined;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    // 100MB max (match admin page)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "خطأ",
        description: "حجم الملف كبير جداً (الحد الأقصى 100 ميجا)",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({ title: "خطأ", description: "يرجى إدخال عنوان", variant: "destructive" });
      return;
    }

    setIsSaving(true);

    try {
      if (props.mode === "edit") {
        const { error } = await supabase
          .from("content")
          .update({ title: title.trim(), description: description.trim() || null })
          .eq("id", props.item.id);

        if (error) throw error;

        toast({ title: "تم", description: "تم تعديل المحتوى" });
        props.onOpenChange(false);
        props.onSuccess?.();
        return;
      }

      // Create mode
      if (!selectedFile) {
        toast({ title: "خطأ", description: "يرجى اختيار ملف", variant: "destructive" });
        return;
      }

      const bucket = getBucketName(props.type);
      const fileExt = selectedFile.name.split(".").pop() || "";
      const safeBase = selectedFile.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\-.]/g, "");
      const fileName = `${props.subjectId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeBase}`;
      const objectPath = fileExt ? (fileName.endsWith(`.${fileExt}`) ? fileName : `${fileName}`) : fileName;

      // Simple progress simulation (upload API doesn't expose progress in browser)
      const interval = window.setInterval(() => {
        setUploadProgress((p) => (p >= 90 ? 90 : p + 10));
      }, 200);

      const { error: uploadError } = await supabase.storage.from(bucket).upload(objectPath, selectedFile);
      window.clearInterval(interval);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(objectPath);

      const { error: insertError } = await supabase.from("content").insert({
        title: title.trim(),
        type: props.type,
        file_url: urlData.publicUrl,
        subject_id: props.subjectId,
        description: description.trim() || null,
        uploaded_by: props.uploadedBy ?? null,
      });

      if (insertError) throw insertError;

      setUploadProgress(100);
      toast({ title: "تم", description: "تم رفع المحتوى بنجاح" });
      props.onOpenChange(false);
      props.onSuccess?.();
    } catch (err: any) {
      console.error(err);
      toast({ title: "خطأ", description: "فشل حفظ المحتوى", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {props.mode === "create" ? "رفع محتوى جديد" : "تعديل المحتوى"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>العنوان</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: الدرس الأول" />
          </div>

          <div className="space-y-2">
            <Label>الوصف (اختياري)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اكتب وصفاً مختصراً..."
            />
          </div>

          {isCreate && (
            <div className="space-y-2">
              <Label>الملف</Label>
              <Input type="file" accept={accepted} onChange={handleFileChange} />
              {selectedFile && (
                <p className="text-xs text-muted-foreground">
                  {selectedFile.name} • {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              )}
            </div>
          )}

          {isCreate && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>جاري الرفع</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => props.onOpenChange(false)} disabled={isSaving}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving} className="gap-2">
            <Upload className="h-4 w-4" />
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
