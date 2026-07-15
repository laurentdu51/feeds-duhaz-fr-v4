
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useFeedUpdate() {
  const [updating, setUpdating] = useState<string | null>(null);

  const updateFeed = async (feedId: string, url: string) => {
    try {
      setUpdating(feedId);
      
      toast.info('Mise à jour du flux en cours...');

      const { data, error } = await supabase.functions.invoke('update-feed', {
        body: { feedId, url }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast.success('Flux mis à jour avec succès !');
        return data.data;
      } else {
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du flux');
      throw error;
    } finally {
      setUpdating(null);
    }
  };

  return {
    updateFeed,
    updating
  };
}
