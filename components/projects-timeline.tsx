'use client'

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProjectType } from "@/lib/types"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

type Project = {
  id: string
  name: string
  start_date: string
  end_date: string
  status: string
  project_type: ProjectType | null
}

type Consultant = {
  id: string
  first_name: string
  last_name: string
}

type ProjectConsultant = {
  project_id: string
  consultant_id: string
}

export function ProjectsTimeline() {
  const supabase = createClientComponentClient()
  const [projects, setProjects] = useState<Project[]>([])
  const [consultants, setConsultants] = useState<Consultant[]>([])
  const [projectConsultants, setProjectConsultants] = useState<ProjectConsultant[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProjectType, setSelectedProjectType] = useState<string | null>(null)
  const [selectedConsultant, setSelectedConsultant] = useState<string | null>(null)
  const [showCompleted, setShowCompleted] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        // Obtener todos los proyectos
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .order('start_date', { ascending: true })

        if (projectsError) throw projectsError

        // Obtener todos los consultores
        const { data: consultantsData, error: consultantsError } = await supabase
          .from('consultants')
          .select('id, first_name, last_name')
          .eq('status', 'active')
          .order('last_name')

        if (consultantsError) throw consultantsError

        // Obtener relaciones proyecto-consultor a través de las tareas
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('project_id, consultant_id')
          .not('consultant_id', 'is', null)

        if (tasksError) throw tasksError

        // Crear un conjunto único de relaciones proyecto-consultor
        const uniqueProjectConsultants = tasksData.reduce((acc: ProjectConsultant[], task) => {
          const exists = acc.some(
            pc => pc.project_id === task.project_id && pc.consultant_id === task.consultant_id
          )
          if (!exists && task.consultant_id) {
            acc.push({
              project_id: task.project_id,
              consultant_id: task.consultant_id
            })
          }
          return acc
        }, [])

        setProjects(projectsData || [])
        setConsultants(consultantsData || [])
        setProjectConsultants(uniqueProjectConsultants)
      } catch (error) {
        console.error('Error al obtener datos para el timeline:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  // Filtrar proyectos según los criterios seleccionados
  const filteredProjects = projects.filter(project => {
    // Filtrar por tipo de proyecto
    if (selectedProjectType && project.project_type !== selectedProjectType) {
      return false
    }

    // Filtrar por consultor
    if (selectedConsultant) {
      const isConsultantInProject = projectConsultants.some(
        pc => pc.project_id === project.id && pc.consultant_id === selectedConsultant
      )
      if (!isConsultantInProject) {
        return false
      }
    }

    // Filtrar por estado (completado/no completado)
    if (!showCompleted && project.status === 'completed') {
      return false
    }

    return true
  })

  // Calcular el rango de fechas para el timeline
  const calculateTimelineRange = () => {
    if (filteredProjects.length === 0) return { startDate: new Date(), endDate: new Date(), totalDays: 30 }

    const dates = filteredProjects.flatMap(project => [new Date(project.start_date), new Date(project.end_date)])
    const startDate = new Date(Math.min(...dates.map(d => d.getTime())))
    const endDate = new Date(Math.max(...dates.map(d => d.getTime())))
    
    // Añadir un margen de 7 días al inicio y al final
    startDate.setDate(startDate.getDate() - 7)
    endDate.setDate(endDate.getDate() + 7)
    
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    return { startDate, endDate, totalDays }
  }

  const { startDate, endDate, totalDays } = calculateTimelineRange()

  // Función para calcular la posición y ancho de la barra de proyecto
  const calculateProjectBar = (project: Project) => {
    const projectStart = new Date(project.start_date)
    const projectEnd = new Date(project.end_date)
    
    const startOffset = Math.max(0, (projectStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const duration = Math.max(1, (projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24))
    
    const leftPosition = (startOffset / totalDays) * 100
    const width = (duration / totalDays) * 100
    
    return { left: `${leftPosition}%`, width: `${width}%` }
  }

  // Generar marcas de tiempo para el eje X (meses)
  const generateTimeMarkers = () => {
    const markers = []
    const currentDate = new Date(startDate)
    currentDate.setDate(1) // Ir al primer día del mes
    
    while (currentDate <= endDate) {
      const position = ((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) / totalDays * 100
      markers.push({
        date: new Date(currentDate),
        position: `${position}%`
      })
      
      // Avanzar al siguiente mes
      currentDate.setMonth(currentDate.getMonth() + 1)
    }
    
    return markers
  }

  const timeMarkers = generateTimeMarkers()

  // Función para formatear la fecha en formato DD/MM/YYYY
  const formatDate = (date: Date) => {
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`
  }

  // Obtener el color según el tipo de proyecto
  const getProjectColor = (projectType: ProjectType | null) => {
    switch (projectType) {
      case 'PTD': return 'bg-blue-500'
      case 'KC360': return 'bg-green-500'
      case 'EOI': return 'bg-purple-500'
      case 'IA': return 'bg-orange-500'
      case 'KCIA': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  if (loading) return <div>Cargando...</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cronograma de Proyectos</CardTitle>
        <div className="flex flex-wrap gap-4 mt-2">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="project-type">Tipo de Proyecto</Label>
            <Select
              value={selectedProjectType || 'all'}
              onValueChange={(value) => setSelectedProjectType(value === 'all' ? null : value)}
            >
              <SelectTrigger id="project-type" className="w-[180px]">
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="PTD">PTD</SelectItem>
                <SelectItem value="KC360">KC360</SelectItem>
                <SelectItem value="EOI">EOI</SelectItem>
                <SelectItem value="IA">IA</SelectItem>
                <SelectItem value="KCIA">KCIA</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="consultant">Consultor</Label>
            <Select
              value={selectedConsultant || 'all'}
              onValueChange={(value) => setSelectedConsultant(value === 'all' ? null : value)}
            >
              <SelectTrigger id="consultant" className="w-[220px]">
                <SelectValue placeholder="Todos los consultores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los consultores</SelectItem>
                {consultants.map(consultant => (
                  <SelectItem key={consultant.id} value={consultant.id}>
                    {consultant.last_name}, {consultant.first_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2 self-end">
            <Checkbox 
              id="show-completed" 
              checked={showCompleted}
              onCheckedChange={(checked) => setShowCompleted(checked as boolean)}
            />
            <Label htmlFor="show-completed">Mostrar proyectos completados</Label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative mt-6 overflow-x-auto">
          {/* Marcadores de tiempo (meses) */}
          <div className="relative h-6 border-b border-gray-200 mb-2">
            {timeMarkers.map((marker, index) => (
              <div 
                key={index} 
                className="absolute top-0 text-xs text-gray-500"
                style={{ left: marker.position }}
              >
                {marker.date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })}
                <div className="h-2 w-px bg-gray-300 mx-auto mt-1"></div>
              </div>
            ))}
          </div>
          
          {/* Proyectos */}
          <div className="space-y-2 min-h-[200px]">
            {filteredProjects.length > 0 ? (
              filteredProjects.map(project => {
                const barStyle = calculateProjectBar(project)
                return (
                  <div key={project.id} className="relative h-10 flex items-center">
                    <div className="w-64 pr-4 font-medium truncate">{project.name}</div>
                    <div className="flex-1 relative h-6">
                      <div 
                        className={`absolute h-full rounded-md ${getProjectColor(project.project_type)} ${project.status === 'completed' ? 'opacity-60' : ''}`}
                        style={barStyle}
                      >
                        <div className="px-2 text-xs text-white truncate h-full flex items-center">
                          {project.name}
                        </div>
                        <div className="absolute -bottom-5 left-0 text-xs whitespace-nowrap">
                          {formatDate(new Date(project.start_date))}
                        </div>
                        <div className="absolute -bottom-5 right-0 text-xs whitespace-nowrap">
                          {formatDate(new Date(project.end_date))}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="flex justify-center items-center h-40 text-gray-500">
                No se encontraron proyectos con los filtros seleccionados
              </div>
            )}
          </div>
          
          {/* Leyenda */}
          <div className="mt-8 flex flex-wrap gap-4">
            <div className="text-sm font-medium">Tipos de proyecto:</div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
              <span className="text-sm">PTD</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
              <span className="text-sm">KC360</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-purple-500 rounded mr-2"></div>
              <span className="text-sm">EOI</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-orange-500 rounded mr-2"></div>
              <span className="text-sm">IA</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
              <span className="text-sm">KCIA</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-500 rounded mr-2"></div>
              <span className="text-sm">Sin tipo</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 