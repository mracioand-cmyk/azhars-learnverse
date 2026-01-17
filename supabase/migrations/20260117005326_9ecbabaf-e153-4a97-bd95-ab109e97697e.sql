-- Create table for admin instructions to AI
CREATE TABLE IF NOT EXISTS public.ai_admin_instructions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  instruction TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.ai_admin_instructions ENABLE ROW LEVEL SECURITY;

-- Policies: Only admins can manage instructions
CREATE POLICY "Admins can view instructions" ON public.ai_admin_instructions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert instructions" ON public.ai_admin_instructions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update instructions" ON public.ai_admin_instructions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete instructions" ON public.ai_admin_instructions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );