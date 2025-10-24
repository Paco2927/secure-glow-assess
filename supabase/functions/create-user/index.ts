import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user is authenticated
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if the user is an admin
    const { data: userRoles, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (rolesError || !userRoles) {
      throw new Error('User is not an admin')
    }

    // Validate input data
    const createUserSchema = z.object({
      email: z.string().email({ message: 'El correo electrónico debe ser válido' }),
      password: z.string().min(12, { message: 'La contraseña debe tener al menos 12 caracteres' }),
      name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
      dni: z.string().min(9, { message: 'La cédula debe tener al menos 9 dígitos' }),
    })
    
    const body = await req.json()
    const { email, password, name, dni } = createUserSchema.parse(body)

    // Create user with admin API (auto-confirms email)
    const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name,
        dni,
      },
    })

    if (createError) {
      console.error('Error creating user:', createError)
      throw createError
    }

    // Log the creation for audit purposes
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'

    await supabaseClient
      .from('admin_actions_log')
      .insert({
        admin_id: user.id,
        action: 'CREATE_USER',
        target_user_id: newUser.user?.id,
        ip_address: ipAddress,
        user_agent: userAgent,
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User created successfully',
        user: newUser.user,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in create-user function:', errorMessage)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
