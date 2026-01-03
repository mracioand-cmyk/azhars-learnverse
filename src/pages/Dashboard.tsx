import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import NotificationsDropdown from "@/components/student/NotificationsDropdown";
import { toast } from "@/hooks/use-toast";
import {
  BookOpen,
  ChevronLeft,
  GraduationCap,
  User,
  Settings,
  LogOut,
  Clock,
  Video,
  Loader2,
  MessageSquare,
  Info,
  BookMarked,
  Beaker,
  Languages,
  BookText,
  Globe,
  Calculator,
  FileText,
} from "lucide-react";

interface ProfileData {
  full_name: string;
  student_code: string | null;
  stage: string | null;
  grade: string | null;
  section: string | null;
}

interface UsageStats {
  totalMinutes: number;
  lessonsWatched: number;
}

// أقسام المواد حسب المرحلة والشعبة
const getCategoryButtons = (stage: string, section: string | null) => {
  if (stage === "preparatory") {
    return [
      { id: "arabic", name: "المواد العربية", icon: BookText, color: "from-emerald-500 to-emerald-600" },
      { id: "religious", name: "المواد الشرعية", icon: BookMarked, color: "from-amber-500 to-amber-600" },
      { id: "science", name: "العلوم", icon: Beaker, color: "from-blue-500 to-blue-600" },
      { id: "social", name: "الدراسات", icon: Globe, color: "from-purple-500 to-purple-600" },
      { id: "english", name: "الإنجليزية", icon: Languages, color: "from-red-500 to-red-600" },
    ];
  }
  
  if (stage === "secondary" && section === "scientific") {
    return [
      { id: "arabic", name: "المواد العربية", icon: BookText, color: "from-emerald-500 to-emerald-600" },
      { id: "religious", name: "المواد الشرعية", icon: BookMarked, color: "from-amber-500 to-amber-600" },
      { id: "scientific", name: "المواد العلمية", icon: Beaker, color: "from-blue-500 to-blue-600" },
      { id: "english", name: "الإنجليزية", icon: Languages, color: "from-red-500 to-red-600" },
    ];
  }
  
  if (stage === "secondary" && section === "literary") {
    return [
      { id: "arabic", name: "المواد العربية", icon: BookText, color: "from-emerald-500 to-emerald-600" },
      { id: "religious", name: "المواد الشرعية", icon: BookMarked, color: "from-amber-500 to-amber-600" },
      { id: "literary", name: "المواد الأدبية", icon: FileText, color: "from-indigo-500 to-indigo-600" },
      { id: "english", name: "الإنجليزية", icon: Languages, color: "from-red-500 to-red-600" },
      { id: "french", name: "الفرنسية", icon: Globe, color: "from-pink-500 to-pink-600" },
    ];
  }
  
  // Default
  return [
    { id: "arabic", name: "المواد العربية", icon: BookText, color: "from-emerald-500 to-emerald-600" },
    { id: "religious", name: "المواد الشرعية", icon: BookMarked, color: "from-amber-500 to-amber-600" },
  ];
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats>({ totalMinutes: 0, lessonsWatched: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Onboarding state
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch profile data
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, student_code, stage, grade, section")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
        } else if (profile) {
          setProfileData(profile);
          
          // Check if user needs onboarding (no stage/grade saved)
          if (!profile.stage || !profile.grade) {
            setNeedsOnboarding(true);
          } else {
            setNeedsOnboarding(false);
          }
        }

        // Fetch usage stats
        const { data: usageLogs, error: usageError } = await supabase
          .from("usage_logs")
          .select("duration_minutes, action")
          .eq("user_id", user.id);

        if (usageError) {
          console.error("Error fetching usage:", usageError);
        } else if (usageLogs) {
          const totalMinutes = usageLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
          const lessonsWatched = usageLogs.filter(log => log.action === "watch_video").length;
          setUsageStats({ totalMinutes, lessonsWatched });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

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

  const handleGradeSelect = async (gradeId: string) => {
    setSelectedGrade(gradeId);
    
    // For preparatory stage, save immediately
    if (selectedStage === "preparatory") {
      await saveOnboarding(selectedStage, gradeId, null);
    } else {
      setSelectedSection(null);
    }
  };

  const handleSectionSelect = async (sectionId: string) => {
    setSelectedSection(sectionId);
    if (!selectedStage || !selectedGrade) return;
    await saveOnboarding(selectedStage, selectedGrade, sectionId);
  };

  const saveOnboarding = async (stage: string, grade: string, section: string | null) => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Save to profile
      const { error } = await supabase
        .from("profiles")
        .update({
          stage,
          grade,
          section: section || null,
        })
        .eq("id", user.id);

      if (error) {
        console.error("Error saving profile:", error);
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء حفظ البيانات",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setProfileData(prev => prev ? { ...prev, stage, grade, section } : null);
      setNeedsOnboarding(false);

      toast({
        title: "تم الحفظ",
        description: "تم حفظ بياناتك بنجاح",
      });
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsSaving(false);
    }
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

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleCategoryClick = (categoryId: string) => {
    if (!profileData?.stage || !profileData?.grade) return;
    navigate(`/subjects?stage=${profileData.stage}&grade=${profileData.grade}${profileData.section ? `&section=${profileData.section}` : ""}&category=${categoryId}`);
  };

  const formatTime = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return { hours, minutes };
  };

  const time = formatTime(usageStats.totalMinutes);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Get category buttons for current user
  const categoryButtons = profileData?.stage 
    ? getCategoryButtons(profileData.stage, profileData.section) 
    : [];

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

          <div className="flex items-center gap-2">
            {/* الإشعارات */}
            <NotificationsDropdown />

            {/* عن المنصة */}
            <Button variant="ghost" size="icon" asChild>
              <Link to="/about-platform">
                <Info className="h-5 w-5" />
              </Link>
            </Button>

            {/* الدعم الفني */}
            <Button variant="ghost" size="icon" asChild>
              <Link to="/support">
                <MessageSquare className="h-5 w-5" />
              </Link>
            </Button>

            {/* الإعدادات */}
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent">
              <User className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{profileData?.full_name || user?.email}</span>
            </div>

            <Button variant="ghost" size="icon" onClick={handleSignOut}>
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
                <p className="text-xl font-bold">{profileData?.student_code || "---"}</p>
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
                  {time.hours} ساعة {time.minutes} دقيقة
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
                <p className="text-xl font-bold text-foreground">{usageStats.lessonsWatched} درس</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* عرض أقسام المواد مباشرة */}
        {!needsOnboarding && profileData?.stage && profileData?.grade && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <BookOpen className="h-7 w-7 text-primary" />
              أقسام المواد
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              {categoryButtons.map((category) => {
                const IconComponent = category.icon;
                return (
                  <Card
                    key={category.id}
                    className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 group overflow-hidden"
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    <CardContent className={`p-6 bg-gradient-to-br ${category.color} text-white text-center`}>
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <IconComponent className="h-8 w-8" />
                      </div>
                      <h3 className="text-lg font-bold">{category.name}</h3>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* زر تغيير المرحلة/الصف */}
            <div className="text-center">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setNeedsOnboarding(true);
                  setSelectedStage(null);
                  setSelectedGrade(null);
                  setSelectedSection(null);
                }}
              >
                <Settings className="h-4 w-4 ml-2" />
                تغيير المرحلة أو الصف
              </Button>
            </div>
          </div>
        )}

        {/* Onboarding - اختيار المرحلة والصف للمرة الأولى */}
        {needsOnboarding && (
          <>
            {/* Progress bar */}
            <div className="mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${!selectedStage ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'}`}>
                  ١
                </div>
                <div className={`w-16 h-1 rounded ${selectedStage ? 'bg-primary' : 'bg-muted'}`} />
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${selectedStage && !selectedGrade ? 'bg-primary text-primary-foreground' : selectedGrade ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  ٢
                </div>
                {selectedStage === "secondary" && (
                  <>
                    <div className={`w-16 h-1 rounded ${selectedGrade ? 'bg-primary' : 'bg-muted'}`} />
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${selectedGrade && !selectedSection ? 'bg-primary text-primary-foreground' : selectedSection ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      ٣
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
                <span className={!selectedStage ? 'text-primary font-medium' : ''}>المرحلة</span>
                <span className={selectedStage && !selectedGrade ? 'text-primary font-medium' : ''}>الصف</span>
                {selectedStage === "secondary" && (
                  <span className={selectedGrade && !selectedSection ? 'text-primary font-medium' : ''}>الشعبة</span>
                )}
              </div>
            </div>

            {/* زر الرجوع */}
            {(selectedStage || selectedGrade || selectedSection) && (
              <Button variant="ghost" className="mb-4" onClick={handleBack} disabled={isSaving}>
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

                <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
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
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <BookMarked className="h-7 w-7 text-primary" />
                  اختر صفك الدراسي
                </h2>

                <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
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
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <GraduationCap className="h-7 w-7 text-primary" />
                  اختر شعبتك
                </h2>

                <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
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

            {/* Loading state while saving */}
            {isSaving && (
              <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-lg font-medium">جاري حفظ البيانات...</p>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
