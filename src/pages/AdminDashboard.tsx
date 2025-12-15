import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/manualClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect } from "react";

import {
  Users,
  GraduationCap,
  BookOpen,
  Bell,
  LogOut,
  BarChart3,
  Upload,
  Settings,
  Video,
  FileText,
} from "lucide-react";

// Import admin pages
import StudentsPage from "./admin/StudentsPage";
import TeachersPage from "./admin/TeachersPage";
import ContentPage from "./admin/ContentPage";
import SubjectsPage from "./admin/SubjectsPage";
import NotificationsPage from "./admin/NotificationsPage";
import SettingsPage from "./admin/SettingsPage";

type Stats = {
  totalStudents: number;
  totalTeachers: number;
  totalSubjects: number;
  totalVideos: number;
  totalBooks: number;
  pendingRequests: number;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalSubjects: 0,
    totalVideos: 0,
    totalBooks: 0,
    pendingRequests: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      const [students, teachers, subjects, videos, books, pending] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "teacher"),
        supabase.from("subjects").select("*", { count: "exact", head: true }),
        supabase.from("content").select("*", { count: "exact", head: true }).eq("type", "video"),
        supabase.from("content").select("*", { count: "exact", head: true }).eq("type", "book"),
        supabase.from("teacher_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
      ]);

      setStats({
        totalStudents: students.count || 0,
        totalTeachers: teachers.count || 0,
        totalSubjects: subjects.count || 0,
        totalVideos: videos.count || 0,
        totalBooks: books.count || 0,
        pendingRequests: pending.count || 0,
      });
    };
    loadStats();
  }, [activeTab]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-bold">أزهاريون – لوحة التحكم</span>
          </Link>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap h-auto gap-1 mb-6">
            <TabsTrigger value="overview"><BarChart3 className="h-4 w-4 ml-1" />نظرة عامة</TabsTrigger>
            <TabsTrigger value="students"><Users className="h-4 w-4 ml-1" />الطلاب</TabsTrigger>
            <TabsTrigger value="teachers"><GraduationCap className="h-4 w-4 ml-1" />المعلمين</TabsTrigger>
            <TabsTrigger value="content"><Upload className="h-4 w-4 ml-1" />المحتوى</TabsTrigger>
            <TabsTrigger value="subjects"><BookOpen className="h-4 w-4 ml-1" />المواد</TabsTrigger>
            <TabsTrigger value="notifications"><Bell className="h-4 w-4 ml-1" />الإشعارات</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="h-4 w-4 ml-1" />الإعدادات</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="cursor-pointer hover:shadow-md" onClick={() => setActiveTab("students")}>
                <CardContent className="p-6 flex items-center gap-4">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">الطلاب</p>
                    <p className="text-3xl font-bold">{stats.totalStudents}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md" onClick={() => setActiveTab("teachers")}>
                <CardContent className="p-6 flex items-center gap-4">
                  <GraduationCap className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">المعلمين</p>
                    <p className="text-3xl font-bold">{stats.totalTeachers}</p>
                    {stats.pendingRequests > 0 && (
                      <p className="text-xs text-destructive">{stats.pendingRequests} طلب جديد</p>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md" onClick={() => setActiveTab("subjects")}>
                <CardContent className="p-6 flex items-center gap-4">
                  <BookOpen className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">المواد</p>
                    <p className="text-3xl font-bold">{stats.totalSubjects}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md" onClick={() => setActiveTab("content")}>
                <CardContent className="p-6 flex items-center gap-4">
                  <Video className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">الفيديوهات</p>
                    <p className="text-3xl font-bold">{stats.totalVideos}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md" onClick={() => setActiveTab("content")}>
                <CardContent className="p-6 flex items-center gap-4">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">الكتب</p>
                    <p className="text-3xl font-bold">{stats.totalBooks}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="students"><StudentsPage /></TabsContent>
          <TabsContent value="teachers"><TeachersPage /></TabsContent>
          <TabsContent value="content"><ContentPage /></TabsContent>
          <TabsContent value="subjects"><SubjectsPage /></TabsContent>
          <TabsContent value="notifications"><NotificationsPage /></TabsContent>
          <TabsContent value="settings"><SettingsPage /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
