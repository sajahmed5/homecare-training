-- ============================================================================
-- Certificate verification: include the holder's name
-- ============================================================================
-- Public certificate verification previously returned only the course and
-- dates. To let a third party confirm a certificate belongs to a named person,
-- the RPC now also returns the holder's full name. It remains SECURITY DEFINER
-- and returns only the holder name (no email or other PII). Changing the return
-- table requires dropping and recreating the function.
drop function if exists public.verify_certificate(text);

create function public.verify_certificate(cert_number text)
returns table (
  valid        boolean,
  holder_name  text,
  course_title text,
  issued_at    timestamptz,
  expires_at   timestamptz,
  is_expired   boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    true as valid,
    coalesce(u.full_name, 'Certificate holder') as holder_name,
    co.title as course_title,
    c.issued_at,
    c.expires_at,
    (c.expires_at is not null and c.expires_at < now()) as is_expired
  from public.certificates c
  join public.courses co on co.id = c.course_id
  join public.users u on u.id = c.user_id
  where c.certificate_number = cert_number;
$$;

grant execute on function public.verify_certificate(text) to anon, authenticated;
