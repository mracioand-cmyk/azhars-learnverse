import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/manualClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  MessageSquare,
  Send,
  Loader2,
  ArrowRight,
  BookOpen,
  User,
  Phone,
  Mail,
} from "lucide-react";

interface Message {
  id: string;
  message: string;
  is_from_admin: boolean;
  created_at: string;
}

const StudentSupportPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadMessages = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel("support-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setSending(true);
    try {
      const { error } = await supabase.from("support_messages").insert({
        user_id: user.id,
        message: newMessage.trim(),
        is_from_admin: false,
      });

      if (error) throw error;

      setNewMessage("");
      toast.success("تم إرسال رسالتك");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("خطأ في إرسال الرسالة");
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ar-EG", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-azhari shadow-azhari">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-gradient-azhari">أزهاريون</span>
          </Link>

          <Button variant="ghost" asChild>
            <Link to="/dashboard" className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              العودة للرئيسية
            </Link>
          </Button>
        </div>
      </header>

      <main className="container px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <MessageSquare className="h-7 w-7 text-primary" />
            الدعم الفني
          </h1>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* معلومات التواصل */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">معلومات التواصل</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">المطور</p>
                    <p className="font-medium">علي محمد علي</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                    <a
                      href="mailto:alyedaft@gmail.com"
                      className="font-medium text-primary hover:underline"
                    >
                      alyedaft@gmail.com
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">واتساب</p>
                    <a
                      href="https://wa.me/201223909712"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      01223909712
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* نافذة المحادثة */}
            <Card className="lg:col-span-2 flex flex-col h-[500px]">
              <CardHeader className="border-b">
                <CardTitle className="text-lg">المحادثة مع الدعم</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0 flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p>لا توجد رسائل بعد</p>
                      <p className="text-sm">ابدأ محادثة جديدة مع فريق الدعم</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${
                            msg.is_from_admin ? "justify-start" : "justify-end"
                          }`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                              msg.is_from_admin
                                ? "bg-accent"
                                : "bg-primary text-primary-foreground"
                            }`}
                          >
                            <p className="text-sm">{msg.message}</p>
                            <p
                              className={`text-xs mt-1 ${
                                msg.is_from_admin
                                  ? "text-muted-foreground"
                                  : "text-primary-foreground/70"
                              }`}
                            >
                              {formatDate(msg.created_at)}
                              {msg.is_from_admin && " • فريق الدعم"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                <div className="p-4 border-t flex gap-2">
                  <Textarea
                    placeholder="اكتب رسالتك هنا..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="min-h-[50px] max-h-[100px]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button onClick={handleSendMessage} disabled={sending}>
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentSupportPage;
