"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { type Consultant } from "@/lib/types"
import Link from "next/link"

export default function ConsultantsPage() {
  const [consultants, setConsultants] = useState<Consultant[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchConsultants = async () => {
      const { data, error } = await supabase
        .from('consultants')
        .select('*')
        .order('last_name', { ascending: true })

      if (error) {
        console.error('Error fetching consultants:', error)
        return
      }

      setConsultants(data)
      setLoading(false)
    }

    fetchConsultants()
  }, [supabase])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Consultants</h1>
        <Button asChild>
          <Link href="/consultants/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Consultant
          </Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Specialization</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Join Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {consultants.map((consultant) => (
            <TableRow key={consultant.id}>
              <TableCell>
                <Link href={`/consultants/${consultant.id}`} className="hover:underline">
                  {consultant.first_name} {consultant.last_name}
                </Link>
              </TableCell>
              <TableCell>{consultant.email}</TableCell>
              <TableCell>{consultant.specialization}</TableCell>
              <TableCell>
                <Badge variant={consultant.status === 'active' ? 'default' : 'secondary'}>
                  {consultant.status}
                </Badge>
              </TableCell>
              <TableCell>{new Date(consultant.join_date).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}