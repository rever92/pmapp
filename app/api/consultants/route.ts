import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type ConsultantFormData } from '@/lib/types'
import { z } from 'zod'

const consultantSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  specialization: z.string().nullable(),
  weekly_hours: z.number().min(1).max(168),
  role: z.enum(['admin', 'project_manager', 'consultant']),
  send_invitation: z.boolean()
})

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const data = await request.json()
    
    // Validar datos
    const validatedData = consultantSchema.parse(data)

    // Generar contraseña aleatoria para el usuario
    const tempPassword = Math.random().toString(36).slice(-12)

    // Crear usuario en auth
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: validatedData.email,
      password: tempPassword,
      email_confirm: true
    })

    if (userError) throw userError

    // Crear consultor
    const { data: consultant, error: consultantError } = await supabase
      .from('consultants')
      .insert({
        name: validatedData.name,
        email: validatedData.email,
        specialization: validatedData.specialization,
        weekly_hours: validatedData.weekly_hours,
        user_id: userData.user.id
      })
      .select()
      .single()

    if (consultantError) throw consultantError

    // Asignar rol
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userData.user.id,
        role: validatedData.role
      })

    if (roleError) throw roleError

    // Enviar invitación si se solicitó
    if (validatedData.send_invitation) {
      const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
        validatedData.email
      )
      if (inviteError) throw inviteError
    }

    return NextResponse.json({ success: true, data: consultant })
  } catch (error: any) {
    console.error('Error creating consultant:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { id, ...data } = await request.json()
    
    // Validar datos
    const validatedData = consultantSchema.parse(data)

    // Actualizar consultor
    const { data: consultant, error: consultantError } = await supabase
      .from('consultants')
      .update({
        name: validatedData.name,
        email: validatedData.email,
        specialization: validatedData.specialization,
        weekly_hours: validatedData.weekly_hours
      })
      .eq('id', id)
      .select()
      .single()

    if (consultantError) throw consultantError

    // Actualizar rol si el consultor tiene un usuario asociado
    if (consultant.user_id) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: validatedData.role })
        .eq('user_id', consultant.user_id)

      if (roleError) throw roleError

      // Reenviar invitación si se solicitó
      if (validatedData.send_invitation) {
        const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
          validatedData.email
        )
        if (inviteError) throw inviteError
      }
    }

    return NextResponse.json({ success: true, data: consultant })
  } catch (error: any) {
    console.error('Error updating consultant:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    )
  }
} 