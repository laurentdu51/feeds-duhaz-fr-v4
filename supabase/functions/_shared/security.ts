import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * SSRF Protection: Validates URLs to prevent Server-Side Request Forgery attacks
 * Blocks internal network addresses, cloud metadata endpoints, and non-HTTP protocols
 */
export function isValidExternalUrl(urlString: string): { valid: boolean; error?: string } {
  try {
    const url = new URL(urlString);
    
    // Only allow HTTP and HTTPS protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS protocols are allowed' };
    }
    
    const hostname = url.hostname.toLowerCase();
    
    // Block localhost and loopback
    if (['localhost', '127.0.0.1', '::1', '0.0.0.0'].includes(hostname)) {
      return { valid: false, error: 'Localhost addresses are not allowed' };
    }
    
    // Block private IP ranges (RFC 1918)
    if (/^10\./.test(hostname) ||
        /^172\.(1[6-9]|2[0-9]|3[01])\./.test(hostname) ||
        /^192\.168\./.test(hostname)) {
      return { valid: false, error: 'Private IP addresses are not allowed' };
    }
    
    // Block link-local addresses
    if (/^169\.254\./.test(hostname) || /^fe80:/i.test(hostname)) {
      return { valid: false, error: 'Link-local addresses are not allowed' };
    }
    
    // Block cloud metadata endpoints
    const blockedHostnames = [
      '169.254.169.254',           // AWS/GCP/Azure metadata
      'metadata.google.internal',   // GCP metadata
      'metadata.internal',          // Generic cloud metadata
      '100.100.100.200',           // Alibaba Cloud metadata
    ];
    if (blockedHostnames.includes(hostname)) {
      return { valid: false, error: 'Cloud metadata endpoints are not allowed' };
    }
    
    // Block internal/private domain patterns
    if (hostname.endsWith('.internal') || 
        hostname.endsWith('.local') ||
        hostname.endsWith('.localhost')) {
      return { valid: false, error: 'Internal domain names are not allowed' };
    }
    
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Authentication helper: Verifies JWT and returns user claims
 * Returns null if authentication fails
 */
export async function verifyAuth(req: Request): Promise<{ userId: string; email?: string } | null> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    
    const token = authHeader.replace('Bearer ', '');
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data?.user) {
      return null;
    }
    
    return { 
      userId: data.user.id, 
      email: data.user.email 
    };
  } catch {
    return null;
  }
}

/**
 * Verifies if the authenticated user is a super user
 */
export async function verifySuperUser(req: Request): Promise<boolean> {
  const auth = await verifyAuth(req);
  if (!auth) return false;
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    const { data, error } = await supabase.rpc('is_super_user', { user_email: auth.email });
    
    if (error) {
      console.error('Error checking super user status:', error);
      return false;
    }
    
    return data === true;
  } catch {
    return false;
  }
}

/**
 * Validates a cron job secret for internal service-to-service calls
 * ASYNC version: checks env var first, then falls back to app_secrets table
 * SECURITY: Fails closed - requires secret to be configured somewhere
 */
export async function validateCronSecret(req: Request): Promise<boolean> {
  const cronSecret = req.headers.get('x-cron-secret');
  
  if (!cronSecret) {
    return false;
  }

  // 1. Try environment variable first (fastest)
  const envSecret = Deno.env.get('CRON_SECRET');
  if (envSecret) {
    if (cronSecret.length !== envSecret.length) {
      console.log('validateCronSecret: secret length mismatch (env)');
      return false;
    }
    if (cronSecret === envSecret) {
      return true;
    }
    console.log('validateCronSecret: secret value mismatch (env)');
    return false;
  }

  // 2. Fallback: read from app_secrets table via service_role
  console.log('validateCronSecret: CRON_SECRET not in env, trying app_secrets fallback');
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data, error } = await supabase
      .from('app_secrets')
      .select('value')
      .eq('key', 'cron_secret')
      .single();

    if (error || !data?.value) {
      console.error('validateCronSecret: cron_secret not found in app_secrets either - denying access');
      return false;
    }

    const dbSecret = data.value;
    if (cronSecret.length !== dbSecret.length) {
      console.log('validateCronSecret: secret length mismatch (db)');
      return false;
    }
    if (cronSecret === dbSecret) {
      console.log('validateCronSecret: validated via app_secrets fallback');
      return true;
    }
    console.log('validateCronSecret: secret value mismatch (db)');
    return false;
  } catch (err) {
    console.error('validateCronSecret: error reading app_secrets:', err);
    return false;
  }
}

/**
 * Check if request is from internal Supabase service (edge function to edge function)
 */
export function isInternalCall(req: Request): boolean {
  // Check for service role key in authorization
  const authHeader = req.headers.get('Authorization');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (authHeader && serviceRoleKey) {
    return authHeader.includes(serviceRoleKey);
  }
  
  return false;
}
