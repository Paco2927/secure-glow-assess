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
    const { cedula } = await req.json();

    // Clean cedula (remove dashes and spaces)
    const cleanCedula = cedula.replace(/[-\s]/g, '');
    
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
    console.log(`Validating cedula: ${cleanCedula}`);
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
