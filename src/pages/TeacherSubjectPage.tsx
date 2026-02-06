// src/pages/TeacherSubjectPage.tsx

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Upload, BookOpen } from "lucide-react";
import {
  gradeKeyFromArabicLabel,
  subjectFilterFromTeacherSelection,
  teacherSelectionLabel,
} from "@/lib/teacherSubjectUtils";

type SubjectRow = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  stage: string;
  grade: string;
  section: string | null;
};

type ContentCountRow = {
  subject_id: string | null;
  id: string;
};

function stageLabel(stage: string) {
  if (stage === "preparatory") return "إعدادي";
  if (stage === "secondary") return "ثانوي";
  return stage;
}

function sectionLabel(section: string | null) {
  if (section === "scientific") return "علمي";
  if (section === "literary") return "أدبي";
  return "";
}

const TeacherSubjectPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // NOTE: TeacherDashboard navigates with ?category=<selection>&grade=<arabic grade label>&stage=<stage key>
  const selection = params.get("category") || "";
  const gradeLabel = params.get("grade") || "";
  const stage = params.get("stage") || "";

  const [isLoading, setIsLoading] = useState(true);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [contentCountBySubjectId, setContentCountBySubjectId] = useState<Record<string, number>>({});

  const headerTitle = useMemo(() => teacherSelectionLabel(selection), [selection]);

  useEffect(() => {
    if (!user || !selection || !gradeLabel || !stage) return;

    const run = async () => {
      setIsLoading(true);
      try {
        const gradeKey = gradeKeyFromArabicLabel(gradeLabel);
        const filter = subjectFilterFromTeacherSelection(selection);

        if (!gradeKey || !filter) {
          setSubjects([]);
          setContentCountBySubjectId({});
          return;
        }

        let q = supabase
          .from("subjects")
          .select("id, name, description, category, stage, grade, section")
          .eq("is_active", true)
          .eq("stage", stage)
          .eq("grade", gradeKey)
          .eq("category", filter.categoryKey);

        // If teacher picked a single subject like "فيزياء" => filter to that specific subject row.
        if (filter.subjectName) {
          q = q.eq("name", filter.subjectName);
        }

        const { data: subjectsData, error: subjectsError } = await q.order("name", { ascending: true });
        if (subjectsError) throw subjectsError;

        const list = (subjectsData as SubjectRow[]) || [];
        setSubjects(list);

        // load content counts (only this teacher's uploads)
        if (list.length === 0) {
          setContentCountBySubjectId({});
          return;
        }

        const subjectIds = list.map((s) => s.id);
        const { data: contentData, error: contentError } = await supabase
          .from("content")
          .select("id, subject_id")
          .eq("is_active", true)
          .eq("uploaded_by", user.id)
          .in("subject_id", subjectIds);

        if (contentError) throw contentError;

        const counts: Record<string, number> = {};
        (contentData as ContentCountRow[] | null | undefined)?.forEach((c) => {
          if (!c.subject_id) return;
          counts[c.subject_id] = (counts[c.subject_id] || 0) + 1;
        });
        setContentCountBySubjectId(counts);
      } catch (e) {
        console.error("Error loading teacher subjects:", e);
        setSubjects([]);
        setContentCountBySubjectId({});
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, [user, selection, gradeLabel, stage]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">جاري تحميل المواد...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-azhari shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-gradient-azhari">أزهاريون</span>
          </Link>

          <Button variant="ghost" onClick={() => navigate("/teacher")} className="gap-2 hover:bg-accent">
            <ArrowRight className="h-4 w-4" />
            رجوع
          </Button>
        </div>
      </header>

      <main className="container px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{headerTitle || "مواد المعلم"}</h1>
          <p className="text-muted-foreground">
            الصف: {gradeLabel} • المرحلة: {stageLabel(stage)}
          </p>
        </div>

        {subjects.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="p-10 text-center">
              <p className="text-lg font-semibold mb-2">لا توجد مواد مطابقة لتعيينك</p>
              <p className="text-muted-foreground mb-6">
                هذا يحدث غالباً لأن اختيار المادة/الصف في طلب المعلم لا يطابق هيكل المواد داخل المنصة.
              </p>
              <Button onClick={() => navigate("/teacher")}>
                الرجوع للوحة المعلم
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {subjects.map((s) => {
              const count = contentCountBySubjectId[s.id] || 0;
              const sec = sectionLabel(s.section);

              return (
                <Card
                  key={s.id}
                  className="cursor-pointer border-2 border-transparent hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 group bg-card/50 backdrop-blur overflow-hidden hover:-translate-y-1"
                  onClick={() =>
                    navigate(
                      `/teacher/upload?subject_id=${encodeURIComponent(s.id)}&category=${encodeURIComponent(selection)}&grade=${encodeURIComponent(
                        gradeLabel
                      )}&stage=${encodeURIComponent(stage)}&subject_name=${encodeURIComponent(s.name)}`
                    )
                  }
                >
                  <CardContent className="p-6 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="flex items-start justify-between gap-3 relative">
                      <div className="min-w-0">
                        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors truncate">
                          {s.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {sec ? `الشعبة: ${sec} • ` : ""}محتواك: {count}
                        </p>
                      </div>

                      <div className="shrink-0">
                        <div className="p-2 rounded-lg bg-primary/10 border border-primary/15">
                          <Upload className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                    </div>

                    {s.description && (
                      <p className="text-sm text-muted-foreground mt-3 line-clamp-2 relative">{s.description}</p>
                    )}

                    <div className="mt-5">
                      <Button className="w-full gap-2" size="sm">
                        <Upload className="h-4 w-4" />
                        إدارة ورفع المحتوى
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherSubjectPage;
