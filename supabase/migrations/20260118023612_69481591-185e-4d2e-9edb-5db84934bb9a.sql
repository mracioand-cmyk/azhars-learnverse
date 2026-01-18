-- Create subscriptions table to track student subscriptions per subject
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  renewal_count INTEGER DEFAULT 0,
  notes TEXT,
  UNIQUE(student_id, subject_id)
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Students can view their own subscriptions
CREATE POLICY "Students can view their own subscriptions"
ON public.subscriptions
FOR SELECT
USING (auth.uid() = student_id);

-- Admins can manage all subscriptions
CREATE POLICY "Admins can manage subscriptions"
ON public.subscriptions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add subscription settings to platform_settings
INSERT INTO public.platform_settings (key, value) VALUES
('subscription_whatsapp', '01223909712'),
('subscription_default_price', '100'),
('subscription_default_message', 'مرحبًا، أريد الاشتراك في:
المادة: {subject}
الصف: {grade}
القسم: {section}
ID الطالب: {student_id}'),
('subscription_currency', 'جنيه');

-- Update platform_settings RLS to include subscription settings
DROP POLICY IF EXISTS "Public can read settings" ON public.platform_settings;
CREATE POLICY "Public can read settings"
ON public.platform_settings
FOR SELECT
USING (key = ANY (ARRAY[
  'platform_name'::text, 
  'maintenance_mode'::text, 
  'maintenance_message'::text, 
  'platform_logo'::text, 
  'support_phone'::text, 
  'support_whatsapp'::text, 
  'support_email'::text,
  'subscription_whatsapp'::text,
  'subscription_default_price'::text,
  'subscription_default_message'::text,
  'subscription_currency'::text
]));