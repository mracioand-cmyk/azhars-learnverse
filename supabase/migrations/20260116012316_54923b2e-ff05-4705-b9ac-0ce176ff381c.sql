-- Add subject_id column to ai_conversations
ALTER TABLE ai_conversations 
ADD COLUMN IF NOT EXISTS subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_conversations_subject_id ON ai_conversations(subject_id);