-- Fix: Add INSERT policy for teacher_requests table
-- This allows users to create their own teacher registration requests directly
-- and provides a fallback if the handle_new_user trigger fails

CREATE POLICY "Users can create their own teacher request"
  ON public.teacher_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'pending'::approval_status);

-- Also allow admins to create teacher requests for manual intervention
CREATE POLICY "Admins can create teacher requests"
  ON public.teacher_requests FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));