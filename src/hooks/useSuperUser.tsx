
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useSuperUser() {
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const checkSuperUserStatus = async () => {
    if (!user) {
      setIsSuperUser(false);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('is_super_user', { 
        user_email: user.email 
      });
      
      if (error) {
        setIsSuperUser(false);
      } else {
        setIsSuperUser(data || false);
      }
    } catch (error) {
      setIsSuperUser(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSuperUserStatus();
  }, [user]);

  return {
    isSuperUser,
    loading,
    refetch: checkSuperUserStatus
  };
}
