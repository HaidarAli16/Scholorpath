create or replace function public.notify_matching_users_on_publish()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user record;
  v_country text;
  v_matches boolean;
begin
  for v_user in
    select a.user_id, a.answers
    from public.assessments a
    where a.status = 'completed'
  loop
    v_country := v_user.answers->>'destinationPreference';
    v_matches := v_country in ('suggest', 'World')
      or upper(coalesce(v_country, '')) = upper(coalesce(new.country_code, ''))
      or (new.country_code = 'GB' and v_country in ('UK', 'United Kingdom'))
      or (new.country_code = 'US' and v_country in ('USA', 'United States'));

    if v_matches then
      perform public.create_notification(
        v_user.user_id,
        'new_scholarship',
        'New scholarship: ' || new.title,
        'A new scholarship from ' || coalesce(new.provider_name, 'a provider') ||
          ' in ' || coalesce(new.country_code, 'an unspecified destination') ||
          ' has been published that may match your profile.',
        '/discover',
        'scholarship_published:' || new.id,
        'normal'
      );
    end if;
  end loop;
  return new;
end;
$$;

create or replace function public.notify_matching_users_on_programme_publish()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user record;
  v_country text;
  v_matches boolean;
begin
  for v_user in
    select a.user_id, a.answers
    from public.assessments a
    where a.status = 'completed'
  loop
    v_country := v_user.answers->>'destinationPreference';
    v_matches := v_country in ('suggest', 'World')
      or upper(coalesce(v_country, '')) = upper(coalesce(new.country_code, ''))
      or (new.country_code = 'GB' and v_country in ('UK', 'United Kingdom'))
      or (new.country_code = 'US' and v_country in ('USA', 'United States'));

    if v_matches then
      perform public.create_notification(
        v_user.user_id,
        'new_programme',
        'New programme: ' || new.title,
        'A new programme from ' || coalesce(new.institution_name, 'an institution') ||
          ' in ' || coalesce(new.country_code, 'an unspecified destination') ||
          ' has been published that may match your profile.',
        '/discover',
        'programme_published:' || new.id,
        'normal'
      );
    end if;
  end loop;
  return new;
end;
$$;

revoke all on function public.notify_matching_users_on_publish() from public, anon, authenticated;
revoke all on function public.notify_matching_users_on_programme_publish() from public, anon, authenticated;
