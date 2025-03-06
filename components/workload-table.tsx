'use client'

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Consultant } from "@/lib/types"

type WeeklyWorkload = {
  consultant_id: string
  week_start: string
  total_hours: number
}

// Extendemos el tipo Consultant para incluir los campos que vienen de la base de datos
type ConsultantWithNames = Consultant & {
  first_name: string
  last_name: string
}

export function WorkloadTable() {
  const supabase = createClientComponentClient()
  const [consultants, setConsultants] = useState<ConsultantWithNames[]>([])
  const [workloads, setWorkloads] = useState<WeeklyWorkload[]>([])
  const [loading, setLoading] = useState(true)

  // Obtener el lunes de la semana actual y las próximas 3 semanas
  const weeks = Array.from({ length: 4 }, (_, i) => {
    const date = new Date()
    const day = date.getDay() // 0 es domingo, 1 es lunes, etc.
    const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Ajustar al lunes
    
    // Crear fecha para el lunes de la semana actual
    const monday = new Date(date.setDate(diff))
    
    // Añadir i semanas
    monday.setDate(monday.getDate() + (i * 7))
    
    return monday.toISOString().split('T')[0]
  })

  useEffect(() => {
    async function fetchData() {
      try {
        // Obtener consultores activos
        const { data: consultantsData, error: consultantsError } = await supabase
          .from('consultants')
          .select('*')
          .eq('status', 'active')
          .order('last_name', { ascending: true })

        if (consultantsError) throw consultantsError

        // Obtener cargas de trabajo
        const { data: workloadData, error: workloadError } = await supabase
          .from('consultant_weekly_workload')
          .select('*')
          .gte('week_start', weeks[0])
          .lte('week_start', weeks[weeks.length - 1])

        if (workloadError) throw workloadError

        setConsultants(consultantsData || [])
        setWorkloads(workloadData || [])
      } catch (error) {
        console.error('Error al obtener datos:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, weeks])

  if (loading) return <div>Cargando...</div>

  function getWorkloadColor(hours: number, weeklyHours: number): string {
    const percentage = (hours / weeklyHours) * 100
    if (percentage >= 100) return 'text-red-600 font-bold'
    if (percentage >= 90) return 'text-orange-500 font-bold'
    return ''
  }

  function getWorkloadForWeek(consultantId: string, weekStart: string): number {
    return workloads.find(w => 
      w.consultant_id === consultantId && 
      w.week_start.startsWith(weekStart)
    )?.total_hours || 0
  }

  function formatWeekDate(date: string): string {
    const d = new Date(date)
    const endOfWeek = new Date(date)
    endOfWeek.setDate(d.getDate() + 6) // Domingo (6 días después del lunes)
    
    return `${d.getDate()}/${d.getMonth() + 1} - ${endOfWeek.getDate()}/${endOfWeek.getMonth() + 1}`
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[200px]">Consultor</TableHead>
            {weeks.map(week => (
              <TableHead key={week} className="text-center">
                Semana {formatWeekDate(week)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {consultants.length > 0 ? (
            consultants.map(consultant => (
              <TableRow key={consultant.id}>
                <TableCell className="font-medium">
                  {consultant.last_name}, {consultant.first_name}
                </TableCell>
                {weeks.map(week => {
                  const hours = getWorkloadForWeek(consultant.id, week)
                  return (
                    <TableCell 
                      key={week} 
                      className={`text-center ${getWorkloadColor(hours, consultant.weekly_hours)}`}
                    >
                      {hours}/{consultant.weekly_hours}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={weeks.length + 1} className="text-center py-4">
                No se encontraron consultores activos
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
} 