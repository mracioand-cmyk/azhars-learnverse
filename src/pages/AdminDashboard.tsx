'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  Loader2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DialogFooter,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';



// ====== TYPES ======
interface Profile {
  id: string;
  username: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: 'student' | 'teacher' | 'admin';
  stage?: string;
  grade?: string;
  is_banned?: boolean;
  created_at: string;
}

interface Subject {
  id: string;
  name: string;
  stage: string;
  grade: string;
  icon?: string;
}

interface Content {
  id: string;
  title: string;
  type: 'video' | 'pdf' | 'exam' | 'summary';
  url: string;
  subject_id: string;
  uploaded_by: string;
  created_at: string;
  views: number;
  is_active: boolean;
}

interface SupportMessage {
  id: string;
  user_id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  read: boolean;
}

interface TeacherRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  cv_url?: string;
  phone?: string;
  school?: string;
  notes?: string;
  created_at: string;
  user?: Profile;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  target_users: string[] | null;
  created_at: string;
}

// ====== ADMIN DASHBOARD ======
export default function AdminDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdminApproved, setIsAdminApproved] = useState(false);

  // STATE: Overview
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    pendingRequests: 0,
    totalSubjects: 0,
    totalVideos: 0,
    totalPdfs: 0,
    unreadMessages: 0,
  });

  // STATE: Students
  const [students, setStudents] = useState<Profile[]>([]);
  const [studentSearch, setStudentSearch] = useState('');

  // STATE: Teachers
  const [teacherRequests, setTeacherRequests] = useState<TeacherRequest[]>([]);

  // STATE: Content
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [content, setContent] = useState<Content[]>([]);
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');

  // STATE: Support
  const [conversations, setConversations] = useState<Map<string, SupportMessage[]>>(new Map());
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [supportSearch, setSupportSearch] = useState('');
  const [newMessage, setNewMessage] = useState('');

  // STATE: Notifications
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationBody, setNotificationBody] = useState('');
  const [notificationTarget, setNotificationTarget] = useState('all');
  const [notificationStudentCode, setNotificationStudentCode] = useState('');

  // STATE: Settings
  const [platformName, setPlatformName] = useState('Azhar Learniverse');
  const [contactPhone, setContactPhone] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // EFFECT: Initialize
  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check authentication
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Not authenticated');
        window.location.href = '/';
        return;
      }

      // Fetch current user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        setError('Failed to load user profile');
        return;
      }

      // Verify admin role
      if (profile.role !== 'admin') {
        setError('Unauthorized: Admin access required');
        window.location.href = '/';
        return;
      }

      setCurrentUser(profile);
      setIsAdminApproved(true);

      // Load all data in parallel
      await Promise.all([
        loadStats(),
        loadStudents(),
        loadTeacherRequests(),
        loadSubjects(),
        loadContent(),
        loadSupport(),
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard';
      setError(message);
      toast({ variant: 'destructive', title: 'Error', description: message });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [
        { count: studentCount },
        { count: teacherCount },
        { count: requestCount },
        { count: subjectCount },
        { data: videoContent },
        { data: pdfContent },
        { data: messages },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
        supabase.from('teacher_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('subjects').select('*', { count: 'exact', head: true }),
        supabase.from('content').select('*', { count: 'exact', head: true }).eq('type', 'video'),
        supabase.from('content').select('*', { count: 'exact', head: true }).eq('type', 'pdf'),
        supabase.from('support_messages').select('*').eq('read', false),
      ]);

      setStats({
        totalStudents: studentCount || 0,
        totalTeachers: teacherCount || 0,
        pendingRequests: requestCount || 0,
        totalSubjects: subjectCount || 0,
        totalVideos: videoContent?.length || 0,
        totalPdfs: pdfContent?.length || 0,
        unreadMessages: messages?.length || 0,
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('Error loading students:', err);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load students' });
    }
  };

  const loadTeacherRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('teacher_requests')
        .select('*, user:profiles(*)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeacherRequests(data || []);
    } catch (err) {
      console.error('Error loading teacher requests:', err);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load teacher requests' });
    }
  };

  const loadSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name');

      if (error) throw error;
      setSubjects(data || []);
    } catch (err) {
      console.error('Error loading subjects:', err);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load subjects' });
    }
  };

  const loadContent = async () => {
    try {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContent(data || []);
    } catch (err) {
      console.error('Error loading content:', err);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load content' });
    }
  };

  const loadSupport = async () => {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const grouped = new Map<string, SupportMessage[]>();
      (data || []).forEach((msg) => {
        if (!grouped.has(msg.user_id)) {
          grouped.set(msg.user_id, []);
        }
        grouped.get(msg.user_id)!.push(msg);
      });

      setConversations(grouped);
    } catch (err) {
      console.error('Error loading support messages:', err);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!studentSearch) return students;
    return students.filter(
      (s) =>
        s.full_name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.email?.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.username?.toLowerCase().includes(studentSearch.toLowerCase())
    );
  }, [students, studentSearch]);

  const handleBanStudent = async (studentId: string, currentBanStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: !currentBanStatus })
        .eq('id', studentId);

      if (error) throw error;

      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, is_banned: !currentBanStatus } : s))
      );

      toast({ title: currentBanStatus ? 'Student unbanned' : 'Student banned' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update student status' });
    }
  };

  const handleApproveTeacher = async (requestId: string, userId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'teacher' })
        .eq('id', userId);

      if (updateError) throw updateError;

      const { error: requestError } = await supabase
        .from('teacher_requests')
        .update({ status: 'approved' })
        .eq('id', requestId);

      if (requestError) throw requestError;

      setTeacherRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: 'approved' } : r))
      );

      setStudents((prev) =>
        prev.map((s) => (s.id === userId ? { ...s, role: 'teacher' } : s))
      );

      toast({ title: 'Teacher approved successfully' });
      await loadStats();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to approve teacher' });
    }
  };

  const handleRejectTeacher = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('teacher_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      setTeacherRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: 'rejected' } : r))
      );

      toast({ title: 'Teacher request rejected' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to reject teacher' });
    }
  };

  const handleSendNotification = async () => {
    if (!notificationTitle || !notificationBody) {
      toast({ variant: 'destructive', title: 'Error', description: 'Fill all fields' });
      return;
    }

    try {
      let targetUsers = null;
      
      if (notificationTarget === 'specific') {
        if (!notificationStudentCode) {
          toast({ variant: 'destructive', title: 'Error', description: 'Enter student code' });
          return;
        }
        targetUsers = [notificationStudentCode];
      }

      const { error } = await supabase.from('notifications').insert({
        title: notificationTitle,
        message: notificationBody,
        target_users: targetUsers,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast({ title: 'Notification sent' });
      setNotificationTitle('');
      setNotificationBody('');
      setNotificationTarget('all');
      setNotificationStudentCode('');
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to send notification' });
    }
  };

  const handleSendSupportMessage = async () => {
    if (!newMessage || !selectedConversation) return;

    try {
      const { error } = await supabase.from('support_messages').insert({
        user_id: selectedConversation,
        message: newMessage,
        is_admin: true,
        created_at: new Date().toISOString(),
        read: true,
      });

      if (error) throw error;

      const message: SupportMessage = {
        id: `m${Date.now()}`,
        user_id: selectedConversation,
        message: newMessage,
        is_admin: true,
        created_at: new Date().toISOString(),
        read: true,
      };

      setConversations((prev) => {
        const updated = new Map(prev);
        const messages = updated.get(selectedConversation) || [];
        updated.set(selectedConversation, [...messages, message]);
        return updated;
      });

      setNewMessage('');
      toast({ title: 'Message sent' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to send message' });
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('support_messages')
        .delete()
        .eq('user_id', conversationId);

      if (error) throw error;

      setConversations((prev) => {
        const updated = new Map(prev);
        updated.delete(conversationId);
        return updated;
      });

      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
      }

      toast({ title: 'Conversation deleted' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete conversation' });
    }
  };

  const handleDeleteContent = async (contentId: string) => {
    try {
      const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', contentId);

      if (error) throw error;

      setContent((prev) => prev.filter((c) => c.id !== contentId));
      toast({ title: 'Content deleted' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete content' });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="space-y-4 w-full max-w-md">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !isAdminApproved) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              {error || 'Unauthorized'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{error || 'Admin access required'}</p>
            <Button onClick={() => window.location.href = '/'} className="w-full">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-right" dir="rtl">
      {/* ====== SIDEBAR ====== */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } transition-all duration-300 border-r border-border bg-card overflow-hidden flex flex-col`}
      >
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6" />
            Admin Panel
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'students', label: 'Students', icon: Users },
            { id: 'teachers', label: 'Teachers', icon: UserCheck },
            { id: 'content', label: 'Content', icon: BookOpen },
            { id: 'subjects', label: 'Subjects', icon: FileText },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'support', label: 'Support', icon: MessageSquare },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-start gap-3"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* ====== MAIN CONTENT ====== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{currentUser?.full_name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{currentUser?.full_name}</p>
                <p className="text-xs text-muted-foreground">{currentUser?.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Tabs Content */}
        <div className="flex-1 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            {/* ====== OVERVIEW TAB ====== */}
            <TabsContent value="overview" className="p-6 space-y-6">
              <div>
                <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
                <p className="text-muted-foreground">Platform statistics and overview</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'bg-blue-50 text-blue-600 dark:bg-blue-950' },
                  { label: 'Teachers', value: stats.totalTeachers, icon: UserCheck, color: 'bg-green-50 text-green-600 dark:bg-green-950' },
                  { label: 'Pending Requests', value: stats.pendingRequests, icon: Bell, color: 'bg-orange-50 text-orange-600 dark:bg-orange-950' },
                  { label: 'Subjects', value: stats.totalSubjects, icon: BookOpen, color: 'bg-purple-50 text-purple-600 dark:bg-purple-950' },
                  { label: 'Videos', value: stats.totalVideos, icon: Video, color: 'bg-red-50 text-red-600 dark:bg-red-950' },
                  { label: 'PDFs', value: stats.totalPdfs, icon: FileText, color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950' },
                  { label: 'Unread Messages', value: stats.unreadMessages, icon: MessageSquare, color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950' },
                ].map(({ label, value, icon: Icon, color }, idx) => (
                  <Card key={idx}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{label}</CardTitle>
                      <div className={`p-2 rounded-lg ${color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{value}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* ====== STUDENTS TAB ====== */}
            <TabsContent value="students" className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search student..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Students List</CardTitle>
                  <CardDescription>Total: {filteredStudents.length}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">Name</TableHead>
                          <TableHead className="text-right">Email</TableHead>
                          <TableHead className="text-right">Stage</TableHead>
                          <TableHead className="text-right">Grade</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudents.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              No students found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredStudents.map((student) => (
                            <TableRow key={student.id}>
                              <TableCell className="text-right">
                                <div className="flex items-center gap-3 justify-end">
                                  <div>
                                    <p className="font-medium">{student.full_name}</p>
                                    <p className="text-sm text-muted-foreground">{student.username}</p>
                                  </div>
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback>{student.full_name?.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                </div>
                              </TableCell>
                              <TableCell>{student.email}</TableCell>
                              <TableCell>{student.stage || '-'}</TableCell>
                              <TableCell>{student.grade || '-'}</TableCell>
                              <TableCell>
                                <Badge variant={student.is_banned ? 'destructive' : 'default'}>
                                  {student.is_banned ? 'Banned' : 'Active'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleBanStudent(student.id, student.is_banned || false)}
                                >
                                  {student.is_banned ? 'Unban' : 'Ban'}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ====== TEACHERS TAB ====== */}
            <TabsContent value="teachers" className="p-6 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Teacher Requests</CardTitle>
                  <CardDescription>Manage teacher join requests</CardDescription>
                </CardHeader>
                <CardContent>
                  {teacherRequests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No pending requests
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {teacherRequests.map((request) => (
                        <div key={request.id} className="border rounded-lg p-4 space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <Avatar>
                                <AvatarFallback>
                                  {request.user?.full_name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{request.user?.full_name}</p>
                                <p className="text-sm text-muted-foreground">{request.user?.email}</p>
                              </div>
                            </div>
                            <Badge
                              variant={
                                request.status === 'approved'
                                  ? 'default'
                                  : request.status === 'rejected'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {request.status === 'approved'
                                ? 'Approved'
                                : request.status === 'rejected'
                                ? 'Rejected'
                                : 'Pending'}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {request.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{request.phone}</span>
                              </div>
                            )}
                            {request.school && (
                              <div className="flex items-center gap-2">
                                <School className="h-4 w-4 text-muted-foreground" />
                                <span>{request.school}</span>
                              </div>
                            )}
                          </div>

                          {request.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApproveTeacher(request.id, request.user_id)}
                              >
                                <Check className="h-4 w-4 ml-2" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectTeacher(request.id)}
                              >
                                <X className="h-4 w-4 ml-2" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ====== CONTENT TAB ====== */}
            <TabsContent value="content" className="p-6 space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Content Management</CardTitle>
                      <CardDescription>
                        Content appears immediately to students when uploaded
                      </CardDescription>
                    </div>
                    <UploadContentDialog subjects={subjects} onUpload={loadContent} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select value={selectedStage} onValueChange={setSelectedStage}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Stage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primary">Primary</SelectItem>
                        <SelectItem value="preparatory">Preparatory</SelectItem>
                        <SelectItem value="secondary">Secondary</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Grade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="first">First</SelectItem>
                        <SelectItem value="second">Second</SelectItem>
                        <SelectItem value="third">Third</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects
                          .filter((s) => (!selectedStage || s.stage === selectedStage) && (!selectedGrade || s.grade === selectedGrade))
                          .map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedSubject ? (
                    <div className="space-y-2">
                      {content.filter(c => c.subject_id === selectedSubject).length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground border rounded-lg">
                          No content yet
                        </div>
                      ) : (
                        <div className="grid gap-3">
                          {content.filter(c => c.subject_id === selectedSubject).map((item) => (
                            <div key={item.id} className="border rounded-lg p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                {item.type === 'video' && <Video className="h-5 w-5 text-red-500" />}
                                {item.type === 'pdf' && <FileText className="h-5 w-5 text-blue-500" />}
                                <div>
                                  <p className="font-medium">{item.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.views} views · {new Date(item.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={item.is_active ? 'default' : 'outline'}>
                                  {item.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteContent(item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground border rounded-lg">
                      Select a stage, grade, and subject to view content
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ====== SUBJECTS TAB ====== */}
            <TabsContent value="subjects" className="p-6 space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Subjects</CardTitle>
                    <AddSubjectDialog onAdd={loadSubjects} />
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">Name</TableHead>
                        <TableHead className="text-right">Stage</TableHead>
                        <TableHead className="text-right">Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjects.map((subject) => (
                        <TableRow key={subject.id}>
                          <TableCell className="font-medium">{subject.name}</TableCell>
                          <TableCell>{subject.stage}</TableCell>
                          <TableCell>{subject.grade}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ====== NOTIFICATIONS TAB ====== */}
            <TabsContent value="notifications" className="p-6 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Send Notification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Title</label>
                    <Input
                      placeholder="Notification title..."
                      value={notificationTitle}
                      onChange={(e) => setNotificationTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Message</label>
                    <Textarea
                      placeholder="Notification message..."
                      value={notificationBody}
                      onChange={(e) => setNotificationBody(e.target.value)}
                      rows={5}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Send To</label>
                    <Select value={notificationTarget} onValueChange={setNotificationTarget}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Students</SelectItem>
                        <SelectItem value="specific">Specific Student</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {notificationTarget === 'specific' && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Student Code</label>
                      <Input
                        placeholder="Enter student code..."
                        value={notificationStudentCode}
                        onChange={(e) => setNotificationStudentCode(e.target.value)}
                      />
                    </div>
                  )}

                  <Button className="w-full" onClick={handleSendNotification}>
                    <Bell className="h-4 w-4 ml-2" />
                    Send Notification
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ====== SUPPORT TAB ====== */}
            <TabsContent value="support" className="p-6 h-full">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
                <Card className="h-full lg:col-span-1 flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-lg">Conversations</CardTitle>
                    <div className="relative mt-2">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search..."
                        value={supportSearch}
                        onChange={(e) => setSupportSearch(e.target.value)}
                        className="pr-10"
                      />
                    </div>
                  </CardHeader>
                  <ScrollArea className="flex-1">
                    <div className="space-y-2 p-4">
                      {Array.from(conversations.keys()).map((userId) => {
                        const messages = conversations.get(userId) || [];
                        const lastMessage = messages[messages.length - 1];
                        const student = students.find((s) => s.id === userId);

                        if (supportSearch && !student?.full_name?.toLowerCase().includes(supportSearch.toLowerCase())) {
                          return null;
                        }

                        return (
                          <button
                            key={userId}
                            onClick={() => setSelectedConversation(userId)}
                            className={`w-full text-right p-3 rounded-lg transition-colors ${
                              selectedConversation === userId
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                            }`}
                          >
                            <p className="font-medium text-sm">{student?.full_name || 'Unknown'}</p>
                            <p className="text-xs opacity-70 truncate">
                              {lastMessage?.message}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </Card>

                {selectedConversation && (
                  <Card className="h-full lg:col-span-2 flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {students
                              .find((s) => s.id === selectedConversation)
                              ?.full_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {students.find((s) => s.id === selectedConversation)?.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground">Student</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteConversation(selectedConversation)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </CardHeader>

                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {(conversations.get(selectedConversation) || []).map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.is_admin ? 'justify-start' : 'justify-end'}`}
                          >
                            <div
                              className={`max-w-xs rounded-lg p-3 ${
                                msg.is_admin
                                  ? 'bg-muted text-foreground'
                                  : 'bg-primary text-primary-foreground'
                              }`}
                            >
                              <p className="text-sm">{msg.message}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {new Date(msg.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    <div className="border-t p-4 flex gap-2">
                      <Input
                        placeholder="Type message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') handleSendSupportMessage();
                        }}
                      />
                      <Button
                        onClick={handleSendSupportMessage}
                        size="icon"
                        disabled={!newMessage}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* ====== SETTINGS TAB ====== */}
            <TabsContent value="settings" className="p-6 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Platform Name</label>
                    <Input
                      value={platformName}
                      onChange={(e) => setPlatformName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Support Phone</label>
                    <Input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+20..."
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Maintenance Mode</p>
                      <p className="text-sm text-muted-foreground">
                        {maintenanceMode ? 'Platform is down' : 'Platform is running'}
                      </p>
                    </div>
                    <Button
                      variant={maintenanceMode ? 'default' : 'destructive'}
                      onClick={() => setMaintenanceMode(!maintenanceMode)}
                    >
                      {maintenanceMode ? 'Enable' : 'Disable'}
                    </Button>
                  </div>

                  <Button className="w-full">Save Changes</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// ====== UPLOAD CONTENT DIALOG ======
function UploadContentDialog({ subjects, onUpload }: { subjects: Subject[]; onUpload: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'video' | 'pdf' | 'exam' | 'summary'>('video');
  const [subjectId, setSubjectId] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!title || !subjectId || !url) {
      toast({ variant: 'destructive', title: 'Error', description: 'Fill all fields' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('content').insert({
        title,
        type,
        url,
        subject_id: subjectId,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id,
        is_active: true,
        views: 0,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast({ title: 'Content uploaded successfully' });
      setOpen(false);
      setTitle('');
      setUrl('');
      onUpload();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to upload content' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          Upload Content
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Educational Content</DialogTitle>
          <DialogDescription>Content appears immediately to students</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Title</label>
            <Input
              placeholder="Content title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Type</label>
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
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Subject</label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select Subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">URL</label>
            <Input
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleUpload} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ====== ADD SUBJECT DIALOG ======
function AddSubjectDialog({ onAdd }: { onAdd: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [stage, setStage] = useState('');
  const [grade, setGrade] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!name || !stage || !grade) {
      toast({ variant: 'destructive', title: 'Error', description: 'Fill all fields' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('subjects').insert({
        name,
        stage,
        grade,
      });

      if (error) throw error;

      toast({ title: 'Subject added successfully' });
      setOpen(false);
      setName('');
      setStage('');
      setGrade('');
      onAdd();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add subject' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          New Subject
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Subject</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Name</label>
            <Input
              placeholder="Subject name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Stage</label>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger>
                <SelectValue placeholder="Select Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Primary</SelectItem>
                <SelectItem value="preparatory">Preparatory</SelectItem>
                <SelectItem value="secondary">Secondary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Grade</label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger>
                <SelectValue placeholder="Select Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="first">First</SelectItem>
                <SelectItem value="second">Second</SelectItem>
                <SelectItem value="third">Third</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleAdd} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
