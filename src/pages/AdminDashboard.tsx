import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/manualClient';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Upload,
  FileText,
  Video,
  Send,
  Phone,
  School,
  UserCheck,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

/* ================= TYPES ================= */

interface Profile {
  id: string;
  email: string;
  full_name: string;
  stage?: string | null;
  grade?: string | null;
  section?: string | null;
  is_banned?: boolean | null;
  created_at: string | null;
  student_code?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
}

interface Subject {
  id: string;
  name: string;
  stage: string;
  grade: string;
  category: string;
  description?: string | null;
  section?: string | null;
  is_active?: boolean | null;
}

interface Content {
  id: string;
  title: string;
  type: string;
  file_url: string;
  subject_id: string | null;
  created_at: string | null;
  is_active: boolean | null;
  description?: string | null;
}

/* ================= MAIN ================= */

export default function AdminDashboard() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);

  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [students, setStudents] = useState<Profile[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [content, setContent] = useState<Content[]>([]);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      setLoading(true);

      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      // Check if user has admin role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleData) {
        throw new Error('Unauthorized');
      }

      setCurrentUser(profile as Profile);

      const [studentsRes, subjectsRes, contentRes] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('subjects').select('*'),
        supabase.from('content').select('*'),
      ]);

      setStudents((studentsRes.data || []) as Profile[]);
      setSubjects((subjectsRes.data || []) as Subject[]);
      setContent((contentRes.data || []) as Content[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-40 w-96" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-500 flex gap-2 items-center">
              <AlertCircle />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>{error}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen" dir="rtl">
      {/* SIDEBAR */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all overflow-hidden border-r`}>
        <div className="p-4 font-bold flex gap-2 items-center">
          <LayoutDashboard /> Admin
        </div>

        <nav className="p-2 space-y-2">
          {[
            ['overview', 'Overview', LayoutDashboard],
            ['students', 'Students', Users],
            ['content', 'Content', BookOpen],
            ['settings', 'Settings', Settings],
          ].map(([id, label, Icon]: any) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-2 p-2 rounded ${
                activeTab === id ? 'bg-primary text-white' : 'hover:bg-muted'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* CONTENT */}
      <div className="flex-1 flex flex-col">
        <header className="p-4 border-b flex justify-between items-center">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X /> : <Menu />}
          </button>

          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarFallback>{currentUser?.full_name?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-bold">{currentUser?.full_name}</p>
              <p className="text-xs">{currentUser?.email}</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Dashboard</CardTitle>
                  <CardDescription>Welcome admin</CardDescription>
                </CardHeader>
              </Card>
            </TabsContent>

            <TabsContent value="students">
              <Card>
                <CardHeader>
                  <CardTitle>Students</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الاسم</TableHead>
                        <TableHead>الإيميل</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>{s.full_name}</TableCell>
                          <TableCell>{s.email}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content">
              <UploadContentDialog subjects={subjects} onUploaded={init} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

/* ================= UPLOAD DIALOG ================= */

function UploadContentDialog({
  subjects,
  onUploaded,
}: {
  subjects: Subject[];
  onUploaded: () => void;
}) {
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'video' | 'pdf' | 'exam' | 'summary'>('video');
  const [subjectId, setSubjectId] = useState('');
  const [url, setUrl] = useState('');

  const submit = async () => {
    if (!title || !subjectId || !url) {
      toast({ variant: 'destructive', title: 'Fill all fields' });
      return;
    }

    await supabase.from('content').insert({
      title,
      type,
      subject_id: subjectId,
      file_url: url,
      is_active: true,
    });

    toast({ title: 'Uploaded' });
    setOpen(false);
    onUploaded();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="ml-2" />
          Upload
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Content</DialogTitle>
          <DialogDescription>Visible immediately</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder="URL" value={url} onChange={(e) => setUrl(e.target.value)} />

          <Select value={type} onValueChange={(v: any) => setType(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="exam">Exam</SelectItem>
              <SelectItem value="summary">Summary</SelectItem>
            </SelectContent>
          </Select>

          <Select value={subjectId} onValueChange={setSubjectId}>
            <SelectTrigger>
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={submit}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
