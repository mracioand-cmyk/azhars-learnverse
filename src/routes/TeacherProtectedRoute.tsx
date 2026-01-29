// src/routes/TeacherProtectedRoute.tsx

import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/manualClient";
import { useAuth } from "@/hooks/useAuth";

type TeacherStatus = "pending" | "approved" | "rejected";

interface Props {
  children: React.ReactNode;
}

const TeacherProtectedRoute = ({ children }: Props) => {
  const { user, role, loading } = useAuth();
  const [teacherStatus, setTeacherStatus] = useState<TeacherStatus | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkTeacherStatus = async () => {
      if (!user) {
        setChecking(false);
        return;
      }

      // لو أدمن
      if (role === "admin") {
        setTeacherStatus("approved");
        setChecking(false);
        return;
      }

      // لو مش معلم
      if (role !== "teacher") {
        setTeacherStatus(null);
        setChecking(false);
        return;
      }

      const { data, error } = await supabase
        .from("teacher_requests")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error checking teacher status:", error);
        setTeacherStatus(null);
      } else {
        setTeacherStatus(data?.status ?? null);
      }

      setChecking(false);
    };

    checkTeacherStatus();
  }, [user, role]);

  // أثناء التحميل
  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        جاري التحقق من صلاحيات المعلم...
      </div>
    );
  }

  // غير مسجل
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // طالب
  if (role === "student") {
    return <Navigate to="/dashboard" replace />;
  }

  // معلم لكن لسه ما اتوافقش عليه
  if (role === "teacher" && teacherStatus === "pending") {
    return <Navigate to="/pending-approval" replace />;
  }

  // معلم مرفوض
  if (role === "teacher" && teacherStatus === "rejected") {
    return <Navigate to="/pending-approval" replace />;
  }

  // معلم معتمد
  if (role === "teacher" && teacherStatus === "approved") {
    return <>{children}</>;
  }

  // أي حالة غريبة
  return <Navigate to="/" replace />;
};

export default TeacherProtectedRoute;