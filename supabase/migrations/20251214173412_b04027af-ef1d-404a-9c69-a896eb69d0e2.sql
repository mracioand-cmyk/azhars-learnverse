-- Create storage buckets for content
INSERT INTO storage.buckets (id, name, public) VALUES ('books', 'books', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('exams', 'exams', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('ai-sources', 'ai-sources', false) ON CONFLICT (id) DO NOTHING;

-- Storage policies for books bucket
CREATE POLICY "Books are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'books');
CREATE POLICY "Admins can upload books" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'books' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update books" ON storage.objects FOR UPDATE USING (bucket_id = 'books' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete books" ON storage.objects FOR DELETE USING (bucket_id = 'books' AND public.has_role(auth.uid(), 'admin'));

-- Storage policies for videos bucket
CREATE POLICY "Videos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'videos');
CREATE POLICY "Admins can upload videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'videos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update videos" ON storage.objects FOR UPDATE USING (bucket_id = 'videos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete videos" ON storage.objects FOR DELETE USING (bucket_id = 'videos' AND public.has_role(auth.uid(), 'admin'));

-- Storage policies for exams bucket
CREATE POLICY "Exams are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'exams');
CREATE POLICY "Admins can upload exams" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'exams' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update exams" ON storage.objects FOR UPDATE USING (bucket_id = 'exams' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete exams" ON storage.objects FOR DELETE USING (bucket_id = 'exams' AND public.has_role(auth.uid(), 'admin'));

-- Storage policies for ai-sources bucket
CREATE POLICY "AI sources accessible by authenticated" ON storage.objects FOR SELECT USING (bucket_id = 'ai-sources' AND auth.role() = 'authenticated');
CREATE POLICY "Admins can upload ai-sources" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'ai-sources' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete ai-sources" ON storage.objects FOR DELETE USING (bucket_id = 'ai-sources' AND public.has_role(auth.uid(), 'admin'));

-- Create subjects table for curriculum
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  stage TEXT NOT NULL, -- preparatory, secondary
  grade TEXT NOT NULL, -- first, second, third
  section TEXT, -- scientific, literary, sharia (null for preparatory)
  category TEXT NOT NULL, -- arabic, sharia, sciences, math
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Subjects are viewable by everyone" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Admins can manage subjects" ON public.subjects FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create content table for books, videos, exams
CREATE TABLE IF NOT EXISTS public.content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- book, video, exam, summary
  file_url TEXT NOT NULL,
  description TEXT,
  duration TEXT, -- for videos
  page_count INTEGER, -- for books
  uploaded_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Content is viewable by authenticated" ON public.content FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage content" ON public.content FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create support_messages table
CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  is_from_admin BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own messages" ON public.support_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can send messages" ON public.support_messages FOR INSERT WITH CHECK (auth.uid() = user_id AND is_from_admin = false);
CREATE POLICY "Admins can view all messages" ON public.support_messages FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can reply to messages" ON public.support_messages FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update messages" ON public.support_messages FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- null means broadcast to all
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Admins can manage notifications" ON public.notifications FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create usage_logs table for tracking
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL, -- login, view_content, etc.
  duration_minutes INTEGER DEFAULT 0,
  content_id UUID REFERENCES public.content(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own logs" ON public.usage_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own logs" ON public.usage_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all logs" ON public.usage_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Create AI sources table
CREATE TABLE IF NOT EXISTS public.ai_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.ai_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "AI sources viewable by authenticated" ON public.ai_sources FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage AI sources" ON public.ai_sources FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Add is_banned column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;

-- Create trigger for updated_at
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON public.subjects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON public.content
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();