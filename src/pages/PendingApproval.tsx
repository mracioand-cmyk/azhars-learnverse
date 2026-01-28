import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, MessageCircle, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const PendingApproval = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 pattern-islamic p-4 font-cairo">
      <div className="w-full max-w-md animate-scale-in">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl gradient-azhari shadow-azhari mb-4">
            <BookOpen className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-gradient-azhari mb-2">أزهاريون</h1>
          <p className="text-muted-foreground">منصة التعليم الأزهري الذكية</p>
        </div>

        <Card className="border-border shadow-lg bg-card/95 backdrop-blur text-center">
          <CardHeader>
            <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">⏳</span>
            </div>
            <CardTitle className="text-xl font-bold text-primary">
              مرحباً أستاذ {user?.user_metadata?.full_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2 text-muted-foreground">
              <p className="font-medium text-foreground">تم استلام طلب انضمامك بنجاح!</p>
              <p className="text-sm">
                حسابك الآن قيد المراجعة من قبل إدارة المنصة.
                سيتم تفعيل حسابك وإشعارك في أقرب وقت ممكن لتتمكن من إدارة موادك.
              </p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg border text-sm">
              <p>هل تحتاج إلى تفعيل عاجل؟</p>
              <Button 
                variant="outline" 
                className="w-full mt-2 gap-2 border-green-600 text-green-700 hover:bg-green-50"
                onClick={() => window.open("https://wa.me/201000000000", "_blank")}
              >
                <MessageCircle className="h-4 w-4" />
                تواصل مع الدعم الفني
              </Button>
            </div>

            <Button variant="ghost" onClick={handleSignOut} className="text-red-500 hover:text-red-600 hover:bg-red-50">
              <LogOut className="h-4 w-4 ml-2" />
              تسجيل الخروج
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PendingApproval;
