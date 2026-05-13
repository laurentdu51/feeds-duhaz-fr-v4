import { useEffect, useState } from 'react';
import { SEO } from '@/components/SEO';

const SUPABASE_URL = "https://data.duhaz.fr";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc1MjA3MzMzLCJleHAiOjE5MzI4ODczMzN9.H3MmzeioXx3Op6gOjA9JvGe2hIyUwkqY-vbyy5kD2Es";

interface CheckResult {
  ok: boolean;
  httpCode: number | null;
  latencyMs: number | null;
  error?: string;
}

interface HealthReport {
  status: 'ok' | 'degraded' | 'down';
  checks: { supabase_rest: CheckResult };
  checkedAt: string;
}

async function checkRest(): Promise<CheckResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  const start = performance.now();
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: { apikey: SUPABASE_ANON_KEY },
      signal: controller.signal,
    });
    const latencyMs = Math.round(performance.now() - start);
    // 200 or 401 both indicate the service is responding
    return {
      ok: res.status === 200 || res.status === 401,
      httpCode: res.status,
      latencyMs,
    };
  } catch (e: any) {
    return {
      ok: false,
      httpCode: null,
      latencyMs: Math.round(performance.now() - start),
      error: e?.name === 'AbortError' ? 'timeout' : (e?.message || 'unknown'),
    };
  } finally {
    clearTimeout(timeout);
  }
}

const Health = () => {
  const [report, setReport] = useState<HealthReport | null>(null);

  const run = async () => {
    const supabase_rest = await checkRest();
    const status: HealthReport['status'] = supabase_rest.ok
      ? (supabase_rest.latencyMs && supabase_rest.latencyMs > 1500 ? 'degraded' : 'ok')
      : 'down';
    setReport({
      status,
      checks: { supabase_rest },
      checkedAt: new Date().toISOString(),
    });
  };

  useEffect(() => {
    document.title = 'Health';
    run();
    const id = setInterval(run, 30000);
    return () => clearInterval(id);
  }, []);

  const statusColor =
    report?.status === 'ok' ? '#16a34a'
    : report?.status === 'degraded' ? '#d97706'
    : report?.status === 'down' ? '#dc2626'
    : '#6b7280';

  return (
    <main style={{
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      padding: '1.5rem',
      maxWidth: 720,
      margin: '0 auto',
    }}>
      <SEO
        title="Health Status - Feeds.Duhaz.fr"
        description="Page de statut technique : disponibilité et latence des services backend de Feeds.Duhaz.fr."
        canonical="https://feeds.duhaz.fr/health"
      />
      <h1 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
        <span
          aria-hidden
          style={{
            display: 'inline-block',
            width: 10, height: 10, borderRadius: '50%',
            background: statusColor, marginRight: 8,
          }}
        />
        Health: {report?.status ?? 'checking...'}
      </h1>
      <pre
        id="health-json"
        style={{
          background: '#0b1020',
          color: '#e6edf3',
          padding: '1rem',
          borderRadius: 6,
          overflow: 'auto',
          fontSize: 13,
          lineHeight: 1.5,
        }}
      >
        {report ? JSON.stringify(report, null, 2) : '{ "status": "checking" }'}
      </pre>
      <p style={{ fontSize: 12, color: '#6b7280', marginTop: '0.75rem' }}>
        Auto-refresh every 30s. Endpoint: <code>{SUPABASE_URL}/rest/v1/</code>
      </p>
    </main>
  );
};

export default Health;
