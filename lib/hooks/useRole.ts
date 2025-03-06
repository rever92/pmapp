import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { type UserRole } from '@/lib/types'

interface UseRoleReturn {
  role: UserRole | null
  userId: string | null
  isLoading: boolean
  error: Error | null
  isAdmin: boolean
  isProjectManager: boolean
  isConsultant: boolean
  canManageUsers: boolean
  canManageProjects: boolean
  canManageConsultants: boolean
}

export function useRole(): UseRoleReturn {
  const [role, setRole] = useState<UserRole | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setRole(null)
          setUserId(null)
          return
        }

        setUserId(user.id)

        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single()

        if (roleError) throw roleError

        setRole(roleData.role)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error al obtener el rol'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchRole()

    // Suscribirse a cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async () => {
      await fetchRole()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return {
    role,
    userId,
    isLoading,
    error,
    isAdmin: role === 'admin',
    isProjectManager: role === 'project_manager',
    isConsultant: role === 'consultant',
    canManageUsers: role === 'admin',
    canManageProjects: role === 'admin' || role === 'project_manager',
    canManageConsultants: role === 'admin' || role === 'project_manager'
  }
} 