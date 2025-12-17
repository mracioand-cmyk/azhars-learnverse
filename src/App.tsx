import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Subjects from "./pages/Subjects";
import SubjectPage from "./pages/SubjectPage";
import PendingApproval from "./pages/PendingApproval";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminStudentsPage from "./pages/admin/StudentsPage";
import AdminTeachersPage from "./pages/admin/TeachersPage";
import AdminContentPage from "./pages/admin/ContentPage";
import AdminSubjectsPage from "./pages/admin/SubjectsPage";
import AdminNotificationsPage from "./pages/admin/NotificationsPage";
import AdminSettingsPage from "./pages/admin/SettingsPage";
import AdminSupportPage from "./pages/admin/SupportPage";

// Student Pages
import StudentSupportPage from "./pages/student/SupportPage";
import StudentAboutPage from "./pages/student/AboutPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/about" element={<About />} />
            
            {/* Protected routes - Student */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["student", "admin"]}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/subjects"
              element={
                <ProtectedRoute allowedRoles={["student", "admin"]}>
                  <Subjects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/subject/:subjectId"
              element={
                <ProtectedRoute allowedRoles={["student", "admin"]}>
                  <SubjectPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/support"
              element={
                <ProtectedRoute allowedRoles={["student", "admin"]}>
                  <StudentSupportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/about-platform"
              element={
                <ProtectedRoute allowedRoles={["student", "admin"]}>
                  <StudentAboutPage />
                </ProtectedRoute>
              }
            />
            
            {/* Protected routes - Admin only */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/students"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminStudentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/teachers"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminTeachersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/content"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminContentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/subjects"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminSubjectsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/notifications"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminNotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/support"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminSupportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminSettingsPage />
                </ProtectedRoute>
              }
            />
            
            {/* Protected routes - Pending approval (for teachers) */}
            <Route
              path="/pending-approval"
              element={
                <ProtectedRoute requireAuth={true}>
                  <PendingApproval />
                </ProtectedRoute>
              }
            />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
