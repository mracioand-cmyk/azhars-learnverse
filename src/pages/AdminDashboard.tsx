import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  BookOpen,
  Users,
  GraduationCap,
  Clock,
  Bell,
  Settings,
  LogOut,
  Search,
  Filter,
  Download,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  Send,
  Trash2,
  ChevronLeft,
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  Activity,
  BarChart3,
  MessageSquare,
  UserCheck,
  UserX,
  FileText,
} from "lucide-react";

// بيانات محاكاة للطلاب
const mockStudents = [
  {
    id: "1",
    name: "أحمد محمد علي",
    code: "123456",
    email: "ahmed@example.com",
    stage: "ثانوي",
    grade: "الصف الثالث",
    section: "علمي",
    status: "active",
    registeredAt: "2024-01-15",
    lastLogin: "2024-12-14",
    totalTime: { hours: 45, minutes: 30 },
    lessonsWatched: 78,
  },
  {
    id: "2",
    name: "محمد عبدالله حسن",
    code: "234567",
    email: "mohamed@example.com",
    stage: "إعدادي",
    grade: "الصف الثاني",
    section: null,
    status: "active",
    registeredAt: "2024-02-20",
    lastLogin: "2024-12-13",
    totalTime: { hours: 32, minutes: 15 },
    lessonsWatched: 52,
  },
  {
    id: "3",
    name: "عمر خالد إبراهيم",
    code: "345678",
    email: "omar@example.com",
    stage: "ثانوي",
    grade: "الصف الأول",
    section: "أدبي",
    status: "suspended",
    registeredAt: "2024-03-10",
    lastLogin: "2024-11-28",
    totalTime: { hours: 18, minutes: 45 },
    lessonsWatched: 25,
  },
  {
    id: "4",
    name: "يوسف أحمد محمود",
    code: "456789",
    email: "youssef@example.com",
    stage: "ثانوي",
    grade: "الصف الثاني",
    section: "علمي",
    status: "active",
    registeredAt: "2024-04-05",
    lastLogin: "2024-12-14",
    totalTime: { hours: 56, minutes: 20 },
    lessonsWatched: 95,
  },
];

// بيانات محاكاة لطلبات المعلمين
const mockTeacherRequests = [
  {
    id: "1",
    name: "د. محمد عبدالرحمن",
    email: "dr.mohamed@example.com",
    phone: "01012345678",
    school: "معهد الأزهر بالقاهرة",
    employeeId: "EMP-2024-001",
    requestedAt: "2024-12-10",
    status: "pending",
  },
  {
    id: "2",
    name: "أ. فاطمة السيد",
    email: "fatma@example.com",
    phone: "01123456789",
    school: "معهد الأزهر بالإسكندرية",
    employeeId: "EMP-2024-002",
    requestedAt: "2024-12-12",
    status: "pending",
  },
  {
    id: "3",
    name: "أ. علي حسين",
    email: "ali@example.com",
    phone: "01234567890",
    school: "معهد الأزهر ببني سويف",
    employeeId: "EMP-2024-003",
    requestedAt: "2024-12-08",
    status: "approved",
  },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<typeof mockStudents[0] | null>(null);
  const [notificationDialog, setNotificationDialog] = useState(false);
  const [notificationTarget, setNotificationTarget] = useState<string | null>(null);
  const [notificationMessage, setNotificationMessage] = useState("");

  // إحصائيات المنصة
  const stats = {
    totalStudents: 1250,
    totalTeachers: 45,
    pendingRequests: mockTeacherRequests.filter(r => r.status === "pending").length,
    totalMessages: 23,
    activeToday: 320,
    totalLessons: 156,
  };

  // تصفية الطلاب
  const filteredStudents = mockStudents.filter(student => {
    const matchesSearch = student.name.includes(searchTerm) || 
                         student.code.includes(searchTerm) ||
                         student.email.includes(searchTerm);
    const matchesStage = stageFilter === "all" || student.stage === stageFilter;
    const matchesStatus = statusFilter === "all" || student.status === statusFilter;
    return matchesSearch && matchesStage && matchesStatus;
  });

  // تصفية طلبات المعلمين
  const pendingTeachers = mockTeacherRequests.filter(t => t.status === "pending");

  const handleApproveTeacher = (teacherId: string) => {
    toast({
      title: "تم قبول المعلم",
      description: "تم إرسال إشعار للمعلم بقبول طلبه",
    });
  };

  const handleRejectTeacher = (teacherId: string) => {
    toast({
      title: "تم رفض الطلب",
      description: "تم إرسال إشعار للمعلم برفض طلبه",
      variant: "destructive",
    });
  };

  const handleToggleBan = (studentId: string, currentStatus: string) => {
    const action = currentStatus === "active" ? "حظر" : "فك حظر";
    toast({
      title: `تم ${action} الطالب`,
      description: `تم ${action} الطالب بنجاح`,
    });
  };

  const handleSendNotification = () => {
    if (!notificationMessage.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى كتابة رسالة الإشعار",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "تم إرسال الإشعار",
      description: notificationTarget ? `تم إرسال الإشعار للطالب ${notificationTarget}` : "تم إرسال الإشعار لجميع الطلاب",
    });
    setNotificationDialog(false);
    setNotificationMessage("");
    setNotificationTarget(null);
  };

  const exportToCSV = () => {
    toast({
      title: "جاري التصدير",
      description: "سيتم تنزيل ملف CSV قريباً",
    });
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
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gradient-azhari">أزهاريون</span>
              <span className="text-xs text-muted-foreground">لوحة تحكم المطور</span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-muted-foreground hover:text-primary transition-colors">
              <Bell className="h-5 w-5" />
              {stats.pendingRequests > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                  {stats.pendingRequests}
                </span>
              )}
            </button>

            <button className="p-2 text-muted-foreground hover:text-primary transition-colors">
              <Settings className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent">
              <div className="h-8 w-8 rounded-full gradient-azhari flex items-center justify-center">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">علي محمد علي</span>
                <span className="text-xs text-muted-foreground">مطور</span>
              </div>
            </div>

            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">نظرة عامة</span>
            </TabsTrigger>
            <TabsTrigger value="students" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">الطلاب</span>
            </TabsTrigger>
            <TabsTrigger value="teachers" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">المعلمين</span>
              {stats.pendingRequests > 0 && (
                <Badge variant="destructive" className="h-5 px-1.5">
                  {stats.pendingRequests}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">الإشعارات</span>
            </TabsTrigger>
          </TabsList>

          {/* نظرة عامة */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-gradient-to-l from-primary to-azhari-dark text-primary-foreground">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-primary-foreground/70">إجمالي الطلاب</p>
                      <p className="text-3xl font-bold">{stats.totalStudents}</p>
                    </div>
                    <Users className="h-10 w-10 text-primary-foreground/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-l from-gold to-gold-dark">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-70">إجمالي المعلمين</p>
                      <p className="text-3xl font-bold">{stats.totalTeachers}</p>
                    </div>
                    <GraduationCap className="h-10 w-10 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">طلبات قيد الانتظار</p>
                      <p className="text-3xl font-bold text-destructive">{stats.pendingRequests}</p>
                    </div>
                    <Clock className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">نشط اليوم</p>
                      <p className="text-3xl font-bold text-primary">{stats.activeToday}</p>
                    </div>
                    <Activity className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* آخر طلبات المعلمين */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" />
                  طلبات المعلمين الجديدة
                </CardTitle>
                <CardDescription>طلبات التسجيل قيد المراجعة</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingTeachers.length > 0 ? (
                  <div className="space-y-4">
                    {pendingTeachers.map((teacher) => (
                      <div key={teacher.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center">
                            <GraduationCap className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{teacher.name}</p>
                            <p className="text-sm text-muted-foreground">{teacher.school}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleApproveTeacher(teacher.id)}
                            className="gap-1"
                          >
                            <CheckCircle className="h-4 w-4" />
                            قبول
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleRejectTeacher(teacher.id)}
                            className="gap-1"
                          >
                            <XCircle className="h-4 w-4" />
                            رفض
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">لا توجد طلبات جديدة</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* إدارة الطلاب */}
          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      قائمة الطلاب
                    </CardTitle>
                    <CardDescription>إدارة وعرض بيانات جميع الطلاب المسجلين</CardDescription>
                  </div>
                  <Button onClick={exportToCSV} variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    تصدير CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* أدوات البحث والفلترة */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="بحث بالاسم أو الكود أو البريد..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                  <Select value={stageFilter} onValueChange={setStageFilter}>
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="المرحلة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع المراحل</SelectItem>
                      <SelectItem value="إعدادي">إعدادي</SelectItem>
                      <SelectItem value="ثانوي">ثانوي</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحالات</SelectItem>
                      <SelectItem value="active">مفعل</SelectItem>
                      <SelectItem value="suspended">موقوف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* جدول الطلاب */}
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-right">الاسم</TableHead>
                        <TableHead className="text-right">الكود</TableHead>
                        <TableHead className="text-right">البريد</TableHead>
                        <TableHead className="text-right">المرحلة</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">تاريخ التسجيل</TableHead>
                        <TableHead className="text-right">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>
                            <code className="px-2 py-1 rounded bg-accent text-sm">
                              {student.code}
                            </code>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{student.email}</TableCell>
                          <TableCell>{student.stage} - {student.grade}</TableCell>
                          <TableCell>
                            <Badge variant={student.status === "active" ? "default" : "destructive"}>
                              {student.status === "active" ? "مفعل" : "موقوف"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{student.registeredAt}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    size="icon" 
                                    variant="ghost"
                                    onClick={() => setSelectedStudent(student)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-lg">
                                  <DialogHeader>
                                    <DialogTitle>تفاصيل الطالب</DialogTitle>
                                  </DialogHeader>
                                  {selectedStudent && (
                                    <div className="space-y-4">
                                      <div className="flex items-center gap-4 p-4 rounded-lg bg-accent">
                                        <div className="h-16 w-16 rounded-full gradient-azhari flex items-center justify-center">
                                          <User className="h-8 w-8 text-primary-foreground" />
                                        </div>
                                        <div>
                                          <h3 className="text-lg font-bold">{selectedStudent.name}</h3>
                                          <p className="text-muted-foreground">كود: {selectedStudent.code}</p>
                                        </div>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Mail className="h-4 w-4" /> البريد
                                          </p>
                                          <p className="font-medium">{selectedStudent.email}</p>
                                        </div>
                                        <div className="space-y-1">
                                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-4 w-4" /> تاريخ التسجيل
                                          </p>
                                          <p className="font-medium">{selectedStudent.registeredAt}</p>
                                        </div>
                                        <div className="space-y-1">
                                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-4 w-4" /> وقت الاستخدام
                                          </p>
                                          <p className="font-medium">
                                            {selectedStudent.totalTime.hours} ساعة {selectedStudent.totalTime.minutes} دقيقة
                                          </p>
                                        </div>
                                        <div className="space-y-1">
                                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Activity className="h-4 w-4" /> آخر دخول
                                          </p>
                                          <p className="font-medium">{selectedStudent.lastLogin}</p>
                                        </div>
                                        <div className="space-y-1">
                                          <p className="text-sm text-muted-foreground">الدروس المشاهدة</p>
                                          <p className="font-medium">{selectedStudent.lessonsWatched} درس</p>
                                        </div>
                                        <div className="space-y-1">
                                          <p className="text-sm text-muted-foreground">المرحلة والصف</p>
                                          <p className="font-medium">
                                            {selectedStudent.stage} - {selectedStudent.grade}
                                            {selectedStudent.section && ` (${selectedStudent.section})`}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>

                              <Button 
                                size="icon" 
                                variant="ghost"
                                onClick={() => {
                                  setNotificationTarget(student.code);
                                  setNotificationDialog(true);
                                }}
                              >
                                <Send className="h-4 w-4" />
                              </Button>

                              <Button 
                                size="icon" 
                                variant={student.status === "active" ? "destructive" : "default"}
                                onClick={() => handleToggleBan(student.id, student.status)}
                              >
                                {student.status === "active" ? 
                                  <Ban className="h-4 w-4" /> : 
                                  <CheckCircle className="h-4 w-4" />
                                }
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* إدارة المعلمين */}
          <TabsContent value="teachers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  طلبات تسجيل المعلمين
                </CardTitle>
                <CardDescription>مراجعة وقبول أو رفض طلبات المعلمين الجدد</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockTeacherRequests.map((teacher) => (
                    <div 
                      key={teacher.id} 
                      className={`p-6 rounded-lg border ${
                        teacher.status === "pending" ? "bg-card" : "bg-muted/30"
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="h-14 w-14 rounded-full bg-accent flex items-center justify-center shrink-0">
                            <GraduationCap className="h-7 w-7 text-primary" />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-lg">{teacher.name}</h3>
                              <Badge variant={
                                teacher.status === "pending" ? "secondary" :
                                teacher.status === "approved" ? "default" : "destructive"
                              }>
                                {teacher.status === "pending" ? "قيد المراجعة" :
                                 teacher.status === "approved" ? "مقبول" : "مرفوض"}
                              </Badge>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                              <p className="flex items-center gap-1">
                                <Mail className="h-4 w-4" />
                                {teacher.email}
                              </p>
                              <p className="flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                {teacher.phone}
                              </p>
                              <p className="flex items-center gap-1">
                                <Building className="h-4 w-4" />
                                {teacher.school}
                              </p>
                              <p className="flex items-center gap-1">
                                <FileText className="h-4 w-4" />
                                {teacher.employeeId}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              تاريخ الطلب: {teacher.requestedAt}
                            </p>
                          </div>
                        </div>

                        {teacher.status === "pending" && (
                          <div className="flex gap-2 self-end lg:self-center">
                            <Button 
                              onClick={() => handleApproveTeacher(teacher.id)}
                              className="gap-2"
                            >
                              <CheckCircle className="h-4 w-4" />
                              قبول الطلب
                            </Button>
                            <Button 
                              variant="destructive"
                              onClick={() => handleRejectTeacher(teacher.id)}
                              className="gap-2"
                            >
                              <XCircle className="h-4 w-4" />
                              رفض
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* الإشعارات */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  إرسال الإشعارات
                </CardTitle>
                <CardDescription>إرسال إشعارات للطلاب بشكل فردي أو جماعي</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* إرسال لطالب محدد */}
                  <Card className="border-2">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold">إرسال لطالب محدد</h3>
                          <p className="text-sm text-muted-foreground">أدخل كود الطالب</p>
                        </div>
                      </div>
                      <Input placeholder="أدخل كود الطالب (مثال: 123456)" />
                      <textarea 
                        className="w-full min-h-24 p-3 rounded-lg border bg-background resize-none"
                        placeholder="اكتب رسالة الإشعار..."
                      />
                      <Button className="w-full gap-2">
                        <Send className="h-4 w-4" />
                        إرسال الإشعار
                      </Button>
                    </CardContent>
                  </Card>

                  {/* إرسال للجميع */}
                  <Card className="border-2 border-primary/20">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full gradient-azhari flex items-center justify-center">
                          <Users className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="font-bold">إرسال لجميع الطلاب</h3>
                          <p className="text-sm text-muted-foreground">إشعار جماعي</p>
                        </div>
                      </div>
                      <textarea 
                        className="w-full min-h-24 p-3 rounded-lg border bg-background resize-none"
                        placeholder="اكتب رسالة الإشعار للجميع..."
                      />
                      <Button className="w-full gap-2" variant="gold">
                        <Send className="h-4 w-4" />
                        إرسال للجميع
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialog للإشعارات */}
      <Dialog open={notificationDialog} onOpenChange={setNotificationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إرسال إشعار</DialogTitle>
            <DialogDescription>
              {notificationTarget ? `إرسال إشعار للطالب ${notificationTarget}` : "إرسال إشعار لجميع الطلاب"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <textarea 
              className="w-full min-h-24 p-3 rounded-lg border bg-background resize-none"
              placeholder="اكتب رسالة الإشعار..."
              value={notificationMessage}
              onChange={(e) => setNotificationMessage(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotificationDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSendNotification} className="gap-2">
              <Send className="h-4 w-4" />
              إرسال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};// لوحة المطور - تعديل يدوي من GitHub

export default AdminDashboard;
// ===== بيانات لوحة المطور (مؤقتة – هتتربط بقاعدة البيانات) =====
  const [stats, setStats] = React.useState({
    users: 0,
    todayUsers: 0,
    countries: 0,
  });

  React.useEffect(() => {
    // بيانات مؤقتة للتجربة
    setStats({
      users: 0,
      todayUsers: 0,
      countries: 0,
    });
  }, []);
