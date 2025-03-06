'use client'

import { createContext, useContext } from 'react'
import { useRole } from '@/lib/hooks/useRole'
import { type UserRole } from '@/lib/types'

interface RoleContextType {
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

const RoleContext = createContext<RoleContextType | null>(null)

export function useRoleContext() {
  const context = useContext(RoleContext)
  if (!context) {
    throw new Error('useRoleContext debe ser usado dentro de un RoleProvider')
  }
  return context
}

export function RoleProvider({
  children
}: {
  children: React.ReactNode
}) {
  const roleData = useRole()

  return (
    <RoleContext.Provider value={roleData}>
      {children}
    </RoleContext.Provider>
  )
} 