import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { List, GanttChart, Pencil, Trash2, Clock } from "lucide-react"
import { type Task, type TaskTemplate, type TaskStatus, type TaskTimeSummary, type Consultant } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { TimeEntryForm } from './TimeEntryForm'
import { TimeEntryButton } from './TimeEntryDialog'
import { Progress } from "@/components/ui/progress"
import { supabase } from "@/lib/supabase"

const taskStatusOptions = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'in_progress', label: 'En Progreso' },
  { value: 'completed', label: 'Completada' },
  { value: 'on_hold', label: 'En Pausa' }
] as const

const taskStatusColors: Record<TaskStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "default",
  "in-progress": "secondary",
  completed: "outline",
  blocked: "destructive"
}

interface TasksTimelineProps {
  tasks: (Task | TaskTemplate)[]
  isTemplate?: boolean
  projectStartDate?: string
  onEditTask: (task: Task | TaskTemplate) => void
  onDeleteTask: (taskId: string) => void
}

export function TasksTimeline({
  tasks,
  isTemplate = false,
  projectStartDate,
  onEditTask,
  onDeleteTask
}: TasksTimelineProps) {
  const [viewMode, setViewMode] = useState<"list" | "timeline">("list")
  const [editingTask, setEditingTask] = useState<Task | TaskTemplate | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [taskSummaries, setTaskSummaries] = useState<Record<string, TaskTimeSummary>>({})
  const [timelineWidth, setTimelineWidth] = useState(0)
  const [consultants, setConsultants] = useState<any[]>([])

  // Cargar consultores cuando se abre el diálogo de edición
  useEffect(() => {
    if (isEditDialogOpen && !isTemplate) {
      loadConsultants()
    }
  }, [isEditDialogOpen, isTemplate])

  // Función para cargar consultores
  const loadConsultants = async () => {
    try {
      console.log("Cargando consultores...")
      const { data, error } = await supabase
        .from("consultants")
        .select("*")
        .eq("status", "active")
        .order("last_name")
      
      if (error) throw error
      
      console.log("Datos de consultores recibidos:", data)
      
      // Transformar los datos para que tengan el formato esperado por el componente
      const formattedConsultants = data?.map(consultant => {
        console.log("Procesando consultor:", consultant)
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
        }
      }) || []
      
      setConsultants(formattedConsultants)
      console.log("Consultores cargados en TasksTimeline:", formattedConsultants.length, formattedConsultants)
    } catch (error) {
      console.error("Error al cargar consultores:", error)
    }
  }

  // Función para cargar los resúmenes de tiempo de las tareas
  const loadTaskSummaries = async () => {
    if (isTemplate || tasks.length === 0) return;
    
    try {
      const { data: summaries, error } = await supabase
        .from('task_time_summary')
        .select('*')
        .in('task_id', tasks.map(t => t.id))

      if (error) throw error

      const summariesMap = summaries.reduce((acc, summary) => {
        acc[summary.task_id] = summary
        return acc
      }, {} as Record<string, TaskTimeSummary>)

      setTaskSummaries(summariesMap)
    } catch (error) {
      console.error('Error loading task summaries:', error)
    }
  }

  useEffect(() => {
    if (!isTemplate && tasks.length > 0) {
      loadTaskSummaries()
    }
  }, [isTemplate, tasks, supabase])

  // Función para ordenar tareas
  const sortedTasks = (tasks: (Task | TaskTemplate)[]) => {
    return [...tasks].sort((a, b) => {
      if (isTemplate) {
        // Para plantillas, ordenar por día relativo
        const aTask = a as TaskTemplate
        const bTask = b as TaskTemplate
        const startDayDiff = aTask.relative_start_day - bTask.relative_start_day
        if (startDayDiff !== 0) return startDayDiff
        return (aTask.relative_end_day - aTask.relative_start_day) - (bTask.relative_end_day - bTask.relative_start_day)
      } else {
        // Para proyectos, ordenar por fecha
        const aTask = a as Task
        const bTask = b as Task
        return new Date(aTask.start_date).getTime() - new Date(bTask.start_date).getTime()
      }
    })
  }

  // Función para obtener la duración total en días
  const getTotalDuration = () => {
    if (tasks.length === 0) return 0
    if (isTemplate) {
      return Math.max(...tasks.map(t => (t as TaskTemplate).relative_end_day)) + 1
    } else {
      const startDate = new Date(projectStartDate!)
      const endDates = tasks.map(t => new Date((t as Task).end_date))
      const maxEndDate = new Date(Math.max(...endDates.map(d => d.getTime())))
      return Math.ceil((maxEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    }
  }

  // Función para obtener la posición relativa de una tarea en el timeline
  const getTaskPosition = (task: Task | TaskTemplate) => {
    if (isTemplate) {
      const templateTask = task as TaskTemplate
      return {
        start: templateTask.relative_start_day,
        duration: templateTask.relative_end_day - templateTask.relative_start_day + 1
      }
    } else {
      const projectTask = task as Task
      const startDate = new Date(projectStartDate!)
      const taskStart = new Date(projectTask.start_date)
      const taskEnd = new Date(projectTask.end_date)
      const startDays = Math.floor((taskStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const duration = Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
      return { start: startDays, duration }
    }
  }

  const startEditing = (task: Task | TaskTemplate) => {
    console.log("Iniciando edición de tarea:", task)
    if (!isTemplate) {
      console.log("Consultant ID de la tarea:", (task as Task).consultant_id)
      console.log("Consultores disponibles:", consultants)
      
      // Cargar consultores si no están cargados
      if (consultants.length === 0) {
        loadConsultants()
      }
    }
    setEditingTask(task)
    setIsEditDialogOpen(true)
  }

  const handleSave = () => {
    if (editingTask) {
      onEditTask(editingTask)
      setIsEditDialogOpen(false)
      setEditingTask(null)
    }
  }

  return (
    <>
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "timeline")}>
        <TabsList className="mb-4">
          <TabsTrigger value="list">
            <List className="h-4 w-4 mr-2" />
            Lista
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <GanttChart className="h-4 w-4 mr-2" />
            Cronograma
          </TabsTrigger>
        </TabsList>

        {tasks.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            No hay tareas definidas
          </div>
        ) : (
          <>
            <TabsContent value="list" className="space-y-4">
              {sortedTasks(tasks).map((task) => (
                <div key={task.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">{task.name}</h3>
                      <span className="text-sm text-muted-foreground">
                        ({task.estimated_hours}h)
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!isTemplate && (
                        <TimeEntryButton 
                          taskId={task.id}
                          taskName={task.name}
                          consultantId={(task as Task).consultant_id || undefined}
                          onTimeEntryAdded={() => {
                            // Recargar los resúmenes de tiempo cuando se añade una entrada
                            if (!isTemplate) {
                              loadTaskSummaries()
                            }
                          }}
                        />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEditing(task)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteTask(task.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  )}
                  {!isTemplate && taskSummaries[task.id] && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progreso de horas</span>
                        <span>
                          {taskSummaries[task.id].actual_hours}h / {task.estimated_hours}h
                        </span>
                      </div>
                      <Progress 
                        value={(taskSummaries[task.id].actual_hours / task.estimated_hours) * 100}
                        className={`h-2 ${
                          taskSummaries[task.id].actual_hours > task.estimated_hours
                            ? "[&>div]:bg-destructive"
                            : ""
                        }`}
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    {'specialization' in task && (
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Especialización:</span>
                        <span>{task.specialization || 'No especificada'}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">
                        {isTemplate ? 'Días relativos:' : 'Período:'}
                      </span>
                      <span>
                        {isTemplate ? 
                          `${(task as TaskTemplate).relative_start_day} - ${(task as TaskTemplate).relative_end_day}` :
                          `${new Date((task as Task).start_date).toLocaleDateString()} - ${new Date((task as Task).end_date).toLocaleDateString()}`
                        }
                      </span>
                    </div>
                  </div>
                  {!isTemplate && (
                    <Badge variant={taskStatusColors[(task as Task).status]}>
                      {taskStatusOptions.find(opt => opt.value === (task as Task).status)?.label}
                    </Badge>
                  )}
                </div>
              ))}
            </TabsContent>

            <TabsContent value="timeline">
              <div className="relative">
                <div className="flex">
                  {/* Columna fija de nombres */}
                  <div className="w-48 flex-shrink-0">
                    <div className="h-8 border-b mb-4" />
                    {sortedTasks(tasks).map((task) => (
                      <div key={task.id} className="h-12 mb-4">
                        <p className="font-medium truncate">{task.name}</p>
                        <p className="text-sm text-muted-foreground">{task.estimated_hours}h</p>
                      </div>
                    ))}
                  </div>

                  {/* Área scrollable */}
                  <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                      {/* Escala de días */}
                      <div className="flex border-b mb-4">
                        {Array.from({ length: getTotalDuration() }).map((_, i) => (
                          <div key={i} className="flex-shrink-0 w-8 text-center text-sm text-muted-foreground">
                            {isTemplate ? i : (() => {
                              const date = new Date(projectStartDate!)
                              date.getDate() + i
                              return date.getDate()
                            })()}
                          </div>
                        ))}
                      </div>

                      {/* Tareas */}
                      <div className="space-y-4">
                        {sortedTasks(tasks).map((task) => {
                          const position = getTaskPosition(task)
                          return (
                            <div key={task.id} className="relative h-12">
                              {/* Líneas de guía verticales */}
                              {Array.from({ length: getTotalDuration() }).map((_, i) => (
                                <div
                                  key={i}
                                  className="absolute top-0 bottom-0 w-px bg-border"
                                  style={{ left: `${i * 2}rem` }}
                                />
                              ))}

                              {/* Barra de la tarea */}
                              <div
                                className={`absolute h-6 rounded-sm border flex items-center px-2 ${
                                  !isTemplate && taskSummaries[task.id]?.actual_hours > task.estimated_hours
                                    ? 'bg-destructive/15 border-destructive'
                                    : 'bg-primary/15 border-primary'
                                }`}
                                style={{
                                  left: `${position.start * 2}rem`,
                                  width: `${position.duration * 2}rem`,
                                }}
                              >
                                {!isTemplate && taskSummaries[task.id] && (
                                  <div className="text-xs">
                                    {taskSummaries[task.id].actual_hours}h / {task.estimated_hours}h
                                  </div>
                                )}
                              </div>

                              {/* Botones de acción */}
                              <div
                                className="absolute top-1/2 -translate-y-1/2"
                                style={{
                                  left: `${(position.start + position.duration) * 2}rem`,
                                }}
                              >
                                <div className="flex items-center space-x-1 ml-2">
                                  {!isTemplate && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Encontrar el botón de imputación correspondiente y hacer clic en él
                                        const timeEntryButton = document.querySelector(`[data-task-id="${task.id}"]`) as HTMLButtonElement;
                                        if (timeEntryButton) {
                                          timeEntryButton.click();
                                        }
                                      }}
                                    >
                                      <Clock className="h-3 w-3" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => startEditing(task)}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => onDeleteTask(task.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {isTemplate ? "Editar Tarea de Plantilla" : "Editar Tarea"}
            </DialogTitle>
          </DialogHeader>
          
          {!isTemplate && (
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-medium">{editingTask?.name}</h3>
                {(editingTask as Task)?.status && (
                  <Badge variant={taskStatusColors[(editingTask as Task).status]}>
                    {taskStatusOptions.find(opt => opt.value === (editingTask as Task).status)?.label}
                  </Badge>
                )}
              </div>
              {taskSummaries[(editingTask?.id || '')] && (
                <div className="text-sm text-right">
                  <div>
                    Tiempo estimado: <span className="font-medium">{editingTask?.estimated_hours}h</span>
                  </div>
                  <div>
                    Tiempo registrado: <span className={`font-medium ${
                      taskSummaries[(editingTask?.id || '')].actual_hours > (editingTask?.estimated_hours || 0) 
                        ? 'text-destructive' 
                        : 'text-primary'
                    }`}>
                      {taskSummaries[(editingTask?.id || '')].actual_hours}h
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
          
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
            {isTemplate ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Día de Inicio Relativo</Label>
                  <Input
                    type="number"
                    min="0"
                    value={(editingTask as TaskTemplate)?.relative_start_day || 0}
                    onChange={(e) => setEditingTask(prev => 
                      prev ? { ...prev, relative_start_day: parseInt(e.target.value) } as TaskTemplate : null
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Día de Fin Relativo</Label>
                  <Input
                    type="number"
                    min="1"
                    value={(editingTask as TaskTemplate)?.relative_end_day || 1}
                    onChange={(e) => setEditingTask(prev => 
                      prev ? { ...prev, relative_end_day: parseInt(e.target.value) } as TaskTemplate : null
                    )}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha de Inicio</Label>
                    <Input
                      type="date"
                      value={(editingTask as Task)?.start_date?.split('T')[0] || ""}
                      onChange={(e) => setEditingTask(prev => 
                        prev ? { ...prev, start_date: e.target.value } as Task : null
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha de Fin</Label>
                    <Input
                      type="date"
                      value={(editingTask as Task)?.end_date?.split('T')[0] || ""}
                      onChange={(e) => setEditingTask(prev => 
                        prev ? { ...prev, end_date: e.target.value } as Task : null
                      )}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select
                    value={(editingTask as Task)?.status || "pending"}
                    onValueChange={(value: TaskStatus) => setEditingTask(prev => 
                      prev ? { ...prev, status: value } as Task : null
                    )}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {taskStatusOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="grid grid-cols-2 gap-4">
              {editingTask && 'specialization' in editingTask && (
                <div className="space-y-2">
                  <Label>Especialización Requerida</Label>
                  <Input
                    placeholder="Especialización"
                    value={(editingTask as TaskTemplate)?.specialization || ""}
                    onChange={(e) => setEditingTask(prev => 
                      prev ? { ...prev, specialization: e.target.value } as TaskTemplate : null
                    )}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Horas Estimadas</Label>
                <Input
                  type="number"
                  min="1"
                  value={editingTask?.estimated_hours || 1}
                  onChange={(e) => setEditingTask(prev => 
                    prev ? { ...prev, estimated_hours: parseInt(e.target.value) } : null
                  )}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Consultor Asignado</Label>
              <Select
                value={(editingTask as Task)?.consultant_id || "unassigned"}
                onValueChange={(value: string) => {
                  console.log("Seleccionando consultor:", value);
                  setEditingTask(prev => 
                    prev ? { ...prev, consultant_id: value } as Task : null
                  );
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar consultor">
                    {(editingTask as Task)?.consultant_id && consultants.length > 0 
                      ? consultants.find(c => c.id === (editingTask as Task)?.consultant_id)?.name || "Consultor no encontrado" 
                      : "Seleccionar consultor"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Sin asignar</SelectItem>
                  {consultants.length > 0 ? (
                    consultants.map((consultant: any) => (
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
              <div className="text-xs text-muted-foreground">
                Consultor ID actual: {(editingTask as Task)?.consultant_id || "No asignado"}
                {(editingTask as Task)?.consultant_id && consultants.length > 0 && (
                  <div>
                    Nombre: {consultants.find(c => c.id === (editingTask as Task)?.consultant_id)?.name || "No encontrado"}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cerrar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
            >
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 