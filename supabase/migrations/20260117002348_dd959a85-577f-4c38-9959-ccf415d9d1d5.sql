-- Create storage bucket for AI source files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('ai-sources', 'ai-sources', true, 20971520, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to view AI sources
CREATE POLICY "Authenticated users can view AI sources"
ON storage.objects
FOR SELECT
USING (bucket_id = 'ai-sources' AND auth.role() = 'authenticated');

-- Allow admins to upload AI sources
CREATE POLICY "Admins can upload AI sources"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'ai-sources' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete AI sources
CREATE POLICY "Admins can delete AI sources"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'ai-sources' 
  AND has_role(auth.uid(), 'admin'::app_role)
);