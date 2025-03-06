"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Plus, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import { type ProjectTemplate } from "@/lib/types"
import { toast } from "sonner"

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<ProjectTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [taskHours, setTaskHours] = useState<Record<string, number>>({})
  const [templateDurations, setTemplateDurations] = useState<Record<string, number>>({})
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        // Obtener plantillas
        const { data: templatesData, error: templatesError } = await supabase
          .from('project_templates')
          .select('*')
          .order('name')

        if (templatesError) throw templatesError

        // Obtener todas las tareas
        const { data: tasksData, error: tasksError } = await supabase
          .from('task_templates')
          .select('project_template_id, estimated_hours, relative_end_day')

        if (tasksError) throw tasksError

        // Calcular horas totales y duración por plantilla
        const hoursMap: Record<string, number> = {}
        const durationsMap: Record<string, number> = {}

        tasksData.forEach(task => {
          // Calcular horas totales
          hoursMap[task.project_template_id] = (hoursMap[task.project_template_id] || 0) + task.estimated_hours
          
          // Calcular duración (día más alto + 1)
          const currentMaxDay = durationsMap[task.project_template_id] || 0
          durationsMap[task.project_template_id] = Math.max(currentMaxDay, task.relative_end_day + 1)
        })

        setTaskHours(hoursMap)
        setTemplateDurations(durationsMap)
        setTemplates(templatesData)
      } catch (error: any) {
        console.error('Error al cargar plantillas:', error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [supabase])

  const handleDuplicate = async (template: ProjectTemplate) => {
    try {
      // Crear nueva plantilla
      const { data: newTemplate, error: templateError } = await supabase
        .from("project_templates")
        .insert([{
          name: `${template.name} (copia)`,
          description: template.description,
          estimated_duration_days: templateDurations[template.id] || 0
        }])
        .select()
        .single()

      if (templateError) throw templateError

      // Obtener tareas de la plantilla original
      const { data: originalTasks, error: tasksError } = await supabase
        .from("task_templates")
        .select("*")
        .eq("project_template_id", template.id)

      if (tasksError) throw tasksError

      if (originalTasks.length > 0) {
        // Crear nuevas tareas para la plantilla duplicada
        const newTasks = originalTasks.map(task => ({
          project_template_id: newTemplate.id,
          name: task.name,
          description: task.description,
          estimated_hours: task.estimated_hours,
          relative_start_day: task.relative_start_day,
          relative_end_day: task.relative_end_day,
          specialization: task.specialization
        }))

        const { error: newTasksError } = await supabase
          .from("task_templates")
          .insert(newTasks)

        if (newTasksError) throw newTasksError
      }

      // Actualizar la lista de plantillas
      const { data: updatedTemplates, error: refreshError } = await supabase
        .from('project_templates')
        .select('*')
        .order('name')

      if (refreshError) throw refreshError
      setTemplates(updatedTemplates)

      // Recalcular horas y duraciones
      const { data: allTasks, error: allTasksError } = await supabase
        .from('task_templates')
        .select('project_template_id, estimated_hours, relative_end_day')

      if (allTasksError) throw allTasksError

      const hoursMap: Record<string, number> = {}
      const durationsMap: Record<string, number> = {}

      allTasks.forEach(task => {
        hoursMap[task.project_template_id] = (hoursMap[task.project_template_id] || 0) + task.estimated_hours
        const currentMaxDay = durationsMap[task.project_template_id] || 0
        durationsMap[task.project_template_id] = Math.max(currentMaxDay, task.relative_end_day + 1)
      })

      setTaskHours(hoursMap)
      setTemplateDurations(durationsMap)

      toast.success("Plantilla duplicada exitosamente")
    } catch (error: any) {
      toast.error(`Error al duplicar la plantilla: ${error.message}`)
    }
  }

  if (loading) {
    return <div>Cargando...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Plantillas de Proyectos</h1>
        <Button asChild>
          <Link href="/templates/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Plantilla
          </Link>
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Duración Estimada</TableHead>
            <TableHead>Total Horas</TableHead>
            <TableHead>Última Actualización</TableHead>
            <TableHead className="w-[100px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template) => (
            <TableRow key={template.id}>
              <TableCell>
                <Link href={`/templates/${template.id}`} className="hover:underline">
                  {template.name}
                </Link>
              </TableCell>
              <TableCell>{templateDurations[template.id] || 0} días</TableCell>
              <TableCell>{taskHours[template.id] || 0}h</TableCell>
              <TableCell>
                {new Date(template.updated_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDuplicate(template)}
                  title="Duplicar plantilla"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {templates.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No hay plantillas creadas
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
} 