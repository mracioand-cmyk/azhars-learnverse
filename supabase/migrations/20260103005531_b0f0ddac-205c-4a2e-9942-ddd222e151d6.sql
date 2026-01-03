
-- Create platform_settings table for storing all platform settings
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage settings
CREATE POLICY "Admins can manage settings" ON public.platform_settings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Public can read certain settings (like maintenance mode)
CREATE POLICY "Public can read settings" ON public.platform_settings
  FOR SELECT USING (key IN ('platform_name', 'maintenance_mode', 'maintenance_message', 'platform_logo', 'support_phone', 'support_whatsapp', 'support_email'));

-- Insert default settings
INSERT INTO public.platform_settings (key, value) VALUES
  ('platform_name', 'أزهاريون'),
  ('platform_description', 'منصة تعليمية للطلاب الأزهريين'),
  ('platform_logo', ''),
  ('support_phone', '01223909712'),
  ('support_whatsapp', '01223909712'),
  ('support_email', 'alyedaft@gmail.com'),
  ('maintenance_mode', 'false'),
  ('maintenance_message', 'المنصة تحت الصيانة حاليًا، سنعود قريبًا'),
  ('developer_name', 'علي محمد علي'),
  ('developer_email', 'alyedaft@gmail.com'),
  ('developer_phone', '01223909712'),
  ('developer_visible', 'true'),
  ('max_video_size_mb', '500'),
  ('max_pdf_size_mb', '50'),
  ('allowed_file_types', 'pdf,mp4,doc,docx');

-- Create trigger for updated_at
CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
