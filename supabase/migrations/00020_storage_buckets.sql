-- Create property-photos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('property-photos', 'property-photos', true, 10485760) -- 10MB
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own agent folder
CREATE POLICY "agents_upload_own_photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'property-photos'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.agent_profiles WHERE user_id = auth.uid()
    )
  );

-- Allow authenticated users to delete their own photos
CREATE POLICY "agents_delete_own_photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'property-photos'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.agent_profiles WHERE user_id = auth.uid()
    )
  );

-- Allow public read access
CREATE POLICY "public_read_photos" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'property-photos');
