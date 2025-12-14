import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, GraduationCap, BookOpen, Clock, Activity } from "lucide-react";

/* =======================
   لوحة تحكم الأدمن
======================= */

const AdminDashboard = () => {
  const navigate = useNavigate();

  // 📊 الإحصائيات الحقيقية
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalSubjects: 0,
    totalContents: 0,
    activeToday: 0,
    pendingRequests: 0,
  });

  const [activeTab, setActiveTab] = useState("overview");

  // 🔗 تحميل الإحصائيات من Supabase
  useEffect(() => {
    const loadStats = async () => {
      try {
        // الطلاب
        const { count: students } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        // المعلمين
        const { count: teachers } = await supabase
          .from("user_roles")
          .select("*", { count: "exact", head: true })
          .eq("role", "teacher");

        // المواد
        const { count: subjects } = await supabase
          .from("subjects")
          .select("*", { count: "exact", head: true });

        // المحتوى
        const { count: contents } = await supabase
          .from("content")
          .select("*", { count: "exact", head: true });

        // طلبات المعلمين المعلقة
        const { count: pending } = await supabase
          .from("teacher_requests")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");

        setStats({
          totalStudents: students || 0,
          totalTeachers: teachers || 0,
          totalSubjects: subjects || 0,
          totalContents: contents || 0,
          activeToday: 0, // نربطها بعدين
          pendingRequests: pending || 0,
        });
      } catch (err) {
        console.error("خطأ تحميل الإحصائيات", err);
      }
    };

    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b p-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <BookOpen />
          <span className="font-bold text-lg">أزهاريون – لوحة الأدمن</span>
        </Link>

        <Button variant="outline" onClick={() => navigate("/")}>
          خروج
        </Button>
      </header>

      <main className="container py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <Users />
                  <p>الطلاب</p>
                  <h2 className="text-2xl font-bold">{stats.totalStudents}</h2>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <GraduationCap />
                  <p>المعلمين</p>
                  <h2 className="text-2xl font-bold">{stats.totalTeachers}</h2>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <Clock />
                  <p>طلبات معلقة</p>
                  <h2 className="text-2xl font-bold text-destructive">
                    {stats.pendingRequests}
                  </h2>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <Activity />
                  <p>نشط اليوم</p>
                  <h2 className="text-2xl font-bold">{stats.activeToday}</h2>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
