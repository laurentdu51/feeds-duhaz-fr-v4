import { supabase } from '@/integrations/supabase/client';

interface MarkUserArticleReadParams {
  userId: string;
  articleId: string;
  isPinned: boolean;
}

export async function markUserArticleAsRead({ userId, articleId, isPinned }: MarkUserArticleReadParams) {
  const readState = {
    is_read: true,
    read_at: new Date().toISOString()
  };

  const { data: updatedRows, error: updateError } = await supabase
    .from('user_articles')
    .update(readState)
    .eq('user_id', userId)
    .eq('article_id', articleId)
    .select('id');

  if (updateError) return updateError;
  if ((updatedRows?.length || 0) > 0) return null;

  const { error: insertError } = await supabase
    .from('user_articles')
    .insert({
      user_id: userId,
      article_id: articleId,
      is_pinned: isPinned,
      ...readState
    });

  if (insertError?.code !== '23505') return insertError ?? null;

  const { error: retryError } = await supabase
    .from('user_articles')
    .update(readState)
    .eq('user_id', userId)
    .eq('article_id', articleId);

  return retryError ?? null;
}