import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/manualClient";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import TeacherRegistrationForm, {
  TeacherFormData,
} from "@/components/auth/TeacherRegistrationForm";
import { useAuth } from "@/hooks/useAuth";

const initialForm: TeacherFormData = {
  school: "",
  employeeId: "",
  phone: "",
  stage: "",
  grades: [],
  subject: "",
};

const TeacherRegister = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<TeacherFormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};

    if (!formData.school) e.school = "جهة العمل مطلوبة";
    if (!formData.employeeId) e.employeeId = "الرقم الوظيفي مطلوب";
    if (!formData.phone) e.phone = "رقم الهاتف مطلوب";
    if (!formData.stage) e.stage = "اختر المرحلة";
    if (formData.grades.length === 0) e.grades = "اختر صف واحد على الأقل";
    if (!formData.subject) e.subject = "اختر المادة";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "يجب تسجيل الدخول أولًا",
        variant: "destructive",
      });
      return;
    }

    if (!validate()) return;

    setLoading(true);

    const { error } = await supabase.from("teacher_requests").insert({
      user_id: user.id,
      school: formData.school,
      employee_id: formData.employeeId,
      phone: formData.phone,
      stage: formData.stage,
      subject: formData.subject,
      grades: formData.grades,
      status: "pending",
    });

    setLoading(false);

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل إرسال الطلب",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "تم إرسال طلبك بنجاح",
      description: "سيتم مراجعته من الإدارة",
    });

    navigate("/pending-approval");
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">تسجيل معلم</h1>

      <TeacherRegistrationForm
        formData={formData}
        onChange={(data) =>
          setFormData((prev) => ({ ...prev, ...data }))
        }
        errors={errors}
      />

      <Button className="w-full" onClick={handleSubmit} disabled={loading}>
        {loading ? "جارٍ الإرسال..." : "إرسال الطلب"}
      </Button>
    </div>
  );
};

export default TeacherRegister;