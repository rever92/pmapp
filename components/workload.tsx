"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface WorkloadData {
  consultant_id: string
  first_name: string
  last_name: string
  week_start: string
  total_hours: number
}

interface ChartData {
  name: string
  total: number
}

interface Consultant {
  id: string
  first_name: string
  last_name: string
}

interface YAxisProps {
  stroke?: string
  fontSize?: number
  tickLine?: boolean
  axisLine?: boolean
  tickFormatter?: (value: number) => string
}

const CustomYAxis = ({
  stroke = "#888888",
  fontSize = 12,
  tickLine = false,
  axisLine = false,
  tickFormatter = (value) => `${value}h`
}: YAxisProps) => (
  <YAxis
    stroke={stroke}
    fontSize={fontSize}
    tickLine={tickLine}
    axisLine={axisLine}
    tickFormatter={tickFormatter}
  />
)

export function Workload() {
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [consultants, setConsultants] = useState<Consultant[]>([])
  const [selectedConsultant, setSelectedConsultant] = useState<string>('all')
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchConsultants = async () => {
      try {
        const { data, error } = await supabase
          .from('consultants')
          .select('id, first_name, last_name')
          .eq('status', 'active')
          .order('last_name')

        if (error) throw error
        setConsultants(data)
      } catch (error: any) {
        console.error('Error al cargar consultores:', error.message)
      }
    }

    fetchConsultants()
  }, [supabase])

  useEffect(() => {
    const fetchWorkload = async () => {
      try {
        setLoading(true)
        let query = supabase
          .from('consultant_weekly_workload')
          .select('*')
          .order('week_start')

        if (selectedConsultant !== 'all') {
          query = query.eq('consultant_id', selectedConsultant)
        }

        const { data: workloadData, error } = await query

        if (error) {
          throw error
        }

        // Agrupar datos por semana
        const weeklyData = workloadData.reduce((acc: { [key: string]: number }, curr: WorkloadData) => {
          const weekStart = new Date(curr.week_start).toLocaleDateString('es-ES', {
            month: 'short',
            day: 'numeric'
          })
          acc[weekStart] = (acc[weekStart] || 0) + curr.total_hours
          return acc
        }, {})

        // Convertir a formato para el gráfico
        const chartData = Object.entries(weeklyData).map(([name, total]) => ({
          name,
          total: Number(total)
        }))

        setData(chartData)
      } catch (error: any) {
        console.error('Error al cargar datos de workload:', error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchWorkload()
  }, [supabase, selectedConsultant])

  if (loading) {
    return <div>Cargando...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Label>Consultor:</Label>
        <Select
          value={selectedConsultant}
          onValueChange={setSelectedConsultant}
        >
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Seleccionar consultor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los consultores</SelectItem>
            {consultants.map((consultant) => (
              <SelectItem key={consultant.id} value={consultant.id}>
                {consultant.first_name} {consultant.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data}>
          <XAxis
            dataKey="name"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <CustomYAxis />
          <Tooltip 
            formatter={(value: number) => [`${value}h`, 'Horas Totales']}
            labelFormatter={(label) => `Semana del ${label}`}
            contentStyle={{
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--foreground)'
            }}
          />
          <Bar
            dataKey="total"
            fill="currentColor"
            radius={[4, 4, 0, 0]}
            className="fill-primary"
          />
        </BarChart>
      </ResponsiveContainer>
      
      {data.length === 0 && (
        <div className="text-center text-sm text-muted-foreground py-4">
          No hay datos de carga de trabajo para mostrar
        </div>
      )}
    </div>
  )
}