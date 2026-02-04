-- Allow voice message type and add storage for voice recordings

-- 1) Allow message type 'voice' (content = transcript, metadata.media_url = audio URL)
alter table public.messages drop constraint if exists messages_type_check;
alter table public.messages add constraint messages_type_check
  check (type in ('text', 'voice'));

-- 2) Storage bucket for voice messages (create via API or dashboard if not exists)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'voice-messages',
  'voice-messages',
  false,
  10485760,
  array['audio/mpeg', 'audio/mp4', 'audio/webm', 'audio/x-m4a', 'audio/mp3']
)
on conflict (id) do update set
  allowed_mime_types = excluded.allowed_mime_types,
  file_size_limit = excluded.file_size_limit;

-- RLS: users can upload/read their own voice files (path: user_id/conversation_id/filename)
drop policy if exists "voice_messages_upload" on storage.objects;
create policy "voice_messages_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'voice-messages'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "voice_messages_select" on storage.objects;
create policy "voice_messages_select"
  on storage.objects for select
  using (
    bucket_id = 'voice-messages'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "voice_messages_delete" on storage.objects;
create policy "voice_messages_delete"
  on storage.objects for delete
  using (
    bucket_id = 'voice-messages'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
