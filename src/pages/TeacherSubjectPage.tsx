// src/pages/TeacherSubjectPage.tsx

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/manualClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Upload } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type ContentItem = {
  id: string;
  title: string;
  type: "video" | "book" | "exam" | "summary";
  created_at: string;
};

const TeacherSubjectPage = () => {
  const { subjectId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const grade = searchParams.get("grade");
  const stage = searchParams.get("stage");

  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<ContentItem[]>([]);

  useEffect(() => {
    if (!user || !subjectId || !grade || !stage) return;
    loadContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, subjectId, grade, stage]);

  const loadContent = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("subject_content")
      .select("*")
      .eq("subject_id", subjectId)
      .eq("grade", grade)
      .eq("stage", stage)
      .eq("teacher_id", user!.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading content:", error);
      setContent([]);
    } else {
      setContent(data || []);
    }

    setLoading(false);
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
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowRight className="h-4 w-4" />
          رجوع
        </Button>

        <Button
          className="gap-2"
          onClick={() =>
            navigate(
              `/teacher/upload?subject=${subjectId}&grade=${grade}&stage=${stage}`
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
          <p className="font-semibold">
            الصف: <span className="text-primary">{grade}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            المرحلة: {stage === "secondary" ? "ثانوي" : "إعدادي"}
          </p>
        </CardContent>
      </Card>

      {/* Content List */}
      {content.length === 0 ? (
        <div className="text-center text-muted-foreground mt-20">
          لا يوجد محتوى مضاف حتى الآن.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {content.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition">
              <CardContent className="p-4 space-y-2">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">
                  النوع:{" "}
                  {item.type === "video"
                    ? "فيديو"
                    : item.type === "book"
                    ? "كتاب"
                    : item.type === "exam"
                    ? "امتحان"
                    : "ملخص"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString("ar-EG")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherSubjectPage;