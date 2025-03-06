'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { TimeEntryForm } from './TimeEntryForm'
import { Button } from "@/components/ui/button"
import { Clock } from "lucide-react"

interface TimeEntryDialogProps {
  taskId: string
  taskName: string
  consultantId?: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onTimeEntryAdded?: () => void
}

export function TimeEntryDialog({
  taskId,
  taskName,
  consultantId,
  isOpen,
  onOpenChange,
  onTimeEntryAdded
}: TimeEntryDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Imputar tiempo - {taskName}</DialogTitle>
        </DialogHeader>
        
        <TimeEntryForm 
          taskId={taskId} 
          consultantId={consultantId} 
          onTimeEntryAdded={() => {
            if (onTimeEntryAdded) {
              onTimeEntryAdded()
            }
          }} 
        />
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function TimeEntryButton({
  taskId,
  taskName,
  consultantId,
  onTimeEntryAdded
}: {
  taskId: string
  taskName: string
  consultantId?: string
  onTimeEntryAdded?: () => void
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsDialogOpen(true)}
        title="Imputar tiempo"
        data-task-id={taskId}
      >
        <Clock className="h-4 w-4" />
      </Button>
      
      <TimeEntryDialog
        taskId={taskId}
        taskName={taskName}
        consultantId={consultantId}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onTimeEntryAdded={onTimeEntryAdded}
      />
    </>
  )
} 