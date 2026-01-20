import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building, IdCard, Phone, BookOpen } from "lucide-react";

// المواد حسب المرحلة والقسم
const CATEGORIES_CONFIG = {
  shared: [
    { value: "المواد العربية", label: "المواد العربية" },
    { value: "المواد الشرعية", label: "المواد الشرعية" },
    { value: "رياضيات", label: "رياضيات" },
    { value: "لغة إنجليزية", label: "لغة إنجليزية" },
    { value: "فرنساوي", label: "لغة فرنسية" },
  ],
  preparatory: [
    { value: "علوم", label: "علوم" },
    { value: "دراسات", label: "دراسات اجتماعية" },
  ],
  secondaryScience: [
    { value: "أحياء", label: "أحياء" },
    { value: "فيزياء", label: "فيزياء" },
    { value: "كيمياء", label: "كيمياء" },
    { value: "جيولوجيا", label: "جيولوجيا" },
  ],
  secondaryArts: [
    { value: "تاريخ", label: "تاريخ" },
    { value: "جغرافيا", label: "جغرافيا" },
    { value: "فلسفة ومنطق", label: "فلسفة ومنطق" },
    { value: "علم نفس واجتماع", label: "علم نفس واجتماع" },
  ],
};

const PREPARATORY_GRADES = [
  { value: "الصف الأول الإعدادي", label: "الصف الأول الإعدادي" },
  { value: "الصف الثاني الإعدادي", label: "الصف الثاني الإعدادي" },
  { value: "الصف الثالث الإعدادي", label: "الصف الثالث الإعدادي" },
];

const SECONDARY_GRADES = [
  { value: "الصف الأول الثانوي", label: "الصف الأول الثانوي" },
  { value: "الصف الثاني الثانوي", label: "الصف الثاني الثانوي" },
  { value: "الصف الثالث الثانوي", label: "الصف الثالث الثانوي" },
];

interface TeacherFormData {
  school: string;
  employeeId: string;
  phone: string;
  selectedStages: string[];
  selectedGrades: string[];
  selectedSections: string[];
  selectedCategory: string;
}

interface Props {
  formData: TeacherFormData;
  onChange: (data: Partial<TeacherFormData>) => void;
  errors: Record<string, string>;
}

export const TeacherRegistrationForm = ({ formData, onChange, errors }: Props) => {
  const [availableGrades, setAvailableGrades] = useState<{ value: string; label: string }[]>([]);
  const [availableCategories, setAvailableCategories] = useState<{ value: string; label: string }[]>([]);
  const [showSections, setShowSections] = useState(false);

  // Update available grades based on selected stages
  useEffect(() => {
    const grades: { value: string; label: string }[] = [];
    
    if (formData.selectedStages.includes("إعدادي")) {
      grades.push(...PREPARATORY_GRADES);
    }
    if (formData.selectedStages.includes("ثانوي")) {
      grades.push(...SECONDARY_GRADES);
    }
    
    setAvailableGrades(grades);
    setShowSections(formData.selectedStages.includes("ثانوي"));
    
    // Reset grades if stage changes
    if (formData.selectedGrades.length > 0) {
      const validGrades = formData.selectedGrades.filter(g => 
        grades.some(ag => ag.value === g)
      );
      if (validGrades.length !== formData.selectedGrades.length) {
        onChange({ selectedGrades: validGrades });
      }
    }
  }, [formData.selectedStages]);

  // Update available categories based on stages and sections
  useEffect(() => {
    let categories = [...CATEGORIES_CONFIG.shared];
    
    if (formData.selectedStages.includes("إعدادي")) {
      categories.push(...CATEGORIES_CONFIG.preparatory);
    }
    
    if (formData.selectedStages.includes("ثانوي")) {
      if (formData.selectedSections.includes("علمي") || formData.selectedSections.length === 0) {
        categories.push(...CATEGORIES_CONFIG.secondaryScience);
      }
      if (formData.selectedSections.includes("أدبي") || formData.selectedSections.length === 0) {
        categories.push(...CATEGORIES_CONFIG.secondaryArts);
      }
    }
    
    // Remove duplicates
    const uniqueCategories = categories.filter((cat, index, self) =>
      index === self.findIndex(c => c.value === cat.value)
    );
    
    setAvailableCategories(uniqueCategories);
  }, [formData.selectedStages, formData.selectedSections]);

  const handleStageToggle = (stage: string) => {
    const newStages = formData.selectedStages.includes(stage)
      ? formData.selectedStages.filter(s => s !== stage)
      : [...formData.selectedStages, stage];
    onChange({ selectedStages: newStages });
  };

  const handleGradeToggle = (grade: string) => {
    const newGrades = formData.selectedGrades.includes(grade)
      ? formData.selectedGrades.filter(g => g !== grade)
      : [...formData.selectedGrades, grade];
    onChange({ selectedGrades: newGrades });
  };

  const handleSectionToggle = (section: string) => {
    const newSections = formData.selectedSections.includes(section)
      ? formData.selectedSections.filter(s => s !== section)
      : [...formData.selectedSections, section];
    onChange({ selectedSections: newSections });
  };

  const handleSelectAllGrades = (stage: "preparatory" | "secondary") => {
    const grades = stage === "preparatory" ? PREPARATORY_GRADES : SECONDARY_GRADES;
    const allSelected = grades.every(g => formData.selectedGrades.includes(g.value));
    
    if (allSelected) {
      onChange({ 
        selectedGrades: formData.selectedGrades.filter(g => 
          !grades.some(pg => pg.value === g)
        )
      });
    } else {
      const newGrades = [...formData.selectedGrades];
      grades.forEach(g => {
        if (!newGrades.includes(g.value)) {
          newGrades.push(g.value);
        }
      });
      onChange({ selectedGrades: newGrades });
    }
  };

  return (
    <div className="space-y-4">
      {/* جهة العمل */}
      <div className="space-y-2">
        <Label htmlFor="school">جهة العمل / المدرسة</Label>
        <div className="relative">
          <Building className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="school"
            placeholder="أدخل اسم المدرسة أو الجهة"
            className={`pr-10 ${errors.school ? "border-destructive" : ""}`}
            value={formData.school}
            onChange={(e) => onChange({ school: e.target.value })}
          />
        </div>
        {errors.school && <p className="text-xs text-destructive">{errors.school}</p>}
      </div>

      {/* الرقم الوظيفي */}
      <div className="space-y-2">
        <Label htmlFor="employeeId">الرقم الوظيفي</Label>
        <div className="relative">
          <IdCard className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="employeeId"
            placeholder="أدخل رقمك الوظيفي"
            className={`pr-10 ${errors.employeeId ? "border-destructive" : ""}`}
            value={formData.employeeId}
            onChange={(e) => onChange({ employeeId: e.target.value })}
          />
        </div>
        {errors.employeeId && <p className="text-xs text-destructive">{errors.employeeId}</p>}
      </div>

      {/* رقم الهاتف */}
      <div className="space-y-2">
        <Label htmlFor="phone">رقم الهاتف</Label>
        <div className="relative">
          <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="phone"
            type="tel"
            placeholder="أدخل رقم هاتفك"
            className={`pr-10 ${errors.phone ? "border-destructive" : ""}`}
            value={formData.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
          />
        </div>
        {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
      </div>

      {/* 1️⃣ اختيار المرحلة التعليمية */}
      <div className="space-y-2">
        <Label className="text-base font-semibold">المرحلة التعليمية</Label>
        <div className="flex gap-4 flex-wrap">
          {[
            { value: "إعدادي", label: "المرحلة الإعدادية" },
            { value: "ثانوي", label: "المرحلة الثانوية" },
          ].map((stage) => (
            <label
              key={stage.value}
              className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                formData.selectedStages.includes(stage.value)
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Checkbox
                checked={formData.selectedStages.includes(stage.value)}
                onCheckedChange={() => handleStageToggle(stage.value)}
              />
              <span>{stage.label}</span>
            </label>
          ))}
        </div>
        {errors.stages && <p className="text-xs text-destructive">{errors.stages}</p>}
      </div>

      {/* 2️⃣ اختيار الصفوف */}
      {formData.selectedStages.length > 0 && (
        <div className="space-y-2">
          <Label className="text-base font-semibold">الصفوف الدراسية</Label>
          
          {formData.selectedStages.includes("إعدادي") && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">المرحلة الإعدادية</span>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => handleSelectAllGrades("preparatory")}
                >
                  {PREPARATORY_GRADES.every(g => formData.selectedGrades.includes(g.value))
                    ? "إلغاء تحديد الكل"
                    : "تحديد جميع الصفوف الإعدادية"}
                </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {PREPARATORY_GRADES.map((grade) => (
                  <label
                    key={grade.value}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all text-sm ${
                      formData.selectedGrades.includes(grade.value)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Checkbox
                      checked={formData.selectedGrades.includes(grade.value)}
                      onCheckedChange={() => handleGradeToggle(grade.value)}
                    />
                    <span>{grade.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          
          {formData.selectedStages.includes("ثانوي") && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">المرحلة الثانوية</span>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => handleSelectAllGrades("secondary")}
                >
                  {SECONDARY_GRADES.every(g => formData.selectedGrades.includes(g.value))
                    ? "إلغاء تحديد الكل"
                    : "تحديد جميع الصفوف الثانوية"}
                </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {SECONDARY_GRADES.map((grade) => (
                  <label
                    key={grade.value}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all text-sm ${
                      formData.selectedGrades.includes(grade.value)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Checkbox
                      checked={formData.selectedGrades.includes(grade.value)}
                      onCheckedChange={() => handleGradeToggle(grade.value)}
                    />
                    <span>{grade.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {errors.grades && <p className="text-xs text-destructive">{errors.grades}</p>}
        </div>
      )}

      {/* 3️⃣ اختيار القسم (للثانوي فقط) */}
      {showSections && (
        <div className="space-y-2">
          <Label className="text-base font-semibold">القسم</Label>
          <div className="flex gap-4 flex-wrap">
            {[
              { value: "علمي", label: "القسم العلمي" },
              { value: "أدبي", label: "القسم الأدبي" },
            ].map((section) => (
              <label
                key={section.value}
                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                  formData.selectedSections.includes(section.value)
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Checkbox
                  checked={formData.selectedSections.includes(section.value)}
                  onCheckedChange={() => handleSectionToggle(section.value)}
                />
                <span>{section.label}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            يمكنك اختيار قسم واحد أو الاثنين معًا
          </p>
        </div>
      )}

      {/* 4️⃣ اختيار المادة */}
      {formData.selectedGrades.length > 0 && (
        <div className="space-y-2">
          <Label className="text-base font-semibold">المادة الدراسية</Label>
          <div className="relative">
            <BookOpen className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
            <Select
              value={formData.selectedCategory}
              onValueChange={(value) => onChange({ selectedCategory: value })}
            >
              <SelectTrigger className={`pr-10 ${errors.category ? "border-destructive" : ""}`}>
                <SelectValue placeholder="اختر المادة التي تدرّسها" />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
        </div>
      )}
    </div>
  );
};

export default TeacherRegistrationForm;
