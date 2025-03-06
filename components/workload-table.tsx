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

export function WorkloadTable() {
  const supabase = createClientComponentClient()
  const [consultants, setConsultants] = useState<Consultant[]>([])
  const [workloads, setWorkloads] = useState<WeeklyWorkload[]>([])
  const [loading, setLoading] = useState(true)

  // Obtener las próximas 4 semanas
  const weeks = Array.from({ length: 4 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + (i * 7))
    return date.toISOString().split('T')[0]
  })

  useEffect(() => {
    async function fetchData() {
      try {
        // Obtener consultores activos
        const { data: consultantsData, error: consultantsError } = await supabase
          .from('consultants')
          .select('*')
          .eq('status', 'active')
          .order('last_name')

        if (consultantsError) throw consultantsError

        // Obtener cargas de trabajo
        const { data: workloadData, error: workloadError } = await supabase
          .from('consultant_weekly_workload')
          .select('*')
          .gte('week_start', weeks[0])
          .lte('week_start', weeks[weeks.length - 1])

        if (workloadError) throw workloadError

        setConsultants(consultantsData)
        setWorkloads(workloadData)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

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
    return `${d.getDate()}/${d.getMonth() + 1}`
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
          {consultants.map(consultant => (
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
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 