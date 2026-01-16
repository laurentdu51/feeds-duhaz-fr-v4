-- Supprimer l'ancienne politique restrictive (authentifiés uniquement)
DROP POLICY IF EXISTS "Authenticated users can read articles" ON articles;

-- Créer une nouvelle politique permettant l'accès public en lecture
CREATE POLICY "Anyone can read articles"
  ON articles
  FOR SELECT
  USING (true);