import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Student = {
  id: string;
  full_name: string;
  email: string;
  student_code: string | null;
  stage: string | null;
  grade: string | null;
  is_banned: boolean | null;
  created_at: string | null;
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStudents = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setStudents(data as Student[]);
      }

      setLoading(false);
    };

    loadStudents();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>📚 الطلاب</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>جاري التحميل...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">البريد</TableHead>
                  <TableHead className="text-right">الكود</TableHead>
                  <TableHead className="text-right">المرحلة</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.full_name}</TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>{s.student_code || "-"}</TableCell>
                    <TableCell>
                      {s.stage} {s.grade}
                    </TableCell>
                    <TableCell>
                      {s.is_banned ? (
                        <Badge variant="destructive">محظور</Badge>
                      ) : (
                        <Badge>نشط</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
