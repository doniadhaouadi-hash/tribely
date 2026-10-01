-- QA-021: any logged-in user could upload any file type of any size to any
-- path in the public tribely-media bucket. Limit the bucket to images
-- (no SVG: it can carry scripts) up to 5 MB, and bind uploads to the
-- uploader's own top-level folder: <auth.uid()>/avatars/… or <auth.uid()>/activities/….

update storage.buckets
   set file_size_limit = 5242880,
       allowed_mime_types = array[
         'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'
       ]
 where id = 'tribely-media';

drop policy if exists "Authenticated users can upload to tribely-media" on storage.objects;

create policy "Users can upload to their own tribely-media folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'tribely-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Updates must stay inside the owner's folder as well.
drop policy if exists "Users can update their own tribely-media uploads" on storage.objects;

create policy "Users can update their own tribely-media uploads"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'tribely-media' and owner = auth.uid())
  with check (
    bucket_id = 'tribely-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
