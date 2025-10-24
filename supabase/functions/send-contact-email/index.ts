import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactRequest {
  fullName: string;
  email: string;
  phone?: string;
  companyName: string;
  message: string;
}

// HTML escaping function to prevent XSS
const escapeHtml = (text: string): string => {
  if (!text) return '';
  return text.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return entities[char];
  });
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fullName, email, phone, companyName, message }: ContactRequest = await req.json();

    console.log("Contact form submission received at:", new Date().toISOString());

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Rate limiting: Get IP address from headers
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    console.log("Rate limit check initiated");

    // Check submissions from this IP in the last hour
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { data: recentSubmissions, error: logError } = await supabase
      .from('contact_submissions_log')
      .select('created_at')
      .eq('ip_address', ipAddress)
      .gte('created_at', oneHourAgo);

    if (logError) {
      console.error('Error checking rate limit:', logError);
    }

    // Allow max 3 submissions per hour per IP
    if (recentSubmissions && recentSubmissions.length >= 3) {
      console.log('Rate limit exceeded');
      return new Response(
        JSON.stringify({ 
          error: 'Demasiados envíos. Por favor, intenta de nuevo más tarde.' 
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Log this submission attempt
    const { error: insertLogError } = await supabase
      .from('contact_submissions_log')
      .insert({ ip_address: ipAddress, email });

    if (insertLogError) {
      console.error('Error logging submission:', insertLogError);
      // Continue anyway - logging shouldn't block the submission
    }

    // Fetch destination email from contact_settings
    const { data: settings, error: settingsError } = await supabase
      .from("contact_settings")
      .select("destination_email")
      .limit(1)
      .single();

    if (settingsError) {
      console.error("Error fetching contact settings:", settingsError);
      throw new Error("Could not fetch contact settings");
    }

    const destinationEmail = settings?.destination_email || "info@techsecureai.com";

    console.log("Sending email");

    // Send email using Resend API directly
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "TechSecureIA <onboarding@resend.dev>",
        to: [destinationEmail],
        reply_to: email,
        subject: `Nueva Consulta de ${companyName}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #e879a6; border-bottom: 2px solid #e879a6; padding-bottom: 10px;">
            Nueva Consulta - TechSecureIA
          </h1>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">Información de Contacto</h2>
            <p><strong>Nombre:</strong> ${escapeHtml(fullName)}</p>
            <p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
            ${phone ? `<p><strong>Teléfono:</strong> ${escapeHtml(phone)}</p>` : ""}
            <p><strong>Empresa:</strong> ${escapeHtml(companyName)}</p>
          </div>

          <div style="margin: 20px 0;">
            <h2 style="color: #333;">Mensaje</h2>
            <div style="background-color: #fff; padding: 15px; border-left: 4px solid #e879a6; border-radius: 4px;">
              <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
            </div>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
            <p>Este mensaje fue enviado desde el formulario de contacto de TechSecureIA.</p>
            <p>Para responder, usa el botón de responder en tu cliente de correo o escribe directamente a: ${escapeHtml(email)}</p>
          </div>
        </div>
      `,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Resend API error:", errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const emailData = await emailResponse.json();
    console.log("Email sent successfully");

    return new Response(JSON.stringify({ success: true, data: emailData }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send email" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
