-- =============================================
-- PHASE 1: Corrections de sécurité RLS
-- =============================================

-- 1. Supprimer les anciennes politiques sur feeds
DROP POLICY IF EXISTS "Authenticated users can insert feeds" ON public.feeds;
DROP POLICY IF EXISTS "Authenticated users can update feeds" ON public.feeds;

-- 2. Créer des politiques restrictives pour feeds (super-users uniquement)
CREATE POLICY "Only super users can insert feeds" 
ON public.feeds 
FOR INSERT 
WITH CHECK (is_super_user());

CREATE POLICY "Only super users can update feeds" 
ON public.feeds 
FOR UPDATE 
USING (is_super_user());

-- 3. Corriger la politique sur super_users (voir seulement sa propre entrée)
DROP POLICY IF EXISTS "Only super users can view super users table" ON public.super_users;

CREATE POLICY "Users can only view their own super_user entry" 
ON public.super_users 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Only existing super users can insert" 
ON public.super_users 
FOR INSERT 
WITH CHECK (is_super_user());

CREATE POLICY "Only existing super users can update" 
ON public.super_users 
FOR UPDATE 
USING (is_super_user());

CREATE POLICY "Only existing super users can delete" 
ON public.super_users 
FOR DELETE 
USING (is_super_user());