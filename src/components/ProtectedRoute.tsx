import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

type Role = "student" | "teacher" | "admin" | "support";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Role[];
  requireAuth?: boolean;
}

const ProtectedRoute = ({
  children,
  allowedRoles,
  requireAuth = true,
}: ProtectedRouteProps) => {
  const { user, role, isLoading, isBanned } = useAuth();
  const location = useLocation();

  /* ===================== */
  /* ⏳ Loading */
  /* ===================== */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">جاري التحقق من الحساب...</p>
        </div>
      </div>
    );
  }

  /* ===================== */
  /* 🔐 Not authenticated */
  /* ===================== */
  if (requireAuth && !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  /* ===================== */
  /* 🚫 Banned user */
  /* ===================== */
  if (user && isBanned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <span className="text-3xl">🚫</span>
          </div>
          <h1 className="text-2xl font-bold text-destructive mb-2">
            حسابك موقوف
          </h1>
          <p className="text-muted-foreground mb-4">
            تم إيقاف حسابك مؤقتًا. يرجى التواصل مع الدعم.
          </p>
          <a
            href="https://wa.me/201223909712"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            تواصل مع الدعم
          </a>
        </div>
      </div>
    );
  }

  /* ===================== */
  /* 🧑‍🏫 Teacher pending approval */
  /* ===================== */
  if (user && !role) {
    return <Navigate to="/pending-approval" replace />;
  }

  /* ===================== */
  /* 🎯 Role-based access */
  /* ===================== */
  if (allowedRoles && allowedRoles.length > 0) {
    if (!role || !allowedRoles.includes(role)) {
      switch (role) {
        case "admin":
          return <Navigate to="/admin" replace />;
        case "teacher":
          return <Navigate to="/teacher" replace />;
        case "student":
          return <Navigate to="/dashboard" replace />;
        default:
          return <Navigate to="/" replace />;
      }
    }
  }

  /* ===================== */
  /* ✅ Allowed */
  /* ===================== */
  return <>{children}</>;
};

export default ProtectedRoute;