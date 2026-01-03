import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/manualClient";
import {
  BookOpen,
  ChevronLeft,
  User,
  Settings,
  LogOut,
  Book,
  ScrollText,
  Calculator,
  Atom,
  Plus,
  Upload,
  Loader2,
  Trash2,
  Edit,
} from "lucide-react";

interface Subject {
  id: string;
  name: string;
  stage: string;
  grade: string;
  section: string | null;
  category: string;
  description: string | null;
}

const AdminSubjectsList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const stage = searchParams.get("stage") || "";
  const grade = searchParams.get("grade") || "";
  const section = searchParams.get("section") || "";

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newSubject, setNewSubject] = useState({
    name: "",
    category: "arabic",
    description: "",
  });

  const categories = [
    { id: "arabic", name: "المواد العربية", icon: "📝", color: "from-primary to-azhari-dark" },
    { id: "sharia", name: "المواد الشرعية", icon: "🕌", color: "from-gold to-gold-dark" },
    { id: "literary", name: "المواد الأدبية", icon: "📚", color: "from-purple-600 to-purple-800" },
    { id: "scientific", name: "المواد العلمية", icon: "🔬", color: "from-blue-600 to-blue-800" },
    { id: "math", name: "الرياضيات", icon: "🔢", color: "from-green-600 to-green-800" },
  ];

  const getStageLabel = () => {
    return stage === "preparatory" ? "المرحلة الإعدادية" : "المرحلة الثانوية";
  };

  const getGradeLabel = () => {
    if (grade === "first") return "الصف الأول";
    if (grade === "second") return "الصف الثاني";
    if (grade === "third") return "الصف الثالث";
    return "";
  };

  const getSectionLabel = () => {
    if (section === "scientific") return "علمي";
    if (section === "literary") return "أدبي";
    return "";
  };

  useEffect(() => {
    fetchSubjects();
  }, [stage, grade, section]);

  const fetchSubjects = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("subjects")
        .select("*")
        .eq("stage", stage)
        .eq("grade", grade)
        .eq("is_active", true);

      if (section) {
        query = query.eq("section", section);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل المواد",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSubject = async () => {
    if (!newSubject.name.trim()) {
      toast({ title: "خطأ", description: "يرجى إدخال اسم المادة", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase.from("subjects").insert({
        name: newSubject.name,
        stage,
        grade,
        section: section || null,
        category: newSubject.category,
        description: newSubject.description || null,
      });

      if (error) throw error;

      toast({ title: "تم بنجاح", description: "تمت إضافة المادة" });
      setShowAddDialog(false);
      setNewSubject({ name: "", category: "arabic", description: "" });
      fetchSubjects();
    } catch (error) {
      console.error("Error adding subject:", error);
      toast({ title: "خطأ", description: "فشل في إضافة المادة", variant: "destructive" });
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه المادة؟")) return;

    try {
      const { error } = await supabase
        .from("subjects")
        .update({ is_active: false })
        .eq("id", subjectId);

      if (error) throw error;

      toast({ title: "تم بنجاح", description: "تم حذف المادة" });
      fetchSubjects();
    } catch (error) {
      console.error("Error deleting subject:", error);
      toast({ title: "خطأ", description: "فشل في حذف المادة", variant: "destructive" });
    }
  };

  const getCategoryInfo = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId) || categories[0];
  };

  const groupedSubjects = categories.map((category) => ({
    ...category,
    subjects: subjects.filter((s) => s.category === category.id),
  })).filter((c) => c.subjects.length > 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* الهيدر */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/admin" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-azhari shadow-azhari">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-gradient-azhari">أزهاريون - لوحة الرفع</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
              <Upload className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">وضع الرفع</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent">
              <User className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">أدمن</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8">
        {/* زر الرجوع */}
        <Button variant="ghost" className="mb-6" onClick={() => navigate("/admin/content-browser")}>
          <ChevronLeft className="h-5 w-5 rotate-180 ml-1" />
          رجوع
        </Button>

        {/* معلومات المرحلة والصف */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">المواد الدراسية</h1>
          <p className="text-muted-foreground">
            {getStageLabel()} - {getGradeLabel()} {section && `- ${getSectionLabel()}`}
          </p>
        </div>

        {/* زر إضافة مادة */}
        <div className="mb-6">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-5 w-5" />
                إضافة مادة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة مادة جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>اسم المادة</Label>
                  <Input
                    value={newSubject.name}
                    onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                    placeholder="مثال: النحو"
                  />
                </div>
                <div>
                  <Label>التصنيف</Label>
                  <Select
                    value={newSubject.category}
                    onValueChange={(value) => setNewSubject({ ...newSubject, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>وصف المادة (اختياري)</Label>
                  <Textarea
                    value={newSubject.description}
                    onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                    placeholder="وصف مختصر للمادة..."
                  />
                </div>
                <Button onClick={handleAddSubject} className="w-full">
                  إضافة المادة
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* قائمة المواد */}
        {subjects.length === 0 ? (
          <Card className="p-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد مواد</h3>
            <p className="text-muted-foreground mb-4">لم يتم إضافة مواد لهذا الصف بعد</p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-5 w-5 ml-2" />
              إضافة أول مادة
            </Button>
          </Card>
        ) : (
          <div className="space-y-8">
            {groupedSubjects.map((category) => (
              <div key={category.id}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{category.icon}</span>
                  <h2 className="text-xl font-bold text-foreground">{category.name}</h2>
                </div>

                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {category.subjects.map((subject) => (
                    <Card
                      key={subject.id}
                      className="cursor-pointer hover:border-primary hover:shadow-lg transition-all group relative"
                    >
                      <CardContent className="p-4">
                        <div
                          className="flex items-center gap-3"
                          onClick={() =>
                            navigate(
                              `/admin/content-browser/subject/${subject.id}?stage=${stage}&grade=${grade}${section ? `&section=${section}` : ""}`
                            )
                          }
                        >
                          <div className={`p-2.5 rounded-lg bg-gradient-to-bl ${category.color} text-white`}>
                            <Book className="h-5 w-5" />
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

                        {/* أزرار التحكم */}
                        <div className="flex gap-2 mt-3 pt-3 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-1"
                            onClick={() =>
                              navigate(
                                `/admin/content-browser/subject/${subject.id}?stage=${stage}&grade=${grade}${section ? `&section=${section}` : ""}`
                              )
                            }
                          >
                            <Upload className="h-4 w-4" />
                            رفع محتوى
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteSubject(subject.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

export default AdminSubjectsList;
