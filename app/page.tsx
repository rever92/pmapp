import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WorkloadTable } from "@/components/workload-table"
import { ConsultantWorkloadSummary } from "@/components/consultant-workload-summary"
import { ProjectsTimeline } from "@/components/projects-timeline"

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = createServerComponentClient({ cookies })

  // Obtener consultores activos
  const { data: activeConsultants } = await supabase
    .from('consultants')
    .select('*')
    .eq('status', 'active')

  // Obtener proyectos activos
  const { data: activeProjects } = await supabase
    .from('projects')
    .select('*')
    .eq('status', 'active')

  // Obtener consultores sobrecargados (más de 40 horas semanales)
  const { data: overloadedConsultants } = await supabase
    .from('consultant_weekly_workload')
    .select('consultant_id')
    .gt('total_hours', 40)
    .order('week_start', { ascending: false })
    .limit(1)

  // Obtener el número único de consultores sobrecargados
  const uniqueOverloadedConsultants = new Set(
    overloadedConsultants?.map(c => c.consultant_id) || []
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultores Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeConsultants?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultores Sobrecargados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {uniqueOverloadedConsultants.size}
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Vista General de Carga de Trabajo</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkloadTable />
        </CardContent>
      </Card>
      <ConsultantWorkloadSummary />
      <ProjectsTimeline />
    </div>
  )
}