import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoMetaResponse {
  nombre: string;
  results: Array<{
    nombre: string;
  }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client for rate limiting
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { cedula } = await req.json();

    // Clean cedula (remove dashes and spaces)
    const cleanCedula = cedula.replace(/[-\s]/g, '');
    
    // Get client IP for rate limiting
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                      req.headers.get('x-real-ip') || 
                      'unknown';

    // Check rate limit (10 validations per hour)
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { data: recentValidations, error: rateLimitError } = await supabase
      .from('cedula_validation_log')
      .select('created_at')
      .eq('ip_address', ipAddress)
      .gte('created_at', oneHourAgo);

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
    }

    if (recentValidations && recentValidations.length >= 10) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Límite de validaciones alcanzado. Intente nuevamente en una hora.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      );
    }
    
    // Validate cedula format (Costa Rica: 9 digits)
    if (!/^\d{9}$/.test(cleanCedula)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Formato de cédula inválido. Debe contener 9 dígitos' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Call GoMeta API (free public API)
    console.log('Cedula validation requested');
    const goMetaResponse = await fetch(
      `https://apis.gometa.org/cedulas/${cleanCedula}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!goMetaResponse.ok) {
      console.error('GoMeta API error:', goMetaResponse.status);
      
      if (goMetaResponse.status === 404) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Cédula no encontrada en el registro civil' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Error al validar la cédula. Intente nuevamente.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const data: GoMetaResponse = await goMetaResponse.json();
    
    // Extract full name
    const fullName = data.nombre || (data.results && data.results[0]?.nombre);
    
    if (!fullName) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No se pudo obtener el nombre de la cédula' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    console.log('Cedula validation successful');

    // Log this validation for rate limiting
    await supabase
      .from('cedula_validation_log')
      .insert({
        ip_address: ipAddress,
        cedula: cleanCedula
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        name: fullName.trim()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in validate-cedula-cr:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Error interno del servidor' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
