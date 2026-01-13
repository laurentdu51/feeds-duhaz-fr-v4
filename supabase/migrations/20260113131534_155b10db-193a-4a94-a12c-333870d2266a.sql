-- Fix 1: super_users email exposure
-- Remove direct SELECT access to super_users table
-- The is_super_user() function (security definer) will still work for checking status
DROP POLICY IF EXISTS "Users can only view their own super_user entry" ON public.super_users;

CREATE POLICY "No direct access to super_users"
ON public.super_users
FOR SELECT
USING (false);

-- Fix 2: articles public content exposure  
-- Remove public access policy, keep only authenticated users policy
DROP POLICY IF EXISTS "Public users can read articles" ON public.articles;