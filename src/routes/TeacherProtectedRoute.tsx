import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function TeacherProtectedRoute({
  children,
}: {
  children: JSX.Element;
}) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const checkTeacherStatus = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("teachers")
        .select("status")
        .eq("id", user.id)
        .single();

      if (data?.status === "approved") {
        setAllowed(true);
      }

      setLoading(false);
    };

    checkTeacherStatus();
  }, []);

  if (loading) return <div className="p-6">جاري التحقق...</div>;
  if (!allowed) return <Navigate to="/pending-approval" replace />;

  return children;
}