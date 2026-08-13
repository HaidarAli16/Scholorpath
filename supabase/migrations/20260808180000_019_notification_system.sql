set search_path = '';

-- Index for upserts
CREATE UNIQUE INDEX IF NOT EXISTS notifications_event_key_idx ON public.notifications(user_id, event_key) WHERE event_key IS NOT NULL;

-- Helper to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id uuid,
    p_category text,
    p_title text,
    p_body text,
    p_action_url text,
    p_event_key text,
    p_priority text DEFAULT 'normal'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.notifications (user_id, category, title, body, action_url, event_key, priority)
    VALUES (p_user_id, p_category, p_title, p_body, p_action_url, p_event_key, p_priority)
    ON CONFLICT (user_id, event_key) WHERE event_key IS NOT NULL DO NOTHING;
    
    IF p_priority IN ('high', 'critical') THEN
        INSERT INTO public.outbox_events (event_type, payload)
        VALUES ('notification.email_requested', jsonb_build_object(
            'user_id', p_user_id,
            'category', p_category,
            'title', p_title,
            'body', p_body,
            'action_url', p_action_url,
            'priority', p_priority
        ))
        ON CONFLICT DO NOTHING;
    END IF;
END;
$$;

-- Notification for scholarships
CREATE OR REPLACE FUNCTION public.notify_matching_users_on_publish()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user record;
    v_country text;
BEGIN
    FOR v_user IN 
        SELECT a.user_id, a.answers
        FROM public.assessments a
        WHERE a.status = 'completed'
    LOOP
        v_country := v_user.answers->>'destinationPreference';
        IF (v_country = NEW.country OR v_country = 'suggest' OR v_country = 'World') THEN
            PERFORM public.create_notification(
                v_user.user_id,
                'new_scholarship',
                'New scholarship: ' || NEW.title,
                'A new scholarship from ' || COALESCE(NEW.provider_name, 'a provider') || ' in ' || NEW.country || ' has been published that may match your profile.',
                '/discover',
                'scholarship_published:' || NEW.id,
                'normal'
            );
        END IF;
    END LOOP;
    RETURN NEW;
END;
$$;

-- Notification for programmes
CREATE OR REPLACE FUNCTION public.notify_matching_users_on_programme_publish()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user record;
    v_country text;
BEGIN
    FOR v_user IN 
        SELECT a.user_id, a.answers
        FROM public.assessments a
        WHERE a.status = 'completed'
    LOOP
        v_country := v_user.answers->>'destinationPreference';
        IF (v_country = NEW.country OR v_country = 'suggest' OR v_country = 'World') THEN
            PERFORM public.create_notification(
                v_user.user_id,
                'new_programme',
                'New programme: ' || NEW.title,
                'A new programme from ' || COALESCE(NEW.institution_name, 'an institution') || ' in ' || NEW.country || ' has been published that may match your profile.',
                '/discover',
                'programme_published:' || NEW.id,
                'normal'
            );
        END IF;
    END LOOP;
    RETURN NEW;
END;
$$;

-- Triggers
DROP TRIGGER IF EXISTS notify_on_scholarship_publish ON public.scholarships;
CREATE TRIGGER notify_on_scholarship_publish
  AFTER INSERT OR UPDATE OF state ON public.scholarships
  FOR EACH ROW WHEN (NEW.state = 'published')
  EXECUTE FUNCTION public.notify_matching_users_on_publish();

DROP TRIGGER IF EXISTS notify_on_programme_publish ON public.programmes;
CREATE TRIGGER notify_on_programme_publish
  AFTER INSERT OR UPDATE OF state ON public.programmes
  FOR EACH ROW WHEN (NEW.state = 'published')
  EXECUTE FUNCTION public.notify_matching_users_on_programme_publish();
