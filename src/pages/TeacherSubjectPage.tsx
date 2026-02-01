// src/pages/TeacherSubjectPage.tsx

import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Upload, Video, FileText, BookOpen, ClipboardList } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type ContentItem = {
  id: string;
  title: string;
  type: string;
  created_at: string;
  file_url: string;
};

const TeacherSubjectPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const category = searchParams.get("category");
  const grade = searchParams.get("grade");
  const stage = searchParams.get("stage");

  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [subjectId, setSubjectId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !category || !grade || !stage) return;
    loadContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, category, grade, stage]);

  const loadContent = async () => {
    setLoading(true);

    // أولاً نجد الـ subject المناسب
    const { data: subjects, error: subjectError } = await supabase
      .from("subjects")
      .select("id")
      .eq("category", category)
      .eq("grade", grade)
      .eq("stage", stage)
      .limit(1);

    if (subjectError || !subjects || subjects.length === 0) {
      console.error("Error finding subject:", subjectError);
      setContent([]);
      setLoading(false);
      return;
    }

    const foundSubjectId = subjects[0].id;
    setSubjectId(foundSubjectId);

    // ثم نجلب المحتوى المرفوع من هذا المعلم لهذه المادة
    const { data, error } = await supabase
      .from("content")
      .select("id, title, type, created_at, file_url")
      .eq("subject_id", foundSubjectId)
      .eq("uploaded_by", user!.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading content:", error);
      setContent([]);
    } else {
      setContent(data || []);
    }

    setLoading(false);
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-5 w-5 text-blue-500" />;
      case "book":
        return <BookOpen className="h-5 w-5 text-green-500" />;
      case "exam":
        return <ClipboardList className="h-5 w-5 text-orange-500" />;
      default:
        return <FileText className="h-5 w-5 text-purple-500" />;
    }
  };

  const getContentTypeName = (type: string) => {
    switch (type) {
      case "video":
        return "فيديو";
      case "book":
        return "كتاب";
      case "exam":
        return "امتحان";
      case "summary":
        return "ملخص";
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">جاري تحميل المحتوى...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <Button variant="ghost" onClick={() => navigate("/teacher")} className="gap-2">
          <ArrowRight className="h-4 w-4" />
          رجوع
        </Button>

        <Button
          className="gap-2"
          onClick={() =>
            navigate(
              `/teacher/upload?category=${encodeURIComponent(category || "")}&grade=${encodeURIComponent(grade || "")}&stage=${stage}&subject_id=${subjectId || ""}`
            )
          }
        >
          <Upload className="h-4 w-4" />
          إضافة محتوى
        </Button>
      </div>

      {/* Info */}
      <Card className="mb-6">
        <CardContent className="p-5 space-y-1">
          <p className="font-semibold text-lg text-primary">{category}</p>
          <p className="text-sm text-muted-foreground">
            الصف: {grade}
          </p>
          <p className="text-sm text-muted-foreground">
            المرحلة: {stage === "secondary" ? "ثانوي" : "إعدادي"}
          </p>
        </CardContent>
      </Card>

      {/* Content List */}
      {content.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">لا يوجد محتوى مضاف حتى الآن.</p>
          <Button
            className="mt-4"
            onClick={() =>
              navigate(
                `/teacher/upload?category=${encodeURIComponent(category || "")}&grade=${encodeURIComponent(grade || "")}&stage=${stage}&subject_id=${subjectId || ""}`
              )
            }
          >
            <Upload className="h-4 w-4 mr-2" />
            أضف أول محتوى
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {content.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  {getContentIcon(item.type)}
                  <h3 className="font-semibold flex-1">{item.title}</h3>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{getContentTypeName(item.type)}</span>
                  <span>{new Date(item.created_at).toLocaleDateString("ar-EG")}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(item.file_url, "_blank")}
                  >
                    عرض
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherSubjectPage;
