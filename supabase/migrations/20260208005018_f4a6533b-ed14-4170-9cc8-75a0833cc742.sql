
-- Table to track which teacher a student chose for a subject category
CREATE TABLE public.student_teacher_choices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  category text NOT NULL,
  stage text NOT NULL,
  grade text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Unique constraint: one teacher per student per category/stage/grade
ALTER TABLE public.student_teacher_choices 
  ADD CONSTRAINT unique_student_teacher_choice UNIQUE (student_id, category, stage, grade);

-- Enable RLS
ALTER TABLE public.student_teacher_choices ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Students can view their own choices"
  ON public.student_teacher_choices FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own choice"
  ON public.student_teacher_choices FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own choice"
  ON public.student_teacher_choices FOR UPDATE
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can manage all choices"
  ON public.student_teacher_choices FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view choices for them"
  ON public.student_teacher_choices FOR SELECT
  USING (auth.uid() = teacher_id);

-- Enable realtime for teacher notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_teacher_choices;
