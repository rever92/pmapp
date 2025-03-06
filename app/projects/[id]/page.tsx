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
import { type Project, type Task, type Consultant, type ProjectTemplate, type ProjectStatus, type TaskStatus, type ProjectType, type CompanySizeType } from "@/lib/types"
import { TasksTimeline } from "@/components/tasks/TasksTimeline"
import { Checkbox } from "@/components/ui/checkbox"

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
  ON_HOLD: 'on-hold'
}

const TASK_STATUS: Record<string, TaskStatus> = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  BLOCKED: 'blocked'
}

// Constantes para los tipos de proyecto
const PROJECT_TYPES: Record<string, ProjectType> = {
  PTD: 'PTD',
  KC360: 'KC360',
  EOI: 'EOI',
  IA: 'IA',
  KCIA: 'KCIA'
}

// Constantes para los tamaños de empresa
const COMPANY_SIZES: Record<string, CompanySizeType> = {
  SMALL: 'Pequeña (1-30empl)',
  MEDIUM: 'Mediana (30-70empl)',
  LARGE: 'Grande (Más de 70)'
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
  { value: TASK_STATUS.BLOCKED, label: 'Bloqueada' }
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
    updated_at: "",
    project_type: null,
    company_size: null,
    is_industry: false
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

        // Formatear los consultores para mostrar nombre completo
        const formattedConsultants = consultantsData?.map(consultant => {
          console.log("Procesando consultor en ProjectPage:", consultant);
          return {
            id: consultant.id,
            name: `${consultant.last_name || ''}, ${consultant.first_name || ''}`,
            email: consultant.email,
            specialization: consultant.specialization,
            weekly_hours: consultant.weekly_hours,
            user_id: consultant.user_id,
            role: consultant.role || 'consultant',
            send_invitation: false,
            created_at: consultant.created_at,
            updated_at: consultant.updated_at
          };
        }) || []

        setConsultants(formattedConsultants)
        console.log("Consultores cargados en ProjectPage:", formattedConsultants.length, formattedConsultants)

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

          // Asegurarse de que los campos opcionales tengan valores adecuados
          const formattedProject = {
            ...projectData,
            // Asegurarse de que project_type sea un valor válido o null
            project_type: projectData.project_type || null,
            // Asegurarse de que company_size sea un valor válido o null
            company_size: projectData.company_size || null,
            // Asegurarse de que is_industry sea un booleano
            is_industry: projectData.is_industry === true
          }

          setProject(formattedProject)

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
        console.error("Error detallado:", error)
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
      // Preparar los datos del proyecto, manejando correctamente los valores nulos
      const projectData: any = {
        name: project.name,
        description: project.description || null,
        start_date: project.start_date,
        end_date: project.end_date,
        status: project.status
      }

      // Añadir los campos opcionales solo si tienen un valor
      if (project.project_type) {
        projectData.project_type = project.project_type;
      }
      
      if (project.company_size) {
        projectData.company_size = project.company_size;
      }
      
      // Asegurarse de que is_industry sea un booleano
      projectData.is_industry = project.is_industry === true;

      console.log("Datos a enviar:", projectData)

      if (params.id === "new") {
        // Crear el proyecto
        const { data: newProject, error: projectError } = await supabase
          .from("projects")
          .insert([projectData])
          .select()
          .single()

        if (projectError) {
          console.error("Error al crear proyecto:", projectError)
          throw projectError
        }

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

          if (tasksError) {
            console.error("Error al crear tareas:", tasksError)
            throw tasksError
          }
        }

        toast.success("Proyecto creado exitosamente")
        router.push(`/projects/${newProject.id}`)
      } else {
        // Actualizar el proyecto existente
        const { error } = await supabase
          .from("projects")
          .update(projectData)
          .eq("id", params.id)

        if (error) {
          console.error("Error al actualizar proyecto:", error)
          throw error
        }

        toast.success("Proyecto actualizado exitosamente")
        router.push("/projects")
      }
    } catch (error: any) {
      console.error("Error detallado:", error)
      toast.error(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTask = async () => {
    try {
      if (!newTask.name || !newTask.start_date || !newTask.end_date || !newTask.consultant_id) {
        toast.error("Por favor complete todos los campos requeridos")
        return
      }

      if (params.id === "new") {
        // Si estamos creando un nuevo proyecto, agregamos la tarea a la lista temporal
        const tempTask: TempTask = {
          name: newTask.name,
          description: newTask.description || null,
          estimated_hours: newTask.estimated_hours || 8,
          start_date: newTask.start_date,
          end_date: newTask.end_date,
          status: newTask.status || 'pending',
          consultant_id: newTask.consultant_id
        }
        setTempTasks([...tempTasks, tempTask])
        toast.success("Tarea agregada al proyecto")
      } else {
        // Si estamos editando un proyecto existente, agregamos la tarea a la base de datos
        const { data, error } = await supabase
          .from("tasks")
          .insert({
            project_id: params.id,
            name: newTask.name,
            description: newTask.description,
            estimated_hours: newTask.estimated_hours || 8,
            start_date: newTask.start_date,
            end_date: newTask.end_date,
            status: newTask.status || 'pending',
            consultant_id: newTask.consultant_id
          })
          .select()

        if (error) throw error

        if (data && data[0]) {
          setTasks([...tasks, data[0]])
          toast.success("Tarea agregada exitosamente")
        }
      }

      // Limpiar el formulario
      setNewTask({
        name: "",
        description: "",
        estimated_hours: 8,
        start_date: project.start_date,
        end_date: project.end_date,
        status: 'pending',
        consultant_id: null
      })
    } catch (error: any) {
      toast.error(`Error al agregar tarea: ${error.message}`)
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

            <div className="space-y-2">
              <Label htmlFor="project_type">Tipo de Proyecto</Label>
              <Select
                value={project.project_type || "null"}
                onValueChange={(value) => {
                  // Si el valor es "null" (como string), establecer como null
                  if (value === "null") {
                    const updatedProject = { ...project };
                    updatedProject.project_type = null;
                    setProject(updatedProject);
                  } else {
                    setProject({ ...project, project_type: value as ProjectType });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo de proyecto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Ninguno</SelectItem>
                  {Object.entries(PROJECT_TYPES).map(([key, value]) => (
                    <SelectItem key={key} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_size">Tamaño de Empresa</Label>
              <Select
                value={project.company_size || "null"}
                onValueChange={(value) => {
                  // Si el valor es "null" (como string), establecer como null
                  if (value === "null") {
                    const updatedProject = { ...project };
                    updatedProject.company_size = null;
                    setProject(updatedProject);
                  } else {
                    setProject({ ...project, company_size: value as CompanySizeType });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tamaño de empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Ninguno</SelectItem>
                  {Object.entries(COMPANY_SIZES).map(([key, value]) => (
                    <SelectItem key={key} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="is_industry" 
                checked={project.is_industry === true}
                onCheckedChange={(checked) => {
                  // Asegurarse de que el valor sea siempre un booleano
                  setProject({ ...project, is_industry: checked === true })
                }}
              />
              <Label htmlFor="is_industry">Proyecto de Industria</Label>
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
                    <Select
                      value={newTask.consultant_id || "unassigned"}
                      onValueChange={(value) => setNewTask({ ...newTask, consultant_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar consultor">
                          {newTask.consultant_id && consultants.length > 0 
                            ? consultants.find(c => c.id === newTask.consultant_id)?.name || "Consultor no encontrado" 
                            : "Seleccionar consultor"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Sin asignar</SelectItem>
                        {consultants.length > 0 ? (
                          consultants.map((consultant: Consultant) => (
                            <SelectItem key={consultant.id} value={consultant.id}>
                              {consultant.name || `ID: ${consultant.id}`}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no_consultants" disabled>
                            No hay consultores disponibles
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
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
                          value={editingTempTask?.consultant_id || "unassigned"}
                          onValueChange={(value) => setEditingTempTask(prev => prev ? { ...prev, consultant_id: value } : null)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar consultor">
                              {editingTempTask?.consultant_id && consultants.length > 0 
                                ? consultants.find(c => c.id === editingTempTask.consultant_id)?.name || "Consultor no encontrado" 
                                : "Seleccionar consultor"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Sin asignar</SelectItem>
                            {consultants.length > 0 ? (
                              consultants.map((consultant: Consultant) => (
                                <SelectItem key={consultant.id} value={consultant.id}>
                                  {consultant.name || `ID: ${consultant.id}`}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no_consultants" disabled>
                                No hay consultores disponibles
                              </SelectItem>
                            )}
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
                            ? `${consultants.find(c => c.id === task.consultant_id)?.name || 'Consultor no encontrado'}`
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