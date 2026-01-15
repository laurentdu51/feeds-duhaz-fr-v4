-- Supprimer les anciens cron jobs s'ils existent
SELECT cron.unschedule(jobname) FROM cron.job WHERE jobname IN ('fetch-active-feeds', 'purge-old-articles-daily');

-- Créer une fonction pour récupérer les articles de tous les feeds actifs
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
  -- Récupérer le secret depuis les paramètres de la base
  cron_secret := current_setting('app.cron_secret', true);
  
  IF cron_secret IS NULL OR cron_secret = '' THEN
    RAISE WARNING 'app.cron_secret not configured - skipping feed fetch';
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

-- Créer une fonction pour déclencher la purge des articles
CREATE OR REPLACE FUNCTION public.trigger_purge_articles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $func$
DECLARE
  cron_secret TEXT;
BEGIN
  cron_secret := current_setting('app.cron_secret', true);
  
  IF cron_secret IS NULL OR cron_secret = '' THEN
    RAISE WARNING 'app.cron_secret not configured - skipping purge';
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

-- Programmer les cron jobs pour appeler ces fonctions
SELECT cron.schedule(
  'fetch-active-feeds',
  '*/10 * * * *',
  'SELECT public.trigger_fetch_all_feeds()'
);

SELECT cron.schedule(
  'purge-old-articles-daily',
  '0 3 * * *',
  'SELECT public.trigger_purge_articles()'
);