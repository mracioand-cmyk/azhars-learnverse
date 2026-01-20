-- Add teacher assignment columns to teacher_requests table
ALTER TABLE public.teacher_requests
ADD COLUMN IF NOT EXISTS assigned_stages TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS assigned_grades TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS assigned_sections TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS assigned_category TEXT;

-- Create teacher_assignments table for more detailed teacher-subject mapping
CREATE TABLE IF NOT EXISTS public.teacher_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL,
  stage TEXT NOT NULL,
  grade TEXT NOT NULL,
  section TEXT,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(teacher_id, stage, grade, section, category)
);

-- Enable RLS
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;

-- Teachers can view their own assignments
CREATE POLICY "Teachers can view their own assignments"
  ON public.teacher_assignments FOR SELECT
  USING (teacher_id = auth.uid());

-- Admins can manage all assignments
CREATE POLICY "Admins can manage teacher assignments"
  ON public.teacher_assignments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Update handle_new_user function to include teacher assignment data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
  student_code_val TEXT;
BEGIN
  -- Determine role from metadata
  user_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student');
  
  -- Generate student code for students
  IF user_role = 'student' THEN
    student_code_val := public.generate_student_code();
  END IF;
  
  -- Insert profile
  INSERT INTO public.profiles (id, full_name, email, phone, student_code, stage, grade, section)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    student_code_val,
    NEW.raw_user_meta_data->>'stage',
    NEW.raw_user_meta_data->>'grade',
    NEW.raw_user_meta_data->>'section'
  );
  
  -- Insert role (students get role immediately, teachers need approval)
  IF user_role = 'student' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'student');
  ELSIF user_role = 'teacher' THEN
    -- Create teacher request with assignment data
    INSERT INTO public.teacher_requests (
      user_id, full_name, email, phone, school_name, employee_id,
      assigned_stages, assigned_grades, assigned_sections, assigned_category
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      NEW.email,
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'school_name',
      NEW.raw_user_meta_data->>'employee_id',
      COALESCE(
        ARRAY(SELECT jsonb_array_elements_text((NEW.raw_user_meta_data->>'assigned_stages')::jsonb)),
        '{}'::TEXT[]
      ),
      COALESCE(
        ARRAY(SELECT jsonb_array_elements_text((NEW.raw_user_meta_data->>'assigned_grades')::jsonb)),
        '{}'::TEXT[]
      ),
      COALESCE(
        ARRAY(SELECT jsonb_array_elements_text((NEW.raw_user_meta_data->>'assigned_sections')::jsonb)),
        '{}'::TEXT[]
      ),
      NEW.raw_user_meta_data->>'assigned_category'
    );
  END IF;
  
  RETURN NEW;
END;
$$;