-- Ajouter la colonne last_seen_at pour suivre quand un article a été vu dans le flux RSS
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Mettre à jour les articles existants avec leur date de création comme valeur initiale
UPDATE public.articles 
SET last_seen_at = created_at 
WHERE last_seen_at IS NULL;