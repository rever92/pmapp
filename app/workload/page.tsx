"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type WorkloadData = {
  consultant_id: string
  first_name: string
  last_name: string
  week_start: string
  total_hours: number
}

export default function WorkloadPage() {
  const [workloadData, setWorkloadData] = useState<WorkloadData[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchWorkload = async () => {
      const { data, error } = await supabase
        .from('consultant_weekly_workload')
        .select('*')
        .order('last_name, first_name, week_start')

      if (error) {
        console.error('Error fetching workload:', error)
        return
      }

      setWorkloadData(data)
      setLoading(false)
    }

    fetchWorkload()
  }, [supabase])

  if (loading) {
    return <div>Loading...</div>
  }

  const getWorkloadStatus = (hours: number) => {
    if (hours > 40) return { color: 'destructive', text: 'Overloaded' }
    if (hours > 32) return { color: 'warning', text: 'High' }
    if (hours > 16) return { color: 'default', text: 'Normal' }
    return { color: 'secondary', text: 'Low' }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Workload Analysis</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Weekly Workload by Consultant</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Consultant</TableHead>
                <TableHead>Week Starting</TableHead>
                <TableHead>Total Hours</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workloadData.map((row, index) => {
                const status = getWorkloadStatus(row.total_hours)
                return (
                  <TableRow key={`${row.consultant_id}-${row.week_start}`}>
                    <TableCell>{row.first_name} {row.last_name}</TableCell>
                    <TableCell>{new Date(row.week_start).toLocaleDateString()}</TableCell>
                    <TableCell>{row.total_hours}</TableCell>
                    <TableCell>
                      <Badge variant={status.color as any}>{status.text}</Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}