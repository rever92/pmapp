"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Activity {
  consultant_name: string
  project_name: string
  action: string
  time: string
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        // Obtener tareas recientes con sus relaciones
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select(`
            *,
            consultants (
              first_name,
              last_name
            ),
            projects (
              name
            )
          `)
          .order('created_at', { ascending: false })
          .limit(5)

        if (tasksError) throw tasksError

        // Formatear los datos para mostrar
        const formattedActivities = tasksData.map(task => ({
          consultant_name: `${task.consultants.first_name} ${task.consultants.last_name}`,
          project_name: task.projects.name,
          action: getActionText(task.status),
          time: formatTimeAgo(new Date(task.created_at))
        }))

        setActivities(formattedActivities)
      } catch (error: any) {
        console.error('Error al cargar actividades:', error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [supabase])

  const getActionText = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'tarea asignada'
      case 'in-progress':
        return 'comenzó tarea'
      case 'completed':
        return 'completó tarea'
      case 'blocked':
        return 'reportó bloqueo'
      default:
        return 'actualizó tarea'
    }
  }

  const formatTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInDays > 0) {
      return `hace ${diffInDays} ${diffInDays === 1 ? 'día' : 'días'}`
    }
    if (diffInHours > 0) {
      return `hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`
    }
    if (diffInMinutes > 0) {
      return `hace ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`
    }
    return 'hace unos segundos'
  }

  if (loading) {
    return <div>Cargando...</div>
  }

  return (
    <div className="space-y-8">
      {activities.map((activity, index) => (
        <div key={index} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarFallback>
              {activity.consultant_name.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">
              {activity.consultant_name}
            </p>
            <p className="text-sm text-muted-foreground">
              {activity.action} en {activity.project_name}
            </p>
          </div>
          <div className="ml-auto font-medium text-sm text-muted-foreground">
            {activity.time}
          </div>
        </div>
      ))}
      {activities.length === 0 && (
        <div className="text-center text-sm text-muted-foreground">
          No hay actividad reciente
        </div>
      )}
    </div>
  )
}