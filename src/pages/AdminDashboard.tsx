import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/manualClient";
import { useAuth } from "@/hooks/useAuth";

// Components
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminOverview from "@/components/admin/AdminOverview";

// Admin Pages
import StudentsPage from "./admin/StudentsPage";
import TeachersPage from "./admin/TeachersPage";
import ContentPage from "./admin/ContentPage";
import SubjectsPage from "./admin/SubjectsPage";
import NotificationsPage from "./admin/NotificationsPage";
import SupportPage from "./admin/SupportPage";
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

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <AdminOverview stats={stats} onNavigate={setActiveTab} />;
      case "students":
        return <StudentsPage />;
      case "teachers":
        return <TeachersPage />;
      case "content":
        return <ContentPage />;
      case "subjects":
        return <SubjectsPage />;
      case "notifications":
        return <NotificationsPage />;
      case "support":
        return <SupportPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <AdminOverview stats={stats} onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSignOut={handleSignOut}
      />

      {/* Main Content */}
      <main className="mr-64 min-h-screen">
        <div className="p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
