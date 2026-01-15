-- Créer une table sécurisée pour stocker les secrets de l'application
CREATE TABLE IF NOT EXISTS public.app_secrets (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;

-- Aucun accès direct - seulement via SECURITY DEFINER functions
CREATE POLICY "No direct access to app_secrets" ON public.app_secrets
  FOR ALL USING (false);

-- Mettre à jour la fonction trigger_fetch_all_feeds pour lire depuis la table
CREATE OR REPLACE FUNCTION public.trigger_fetch_all_feeds()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $func$
DECLARE
  feed_record RECORD;
  cron_secret TEXT;
BEGIN
  -- Récupérer le secret depuis la table app_secrets
  SELECT value INTO cron_secret FROM public.app_secrets WHERE key = 'cron_secret';
  
  IF cron_secret IS NULL OR cron_secret = '' THEN
    RAISE WARNING 'cron_secret not configured in app_secrets table';
    RETURN;
  END IF;
  
  FOR feed_record IN 
    SELECT id, url FROM public.feeds WHERE status = 'active'
  LOOP
    PERFORM net.http_post(
      url := 'https://wftyukugedtojizgatwj.supabase.co/functions/v1/fetch-rss',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', cron_secret
      ),
      body := jsonb_build_object(
        'feedId', feed_record.id,
        'feedUrl', feed_record.url
      )
    );
  END LOOP;
END;
$func$;

-- Mettre à jour la fonction trigger_purge_articles pour lire depuis la table
CREATE OR REPLACE FUNCTION public.trigger_purge_articles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $func$
DECLARE
  cron_secret TEXT;
BEGIN
  -- Récupérer le secret depuis la table app_secrets
  SELECT value INTO cron_secret FROM public.app_secrets WHERE key = 'cron_secret';
  
  IF cron_secret IS NULL OR cron_secret = '' THEN
    RAISE WARNING 'cron_secret not configured in app_secrets table';
    RETURN;
  END IF;
  
  PERFORM net.http_post(
    url := 'https://wftyukugedtojizgatwj.supabase.co/functions/v1/purge-articles',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', cron_secret
    ),
    body := '{"scheduled": true}'::jsonb
  );
END;
$func$;