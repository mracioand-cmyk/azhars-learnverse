import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "student" | "teacher" | "admin" | "support";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  isLoading: boolean;
  isBanned: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (data: SignUpData) => Promise<{ error: string | null }>;
  signUpTeacher: (data: TeacherSignUpData) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  username?: string;
}

interface TeacherAssignment {
  subject: string;
  stage: string;
  grade: string;
  section: string | null;
}

interface TeacherSignUpData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  assignments: TeacherAssignment[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        getProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        getProfile(session.user.id);
      } else {
        setRole(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const getProfile = async (userId: string) => {
    try {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();
      
      setRole((roleData?.role as AppRole) || "student");

      const { data: profileData } = await supabase
        .from("profiles")
        .select("is_banned")
        .eq("id", userId)
        .maybeSingle();

      if (profileData) {
        setIsBanned(profileData.is_banned || false);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const signUp = async (data: SignUpData) => {
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email.trim(),
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone,
            username: data.username,
            role: "student",
          },
        },
      });

      if (error) return { error: error.message };
      return { error: null };
    } catch (error: any) {
      return { error: "حدث خطأ أثناء إنشاء الحساب" };
    }
  };

  const signUpTeacher = async (data: TeacherSignUpData) => {
    try {
      // 1. إنشاء الحساب
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email.trim(),
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone,
            role: "teacher", 
          },
        },
      });

      if (error) return { error: error.message };

      // 2. إدخال التخصصات
      if (authData.user && data.assignments.length > 0) {
        const assignmentsToInsert = data.assignments.map(a => ({
          teacher_id: authData.user!.id,
          subject_id: a.subject,
          stage: a.stage,
          grade: a.grade,
          section: a.section
        }));

        await supabase.from('teacher_assignments').insert(assignmentsToInsert);
      }

      return { error: null };
    } catch (error: any) {
      return { error: "حدث خطأ أثناء إنشاء حساب المعلم" };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setIsBanned(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        isLoading,
        isBanned,
        signIn,
        signUp,
        signUpTeacher,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
