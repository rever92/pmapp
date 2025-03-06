"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Pencil, X, Check, List, GanttChart } from "lucide-react"
import { toast } from "sonner"
import { type ProjectTemplate, type TaskTemplate } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { TasksTimeline } from "@/components/tasks/TasksTimeline"

export default function TemplatePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [template, setTemplate] = useState<ProjectTemplate>({
    id: "",
    name: "",
    description: "",
    estimated_duration_days: 0,
    created_at: "",
    updated_at: ""
  })
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([])
  const [newTask, setNewTask] = useState<Partial<TaskTemplate>>({
    name: "",
    description: "",
    estimated_hours: 8,
    relative_start_day: 0,
    relative_end_day: 1,
    specialization: ""
  })
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<TaskTemplate | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "timeline">("list")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Calcular la duración estimada basada en las tareas
  const calculateEstimatedDuration = (tasks: TaskTemplate[]) => {
    if (tasks.length === 0) return 0
    return Math.max(...tasks.map(task => task.relative_end_day)) + 1
  }

  useEffect(() => {
    const fetchData = async () => {
      if (params.id === "new") {
        setLoading(false)
        return
      }

      try {
        // Obtener plantilla
        const { data: templateData, error: templateError } = await supabase
          .from("project_templates")
          .select("*")
          .eq("id", params.id)
          .single()

        if (templateError) throw templateError
        setTemplate(templateData)

        // Obtener tareas de la plantilla
        const { data: tasksData, error: tasksError } = await supabase
          .from("task_templates")
          .select("*")
          .eq("project_template_id", params.id)
          .order("relative_start_day")

        if (tasksError) throw tasksError
        setTaskTemplates(tasksData)
      } catch (error: any) {
        toast.error(`Error al cargar datos: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id, supabase])

  useEffect(() => {
    // Actualizar la duración estimada cuando cambian las tareas
    const duration = calculateEstimatedDuration(taskTemplates)
    if (duration !== template.estimated_duration_days) {
      setTemplate(prev => ({ ...prev, estimated_duration_days: duration }))
    }
  }, [taskTemplates])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const templateData = {
        name: template.name,
        description: template.description || null,
        estimated_duration_days: calculateEstimatedDuration(taskTemplates)
      }

      if (params.id === "new") {
        const { data, error } = await supabase
          .from("project_templates")
          .insert([templateData])
          .select()
          .single()

        if (error) throw error

        toast.success("Plantilla creada exitosamente")
        router.push(`/templates/${data.id}`)
      } else {
        const { error } = await supabase
          .from("project_templates")
          .update(templateData)
          .eq("id", params.id)

        if (error) throw error

        toast.success("Plantilla actualizada exitosamente")
        router.push("/templates")
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTask = async () => {
    if (!newTask.name) {
      toast.error("Por favor ingrese el nombre de la tarea")
      return
    }

    try {
      const taskData = {
        ...newTask,
        project_template_id: params.id,
        description: newTask.description || null,
        specialization: newTask.specialization || null
      }

      const { data, error } = await supabase
        .from("task_templates")
        .insert([taskData])
        .select()
        .single()

      if (error) throw error

      setTaskTemplates([...taskTemplates, data])
      setNewTask({
        name: "",
        description: "",
        estimated_hours: 8,
        relative_start_day: 0,
        relative_end_day: 1,
        specialization: ""
      })
      toast.success("Tarea agregada exitosamente")
    } catch (error: any) {
      toast.error(`Error: ${error.message}`)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("task_templates")
        .delete()
        .eq("id", taskId)

      if (error) throw error

      setTaskTemplates(taskTemplates.filter(t => t.id !== taskId))
      toast.success("Tarea eliminada exitosamente")
    } catch (error: any) {
      toast.error(`Error: ${error.message}`)
    }
  }

  const handleEditTask = async (task: TaskTemplate) => {
    try {
      const taskData = {
        name: task.name,
        description: task.description,
        estimated_hours: task.estimated_hours,
        relative_start_day: task.relative_start_day,
        relative_end_day: task.relative_end_day,
        specialization: task.specialization
      }

      const { error } = await supabase
        .from("task_templates")
        .update(taskData)
        .eq("id", task.id)

      if (error) throw error

      setTaskTemplates(taskTemplates.map(t => t.id === task.id ? { ...t, ...taskData } : t))
      toast.success("Tarea actualizada exitosamente")
    } catch (error: any) {
      toast.error(`Error: ${error.message}`)
    }
  }

  const startEditing = (task: TaskTemplate) => {
    setEditingTaskId(task.id)
    setEditingTask(task)
    setIsEditDialogOpen(true)
  }

  const cancelEditing = () => {
    setEditingTaskId(null)
    setEditingTask(null)
    setIsEditDialogOpen(false)
  }

  // Función de utilidad para ordenar tareas
  const sortedTasks = (tasks: TaskTemplate[]) => {
    return [...tasks].sort((a, b) => {
      // Primero ordenar por día de inicio
      const startDayDiff = a.relative_start_day - b.relative_start_day
      if (startDayDiff !== 0) return startDayDiff
      // Si tienen el mismo día de inicio, ordenar por duración (más cortas primero)
      return (a.relative_end_day - a.relative_start_day) - (b.relative_end_day - b.relative_start_day)
    })
  }

  if (loading) {
    return <div>Cargando...</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">
        {params.id === "new" ? "Nueva Plantilla" : "Editar Plantilla"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información de la Plantilla</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la Plantilla</Label>
              <Input
                id="name"
                value={template.name}
                onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={template.description || ""}
                onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Duración Estimada</Label>
              <div className="text-sm text-muted-foreground">
                {template.estimated_duration_days} días (calculado automáticamente)
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/templates")}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>

      {params.id !== "new" && (
        <Card>
          <CardHeader>
            <CardTitle>Tareas de la Plantilla</CardTitle>
          </CardHeader>
          <CardContent>
            <TasksTimeline
              tasks={taskTemplates}
              isTemplate={true}
              onEditTask={(task) => handleEditTask(task as TaskTemplate)}
              onDeleteTask={handleDeleteTask}
            />

            <div className="border-t mt-6 pt-6">
              <h3 className="font-medium mb-4">Agregar Nueva Tarea</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre de la Tarea</Label>
                  <Input
                    placeholder="Nombre de la tarea"
                    value={newTask.name}
                    onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    placeholder="Descripción de la tarea"
                    value={newTask.description || ""}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Día de Inicio Relativo</Label>
                    <Input
                      type="number"
                      min="0"
                      value={newTask.relative_start_day}
                      onChange={(e) => setNewTask({ ...newTask, relative_start_day: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Día de Fin Relativo</Label>
                    <Input
                      type="number"
                      min="1"
                      value={newTask.relative_end_day}
                      onChange={(e) => setNewTask({ ...newTask, relative_end_day: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Especialización Requerida</Label>
                    <Input
                      placeholder="Especialización"
                      value={newTask.specialization || ""}
                      onChange={(e) => setNewTask({ ...newTask, specialization: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Horas Estimadas</Label>
                    <Input
                      type="number"
                      min="1"
                      value={newTask.estimated_hours}
                      onChange={(e) => setNewTask({ ...newTask, estimated_hours: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleAddTask}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Tarea
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tarea</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre de la Tarea</Label>
              <Input
                value={editingTask?.name || ""}
                onChange={(e) => setEditingTask(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="Nombre de la tarea"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={editingTask?.description || ""}
                onChange={(e) => setEditingTask(prev => prev ? { ...prev, description: e.target.value } : null)}
                placeholder="Descripción de la tarea"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Día de Inicio Relativo</Label>
                <Input
                  type="number"
                  min="0"
                  value={editingTask?.relative_start_day || 0}
                  onChange={(e) => setEditingTask(prev => prev ? { ...prev, relative_start_day: parseInt(e.target.value) } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Día de Fin Relativo</Label>
                <Input
                  type="number"
                  min="1"
                  value={editingTask?.relative_end_day || 1}
                  onChange={(e) => setEditingTask(prev => prev ? { ...prev, relative_end_day: parseInt(e.target.value) } : null)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Especialización Requerida</Label>
                <Input
                  placeholder="Especialización"
                  value={editingTask?.specialization || ""}
                  onChange={(e) => setEditingTask(prev => prev ? { ...prev, specialization: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Horas Estimadas</Label>
                <Input
                  type="number"
                  min="1"
                  value={editingTask?.estimated_hours || 1}
                  onChange={(e) => setEditingTask(prev => prev ? { ...prev, estimated_hours: parseInt(e.target.value) } : null)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={cancelEditing}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => {
                handleEditTask(editingTask!)
                setIsEditDialogOpen(false)
              }}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 