// src/pages/TeacherDashboard.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/manualClient";
import { useAuth } from "@/hooks/useAuth";

interface TeacherSubject {
  subject_id: string;
  subject_name: string;
  stage: "secondary" | "preparatory";
  grade: string;
}

const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<TeacherSubject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeacherSubjects = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("teacher_subjects")
        .select(`
          subject_id,
          stage,
          grade,
          subjects (
            name
          )
        `)
        .eq("teacher_id", user.id);

      if (error) {
        console.error("Error loading teacher subjects:", error);
      } else {
        const formatted = data.map((item: any) => ({
          subject_id: item.subject_id,
          subject_name: item.subjects.name,
          stage: item.stage,
          grade: item.grade,
        }));
        setSubjects(formatted);
      }

      setLoading(false);
    };

    fetchTeacherSubjects();
  }, [user]);

  if (loading) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        جاري تحميل لوحة المعلم...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">لوحة تحكم المعلم</h1>

      {subjects.length === 0 ? (
        <p className="text-muted-foreground">
          لم يتم ربطك بأي مادة حتى الآن.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((item, index) => (
            <Card key={index} className="hover:shadow-md transition">
              <CardContent className="p-4 space-y-3">
                <div>
                  <h2 className="font-bold text-lg">{item.subject_name}</h2>
                  <p className="text-sm text-muted-foreground">
                    المرحلة: {item.stage === "secondary" ? "ثانوي" : "إعدادي"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    الصف: {item.grade}
                  </p>
                </div>

                <Button
                  className="w-full"
                  onClick={() =>
                    navigate(
                      `/teacher/subject/${item.subject_id}?stage=${item.stage}&grade=${item.grade}`
                    )
                  }
                >
                  الدخول لإدارة المادة
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;