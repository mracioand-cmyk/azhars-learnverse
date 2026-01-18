import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Search,
  CreditCard,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  BookOpen,
  ChevronLeft,
  Plus,
  RefreshCw,
  Loader2,
  GraduationCap,
  Settings,
  User,
} from "lucide-react";

// Types
interface Student {
  id: string;
  full_name: string;
  email: string;
  student_code: string | null;
  stage: string | null;
  grade: string | null;
  section: string | null;
}

interface Subject {
  id: string;
  name: string;
  stage: string;
  grade: string;
  section: string | null;
}

interface Subscription {
  id: string;
  student_id: string;
  subject_id: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  renewal_count: number;
  subjects?: Subject;
  profiles?: Student;
}

const SubscriptionsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("manage");

  // Manage Subscription State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentSubjects, setStudentSubjects] = useState<Subject[]>([]);
  const [studentSubscriptions, setStudentSubscriptions] = useState<Subscription[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [duration, setDuration] = useState<string>("30");
  const [customEndDate, setCustomEndDate] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // View Subscriptions State
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);

  // Search Status State
  const [statusSearchQuery, setStatusSearchQuery] = useState("");
  const [statusSearchResult, setStatusSearchResult] = useState<{
    student: Student;
    subscriptions: Subscription[];
  } | null>(null);
  const [isStatusSearching, setIsStatusSearching] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({
    whatsapp: "",
    price: "",
    currency: "جنيه",
    message: "",
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Load initial data
  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("key, value")
        .in("key", [
          "subscription_whatsapp",
          "subscription_default_price",
          "subscription_currency",
          "subscription_default_message",
        ]);

      if (data) {
        const settingsMap: Record<string, string> = {};
        data.forEach((item) => {
          if (item.value) settingsMap[item.key] = item.value;
        });
        setSettings({
          whatsapp: settingsMap.subscription_whatsapp || "",
          price: settingsMap.subscription_default_price || "",
          currency: settingsMap.subscription_currency || "جنيه",
          message: settingsMap.subscription_default_message || "",
        });
      }
      setLoading(false);
    };

    fetchSettings();
  }, []);

  // Search students
  const searchStudents = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, student_code, stage, grade, section")
        .or(`full_name.ilike.%${searchQuery}%,student_code.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(20);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error("Error searching students:", error);
      toast.error("خطأ في البحث");
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // Select student for subscription management
  const selectStudent = async (student: Student) => {
    setSelectedStudent(student);
    setSearchResults([]);
    setSearchQuery("");
    setSelectedSubjects([]);

    // Fetch subjects for student's grade
    const { data: subjects } = await supabase
      .from("subjects")
      .select("id, name, stage, grade, section")
      .eq("is_active", true)
      .order("name");

    setStudentSubjects(subjects || []);

    // Fetch existing subscriptions
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("student_id", student.id);

    setStudentSubscriptions(subs || []);
  };

  // Check if student has active subscription for subject
  const hasActiveSubscription = (subjectId: string) => {
    const sub = studentSubscriptions.find((s) => s.subject_id === subjectId);
    if (!sub) return false;
    return sub.is_active && new Date(sub.end_date) > new Date();
  };

  // Get subscription end date for subject
  const getSubscriptionEndDate = (subjectId: string) => {
    const sub = studentSubscriptions.find((s) => s.subject_id === subjectId);
    if (!sub || !sub.is_active) return null;
    const endDate = new Date(sub.end_date);
    if (endDate <= new Date()) return null;
    return endDate;
  };

  // Toggle subject selection
  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  // Save subscriptions
  const saveSubscriptions = async () => {
    if (!selectedStudent || selectedSubjects.length === 0) {
      toast.error("يرجى اختيار مادة واحدة على الأقل");
      return;
    }

    setIsSaving(true);
    try {
      const endDate =
        duration === "custom"
          ? new Date(customEndDate)
          : new Date(Date.now() + parseInt(duration) * 24 * 60 * 60 * 1000);

      for (const subjectId of selectedSubjects) {
        const existingSub = studentSubscriptions.find(
          (s) => s.subject_id === subjectId
        );

        if (existingSub) {
          // Update existing subscription
          await supabase
            .from("subscriptions")
            .update({
              end_date: endDate.toISOString(),
              is_active: true,
              renewal_count: existingSub.renewal_count + 1,
            })
            .eq("id", existingSub.id);
        } else {
          // Create new subscription
          await supabase.from("subscriptions").insert({
            student_id: selectedStudent.id,
            subject_id: subjectId,
            start_date: new Date().toISOString(),
            end_date: endDate.toISOString(),
            is_active: true,
            created_by: user?.id,
          });
        }
      }

      toast.success("تم تفعيل الاشتراكات بنجاح");
      setSelectedSubjects([]);
      
      // Refresh subscriptions
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("student_id", selectedStudent.id);
      setStudentSubscriptions(subs || []);
    } catch (error) {
      console.error("Error saving subscriptions:", error);
      toast.error("خطأ في حفظ الاشتراكات");
    } finally {
      setIsSaving(false);
    }
  };

  // Deactivate subscription
  const deactivateSubscription = async (subscriptionId: string) => {
    try {
      await supabase
        .from("subscriptions")
        .update({ is_active: false })
        .eq("id", subscriptionId);

      toast.success("تم إلغاء الاشتراك");

      if (selectedStudent) {
        const { data: subs } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("student_id", selectedStudent.id);
        setStudentSubscriptions(subs || []);
      }
    } catch (error) {
      console.error("Error deactivating subscription:", error);
      toast.error("خطأ في إلغاء الاشتراك");
    }
  };

  // Fetch subscriptions by filters
  const fetchSubscriptionsByFilters = useCallback(async () => {
    setLoadingSubscriptions(true);
    try {
      // First get subjects based on filters
      let subjectsQuery = supabase.from("subjects").select("id, name, stage, grade, section");
      
      if (stageFilter !== "all") {
        subjectsQuery = subjectsQuery.eq("stage", stageFilter);
      }
      if (gradeFilter !== "all") {
        subjectsQuery = subjectsQuery.eq("grade", gradeFilter);
      }
      if (sectionFilter !== "all") {
        subjectsQuery = subjectsQuery.eq("section", sectionFilter);
      }

      const { data: subjects } = await subjectsQuery;
      const subjectIds = subjects?.map((s) => s.id) || [];

      if (subjectIds.length === 0) {
        setSubscriptions([]);
        setLoadingSubscriptions(false);
        return;
      }

      // Get subscriptions for these subjects
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("*")
        .in("subject_id", subjectIds)
        .eq("is_active", true);

      // Get unique student IDs
      const studentIds = [...new Set(subs?.map((s) => s.student_id) || [])];

      // Fetch student profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, student_code, stage, grade, section")
        .in("id", studentIds);

      // Combine data
      const enrichedSubs = subs?.map((sub) => ({
        ...sub,
        subjects: subjects?.find((s) => s.id === sub.subject_id),
        profiles: profiles?.find((p) => p.id === sub.student_id),
      })) || [];

      setSubscriptions(enrichedSubs);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      toast.error("خطأ في تحميل الاشتراكات");
    } finally {
      setLoadingSubscriptions(false);
    }
  }, [stageFilter, gradeFilter, sectionFilter]);

  useEffect(() => {
    if (activeTab === "view") {
      fetchSubscriptionsByFilters();
    }
  }, [activeTab, fetchSubscriptionsByFilters]);

  // Search subscription status
  const searchSubscriptionStatus = async () => {
    if (!statusSearchQuery.trim()) return;

    setIsStatusSearching(true);
    try {
      const { data: students } = await supabase
        .from("profiles")
        .select("id, full_name, email, student_code, stage, grade, section")
        .or(`student_code.ilike.%${statusSearchQuery}%,full_name.ilike.%${statusSearchQuery}%`)
        .limit(1);

      if (!students || students.length === 0) {
        toast.error("لم يتم العثور على الطالب");
        setStatusSearchResult(null);
        return;
      }

      const student = students[0];

      // Fetch subscriptions with subject details
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("student_id", student.id);

      // Fetch subject details
      const subjectIds = subs?.map((s) => s.subject_id) || [];
      const { data: subjects } = await supabase
        .from("subjects")
        .select("id, name, stage, grade, section")
        .in("id", subjectIds);

      const enrichedSubs = subs?.map((sub) => ({
        ...sub,
        subjects: subjects?.find((s) => s.id === sub.subject_id),
      })) || [];

      setStatusSearchResult({ student, subscriptions: enrichedSubs });
    } catch (error) {
      console.error("Error searching subscription status:", error);
      toast.error("خطأ في البحث");
    } finally {
      setIsStatusSearching(false);
    }
  };

  // Save settings
  const saveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const updates = [
        { key: "subscription_whatsapp", value: settings.whatsapp },
        { key: "subscription_default_price", value: settings.price },
        { key: "subscription_currency", value: settings.currency },
        { key: "subscription_default_message", value: settings.message },
      ];

      for (const update of updates) {
        await supabase
          .from("platform_settings")
          .update({ value: update.value })
          .eq("key", update.key);
      }

      toast.success("تم حفظ الإعدادات");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("خطأ في حفظ الإعدادات");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Format dates
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate("/admin")}>
            <ChevronLeft className="h-5 w-5 rotate-180" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">إدارة الاشتراكات</h1>
            <p className="text-muted-foreground">إدارة اشتراكات الطلاب في المواد</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="manage" className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">تفعيل اشتراك</span>
            </TabsTrigger>
            <TabsTrigger value="view" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">عرض المشتركين</span>
            </TabsTrigger>
            <TabsTrigger value="status" className="gap-2">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">بحث حالة</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">الإعدادات</span>
            </TabsTrigger>
          </TabsList>

          {/* Manage Subscriptions Tab */}
          <TabsContent value="manage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  تفعيل / إدارة اشتراك طالب
                </CardTitle>
                <CardDescription>
                  ابحث عن طالب بالاسم أو كود الطالب لتفعيل اشتراكه
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="ابحث باسم الطالب أو كود الطالب..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && searchStudents()}
                      className="pr-10"
                    />
                  </div>
                  <Button onClick={searchStudents} disabled={isSearching}>
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "بحث"
                    )}
                  </Button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <Card>
                    <CardContent className="p-2">
                      <ScrollArea className="max-h-60">
                        {searchResults.map((student) => (
                          <button
                            key={student.id}
                            onClick={() => selectStudent(student)}
                            className="w-full p-3 text-right hover:bg-accent rounded-lg transition-colors flex items-center gap-3"
                          >
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{student.full_name}</p>
                              <p className="text-sm text-muted-foreground truncate">
                                {student.student_code || student.email}
                              </p>
                            </div>
                            {student.grade && (
                              <Badge variant="secondary">{student.grade}</Badge>
                            )}
                          </button>
                        ))}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}

                {/* Selected Student */}
                {selectedStudent && (
                  <div className="space-y-4">
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                            <GraduationCap className="h-6 w-6 text-primary-foreground" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{selectedStudent.full_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {selectedStudent.student_code && `كود: ${selectedStudent.student_code} • `}
                              {selectedStudent.grade && `${selectedStudent.grade}`}
                              {selectedStudent.section && ` • ${selectedStudent.section}`}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedStudent(null)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Subjects Selection */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">اختر المواد للاشتراك</Label>
                      <div className="grid gap-2 max-h-[300px] overflow-y-auto">
                        {studentSubjects.map((subject) => {
                          const isSubscribed = hasActiveSubscription(subject.id);
                          const endDate = getSubscriptionEndDate(subject.id);
                          const subscription = studentSubscriptions.find(
                            (s) => s.subject_id === subject.id
                          );

                          return (
                            <div
                              key={subject.id}
                              className={`p-3 rounded-lg border transition-colors ${
                                isSubscribed
                                  ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                                  : selectedSubjects.includes(subject.id)
                                  ? "bg-primary/10 border-primary"
                                  : "hover:bg-accent"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={selectedSubjects.includes(subject.id)}
                                  onCheckedChange={() => toggleSubject(subject.id)}
                                  disabled={isSubscribed}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{subject.name}</span>
                                    {isSubscribed && (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {subject.stage} - {subject.grade}
                                    {subject.section && ` - ${subject.section}`}
                                  </p>
                                </div>
                                {isSubscribed && endDate && (
                                  <div className="text-left">
                                    <p className="text-xs text-green-600 font-medium">
                                      مشترك حتى {formatDate(endDate.toISOString())}
                                    </p>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 text-xs text-destructive hover:text-destructive"
                                      onClick={() =>
                                        subscription && deactivateSubscription(subscription.id)
                                      }
                                    >
                                      إلغاء
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Duration Selection */}
                    {selectedSubjects.length > 0 && (
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">مدة الاشتراك</Label>
                        <Select value={duration} onValueChange={setDuration}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 يوم</SelectItem>
                            <SelectItem value="60">60 يوم</SelectItem>
                            <SelectItem value="90">90 يوم</SelectItem>
                            <SelectItem value="180">180 يوم (6 أشهر)</SelectItem>
                            <SelectItem value="365">365 يوم (سنة)</SelectItem>
                            <SelectItem value="custom">تاريخ مخصص</SelectItem>
                          </SelectContent>
                        </Select>

                        {duration === "custom" && (
                          <Input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                          />
                        )}

                        <Button
                          onClick={saveSubscriptions}
                          disabled={isSaving}
                          className="w-full"
                        >
                          {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin ml-2" />
                          ) : (
                            <CheckCircle className="h-4 w-4 ml-2" />
                          )}
                          تفعيل الاشتراك ({selectedSubjects.length} مادة)
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* View Subscriptions Tab */}
          <TabsContent value="view" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  عرض المشتركين
                </CardTitle>
                <CardDescription>
                  عرض الطلاب المشتركين حسب المرحلة والصف
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Select value={stageFilter} onValueChange={setStageFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="المرحلة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع المراحل</SelectItem>
                      <SelectItem value="preparatory">إعدادي</SelectItem>
                      <SelectItem value="secondary">ثانوي</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={gradeFilter} onValueChange={setGradeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="الصف" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الصفوف</SelectItem>
                      <SelectItem value="first">الصف الأول</SelectItem>
                      <SelectItem value="second">الصف الثاني</SelectItem>
                      <SelectItem value="third">الصف الثالث</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sectionFilter} onValueChange={setSectionFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="القسم" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الأقسام</SelectItem>
                      <SelectItem value="scientific">علمي</SelectItem>
                      <SelectItem value="literary">أدبي</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    onClick={fetchSubscriptionsByFilters}
                    disabled={loadingSubscriptions}
                  >
                    {loadingSubscriptions ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    تحديث
                  </Button>
                </div>

                {/* Subscriptions Table */}
                {loadingSubscriptions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : subscriptions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    لا يوجد مشتركين في هذا التصنيف
                  </div>
                ) : (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>الطالب</TableHead>
                          <TableHead>كود الطالب</TableHead>
                          <TableHead>المادة</TableHead>
                          <TableHead>تاريخ الانتهاء</TableHead>
                          <TableHead>الحالة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subscriptions.map((sub) => {
                          const daysRemaining = getDaysRemaining(sub.end_date);
                          const isExpired = daysRemaining <= 0;

                          return (
                            <TableRow key={sub.id}>
                              <TableCell className="font-medium">
                                {sub.profiles?.full_name || "غير معروف"}
                              </TableCell>
                              <TableCell>
                                {sub.profiles?.student_code || "-"}
                              </TableCell>
                              <TableCell>{sub.subjects?.name || "غير معروف"}</TableCell>
                              <TableCell>{formatDate(sub.end_date)}</TableCell>
                              <TableCell>
                                {isExpired ? (
                                  <Badge variant="destructive">منتهي</Badge>
                                ) : daysRemaining <= 7 ? (
                                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                    {daysRemaining} يوم متبقي
                                  </Badge>
                                ) : (
                                  <Badge variant="default" className="bg-green-100 text-green-800">
                                    نشط ({daysRemaining} يوم)
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Status Search Tab */}
          <TabsContent value="status" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  بحث حالة الاشتراك
                </CardTitle>
                <CardDescription>
                  ابحث بكود الطالب لعرض حالة اشتراكاته
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="أدخل كود الطالب..."
                      value={statusSearchQuery}
                      onChange={(e) => setStatusSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && searchSubscriptionStatus()}
                      className="pr-10"
                    />
                  </div>
                  <Button onClick={searchSubscriptionStatus} disabled={isStatusSearching}>
                    {isStatusSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "بحث"
                    )}
                  </Button>
                </div>

                {statusSearchResult && (
                  <div className="space-y-4">
                    {/* Student Info */}
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                            <GraduationCap className="h-6 w-6 text-primary-foreground" />
                          </div>
                          <div>
                            <h3 className="font-semibold">
                              {statusSearchResult.student.full_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              كود: {statusSearchResult.student.student_code || "غير محدد"} •{" "}
                              {statusSearchResult.student.grade || ""}
                              {statusSearchResult.student.section &&
                                ` • ${statusSearchResult.student.section}`}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Subscriptions */}
                    {statusSearchResult.subscriptions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        لا توجد اشتراكات لهذا الطالب
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {statusSearchResult.subscriptions.map((sub) => {
                          const daysRemaining = getDaysRemaining(sub.end_date);
                          const isExpired = daysRemaining <= 0;

                          return (
                            <Card key={sub.id}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <BookOpen className="h-5 w-5 text-primary" />
                                    <div>
                                      <p className="font-medium">
                                        {sub.subjects?.name || "مادة غير معروفة"}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {sub.subjects?.stage} - {sub.subjects?.grade}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-left">
                                    <div className="flex items-center gap-2">
                                      {isExpired ? (
                                        <Badge variant="destructive">منتهي</Badge>
                                      ) : (
                                        <Badge
                                          variant="default"
                                          className="bg-green-100 text-green-800"
                                        >
                                          نشط
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      من {formatDate(sub.start_date)} إلى{" "}
                                      {formatDate(sub.end_date)}
                                    </p>
                                    {!isExpired && (
                                      <p className="text-xs font-medium text-primary mt-1">
                                        {daysRemaining} يوم متبقي
                                      </p>
                                    )}
                                    {sub.renewal_count > 0 && (
                                      <p className="text-xs text-muted-foreground">
                                        تم التجديد {sub.renewal_count} مرة
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  إعدادات الاشتراك والدفع
                </CardTitle>
                <CardDescription>
                  تخصيص رسالة الاشتراك ومعلومات التواصل
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>رقم واتساب للتواصل</Label>
                    <Input
                      value={settings.whatsapp}
                      onChange={(e) =>
                        setSettings({ ...settings, whatsapp: e.target.value })
                      }
                      placeholder="01223909712"
                      dir="ltr"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>سعر الاشتراك الافتراضي</Label>
                      <Input
                        value={settings.price}
                        onChange={(e) =>
                          setSettings({ ...settings, price: e.target.value })
                        }
                        placeholder="100"
                        type="number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>العملة</Label>
                      <Input
                        value={settings.currency}
                        onChange={(e) =>
                          setSettings({ ...settings, currency: e.target.value })
                        }
                        placeholder="جنيه"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>رسالة واتساب الافتراضية</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      المتغيرات المتاحة: {"{subject}"} - {"{grade}"} - {"{stage}"} -{" "}
                      {"{section}"} - {"{student_id}"}
                    </p>
                    <textarea
                      className="w-full min-h-[120px] p-3 rounded-lg border border-input bg-background resize-none"
                      value={settings.message}
                      onChange={(e) =>
                        setSettings({ ...settings, message: e.target.value })
                      }
                      placeholder={`مرحبًا، أريد الاشتراك في:
المادة: {subject}
الصف: {grade}
المرحلة: {stage}
القسم: {section}
ID الطالب: {student_id}`}
                    />
                  </div>
                </div>

                <Button
                  onClick={saveSettings}
                  disabled={isSavingSettings}
                  className="w-full"
                >
                  {isSavingSettings ? (
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 ml-2" />
                  )}
                  حفظ الإعدادات
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SubscriptionsPage;
