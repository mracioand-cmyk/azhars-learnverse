import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  ChevronLeft,
  Settings,
  LogOut,
  Bell,
  FileText,
  Video,
  Download,
  Play,
  Bot,
  Send,
  Loader2,
  FileQuestion,
  Upload,
} from "lucide-react";

const SubjectPage = () => {
  const navigate = useNavigate();
  const { subjectId } = useParams();
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "مرحباً! أنا المساعد الذكي لمادة النحو. اسألني أي سؤال وسأجيبك من الكتب المرفوعة." },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // بيانات المادة (محاكاة)
  const subjectData = {
    id: subjectId,
    name: "النحو",
    grade: "الصف الثالث الثانوي",
    section: "أدبي",
  };

  const books = [
    { id: 1, title: "كتاب النحو - الجزء الأول", pages: 180, size: "12 MB" },
    { id: 2, title: "كتاب النحو - الجزء الثاني", pages: 156, size: "10 MB" },
    { id: 3, title: "مذكرة شرح النحو", pages: 80, size: "5 MB" },
  ];

  const lessons = [
    { id: 1, title: "إعراب الجمل", duration: "45:30", watched: true },
    { id: 2, title: "المبتدأ والخبر", duration: "38:15", watched: true },
    { id: 3, title: "كان وأخواتها", duration: "52:00", watched: false },
    { id: 4, title: "إن وأخواتها", duration: "41:20", watched: false },
    { id: 5, title: "ظن وأخواتها", duration: "35:45", watched: false },
  ];

  const resources = [
    { id: 1, title: "ملخص الباب الأول", type: "PDF" },
    { id: 2, title: "امتحان تجريبي 2024", type: "PDF" },
    { id: 3, title: "أسئلة الفصل الأول", type: "PDF" },
  ];

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isLoading) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    // محاكاة رد المساعد الذكي
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const assistantResponse =
      "المبتدأ هو الاسم المرفوع في أول الجملة الاسمية، والخبر هو ما يُخبر به عن المبتدأ ويُتمم معنى الجملة. مثال: 'محمدٌ مجتهدٌ' - محمد: مبتدأ مرفوع، مجتهد: خبر مرفوع.\n\n📖 المصدر: كتاب النحو - الباب الثاني، صفحة 45";

    setChatMessages((prev) => [...prev, { role: "assistant", content: assistantResponse }]);
    setIsLoading(false);
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
            </button>

            <button className="p-2 text-muted-foreground hover:text-primary transition-colors">
              <Settings className="h-5 w-5" />
            </button>

            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8">
        {/* زر الرجوع */}
        <Button variant="ghost" className="mb-6" onClick={() => navigate("/subjects")}>
          <ChevronLeft className="h-5 w-5 rotate-180 ml-1" />
          رجوع للمواد
        </Button>

        {/* معلومات المادة */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{subjectData.name}</h1>
          <p className="text-muted-foreground">
            {subjectData.grade} - {subjectData.section}
          </p>
        </div>

        {/* التبويبات */}
        <Tabs defaultValue="books" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="books" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">كتب المادة</span>
            </TabsTrigger>
            <TabsTrigger value="lessons" className="gap-2">
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">شرح الدروس</span>
            </TabsTrigger>
            <TabsTrigger value="resources" className="gap-2">
              <FileQuestion className="h-4 w-4" />
              <span className="hidden sm:inline">ملخصات</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">المساعد الذكي</span>
            </TabsTrigger>
          </TabsList>

          {/* تبويب الكتب */}
          <TabsContent value="books">
            <div className="grid gap-4">
              {books.map((book) => (
                <Card key={book.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-accent">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{book.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {book.pages} صفحة • {book.size}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      تحميل
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* تبويب الدروس */}
          <TabsContent value="lessons">
            <div className="grid gap-4">
              {lessons.map((lesson, index) => (
                <Card
                  key={lesson.id}
                  className={`hover:shadow-md transition-shadow ${lesson.watched ? "border-primary/30" : ""}`}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-lg ${
                          lesson.watched ? "bg-primary text-primary-foreground" : "bg-accent"
                        }`}
                      >
                        <Play className={`h-6 w-6 ${lesson.watched ? "" : "text-primary"}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{lesson.title}</h3>
                          {lesson.watched && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              تمت المشاهدة
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          الدرس {index + 1} • {lesson.duration}
                        </p>
                      </div>
                    </div>
                    <Button variant={lesson.watched ? "outline" : "default"} size="sm">
                      {lesson.watched ? "إعادة المشاهدة" : "مشاهدة"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* تبويب الملخصات */}
          <TabsContent value="resources">
            <div className="grid gap-4">
              {resources.map((resource) => (
                <Card key={resource.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-gold/10">
                        <FileQuestion className="h-6 w-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{resource.title}</h3>
                        <p className="text-sm text-muted-foreground">{resource.type}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      تحميل
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* تبويب المساعد الذكي */}
          <TabsContent value="ai">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  المساعد الذكي - {subjectData.name}
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-4 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-muted text-foreground rounded-tl-none"
                      }`}
                    >
                      <p className="whitespace-pre-line text-sm leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-end">
                    <div className="bg-muted rounded-2xl rounded-tl-none p-4">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  </div>
                )}
              </CardContent>

              <div className="border-t p-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="اكتب سؤالك هنا..."
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Button type="submit" disabled={isLoading || !chatInput.trim()}>
                    <Send className="h-5 w-5" />
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  المساعد الذكي يجيب من الكتب المرفوعة للمادة
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SubjectPage;
