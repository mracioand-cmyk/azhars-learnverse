// src/pages/TeacherDashboard.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type TeacherAssignment = {
  stage: string;
  grade: string;
  section: string | null;
  category: string;
};

const TeacherDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [teacherName, setTeacherName] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchTeacherData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchTeacherData = async () => {
    setLoading(true);

    // جلب بيانات المعلم
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user!.id)
      .maybeSingle();

    if (profile) {
      setTeacherName(profile.full_name);
    }

    // جلب تخصيصات المعلم
    const { data, error } = await supabase
      .from("teacher_assignments")
      .select("stage, grade, section, category")
      .eq("teacher_id", user!.id);

    if (error) {
      console.error("Error loading teacher assignments:", error);
      setAssignments([]);
    } else {
      setAssignments(data || []);
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  // تجميع الصفوف حسب المادة والمرحلة
  const groupedAssignments = assignments.reduce((acc, curr) => {
    const key = `${curr.category}-${curr.stage}`;
    if (!acc[key]) {
      acc[key] = {
        category: curr.category,
        stage: curr.stage,
        grades: [],
      };
    }
    if (!acc[key].grades.includes(curr.grade)) {
      acc[key].grades.push(curr.grade);
    }
    return acc;
  }, {} as Record<string, { category: string; stage: string; grades: string[] }>);

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

  if (assignments.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold mb-2">لم يتم ربطك بأي مادة حتى الآن</h2>
          <p className="text-muted-foreground mb-4">
            انتظر حتى يقوم الأدمن بتعيينك على المواد والصفوف
          </p>
          <Button variant="outline" onClick={handleLogout}>
            تسجيل الخروج
          </Button>
        </div>
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
              <p className="text-sm text-muted-foreground">{teacherName}</p>
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
        {/* المواد والصفوف */}
        {Object.values(groupedAssignments).map((group) => (
          <Card key={`${group.category}-${group.stage}`}>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-primary">
                    {group.category}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    المرحلة: {group.stage === "secondary" ? "ثانوي" : "إعدادي"}
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.grades.map((grade) => (
                  <Card
                    key={grade}
                    className="hover:shadow-md transition cursor-pointer"
                    onClick={() =>
                      navigate(
                        `/teacher/subject?category=${encodeURIComponent(group.category)}&grade=${encodeURIComponent(grade)}&stage=${group.stage}`
                      )
                    }
                  >
                    <CardContent className="p-4 text-center">
                      <h3 className="font-semibold">{grade}</h3>
                      <Button className="w-full mt-3" size="sm">
                        إدارة المحتوى
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </main>
    </div>
  );
};

export default TeacherDashboard;
