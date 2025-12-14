import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen,
  ChevronLeft,
  User,
  Settings,
  LogOut,
  Bell,
  Book,
  ScrollText,
  Calculator,
  Atom,
} from "lucide-react";

const Subjects = () => {
  const navigate = useNavigate();

  const categories = [
    {
      id: "arabic",
      name: "المواد العربية",
      icon: "📝",
      color: "from-primary to-azhari-dark",
      subjects: [
        { id: "nahw", name: "النحو", icon: Book },
        { id: "sarf", name: "الصرف", icon: Book },
        { id: "adab", name: "الأدب", icon: ScrollText },
        { id: "nosoos", name: "النصوص", icon: ScrollText },
        { id: "balagha", name: "البلاغة", icon: Book },
        { id: "motalaa", name: "المطالعة", icon: Book },
        { id: "inshaa", name: "الإنشاء", icon: ScrollText },
      ],
    },
    {
      id: "sharia",
      name: "المواد الشرعية",
      icon: "🕌",
      color: "from-gold to-gold-dark",
      subjects: [
        { id: "fiqh", name: "الفقه", icon: Book },
        { id: "tawheed", name: "التوحيد", icon: Book },
        { id: "tafseer", name: "التفسير", icon: ScrollText },
      ],
    },
    {
      id: "literary",
      name: "المواد الأدبية",
      icon: "📚",
      color: "from-purple-600 to-purple-800",
      subjects: [
        { id: "english", name: "اللغة الإنجليزية", icon: Book },
        { id: "second-lang", name: "اللغة الثانية", icon: Book },
        { id: "philosophy", name: "الفلسفة", icon: ScrollText },
        { id: "history", name: "التاريخ", icon: ScrollText },
        { id: "geography", name: "الجغرافيا", icon: ScrollText },
      ],
    },
    {
      id: "math",
      name: "الرياضيات",
      icon: "🔢",
      color: "from-blue-600 to-blue-800",
      subjects: [{ id: "math", name: "الرياضيات", icon: Calculator }],
    },
  ];

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

            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8">
        {/* زر الرجوع */}
        <Button variant="ghost" className="mb-6" onClick={() => navigate("/dashboard")}>
          <ChevronLeft className="h-5 w-5 rotate-180 ml-1" />
          رجوع للوحة التحكم
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-2">المواد الدراسية</h1>
        <p className="text-muted-foreground mb-8">الصف الثالث الثانوي - القسم الأدبي</p>

        {/* أقسام المواد */}
        <div className="space-y-8">
          {categories.map((category, catIndex) => (
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
                    style={{ animationDelay: `${(catIndex * 0.1) + (subIndex * 0.05)}s` }}
                    onClick={() => navigate(`/subject/${subject.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg bg-gradient-to-bl ${category.color} text-white`}>
                          <subject.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {subject.name}
                          </h3>
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
      </main>
    </div>
  );
};

export default Subjects;
