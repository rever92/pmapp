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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type ConsultantSummary = {
  id: string
  first_name: string
  last_name: string
  active_projects: number
  pending_hours: number
}

export function ConsultantWorkloadSummary() {
  const supabase = createClientComponentClient()
  const [consultantSummaries, setConsultantSummaries] = useState<ConsultantSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        // Obtenemos los consultores con sus proyectos activos y horas pendientes
        const { data, error } = await supabase
          .rpc('get_consultant_workload_summary')

        if (error) throw error

        setConsultantSummaries(data || [])
      } catch (error) {
        console.error('Error al obtener el resumen de consultores:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  if (loading) return <div>Cargando...</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen de Carga por Consultor</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Consultor</TableHead>
                <TableHead className="text-center">Proyectos Activos</TableHead>
                <TableHead className="text-center">Horas Pendientes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consultantSummaries.length > 0 ? (
                consultantSummaries.map(consultant => (
                  <TableRow key={consultant.id}>
                    <TableCell className="font-medium">
                      {consultant.last_name}, {consultant.first_name}
                    </TableCell>
                    <TableCell className="text-center">
                      {consultant.active_projects}
                    </TableCell>
                    <TableCell className="text-center">
                      {consultant.pending_hours}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4">
                    No se encontraron consultores activos
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
} 