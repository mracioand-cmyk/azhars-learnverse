import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/manualClient";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import {
  Users,
  GraduationCap,
  BookOpen,
  Bell,
  LogOut,
  BarChart3,
} from "lucide-react";

/* =========================
   Types
========================= */
type Stats = {
  totalStudents: number;
  totalTeachers: number;
  totalSubjects: number;
  totalContents: number;
  pendingRequests: number;
};

/* =========================
   Component
========================= */
const AdminDashboard = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalSubjects: 0,
    totalContents: 0,
    pendingRequests: 0,
  });

  /* =========================
     Load Dashboard Data
  ========================= */
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        // الطلاب
        const { count: students } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        // المدرسين
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

        // طلبات المعلمين
        const { count: pending } = await supabase
          .from("teacher_requests")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");

        setStats({
          totalStudents: students || 0,
          totalTeachers: teachers || 0,
          totalSubjects: subjects || 0,
          totalContents: contents || 0,
          pendingRequests: pending || 0,
        });
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  /* =========================
     UI
  ========================= */
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-bold">أزهاريون – لوحة التحكم</span>
          </Link>

          <Button variant="ghost" onClick={() => navigate("/")}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              نظرة عامة
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              الإشعارات
            </TabsTrigger>
          </TabsList>

          {/* ================= Overview ================= */}
          <TabsContent value="overview" className="mt-6">
            {loading ? (
              <p className="text-center text-muted-foreground">
                جاري تحميل البيانات...
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="p-6">
                    <Users className="mb-2" />
                    <p className="text-sm">الطلاب</p>
                    <p className="text-2xl font-bold">
                      {stats.totalStudents}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <GraduationCap className="mb-2" />
                    <p className="text-sm">المعلمين</p>
                    <p className="text-2xl font-bold">
                      {stats.totalTeachers}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <BookOpen className="mb-2" />
                    <p className="text-sm">المواد</p>
                    <p className="text-2xl font-bold">
                      {stats.totalSubjects}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <Bell className="mb-2" />
                    <p className="text-sm">طلبات معلّمين</p>
                    <p className="text-2xl font-bold text-destructive">
                      {stats.pendingRequests}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* ================= Notifications ================= */}
          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>الإشعارات</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  (هتتربط بالـ Supabase بعدين)
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
