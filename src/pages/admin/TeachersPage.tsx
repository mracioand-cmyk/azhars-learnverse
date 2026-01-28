import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X, Loader2, BookOpen, User } from "lucide-react";

interface TeacherRequest {
  id: string; // teacher_id
  full_name: string;
  email: string;
  phone: string;
  approval_status: string;
  assignments: { subject_category: string; stage: string; grade: string }[];
}

const AdminTeachersPage = () => {
  const [requests, setRequests] = useState<TeacherRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // جلب الطلبات
  const fetchRequests = async () => {
    setLoading(true);
    try {
      // 1. جلب المعلمين المعلقين
      const { data: profiles, error } = await supabase
        .from('teacher_profiles')
        .select(`
          teacher_id,
          approval_status,
          profiles:teacher_id (full_name, email, phone)
        `)
        .eq('approval_status', 'pending');

      if (error) throw error;

      // 2. جلب تخصصات كل معلم
      const requestsWithAssignments = await Promise.all(
        profiles.map(async (p: any) => {
          const { data: assignments } = await supabase
            .from('teacher_assignments')
            .select('*')
            .eq('teacher_id', p.teacher_id);
            
          return {
            id: p.teacher_id,
            full_name: p.profiles?.full_name || "بدون اسم",
            email: p.profiles?.email || "",
            phone: p.profiles?.phone || "",
            approval_status: p.approval_status,
            assignments: assignments || []
          };
        })
      );

      setRequests(requestsWithAssignments);
    } catch (error) {
      console.error(error);
      toast.error("فشل جلب الطلبات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // دالة الموافقة أو الرفض
  const handleAction = async (teacherId: string, action: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('teacher_profiles')
        .update({ 
          approval_status: action,
          is_approved: action === 'approved' 
        })
        .eq('teacher_id', teacherId);

      if (error) throw error;

      toast.success(action === 'approved' ? "تم قبول المعلم بنجاح" : "تم رفض الطلب");
      fetchRequests(); // تحديث القائمة
    } catch (error) {
      toast.error("حدث خطأ");
    }
  };

  // ترجمة النصوص
  const translateSubject = (s: string) => {
    const map: any = { arabic: "عربي", math: "رياضيات", science: "علوم", english: "إنجليزي", religious: "شرعي", history: "تاريخ", physics: "فيزياء", chemistry: "كيمياء", biology: "أحياء" };
    return map[s] || s;
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold text-primary">طلبات انضمام المعلمين</h1>
      
      {loading ? (
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
      ) : requests.length === 0 ? (
        <p className="text-center text-muted-foreground">لا توجد طلبات معلقة حالياً</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {requests.map((req) => (
            <Card key={req.id} className="border-l-4 border-l-gold">
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <User className="h-5 w-5 text-muted-foreground" />
                    {req.full_name}
                  </span>
                  <Badge variant="outline">{req.approval_status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-1 text-muted-foreground">
                  <p>البريد: {req.email}</p>
                  <p>الهاتف: {req.phone}</p>
                </div>
                
                <div className="bg-muted/50 p-3 rounded-md">
                  <p className="text-xs font-bold mb-2 flex items-center gap-1">
                    <BookOpen className="h-3 w-3" /> التخصصات المطلوبة:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {req.assignments.map((a, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {translateSubject(a.subject_category)} - {a.grade === 'first' ? '1' : a.grade === 'second' ? '2' : '3'} {a.stage === 'secondary' ? 'ث' : 'ع'}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700" 
                    onClick={() => handleAction(req.id, 'approved')}
                  >
                    <Check className="h-4 w-4 ml-2" /> موافقة
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="flex-1"
                    onClick={() => handleAction(req.id, 'rejected')}
                  >
                    <X className="h-4 w-4 ml-2" /> رفض
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTeachersPage;
