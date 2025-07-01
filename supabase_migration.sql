-- Enable Row Level Security
ALTER TABLE IF EXISTS public.cards DISABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS public.cards;

-- Create cards table
CREATE TABLE public.cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    english TEXT NOT NULL,
    vietnamese TEXT NOT NULL,
    example TEXT,
    phonetic TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Spaced Repetition System fields
    status TEXT CHECK (status IN ('new', 'learning', 'learned')) DEFAULT 'new' NOT NULL,
    interval INTEGER DEFAULT 0 NOT NULL,
    step_index INTEGER DEFAULT 0 NOT NULL,
    next_review TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    lapses INTEGER DEFAULT 0 NOT NULL,
    reps INTEGER DEFAULT 0 NOT NULL,
    last_review TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own cards" ON public.cards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cards" ON public.cards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cards" ON public.cards
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cards" ON public.cards
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_cards_user_id ON public.cards(user_id);
CREATE INDEX idx_cards_next_review ON public.cards(next_review);
CREATE INDEX idx_cards_status ON public.cards(status);
CREATE INDEX idx_cards_created_at ON public.cards(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cards_updated_at
    BEFORE UPDATE ON public.cards
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();