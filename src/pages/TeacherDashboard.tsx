import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  BookOpen,
  GraduationCap,
  LogOut,
  Loader2,
  Upload,
  ChevronLeft,
  User,
} from "lucide-react";

interface TeacherAssignment {
  id: string;
  stage: string;
  grade: string;
  section: string | null;
  category: string;
}

interface TeacherInfo {
  full_name: string;
  email: string;
  category: string;
  assignments: TeacherAssignment[];
}

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null);

  useEffect(() => {
    if (user) {
      loadTeacherInfo();
    }
  }, [user]);

  const loadTeacherInfo = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get profile info
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      // Get teacher request with assignments
      const { data: teacherRequest, error: requestError } = await supabase
        .from("teacher_requests")
        .select("assigned_category, assigned_stages, assigned_grades, assigned_sections")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .single();

      if (requestError) throw requestError;

      // Get teacher assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from("teacher_assignments")
        .select("*")
        .eq("teacher_id", user.id);

      if (assignmentsError) throw assignmentsError;

      setTeacherInfo({
        full_name: profile.full_name,
        email: profile.email,
        category: teacherRequest?.assigned_category || "",
        assignments: assignments || [],
      });
    } catch (error) {
      console.error("Error loading teacher info:", error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "يرجى إعادة تحميل الصفحة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const navigateToGrade = (grade: string, section?: string | null) => {
    const params = new URLSearchParams();
    params.set("grade", grade);
    if (section) params.set("section", section);
    navigate(`/teacher/upload?${params.toString()}`);
  };

  // Group assignments by grade
  const groupedAssignments = teacherInfo?.assignments.reduce((acc, assignment) => {
    const key = assignment.grade;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(assignment);
    return acc;
  }, {} as Record<string, TeacherAssignment[]>) || {};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-azhari">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">لوحة تحكم المعلم</h1>
              <p className="text-xs text-muted-foreground">{teacherInfo?.full_name}</p>
            </div>
          </div>
          
          <Button variant="ghost" onClick={handleSignOut} className="gap-2">
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Welcome Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">مرحباً، {teacherInfo?.full_name}</h2>
                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                  <BookOpen className="h-4 w-4" />
                  <span className="font-medium">{teacherInfo?.category}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grades Section */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            الصفوف المخصصة لك
          </h3>
          
          {Object.keys(groupedAssignments).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  لم يتم تعيين صفوف لك بعد
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  سيتم تعيين الصفوف بعد موافقة المطور
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(groupedAssignments).map(([grade, assignments]) => {
                const hasSections = assignments.some(a => a.section);
                const sections = [...new Set(assignments.map(a => a.section).filter(Boolean))];
                
                return (
                  <Card 
                    key={grade}
                    className="hover:shadow-lg transition-shadow cursor-pointer group"
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{grade}</span>
                        <ChevronLeft className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {hasSections ? (
                        <div className="flex gap-2 flex-wrap">
                          {sections.map((section) => (
                            <Button
                              key={section}
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => navigateToGrade(grade, section)}
                            >
                              <span>{section}</span>
                              <Upload className="h-3 w-3" />
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-2"
                          onClick={() => navigateToGrade(grade)}
                        >
                          <Upload className="h-4 w-4" />
                          رفع محتوى
                        </Button>
                      )}
                      
                      <Badge variant="secondary" className="mt-3">
                        {teacherInfo?.category}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold text-primary">
                {Object.keys(groupedAssignments).length}
              </p>
              <p className="text-sm text-muted-foreground">صفوف مخصصة</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold text-primary">
                {teacherInfo?.assignments.length || 0}
              </p>
              <p className="text-sm text-muted-foreground">تخصيصات</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold text-gold">1</p>
              <p className="text-sm text-muted-foreground">مادة</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;
