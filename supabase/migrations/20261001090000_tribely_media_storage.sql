-- Public storage bucket for user-uploaded photos (profile avatars, activity covers).
insert into storage.buckets (id, name, public)
values ('tribely-media', 'tribely-media', true)
on conflict (id) do nothing;

create policy "Public read access to tribely-media"
  on storage.objects for select
  to public
  using (bucket_id = 'tribely-media');

create policy "Authenticated users can upload to tribely-media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'tribely-media');

create policy "Users can update their own tribely-media uploads"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'tribely-media' and owner = auth.uid());

create policy "Users can delete their own tribely-media uploads"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'tribely-media' and owner = auth.uid());
