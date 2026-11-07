-- Fix: magic-link / OTP sign-ups carry no name metadata, so the profile
-- trigger passed NULL into `profiles.last_name` (NOT NULL) and the whole
-- auth.users insert rolled back → Supabase answered "Database error saving
-- new user" and no email was ever sent.
--
-- Also honour `preferred_locale` sent by the sign-in form (falls back to 'en').
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  full_name text := coalesce(meta ->> 'full_name', meta ->> 'name', '');
  locale public.locale_code := 'en';
begin
  if meta ->> 'preferred_locale' in ('en', 'ar') then
    locale := (meta ->> 'preferred_locale')::public.locale_code;
  end if;

  insert into public.profiles (id, email, first_name, last_name, avatar_url, preferred_locale)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(meta ->> 'first_name', ''), split_part(full_name, ' ', 1), ''),
    coalesce(nullif(meta ->> 'last_name', ''), nullif(regexp_replace(full_name, '^\S+\s*', ''), ''), ''),
    nullif(meta ->> 'avatar_url', ''),
    locale
  )
  on conflict (id) do nothing;
  return new;
end $$;
