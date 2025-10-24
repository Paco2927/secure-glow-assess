import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

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

    // Send welcome email with credentials
    try {
      const fromAddress = Deno.env.get('EMAIL_FROM_ADDRESS') || 'TechSecure AI <onboarding@resend.dev>'
      
      console.log('=== RESEND EMAIL ATTEMPT ===')
      console.log('RESEND_API_KEY exists:', !!Deno.env.get('RESEND_API_KEY'))
      console.log('RESEND_API_KEY length:', Deno.env.get('RESEND_API_KEY')?.length || 0)
      console.log('Sending email to:', email)
      console.log('From address:', fromAddress)
      
      const emailResponse = await resend.emails.send({
        from: fromAddress,
        to: [email],
        subject: 'Bienvenido a TechSecure AI - Credenciales de Acceso',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">¡Bienvenido a TechSecure AI!</h1>
            
            <p>Se ha creado una cuenta para usted en TechSecure AI. A continuación encontrará sus credenciales de acceso:</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 10px 0;"><strong>Correo electrónico:</strong> ${email}</p>
              <p style="margin: 10px 0;"><strong>Contraseña:</strong> ${password}</p>
            </div>
            
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                <strong>⚠️ Recomendación de Seguridad:</strong><br/>
                Por su seguridad, le recomendamos encarecidamente que cambie su contraseña una vez que acceda a la plataforma por primera vez. 
                Puede hacerlo desde su perfil de usuario.
              </p>
            </div>
            
            <p>Si tiene alguna pregunta o necesita ayuda, no dude en contactarnos.</p>
            
            <p style="color: #666; margin-top: 30px;">
              Saludos,<br/>
              El equipo de TechSecure AI
            </p>
          </div>
        `,
      })
      
      console.log('=== RESEND RESPONSE ===')
      console.log('Full response:', JSON.stringify(emailResponse, null, 2))
      console.log('Response data:', emailResponse.data)
      console.log('Response error:', emailResponse.error)
      
      if (emailResponse.error) {
        console.error('❌ Resend returned an error:', emailResponse.error)
        throw new Error(`Resend error: ${JSON.stringify(emailResponse.error)}`)
      }
      
      if (emailResponse.data) {
        console.log('✅ Email sent successfully!')
        console.log('Email ID:', emailResponse.data.id)
      } else {
        console.warn('⚠️ No data in response, but no error either')
      }
      
    } catch (emailError) {
      console.error('=== EMAIL ERROR ===')
      console.error('Error type:', emailError?.constructor?.name)
      console.error('Error message:', (emailError as Error)?.message)
      console.error('Full error object:', JSON.stringify(emailError, null, 2))
      console.error('Error stack:', (emailError as Error)?.stack)
      // Don't fail the user creation if email fails
    }

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
