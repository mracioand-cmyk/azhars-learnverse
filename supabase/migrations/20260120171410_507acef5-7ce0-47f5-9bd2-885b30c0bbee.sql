-- Create subscription_messages table for custom subscription messages per subject/stage/grade/section
CREATE TABLE IF NOT EXISTS public.subscription_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage TEXT NOT NULL, -- preparatory, secondary
  grade TEXT NOT NULL, -- first, second, third
  section TEXT, -- scientific, literary (null for preparatory)
  category TEXT NOT NULL, -- arabic, sharia, scientific, literary, math, english, french, etc.
  welcome_message TEXT NOT NULL,
  price TEXT NOT NULL,
  includes_description TEXT, -- e.g., "الاشتراك يشمل نحو + بلاغة + أدب + نصوص"
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(stage, grade, section, category)
);

-- Enable RLS
ALTER TABLE public.subscription_messages ENABLE ROW LEVEL SECURITY;

-- Admins can manage subscription messages
CREATE POLICY "Admins can manage subscription messages"
  ON public.subscription_messages
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Everyone can read subscription messages
CREATE POLICY "Anyone can read subscription messages"
  ON public.subscription_messages
  FOR SELECT
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_subscription_messages_updated_at
  BEFORE UPDATE ON public.subscription_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();