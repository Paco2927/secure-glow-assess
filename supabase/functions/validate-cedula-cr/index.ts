import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifikResponse {
  status: string;
  data: {
    firstName: string;
    lastName1: string;
    lastName2?: string;
    fullName?: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cedula } = await req.json();

    // Validate cedula format (Costa Rica: X-XXXX-XXXX or XXXXXXXXX)
    const cedulaRegex = /^[1-9]-?\d{4}-?\d{4}$/;
    const cleanCedula = cedula.replace(/-/g, '');
    
    if (!cedulaRegex.test(cedula) || cleanCedula.length !== 9) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Formato de cédula inválido. Use: X-XXXX-XXXX' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const veifikApiKey = Deno.env.get('VERIFIK_API_KEY');
    if (!veifikApiKey) {
      console.error('VERIFIK_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Servicio no configurado' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Call Verifik API
    console.log(`Validating cedula: ${cleanCedula}`);
    const veifikResponse = await fetch(
      `https://api.verifik.co/v2/cr/identity?documentNumber=${cleanCedula}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${veifikApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!veifikResponse.ok) {
      const errorText = await veifikResponse.text();
      console.error('Verifik API error:', veifikResponse.status, errorText);
      
      if (veifikResponse.status === 404) {
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

    const data: VerifikResponse = await veifikResponse.json();
    
    // Extract full name
    let fullName = data.data.fullName;
    if (!fullName) {
      // Build name from parts
      fullName = `${data.data.firstName} ${data.data.lastName1}`;
      if (data.data.lastName2) {
        fullName += ` ${data.data.lastName2}`;
      }
    }

    console.log(`Successfully validated cedula: ${cleanCedula}, name: ${fullName}`);

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
