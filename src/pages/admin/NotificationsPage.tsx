import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/manualClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import {
  Bell,
  Send,
  Loader2,
  Users,
  User,
} from "lucide-react";

const NotificationsPage = () => {
  const [sending, setSending] = useState(false);
  const [targetType, setTargetType] = useState<"all" | "specific">("all");
  const [studentCode, setStudentCode] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);

  const loadRecentNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    setRecentNotifications(data || []);
  };

  useEffect(() => {
    loadRecentNotifications();
  }, []);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("يرجى إدخال العنوان والرسالة");
      return;
    }

    if (targetType === "specific" && !studentCode.trim()) {
      toast.error("يرجى إدخال كود الطالب");
      return;
    }

    setSending(true);
    try {
      let targetUserId: string | null = null;

      if (targetType === "specific") {
        // Find student by code
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("student_code", studentCode.trim())
          .maybeSingle();

        if (error || !profile) {
          toast.error("لم يتم العثور على طالب بهذا الكود");
          setSending(false);
          return;
        }
        targetUserId = profile.id;
      }

      // Insert notification
      const { error: insertError } = await supabase.from("notifications").insert({
        title: title.trim(),
        message: message.trim(),
        user_id: targetUserId, // null = broadcast to all
      });

      if (insertError) throw insertError;

      toast.success(
        targetType === "all"
          ? "تم إرسال الإشعار لجميع الطلاب"
          : "تم إرسال الإشعار للطالب"
      );

      // Reset form
      setTitle("");
      setMessage("");
      setStudentCode("");
      loadRecentNotifications();
    } catch (error) {
      console.error("Send error:", error);
      toast.error("خطأ في إرسال الإشعار");
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Bell className="h-6 w-6" />
        إرسال الإشعارات
      </h2>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* نموذج الإرسال */}
        <Card>
          <CardHeader>
            <CardTitle>إشعار جديد</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-3 block">إرسال إلى</Label>
              <RadioGroup
                value={targetType}
                onValueChange={(v: "all" | "specific") => setTargetType(v)}
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="flex items-center gap-1 cursor-pointer">
                    <Users className="h-4 w-4" />
                    جميع الطلاب
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="specific" id="specific" />
                  <Label htmlFor="specific" className="flex items-center gap-1 cursor-pointer">
                    <User className="h-4 w-4" />
                    طالب محدد
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {targetType === "specific" && (
              <div>
                <Label>كود الطالب</Label>
                <Input
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  placeholder="أدخل كود الطالب (6 أرقام)"
                  maxLength={6}
                />
              </div>
            )}

            <div>
              <Label>عنوان الإشعار *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="عنوان الإشعار"
              />
            </div>

            <div>
              <Label>نص الرسالة *</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="اكتب رسالة الإشعار هنا..."
                rows={4}
              />
            </div>

            <Button onClick={handleSend} disabled={sending} className="w-full">
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <Send className="h-4 w-4 ml-2" />
              )}
              إرسال الإشعار
            </Button>
          </CardContent>
        </Card>

        {/* الإشعارات الأخيرة */}
        <Card>
          <CardHeader>
            <CardTitle>الإشعارات الأخيرة</CardTitle>
          </CardHeader>
          <CardContent>
            {recentNotifications.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                لا توجد إشعارات
              </p>
            ) : (
              <div className="space-y-3">
                {recentNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{notif.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notif.message}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap mr-2">
                        {notif.user_id ? "خاص" : "عام"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(notif.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotificationsPage;
