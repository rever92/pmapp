"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Pencil, Trash2, X, Check } from "lucide-react"
import { toast } from "sonner"
import { type Project, type Task, type Consultant, type ProjectTemplate, type ProjectStatus, type TaskStatus } from "@/lib/types"
import { TasksTimeline } from "@/components/tasks/TasksTimeline"

const taskStatusColors = {
  'pending': 'secondary',
  'in-progress': 'default',
  'completed': 'outline',
  'blocked': 'destructive'
} as const

const taskStatusLabels = {
  'pending': 'Pendiente',
  'in-progress': 'En Progreso',
  'completed': 'Completada',
  'blocked': 'Bloqueada'
} as const

// Constantes para los estados
const PROJECT_STATUS: Record<string, ProjectStatus> = {
  PLANNING: 'planning',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ON_HOLD: 'on_hold'
}

const TASK_STATUS: Record<string, TaskStatus> = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ON_HOLD: 'on_hold'
}

interface TempTask {
  name: string;
  description: string | null;
  estimated_hours: number;
  start_date: string;
  end_date: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  consultant_id?: string;
}

const projectStatusOptions = [
  { value: PROJECT_STATUS.PLANNING, label: 'Planificación' },
  { value: PROJECT_STATUS.ACTIVE, label: 'Activo' },
  { value: PROJECT_STATUS.COMPLETED, label: 'Completado' },
  { value: PROJECT_STATUS.ON_HOLD, label: 'En Pausa' }
]

const taskStatusOptions = [
  { value: TASK_STATUS.PENDING, label: 'Pendiente' },
  { value: TASK_STATUS.IN_PROGRESS, label: 'En Progreso' },
  { value: TASK_STATUS.COMPLETED, label: 'Completada' },
  { value: TASK_STATUS.ON_HOLD, label: 'En Pausa' }
]

export default function ProjectPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [consultants, setConsultants] = useState<Consultant[]>([])
  const [templates, setTemplates] = useState<ProjectTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [project, setProject] = useState<Project>({
    id: "",
    name: "",
    description: "",
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: PROJECT_STATUS.PLANNING,
    created_at: "",
    updated_at: ""
  })
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState<Partial<Task>>({
    name: "",
    description: "",
    estimated_hours: 8,
    start_date: project.start_date,
    end_date: project.end_date,
    status: TASK_STATUS.PENDING,
    consultant_id: null
  })
  const [tempTasks, setTempTasks] = useState<TempTask[]>([])
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editingTempTaskIndex, setEditingTempTaskIndex] = useState<number | null>(null)
  const [editingTempTask, setEditingTempTask] = useState<TempTask | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch consultants
        const { data: consultantsData, error: consultantsError } = await supabase
          .from("consultants")
          .select("*")
          .eq("status", "active")
          .order("last_name")

        if (consultantsError) throw consultantsError

        setConsultants(consultantsData)

        // Fetch templates if creating new project
        if (params.id === "new") {
          const { data: templatesData, error: templatesError } = await supabase
            .from("project_templates")
            .select("*")
            .order("name")

          if (templatesError) throw templatesError
          setTemplates(templatesData)
        }

        if (params.id !== "new") {
          // Fetch project
          const { data: projectData, error: projectError } = await supabase
            .from("projects")
            .select("*")
            .eq("id", params.id)
            .single()

          if (projectError) throw projectError

          setProject(projectData)

          // Fetch tasks
          const { data: tasksData, error: tasksError } = await supabase
            .from("tasks")
            .select("*")
            .eq("project_id", params.id)
            .order("start_date")

          if (tasksError) throw tasksError

          setTasks(tasksData)
        }
      } catch (error: any) {
        toast.error(`Error al cargar datos: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar que todas las tareas temporales tengan consultor asignado
    if (params.id === "new" && tempTasks.length > 0) {
      const unassignedTasks = tempTasks.filter(task => !task.consultant_id)
      if (unassignedTasks.length > 0) {
        toast.error("Todas las tareas deben tener un consultor asignado")
        return
      }
    }

    setLoading(true)

    try {
      const projectData = {
        name: project.name,
        description: project.description || null,
        start_date: project.start_date,
        end_date: project.end_date,
        status: project.status
      }

      if (params.id === "new") {
        // Crear el proyecto
        const { data: newProject, error: projectError } = await supabase
          .from("projects")
          .insert([projectData])
          .select()
          .single()

        if (projectError) throw projectError

        // Si hay tareas de la plantilla, crearlas
        if (tempTasks.length > 0) {
          const tasksToCreate = tempTasks.map(task => ({
            project_id: newProject.id,
            name: task.name,
            description: task.description,
            start_date: task.start_date,
            end_date: task.end_date,
            estimated_hours: task.estimated_hours,
            status: task.status,
            consultant_id: task.consultant_id
          }))

          const { error: tasksError } = await supabase
            .from("tasks")
            .insert(tasksToCreate)

          if (tasksError) throw tasksError
        }

        toast.success("Proyecto creado exitosamente")
        router.push(`/projects/${newProject.id}`)
      } else {
        const { error } = await supabase
          .from("projects")
          .update(projectData)
          .eq("id", params.id)

        if (error) throw error

        toast.success("Proyecto actualizado exitosamente")
        router.push("/projects")
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
        project_id: params.id,
        description: newTask.description || null,
        consultant_id: newTask.consultant_id || null
      }

      const { data, error } = await supabase
        .from("tasks")
        .insert([taskData])
        .select()
        .single()

      if (error) throw error

      setTasks([...tasks, data])
      setNewTask({
        name: "",
        description: "",
        estimated_hours: 8,
        start_date: project.start_date,
        end_date: project.end_date,
        status: TASK_STATUS.PENDING,
        consultant_id: null
      })
      toast.success("Tarea agregada exitosamente")
    } catch (error: any) {
      toast.error(`Error: ${error.message}`)
    }
  }

  const applyTemplate = async (templateId: string) => {
    try {
      // Obtener la plantilla y sus tareas
      const { data: template, error: templateError } = await supabase
        .from("project_templates")
        .select("*")
        .eq("id", templateId)
        .single()

      if (templateError) throw templateError

      // Actualizar el proyecto con los datos de la plantilla
      setProject(prev => ({
        ...prev,
        name: template.name,
        description: template.description,
        estimated_duration_days: template.estimated_duration_days
      }))

      // Obtener las tareas de la plantilla
      const { data: taskTemplates, error: tasksError } = await supabase
        .from("task_templates")
        .select("*")
        .eq("project_template_id", templateId)
        .order("relative_start_day")

      if (tasksError) throw tasksError

      // Calcular las fechas de las tareas basadas en la fecha de inicio del proyecto
      const projectStartDate = new Date(project.start_date)
      const newTasks: TempTask[] = taskTemplates.map(template => ({
        name: template.name,
        description: template.description,
        estimated_hours: template.estimated_hours,
        start_date: new Date(projectStartDate.getTime() + template.relative_start_day * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date(projectStartDate.getTime() + template.relative_end_day * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: "pending",
        consultant_id: undefined
      }))

      setTempTasks(newTasks)
      toast.success("Plantilla aplicada exitosamente")
    } catch (error: any) {
      toast.error(`Error al aplicar la plantilla: ${error.message}`)
    }
  }

  const handleEditTask = async (task: Task) => {
    try {
      const taskData = {
        name: task.name,
        description: task.description,
        estimated_hours: task.estimated_hours,
        start_date: task.start_date,
        end_date: task.end_date,
        status: task.status,
        consultant_id: task.consultant_id
      }

      const { error } = await supabase
        .from("tasks")
        .update(taskData)
        .eq("id", task.id)

      if (error) throw error

      setTasks(tasks.map(t => t.id === task.id ? { ...t, ...taskData } : t))
      toast.success("Tarea actualizada exitosamente")
    } catch (error: any) {
      toast.error(`Error: ${error.message}`)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId)

      if (error) throw error

      setTasks(tasks.filter(t => t.id !== taskId))
      toast.success("Tarea eliminada exitosamente")
    } catch (error: any) {
      toast.error(`Error: ${error.message}`)
    }
  }

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id)
    setEditingTask(task)
  }

  const cancelEditing = () => {
    setEditingTaskId(null)
    setEditingTask(null)
  }

  const handleEditTempTask = (index: number) => {
    setEditingTempTaskIndex(index)
    setEditingTempTask(tempTasks[index])
  }

  const handleSaveTempTask = () => {
    if (!editingTempTask || editingTempTaskIndex === null) return

    const updatedTasks = [...tempTasks]
    updatedTasks[editingTempTaskIndex] = editingTempTask
    setTempTasks(updatedTasks)
    setEditingTempTaskIndex(null)
    setEditingTempTask(null)
    toast.success("Tarea actualizada exitosamente")
  }

  const cancelTempTaskEditing = () => {
    setEditingTempTaskIndex(null)
    setEditingTempTask(null)
  }

  // Función para verificar si se puede guardar el proyecto
  const canSaveProject = () => {
    if (params.id === "new" && tempTasks.length > 0) {
      return !tempTasks.some(task => !task.consultant_id)
    }
    return true
  }

  if (loading) {
    return <div>Cargando...</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">
        {params.id === "new" ? "Nuevo Proyecto" : "Editar Proyecto"}
      </h1>

      {params.id === "new" && templates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Usar Plantilla (Opcional)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Seleccionar Plantilla</Label>
                <Select
                  value={selectedTemplate}
                  onValueChange={(value) => {
                    setSelectedTemplate(value)
                    if (value) applyTemplate(value)
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar una plantilla para comenzar" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-2">
                  Las plantillas te ayudan a comenzar rápidamente con un conjunto predefinido de tareas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información del Proyecto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Proyecto</Label>
              <Input
                id="name"
                value={project.name}
                onChange={(e) => setProject({ ...project, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={project.description || ""}
                onChange={(e) => setProject({ ...project, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Fecha de Inicio</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={project.start_date}
                  onChange={(e) => setProject({ ...project, start_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Fecha de Fin</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={project.end_date}
                  onChange={(e) => setProject({ ...project, end_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={project.status}
                onValueChange={(value: ProjectStatus) => setProject({ ...project, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {projectStatusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/projects")}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={loading || !canSaveProject()}
          >
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>

      {params.id !== "new" && (
        <Card>
          <CardHeader>
            <CardTitle>Tareas del Proyecto</CardTitle>
          </CardHeader>
          <CardContent>
            <TasksTimeline
              tasks={tasks}
              projectStartDate={project.start_date}
              onEditTask={(task) => handleEditTask(task as Task)}
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
                    <Label>Fecha de Inicio</Label>
                    <Input
                      type="date"
                      value={newTask.start_date}
                      onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha de Fin</Label>
                    <Input
                      type="date"
                      value={newTask.end_date}
                      onChange={(e) => setNewTask({ ...newTask, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Consultor Asignado</Label>
                    <Input
                      placeholder="ID del consultor"
                      value={newTask.consultant_id || ""}
                      onChange={(e) => setNewTask({ ...newTask, consultant_id: e.target.value })}
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

      {params.id === "new" && tempTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tareas de la Plantilla</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tempTasks.map((task, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-2">
                {editingTempTaskIndex === index ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nombre de la Tarea</Label>
                      <Input
                        value={editingTempTask?.name || ""}
                        onChange={(e) => setEditingTempTask(prev => prev ? { ...prev, name: e.target.value } : null)}
                        placeholder="Nombre de la tarea"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descripción</Label>
                      <Textarea
                        value={editingTempTask?.description || ""}
                        onChange={(e) => setEditingTempTask(prev => prev ? { ...prev, description: e.target.value } : null)}
                        placeholder="Descripción de la tarea"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Fecha de Inicio</Label>
                        <Input
                          type="date"
                          value={editingTempTask?.start_date || ""}
                          onChange={(e) => setEditingTempTask(prev => prev ? { ...prev, start_date: e.target.value } : null)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fecha de Fin</Label>
                        <Input
                          type="date"
                          value={editingTempTask?.end_date || ""}
                          onChange={(e) => setEditingTempTask(prev => prev ? { ...prev, end_date: e.target.value } : null)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Consultor</Label>
                        <Select
                          value={editingTempTask?.consultant_id || ""}
                          onValueChange={(value) => setEditingTempTask(prev => prev ? { ...prev, consultant_id: value } : null)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar consultor" />
                          </SelectTrigger>
                          <SelectContent>
                            {consultants.map((consultant) => (
                              <SelectItem key={consultant.id} value={consultant.id}>
                                {consultant.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Horas Estimadas</Label>
                        <Input
                          type="number"
                          min="1"
                          value={editingTempTask?.estimated_hours || 0}
                          onChange={(e) => setEditingTempTask(prev => prev ? { ...prev, estimated_hours: parseInt(e.target.value) } : null)}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={cancelTempTaskEditing}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveTempTask}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Guardar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{task.name}</h3>
                        <span className="text-sm text-muted-foreground">
                          ({task.estimated_hours}h)
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditTempTask(index)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Consultor:</span>
                        <span className={!task.consultant_id ? "text-red-500" : ""}>
                          {task.consultant_id 
                            ? `${consultants.find(c => c.id === task.consultant_id)?.name}`
                            : 'No asignado'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Período:</span>
                        <span>
                          {new Date(task.start_date).toLocaleDateString()} - {new Date(task.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}