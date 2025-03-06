// Tipos base
interface BaseTask {
  id: string
  name: string
  description: string | null
  estimated_hours: number
  created_at: string
  updated_at: string
}

// Estados
export type ProjectStatus = 'planning' | 'active' | 'completed' | 'on_hold'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'on_hold'

// Roles de usuario
export type UserRole = 'admin' | 'project_manager' | 'consultant'

// Tarea de plantilla
export interface TaskTemplate extends BaseTask {
  project_template_id: string
  relative_start_day: number
  relative_end_day: number
  specialization: string | null
}

// Tarea de proyecto
export interface Task extends BaseTask {
  project_id: string
  start_date: string
  end_date: string
  consultant_id: string | null
  status: TaskStatus
}

// Plantilla de proyecto
export interface ProjectTemplate {
  id: string
  name: string
  description: string | null
  estimated_duration_days: number
  created_at: string
  updated_at: string
}

// Proyecto
export interface Project {
  id: string
  name: string
  description: string | null
  start_date: string
  end_date: string
  status: ProjectStatus
  created_at: string
  updated_at: string
}

// Consultor
export interface Consultant {
  id: string
  name: string
  email: string
  specialization: string | null
  weekly_hours: number
  user_id: string | null
  role: UserRole
  send_invitation: boolean
  created_at: string
  updated_at: string
}

// Formulario de consultor
export interface ConsultantFormData {
  name: string
  email: string
  specialization: string | null
  weekly_hours: number
  role: UserRole
  send_invitation: boolean
}

// Usuario con rol
export interface UserWithRole {
  id: string
  email: string
  role: UserRole
  created_at: string
  updated_at: string
}

// Registro de rol de usuario
export interface UserRoleRecord {
  id: string
  user_id: string
  role: UserRole
  created_at: string
  updated_at: string
}

// Registro de tiempo
export interface TimeEntry {
  id: string
  task_id: string
  user_id: string
  hours: number
  date: string
  description: string | null
  created_at: string
  updated_at: string
}

// Formulario de registro de tiempo
export interface TimeEntryFormData {
  hours: number
  date: string
  description?: string
}

// Resumen de tiempo de tarea
export interface TaskTimeSummary {
  task_id: string
  project_id: string
  task_name: string
  estimated_hours: number
  actual_hours: number
  work_days: number
}