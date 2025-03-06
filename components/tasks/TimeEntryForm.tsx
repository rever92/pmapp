'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { TimeEntry } from "@/lib/types"
import { useRoleContext } from "@/components/providers/RoleProvider"
import { toast } from "sonner"

export function TimeEntryForm({ taskId, consultantId, onTimeEntryAdded }: { taskId: string, consultantId?: string, onTimeEntryAdded?: () => void }) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hours, setHours] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [description, setDescription] = useState("")
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [totalHours, setTotalHours] = useState(0)
  const [canEdit, setCanEdit] = useState(false)
  const { role, userId } = useRoleContext()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkPermissionAndLoadEntries = async () => {
      setIsLoading(true)
      
      // Verificar si el usuario puede editar esta entrada de tiempo
      // Admins pueden editar cualquier tarea, consultores solo sus tareas asignadas
      const userCanEdit = role === 'admin' || consultantId === userId
      setCanEdit(userCanEdit)
      
      try {
        // Cargar entradas de tiempo existentes
        const { data, error } = await supabase
          .from("time_entries")
          .select("*")
          .eq("task_id", taskId)
          .order("date", { ascending: false })
        
        if (error) throw error
        
        setTimeEntries(data || [])
        
        // Calcular total de horas
        const total = (data || []).reduce((sum: number, entry: TimeEntry) => sum + entry.hours, 0)
        setTotalHours(total)
      } catch (error) {
        console.error("Error al cargar entradas de tiempo:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (taskId) {
      checkPermissionAndLoadEntries()
    }
  }, [taskId, consultantId, role, userId, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!canEdit) {
      toast.error("No tienes permiso para registrar tiempo en esta tarea")
      return
    }
    
    if (!hours || !date) {
      toast.error("Por favor completa todos los campos requeridos")
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const { data, error } = await supabase
        .from("time_entries")
        .insert([
          {
            task_id: taskId,
            hours: parseFloat(hours),
            date,
            description,
            user_id: userId
          }
        ])
        .select()
      
      if (error) throw error
      
      // Actualizar la lista de entradas de tiempo
      setTimeEntries([data[0], ...timeEntries])
      setTotalHours(totalHours + parseFloat(hours))
      
      // Limpiar el formulario
      setHours("")
      setDescription("")
      
      toast.success("Tiempo registrado correctamente")
      
      // Notificar al componente padre
      if (onTimeEntryAdded) {
        onTimeEntryAdded()
      }
    } catch (error) {
      console.error("Error al registrar tiempo:", error)
      toast.error("Error al registrar tiempo. Por favor intenta nuevamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }
    return new Date(dateString).toLocaleDateString('es-ES', options)
  }

  if (!canEdit && timeEntries.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">No tienes permiso para registrar tiempo en esta tarea y no hay registros existentes.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {canEdit && (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-md">
          <h3 className="font-medium">Registrar nuevo tiempo</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hours">Horas trabajadas</Label>
              <Input
                id="hours"
                type="number"
                step="0.25"
                min="0.25"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="Ej: 2.5"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Fecha de trabajo</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe brevemente el trabajo realizado"
              rows={2}
            />
          </div>
          
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Registrando..." : "Registrar tiempo"}
          </Button>
        </form>
      )}
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">Historial de tiempo</h3>
          <div className="text-sm">
            Total: <span className="font-medium">{totalHours.toFixed(2)} horas</span>
          </div>
        </div>
        
        {isLoading ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Cargando registros de tiempo...</p>
          </div>
        ) : timeEntries.length > 0 ? (
          <div className="space-y-2">
            {timeEntries.map((entry) => (
              <div key={entry.id} className="p-3 border rounded-md">
                <div className="flex justify-between">
                  <span className="font-medium">{entry.hours} horas</span>
                  <span className="text-muted-foreground text-sm">{formatDate(entry.date)}</span>
                </div>
                {entry.description && (
                  <p className="text-sm mt-1">{entry.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground">No hay registros de tiempo para esta tarea.</p>
          </div>
        )}
      </div>
    </div>
  )
} 