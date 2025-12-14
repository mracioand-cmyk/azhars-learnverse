-- Fix search_path for handle_new_user function
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
    -- Create teacher request instead
    INSERT INTO public.teacher_requests (user_id, full_name, email, phone, school_name, employee_id)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      NEW.email,
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'school_name',
      NEW.raw_user_meta_data->>'employee_id'
    );
  END IF;
  
  RETURN NEW;
END;
$$;