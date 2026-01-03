import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import NotificationsDropdown from "@/components/student/NotificationsDropdown";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  ChevronLeft,
  Settings,
  LogOut,
  Info,
  MessageSquare,
  Book,
} from "lucide-react";

type SubjectRow = {
  id: string;
  name: string;
  category: string;
  description: string | null;
};

const CATEGORY_META: Array<{
  id: string;
  name: string;
  icon: string;
  badgeClass: string;
  badgeTextClass: string;
}> = [
  { id: "arabic", name: "المواد العربية", icon: "📝", badgeClass: "gradient-azhari", badgeTextClass: "text-primary-foreground" },
  { id: "sharia", name: "المواد الشرعية", icon: "🕌", badgeClass: "gradient-gold", badgeTextClass: "text-foreground" },
  { id: "literary", name: "المواد الأدبية", icon: "📚", badgeClass: "bg-secondary", badgeTextClass: "text-secondary-foreground" },
  { id: "scientific", name: "المواد العلمية", icon: "🔬", badgeClass: "bg-accent", badgeTextClass: "text-accent-foreground" },
  { id: "math", name: "الرياضيات", icon: "🔢", badgeClass: "bg-muted", badgeTextClass: "text-foreground" },
];

function stageLabel(stage: string) {
  if (stage === "preparatory") return "المرحلة الإعدادية";
  if (stage === "secondary") return "المرحلة الثانوية";
  return "";
}

function gradeLabel(grade: string) {
  if (grade === "first") return "الصف الأول";
  if (grade === "second") return "الصف الثاني";
  if (grade === "third") return "الصف الثالث";
  return "";
}

function sectionLabel(section: string) {
  if (section === "scientific") return "علمي";
  if (section === "literary") return "أدبي";
  return "";
}

const Subjects = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { signOut, role } = useAuth();

  const stage = params.get("stage") || "";
  const grade = params.get("grade") || "";
  const section = params.get("section") || "";

  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const grouped = useMemo(() => {
    return CATEGORY_META.map((cat) => ({
      ...cat,
      subjects: subjects.filter((s) => s.category === cat.id),
    })).filter((c) => c.subjects.length > 0);
  }, [subjects]);

  useEffect(() => {
    const run = async () => {
      if (!stage || !grade) {
        navigate("/dashboard", { replace: true });
        return;
      }

      setIsLoading(true);
      try {
        let q = supabase
          .from("subjects")
          .select("id, name, category, description")
          .eq("is_active", true)
          .eq("stage", stage)
          .eq("grade", grade);

        if (stage === "secondary") {
          if (!section) {
            navigate("/dashboard", { replace: true });
            return;
          }
          q = q.eq("section", section);
        }

        const { data, error } = await q.order("name", { ascending: true });
        if (error) throw error;

        setSubjects((data as SubjectRow[]) || []);
      } catch (e) {
        console.error(e);
        setSubjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, [stage, grade, section, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const subtitle = `${stageLabel(stage)} - ${gradeLabel(grade)}${section ? ` - ${sectionLabel(section)}` : ""}`;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-azhari shadow-azhari">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-gradient-azhari">أزهاريون</span>
          </Link>

          <div className="flex items-center gap-2">
            <NotificationsDropdown />

            <Button variant="ghost" size="icon" asChild>
              <Link to="/about-platform">
                <Info className="h-5 w-5" />
              </Link>
            </Button>

            <Button variant="ghost" size="icon" asChild>
              <Link to="/support">
                <MessageSquare className="h-5 w-5" />
              </Link>
            </Button>

            {role === "admin" && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                <span className="text-sm font-medium text-primary">وضع الرفع</span>
              </div>
            )}

            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>

            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate("/dashboard")}> 
          <ChevronLeft className="h-5 w-5 rotate-180 ml-1" />
          رجوع للوحة التحكم
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-2">المواد الدراسية</h1>
        <p className="text-muted-foreground mb-8">{subtitle}</p>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6" />
              </Card>
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد مواد</h3>
              <p className="text-muted-foreground">لم يتم إضافة مواد لهذا الصف بعد</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {grouped.map((category, catIndex) => (
              <div key={category.id} className="animate-slide-up" style={{ animationDelay: `${catIndex * 0.1}s` }}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{category.icon}</span>
                  <h2 className="text-xl font-bold text-foreground">{category.name}</h2>
                </div>

                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {category.subjects.map((subject, subIndex) => (
                    <Card
                      key={subject.id}
                      className="cursor-pointer hover:border-primary hover:shadow-lg transition-all group animate-scale-in"
                      style={{ animationDelay: `${catIndex * 0.1 + subIndex * 0.05}s` }}
                      onClick={() =>
                        navigate(
                          `/subject/${subject.id}?stage=${stage}&grade=${grade}${section ? `&section=${section}` : ""}`
                        )
                      }
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2.5 rounded-lg", category.badgeClass)}>
                            <Book className={cn("h-5 w-5", category.badgeTextClass)} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {subject.name}
                            </h3>
                            {subject.description && (
                              <p className="text-xs text-muted-foreground truncate">{subject.description}</p>
                            )}
                          </div>
                          <ChevronLeft className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Subjects;

