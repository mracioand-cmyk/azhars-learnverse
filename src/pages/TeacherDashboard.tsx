// src/pages/TeacherDashboard.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/manualClient";
import { useAuth } from "@/hooks/useAuth";

type TeacherAssignment = {
  subject_id: string;
  subject_name: string;
  stage: "preparatory" | "secondary";
  grades: string[];
};

const TeacherDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<TeacherAssignment | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchTeacherAssignment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchTeacherAssignment = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("teacher_assignments")
      .select(
        `
        subject_id,
        stage,
        grades,
        subjects (
          name
        )
      `
      )
      .eq("teacher_id", user!.id)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error loading teacher assignment:", error);
      setAssignment(null);
      setLoading(false);
      return;
    }

    if (!data) {
      setAssignment(null);
      setLoading(false);
      return;
    }

    setAssignment({
      subject_id: data.subject_id,
      subject_name: data.subjects?.name ?? "غير محدد",
      stage: data.stage,
      grades: Array.isArray(data.grades) ? data.grades : [],
    });

    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">جاري تحميل لوحة المعلم...</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <p className="text-muted-foreground text-lg">
          لم يتم ربطك بأي مادة حتى الآن.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-azhari flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">لوحة المعلم</h1>
              <p className="text-sm text-muted-foreground">
                {assignment.subject_name}
              </p>
            </div>
          </div>

          <Button variant="ghost" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Info */}
        <Card>
          <CardContent className="p-6 space-y-2">
            <p className="text-lg font-semibold">
              المادة:{" "}
              <span className="text-primary">
                {assignment.subject_name}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              المرحلة:{" "}
              {assignment.stage === "secondary" ? "ثانوي" : "إعدادي"}
            </p>
          </CardContent>
        </Card>

        {/* Grades */}
        <div>
          <h2 className="text-xl font-bold mb-4">
            الصفوف التي تدرّسها
          </h2>

          {assignment.grades.length === 0 ? (
            <p className="text-muted-foreground">
              لم يتم تحديد صفوف لك بعد.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignment.grades.map((grade) => (
                <Card
                  key={grade}
                  className="hover:shadow-md transition"
                >
                  <CardContent className="p-5 space-y-4">
                    <h3 className="text-lg font-semibold text-center">
                      الصف {grade}
                    </h3>

                    <Button
                      className="w-full"
                      onClick={() =>
                        navigate(
                          `/teacher/subject/${assignment.subject_id}?grade=${grade}&stage=${assignment.stage}`
                        )
                      }
                    >
                      إدارة المحتوى
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;