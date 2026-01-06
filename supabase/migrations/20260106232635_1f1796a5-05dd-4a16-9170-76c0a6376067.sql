-- Create table to track user validation signals
CREATE TABLE public.idea_validations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('want_to_use', 'willing_to_pay', 'waitlist')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(idea_id, user_id, signal_type)
);

-- Enable RLS
ALTER TABLE public.idea_validations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Validations are viewable by everyone" 
ON public.idea_validations 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert validations" 
ON public.idea_validations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own validations" 
ON public.idea_validations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Function to update idea validation counts
CREATE OR REPLACE FUNCTION public.update_idea_validation_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.signal_type = 'want_to_use' THEN
      UPDATE public.ideas SET want_to_use_count = want_to_use_count + 1 WHERE id = NEW.idea_id;
    ELSIF NEW.signal_type = 'willing_to_pay' THEN
      UPDATE public.ideas SET willing_to_pay_count = willing_to_pay_count + 1 WHERE id = NEW.idea_id;
    ELSIF NEW.signal_type = 'waitlist' THEN
      UPDATE public.ideas SET waitlist_count = waitlist_count + 1 WHERE id = NEW.idea_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.signal_type = 'want_to_use' THEN
      UPDATE public.ideas SET want_to_use_count = want_to_use_count - 1 WHERE id = OLD.idea_id;
    ELSIF OLD.signal_type = 'willing_to_pay' THEN
      UPDATE public.ideas SET willing_to_pay_count = willing_to_pay_count - 1 WHERE id = OLD.idea_id;
    ELSIF OLD.signal_type = 'waitlist' THEN
      UPDATE public.ideas SET waitlist_count = waitlist_count - 1 WHERE id = OLD.idea_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger
CREATE TRIGGER update_idea_validation_counts_trigger
AFTER INSERT OR DELETE ON public.idea_validations
FOR EACH ROW
EXECUTE FUNCTION public.update_idea_validation_counts();