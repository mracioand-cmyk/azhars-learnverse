import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ("student" | "teacher" | "admin" | "support")[];
  requireAuth?: boolean;
}

const ProtectedRoute = ({
  children,
  allowedRoles,
  requireAuth = true,
}: ProtectedRouteProps) => {
  const { user, role, isLoading, isBanned } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not logged in
  if (requireAuth && !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If user is banned
  if (isBanned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <span className="text-3xl">🚫</span>
          </div>
          <h1 className="text-2xl font-bold text-destructive mb-2">حسابك موقوف</h1>
          <p className="text-muted-foreground mb-4">
            تم إيقاف حسابك. يرجى التواصل مع الدعم للمزيد من المعلومات.
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

  // If specific roles are required
  if (allowedRoles && allowedRoles.length > 0) {
    // If user has no role yet (teacher pending approval)
    if (!role) {
      // Check if user is a pending teacher
      return <Navigate to="/pending-approval" replace />;
    }

    // If user's role is not in allowed roles
    if (!allowedRoles.includes(role)) {
      // Redirect based on role
      if (role === "admin") {
        return <Navigate to="/admin" replace />;
      } else if (role === "student") {
        return <Navigate to="/dashboard" replace />;
      } else if (role === "teacher") {
        return <Navigate to="/teacher" replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
