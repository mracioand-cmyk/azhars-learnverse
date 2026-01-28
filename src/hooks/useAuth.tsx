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
  stage?: string;
  grade?: string;
  section?: string;
}

// تحديث بيانات المعلم لتشمل التخصصات
export interface TeacherAssignment {
  subject: string;
  stage: string;
  grade: string;
}

interface TeacherSignUpData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  schoolName?: string;
  employeeId?: string;
  assignments: TeacherAssignment[]; // التخصصات المختارة
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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
      // Get role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();
      
      const userRole = (roleData?.role as AppRole) || "student";
      setRole(userRole);

      // Get profile status (banned or not)
      const { data: profileData } = await supabase
        .from("profiles")
        .select("is_banned")
        .eq("id", userId)
        .maybeSingle(); // Use maybeSingle to avoid error if profile doesn't exist yet

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

      if (error) {
        return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
      }

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const signUp = async (data: SignUpData) => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { error } = await supabase.auth.signUp({
        email: data.email.trim(),
        password: data.password,
        options: {\n          emailRedirectTo: redirectUrl,
          data: {
            full_name: data.fullName,
            phone: data.phone,
            role: "student",
            stage: data.stage,
            grade: data.grade,
            section: data.section,
          },
        },
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          return { error: "هذا البريد الإلكتروني مسجل بالفعل" };
        }
        return { error: error.message };
      }

      return { error: null };
    } catch (error: any) {
      return { error: "حدث خطأ أثناء إنشاء الحساب" };
    }
  };

  const signUpTeacher = async (data: TeacherSignUpData) => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      // 1. إنشاء الحساب الأساسي
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email.trim(),
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: data.fullName,
            phone: data.phone,
            school_name: data.schoolName,
            employee_id: data.employeeId,
            role: "teacher", // This triggers the handle_new_user function
          },
        },
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          return { error: "هذا البريد الإلكتروني مسجل بالفعل" };
        }
        return { error: error.message };
      }

      // 2. حفظ تخصصات المعلم (المواد والصفوف)
      if (authData.user && data.assignments.length > 0) {
        const assignmentsToInsert = data.assignments.map(assignment => ({
          teacher_id: authData.user!.id,
          subject_category: assignment.subject,
          stage: assignment.stage,
          grade: assignment.grade
        }));

        const { error: assignmentError } = await supabase
          .from('teacher_assignments')
          .insert(assignmentsToInsert);
        
        if (assignmentError) {
          console.error("Error inserting assignments:", assignmentError);
          // لا نوقف التسجيل، ولكن نسجل الخطأ (يمكن للمعلم إضافتها لاحقاً)
        }
      }

      return { error: null };
    } catch (error: any) {
      console.error("Teacher sign up error:", error);
      return { error: "حدث خطأ أثناء إنشاء الحساب" };
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
