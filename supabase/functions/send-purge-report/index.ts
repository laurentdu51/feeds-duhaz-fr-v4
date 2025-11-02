/**
 * Send Purge Report Edge Function
 * Version: 2.0
 * Last updated: 2025-01-20
 * Purpose: Send email reports about article purge operations to admin users
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PurgeReportRequest {
  deletedCount: number;
  adminEmails: string[];
  timestamp: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('📧 Send-purge-report function invoked at', new Date().toISOString());
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log('📝 CORS preflight request handled');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { deletedCount, adminEmails, timestamp }: PurgeReportRequest = await req.json();

    console.log('📨 Preparing to send purge report email...');
    console.log(`📊 Report details: ${deletedCount} articles deleted, ${adminEmails?.length || 0} admins to notify`);
    console.log('📧 Admin emails:', adminEmails);

    const emailDate = new Date(timestamp);
    const formattedDate = emailDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .stat-box {
              background: white;
              border-left: 4px solid #667eea;
              padding: 20px;
              margin: 20px 0;
              border-radius: 5px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .stat-number {
              font-size: 36px;
              font-weight: bold;
              color: #667eea;
              margin: 10px 0;
            }
            .stat-label {
              color: #666;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .criteria {
              background: white;
              padding: 20px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .criteria h3 {
              margin-top: 0;
              color: #667eea;
            }
            .criteria ul {
              margin: 10px 0;
              padding-left: 20px;
            }
            .criteria li {
              margin: 8px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #666;
              font-size: 12px;
            }
            .success-badge {
              display: inline-block;
              background: #10b981;
              color: white;
              padding: 5px 15px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🗑️ Rapport de Purge Automatique</h1>
            <div class="success-badge">✓ EXÉCUTION RÉUSSIE</div>
          </div>
          
          <div class="content">
            <p>Bonjour,</p>
            <p>La purge automatique des articles a été exécutée avec succès.</p>
            
            <div class="stat-box">
              <div class="stat-label">Articles supprimés</div>
              <div class="stat-number">${deletedCount}</div>
            </div>
            
            <div class="stat-box">
              <div class="stat-label">Date d'exécution</div>
              <div style="font-size: 18px; margin-top: 10px;">${formattedDate}</div>
            </div>
            
            <div class="criteria">
              <h3>📋 Critères de purge appliqués</h3>
              <ul>
                <li><strong>Âge des articles :</strong> Plus de 48 heures (2 jours)</li>
                <li><strong>Articles préservés :</strong> 
                  <ul>
                    <li>Articles épinglés par au moins un utilisateur</li>
                    <li>Articles avec plus de 20 lectures</li>
                  </ul>
                </li>
                <li><strong>Fréquence :</strong> Tous les jours à 3h00 du matin</li>
              </ul>
            </div>
            
            ${deletedCount === 0 ? `
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <strong>ℹ️ Information :</strong> Aucun article ne correspondait aux critères de purge.
              </div>
            ` : ''}
            
            <div class="footer">
              <p>Ce rapport est généré automatiquement par le système de purge.</p>
              <p>Pour toute question, veuillez consulter les logs de la base de données.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "News Aggregator <notifications@notifications.duhaz.fr>",
      to: adminEmails,
      subject: `📊 Rapport de purge automatique - ${deletedCount} article${deletedCount > 1 ? 's' : ''} supprimé${deletedCount > 1 ? 's' : ''}`,
      html: emailHtml,
    });

    console.log("Purge report email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-purge-report function:", error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
