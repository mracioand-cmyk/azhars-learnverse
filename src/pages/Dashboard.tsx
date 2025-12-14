import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import {
  BookOpen,
  ChevronLeft,
  GraduationCap,
  User,
  Settings,
  LogOut,
  Bell,
  Clock,
  BookMarked,
  Video,
  Bot,
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // بيانات الطالب (محاكاة)
  const studentData = {
    name: "أحمد محمد علي",
    code: "123456",
    stage: null,
    grade: null,
    section: null,
    totalTime: { hours: 12, minutes: 45 },
    lessonsWatched: 24,
  };

  const stages = [
    { id: "preparatory", name: "المرحلة الإعدادية", icon: "📚" },
    { id: "secondary", name: "المرحلة الثانوية", icon: "🎓" },
  ];

  const grades = [
    { id: "first", name: "الصف الأول" },
    { id: "second", name: "الصف الثاني" },
    { id: "third", name: "الصف الثالث" },
  ];

  const sections = [
    { id: "scientific", name: "علمي", icon: "🔬" },
    { id: "literary", name: "أدبي", icon: "📖" },
  ];

  const handleStageSelect = (stageId: string) => {
    setSelectedStage(stageId);
    setSelectedGrade(null);
    setSelectedSection(null);
  };

  const handleGradeSelect = (gradeId: string) => {
    setSelectedGrade(gradeId);
    if (selectedStage === "preparatory") {
      // الإعدادية ليس لها شعب
      navigate("/subjects");
    } else {
      setSelectedSection(null);
    }
  };

  const handleSectionSelect = (sectionId: string) => {
    setSelectedSection(sectionId);
    navigate("/subjects");
  };

  const handleBack = () => {
    if (selectedSection) {
      setSelectedSection(null);
    } else if (selectedGrade) {
      setSelectedGrade(null);
    } else if (selectedStage) {
      setSelectedStage(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* الهيدر */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-azhari shadow-azhari">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-gradient-azhari">أزهاريون</span>
          </Link>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-muted-foreground hover:text-primary transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
            </button>

            <button className="p-2 text-muted-foreground hover:text-primary transition-colors">
              <Settings className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent">
              <User className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{studentData.name}</span>
            </div>

            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8">
        {/* شريط الحالة */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-l from-primary to-azhari-dark text-primary-foreground">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary-foreground/20">
                <User className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-primary-foreground/70">كود الطالب</p>
                <p className="text-xl font-bold">{studentData.code}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-l from-gold to-gold-dark text-foreground">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-foreground/20">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm opacity-70">وقت التعلم</p>
                <p className="text-xl font-bold">
                  {studentData.totalTime.hours} ساعة {studentData.totalTime.minutes} دقيقة
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-accent">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الدروس المشاهدة</p>
                <p className="text-xl font-bold text-foreground">{studentData.lessonsWatched} درس</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* زر الرجوع */}
        {(selectedStage || selectedGrade || selectedSection) && (
          <Button variant="ghost" className="mb-4" onClick={handleBack}>
            <ChevronLeft className="h-5 w-5 rotate-180 ml-1" />
            رجوع
          </Button>
        )}

        {/* اختيار المرحلة */}
        {!selectedStage && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <GraduationCap className="h-7 w-7 text-primary" />
              اختر مرحلتك الدراسية
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {stages.map((stage) => (
                <Card
                  key={stage.id}
                  className="cursor-pointer hover:border-primary hover:shadow-lg transition-all group"
                  onClick={() => handleStageSelect(stage.id)}
                >
                  <CardContent className="p-8 text-center">
                    <div className="text-5xl mb-4">{stage.icon}</div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{stage.name}</h3>
                    <Button variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground">
                      اختيار <ChevronLeft className="h-4 w-4 mr-1" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* اختيار الصف */}
        {selectedStage && !selectedGrade && (
          <div className="animate-slide-right">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <BookMarked className="h-7 w-7 text-primary" />
              اختر صفك الدراسي
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              {grades.map((grade) => (
                <Card
                  key={grade.id}
                  className="cursor-pointer hover:border-primary hover:shadow-lg transition-all group"
                  onClick={() => handleGradeSelect(grade.id)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full gradient-azhari flex items-center justify-center mb-4">
                      <span className="text-2xl font-bold text-primary-foreground">
                        {grade.id === "first" ? "١" : grade.id === "second" ? "٢" : "٣"}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{grade.name}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* اختيار الشعبة (للثانوية فقط) */}
        {selectedStage === "secondary" && selectedGrade && !selectedSection && (
          <div className="animate-slide-right">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <GraduationCap className="h-7 w-7 text-primary" />
              اختر شعبتك
            </h2>

            <div className="grid md:grid-cols-2 gap-6 max-w-2xl">
              {sections.map((section) => (
                <Card
                  key={section.id}
                  className="cursor-pointer hover:border-primary hover:shadow-lg transition-all group"
                  onClick={() => handleSectionSelect(section.id)}
                >
                  <CardContent className="p-8 text-center">
                    <div className="text-4xl mb-4">{section.icon}</div>
                    <h3 className="text-xl font-bold text-foreground">{section.name}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
