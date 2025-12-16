import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/manualClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  MessageSquare,
  Send,
  Loader2,
  User,
  Search,
  RefreshCw,
} from "lucide-react";

interface SupportConversation {
  user_id: string;
  user_name: string;
  student_code: string | null;
  last_message: string;
  unread_count: number;
  last_message_at: string;
}

interface Message {
  id: string;
  message: string;
  is_from_admin: boolean;
  created_at: string;
  is_read: boolean;
}

const SupportPage = () => {
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadConversations = async () => {
    setLoading(true);
    try {
      // Get unique user conversations
      const { data: messagesData, error } = await supabase
        .from("support_messages")
        .select("user_id, message, is_from_admin, is_read, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group by user_id
      const userMap = new Map<string, any>();
      messagesData?.forEach((msg) => {
        if (!userMap.has(msg.user_id)) {
          userMap.set(msg.user_id, {
            user_id: msg.user_id,
            last_message: msg.message,
            last_message_at: msg.created_at,
            unread_count: 0,
          });
        }
        if (!msg.is_from_admin && !msg.is_read) {
          const conv = userMap.get(msg.user_id);
          conv.unread_count++;
        }
      });

      // Get user profiles
      const userIds = Array.from(userMap.keys());
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, student_code")
          .in("id", userIds);

        profiles?.forEach((profile) => {
          const conv = userMap.get(profile.id);
          if (conv) {
            conv.user_name = profile.full_name;
            conv.student_code = profile.student_code;
          }
        });
      }

      setConversations(Array.from(userMap.values()));
    } catch (error) {
      console.error("Error loading conversations:", error);
      toast.error("خطأ في تحميل المحادثات");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark as read
      await supabase
        .from("support_messages")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_from_admin", false);

      loadConversations();
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadMessages(selectedUserId);
    }
  }, [selectedUserId]);

  const handleSendReply = async () => {
    if (!newMessage.trim() || !selectedUserId) return;

    setSending(true);
    try {
      const { error } = await supabase.from("support_messages").insert({
        user_id: selectedUserId,
        message: newMessage.trim(),
        is_from_admin: true,
      });

      if (error) throw error;

      setNewMessage("");
      loadMessages(selectedUserId);
      toast.success("تم إرسال الرد");
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("خطأ في إرسال الرد");
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

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.student_code?.includes(searchQuery)
  );

  const selectedConversation = conversations.find(
    (c) => c.user_id === selectedUserId
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          الدعم الفني
        </h2>
        <Button variant="outline" onClick={loadConversations}>
          <RefreshCw className="h-4 w-4 ml-2" />
          تحديث
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 h-[600px]">
        {/* قائمة المحادثات */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو الكود..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">
                  لا توجد محادثات
                </p>
              ) : (
                <div className="space-y-1 p-2">
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.user_id}
                      onClick={() => setSelectedUserId(conv.user_id)}
                      className={`w-full p-3 rounded-lg text-right transition-colors ${
                        selectedUserId === conv.user_id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              selectedUserId === conv.user_id
                                ? "bg-primary-foreground/20"
                                : "bg-accent"
                            }`}
                          >
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {conv.user_name || "طالب"}
                            </p>
                            <p
                              className={`text-xs ${
                                selectedUserId === conv.user_id
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {conv.student_code || "---"}
                            </p>
                          </div>
                        </div>
                        {conv.unread_count > 0 && (
                          <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-xs mt-2 line-clamp-1 ${
                          selectedUserId === conv.user_id
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {conv.last_message}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* نافذة المحادثة */}
        <Card className="lg:col-span-2 flex flex-col">
          {selectedUserId ? (
            <>
              <CardHeader className="border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {selectedConversation?.user_name || "طالب"}
                  {selectedConversation?.student_code && (
                    <span className="text-sm font-normal text-muted-foreground">
                      ({selectedConversation.student_code})
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0 flex flex-col">
                <ScrollArea className="flex-1 p-4">
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
                              ? "bg-primary text-primary-foreground"
                              : "bg-accent"
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                          <p
                            className={`text-xs mt-1 ${
                              msg.is_from_admin
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            }`}
                          >
                            {formatDate(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t flex gap-2">
                  <Textarea
                    placeholder="اكتب ردك هنا..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="min-h-[50px] max-h-[100px]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                  />
                  <Button onClick={handleSendReply} disabled={sending}>
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p>اختر محادثة للبدء</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SupportPage;
