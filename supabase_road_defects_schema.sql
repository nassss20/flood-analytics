-- Create the road defects logs table
CREATE TABLE public.road_defects_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    road_name TEXT NOT NULL,
    district TEXT,
    defect_types JSONB, -- Array of strings (e.g., ["Potholes (Lubang)"])
    defect_causes JSONB, -- Array of strings (e.g., ["Flood (Banjir)"])
    other_defect_type TEXT,
    other_defect_cause TEXT,
    status TEXT, -- 'Ongoing', 'Completed'
    notes TEXT,
    submitted_by_name TEXT,
    submitted_by_email TEXT,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.road_defects_logs ENABLE ROW LEVEL SECURITY;

-- Allow read access for everyone
CREATE POLICY "Enable read access for all users" ON public.road_defects_logs
    FOR SELECT USING (true);

-- Allow insert access for authenticated users
CREATE POLICY "Enable insert access for authenticated users" ON public.road_defects_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow update access for authenticated users
CREATE POLICY "Enable update access for authenticated users" ON public.road_defects_logs
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow delete access for authenticated users
CREATE POLICY "Enable delete access for authenticated users" ON public.road_defects_logs
    FOR DELETE USING (auth.role() = 'authenticated');

-- Realtime replication
ALTER PUBLICATION supabase_realtime ADD TABLE public.road_defects_logs;
