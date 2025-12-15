import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Settings,
  Save,
  Mail,
  Phone,
  Globe,
  Loader2,
} from "lucide-react";

const SettingsPage = () => {
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    platformName: "أزهاريون",
    supportEmail: "alyedaft@gmail.com",
    supportPhone: "01223909712",
    whatsappNumber: "01223909712",
  });

  const handleSave = async () => {
    setSaving(true);
    // In a real implementation, you'd save this to Supabase
    // For now, we'll just simulate a save
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("تم حفظ الإعدادات");
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Settings className="h-6 w-6" />
        إعدادات المنصة
      </h2>

      <div className="grid gap-6">
        {/* معلومات المنصة */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              معلومات المنصة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>اسم المنصة</Label>
              <Input
                value={settings.platformName}
                onChange={(e) =>
                  setSettings({ ...settings, platformName: e.target.value })
                }
                placeholder="اسم المنصة"
              />
            </div>
          </CardContent>
        </Card>

        {/* بيانات التواصل */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              بيانات التواصل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>البريد الإلكتروني للدعم</Label>
              <Input
                type="email"
                value={settings.supportEmail}
                onChange={(e) =>
                  setSettings({ ...settings, supportEmail: e.target.value })
                }
                placeholder="support@example.com"
              />
            </div>

            <div>
              <Label>رقم الهاتف</Label>
              <Input
                value={settings.supportPhone}
                onChange={(e) =>
                  setSettings({ ...settings, supportPhone: e.target.value })
                }
                placeholder="01xxxxxxxxx"
              />
            </div>

            <div>
              <Label>رقم واتساب</Label>
              <Input
                value={settings.whatsappNumber}
                onChange={(e) =>
                  setSettings({ ...settings, whatsappNumber: e.target.value })
                }
                placeholder="01xxxxxxxxx"
              />
            </div>
          </CardContent>
        </Card>

        {/* معلومات المطور */}
        <Card>
          <CardHeader>
            <CardTitle>معلومات المطور</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p><strong>المطور:</strong> علي محمد علي</p>
              <p><strong>البريد:</strong> alyedaft@gmail.com</p>
              <p><strong>واتساب:</strong> 01223909712</p>
              <p><strong>المدينة:</strong> بني سويف</p>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin ml-2" />
          ) : (
            <Save className="h-4 w-4 ml-2" />
          )}
          حفظ الإعدادات
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;
