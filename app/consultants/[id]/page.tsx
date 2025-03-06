"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { type Consultant, type UserRole, type ConsultantFormData } from "@/lib/types"

const roleOptions = [
  { value: 'consultant', label: 'Consultor' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'admin', label: 'Administrador' }
] as const

const initialConsultant: ConsultantFormData = {
  name: "",
  email: "",
  specialization: "",
  weekly_hours: 40,
  role: "consultant",
  send_invitation: true
}

export default function ConsultantPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [consultant, setConsultant] = useState<ConsultantFormData>(initialConsultant)

  useEffect(() => {
    const fetchConsultant = async () => {
      if (params.id === "new") {
        setLoading(false)
        return
      }

      try {
        // Obtener consultor
        const { data: consultantData, error: consultantError } = await supabase
          .from("consultants")
          .select("*")
          .eq("id", params.id)
          .single()

        if (consultantError) throw consultantError

        // Si el consultor tiene un usuario asociado, obtener su rol
        if (consultantData.user_id) {
          const { data: roleData, error: roleError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", consultantData.user_id)
            .single()

          if (roleError) throw roleError

          consultantData.role = roleData.role
        }

        setConsultant({
          name: consultantData.name,
          email: consultantData.email,
          specialization: consultantData.specialization,
          weekly_hours: consultantData.weekly_hours,
          role: consultantData.role || 'consultant',
          send_invitation: false
        })
      } catch (error: any) {
        console.error("Error fetching consultant:", error)
        toast.error(`Error: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchConsultant()
  }, [params.id, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(
        params.id === "new" 
          ? '/api/consultants'
          : '/api/consultants',
        {
          method: params.id === "new" ? 'POST' : 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            params.id === "new"
              ? consultant
              : { ...consultant, id: params.id }
          ),
        }
      )

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success(
        params.id === "new"
          ? "Consultor creado exitosamente"
          : "Consultor actualizado exitosamente"
      )
      router.push("/consultants")
      router.refresh()
    } catch (error: any) {
      toast.error(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Cargando...</div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">
        {params.id === "new" ? "Nuevo Consultor" : "Editar Consultor"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input
                id="name"
                value={consultant.name}
                onChange={(e) => setConsultant({ ...consultant, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={consultant.email}
                onChange={(e) => setConsultant({ ...consultant, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialization">Especialización</Label>
              <Input
                id="specialization"
                value={consultant.specialization || ""}
                onChange={(e) => setConsultant({ ...consultant, specialization: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weekly_hours">Disponibilidad Semanal (horas)</Label>
              <Input
                id="weekly_hours"
                type="number"
                min="1"
                max="168"
                value={consultant.weekly_hours}
                onChange={(e) => setConsultant({ ...consultant, weekly_hours: parseInt(e.target.value) })}
                required
              />
              <p className="text-sm text-muted-foreground">
                Máximo de horas semanales que el consultor puede dedicar a proyectos
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Select
                value={consultant.role}
                onValueChange={(value: UserRole) => 
                  setConsultant({ ...consultant, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Nivel de acceso y permisos en el sistema
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="send_invitation">Enviar Invitación</Label>
                <p className="text-sm text-muted-foreground">
                  {params.id === "new"
                    ? "Enviar email de invitación para establecer contraseña"
                    : "Reenviar email de invitación"}
                </p>
              </div>
              <Switch
                id="send_invitation"
                checked={consultant.send_invitation}
                onCheckedChange={(checked) =>
                  setConsultant({ ...consultant, send_invitation: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/consultants")}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>
    </div>
  )
}