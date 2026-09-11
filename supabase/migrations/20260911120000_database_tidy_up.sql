-- Database tidy-up from the Supabase advisors (11 Sep 2026).
--
-- 1. Index every foreign key that had none. Deleting a course, user or
--    organisation has to find the rows pointing at it; without an index that's
--    a scan of the whole table, which gets slower with every company added.
create index if not exists pathway_courses_course_id_idx       on public.pathway_courses (course_id);
create index if not exists quiz_attempts_course_id_idx         on public.quiz_attempts (course_id);
create index if not exists certificates_course_id_idx          on public.certificates (course_id);
create index if not exists form_fields_organisation_id_idx     on public.form_fields (organisation_id);
create index if not exists form_submissions_submitted_by_idx   on public.form_submissions (submitted_by);
create index if not exists audit_logs_actor_id_idx             on public.audit_logs (actor_id);
create index if not exists care_cert_observations_assessor_id_idx on public.care_cert_observations (assessor_id);
create index if not exists care_cert_signoffs_signed_by_idx    on public.care_cert_signoffs (signed_by);
create index if not exists care_cert_signoffs_user_id_idx      on public.care_cert_signoffs (user_id);
create index if not exists content_question_stars_course_id_idx on public.content_question_stars (course_id);
create index if not exists content_question_stars_organisation_id_idx on public.content_question_stars (organisation_id);
create index if not exists issue_reports_organisation_id_idx   on public.issue_reports (organisation_id);
create index if not exists issue_reports_user_id_idx           on public.issue_reports (user_id);

-- 2. Pin search_path on the sign-in hook and the updated_at trigger.
--    Deliberately NOT on current_org_id(), current_user_role() or
--    is_platform_admin(): every RLS policy calls those per row, and a function
--    with a SET clause can't be inlined, so pinning them would slow every
--    dashboard read. They're SECURITY INVOKER and only call schema-qualified
--    auth.jwt(), so the advisor's search_path warning can't be exploited there.
alter function public.custom_access_token_hook(jsonb) set search_path = public;
alter function public.set_updated_at() set search_path = public;

-- 3. Stop exposing internal SECURITY DEFINER functions over the API.
--    handle_new_user() is a trigger — it's never meant to be called directly.
--    Trigger functions don't need EXECUTE at fire time; the explicit grant to
--    supabase_auth_admin (which inserts into auth.users) is belt and braces so
--    invites can't break.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant  execute on function public.handle_new_user() to supabase_auth_admin;
--    The feature switches are only used by policies scoped to signed-in users,
--    so signed-out visitors don't need them. verify_certificate() stays public
--    on purpose: it backs the public /verify page.
revoke execute on function public.forms_enabled()        from public, anon;
revoke execute on function public.observations_enabled() from public, anon;
revoke execute on function public.recruitment_enabled()  from public, anon;
