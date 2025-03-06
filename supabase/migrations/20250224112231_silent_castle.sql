/*
  # Initial Schema Setup for Project Management System

  1. Tables
    - consultants
      - Basic information about consultants
      - Contact details
      - Specialization and status
    - projects
      - Project details
      - Timeline and status
    - tasks
      - Task information
      - Time estimates and assignments
    - absences
      - Planned absences for consultants
    - project_templates
      - Template details for projects
    - task_templates
      - Template details for tasks
      
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Consultants table
CREATE TABLE IF NOT EXISTS consultants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  specialization text NOT NULL,
  join_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  weekly_hours integer NOT NULL DEFAULT 40 CHECK (weekly_hours > 0 AND weekly_hours <= 168),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'on-hold')),
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  project_type TEXT CHECK (project_type IN ('PTD', 'KC360', 'EOI', 'IA', 'KCIA')),
  company_size TEXT CHECK (company_size IN ('Pequeña (1-30empl)', 'Mediana (30-70empl)', 'Grande (Más de 70)')),
  is_industry boolean DEFAULT false
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  consultant_id uuid NOT NULL REFERENCES consultants(id),
  name text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  estimated_hours integer NOT NULL CHECK (estimated_hours > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'blocked')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Absences table
CREATE TABLE IF NOT EXISTS absences (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultant_id uuid NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Project Templates table
CREATE TABLE IF NOT EXISTS project_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  estimated_duration_days integer NOT NULL DEFAULT 30,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Task Templates table
CREATE TABLE IF NOT EXISTS task_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_template_id uuid NOT NULL REFERENCES project_templates(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  estimated_hours integer NOT NULL CHECK (estimated_hours > 0),
  relative_start_day integer NOT NULL DEFAULT 0,
  relative_end_day integer NOT NULL,
  specialization text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_relative_days CHECK (relative_start_day >= 0 AND relative_end_day > relative_start_day)
);

-- Enable Row Level Security
ALTER TABLE consultants ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read consultants"
  ON consultants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert consultants"
  ON consultants FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update consultants"
  ON consultants FOR UPDATE
  TO authenticated
  USING (true);

-- Similar policies for other tables
CREATE POLICY "Allow authenticated users to read projects"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read absences"
  ON absences FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert absences"
  ON absences FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update absences"
  ON absences FOR UPDATE
  TO authenticated
  USING (true);

-- Create policies for new tables
CREATE POLICY "Allow authenticated users to read project_templates"
  ON project_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert project_templates"
  ON project_templates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update project_templates"
  ON project_templates FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete project_templates"
  ON project_templates FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read task_templates"
  ON task_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert task_templates"
  ON task_templates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update task_templates"
  ON task_templates FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete task_templates"
  ON task_templates FOR DELETE
  TO authenticated
  USING (true);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
CREATE TRIGGER update_consultants_updated_at
  BEFORE UPDATE ON consultants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_absences_updated_at
  BEFORE UPDATE ON absences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_project_templates_updated_at
  BEFORE UPDATE ON project_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_task_templates_updated_at
  BEFORE UPDATE ON task_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create views for workload analysis
CREATE OR REPLACE VIEW consultant_weekly_workload AS
WITH RECURSIVE weeks AS (
  SELECT 
    date_trunc('week', CURRENT_DATE)::date as week_start,
    (date_trunc('week', CURRENT_DATE) + interval '6 days')::date as week_end
  UNION ALL
  SELECT 
    (week_start + interval '1 week')::date,
    (week_end + interval '1 week')::date
  FROM weeks
  WHERE week_start < CURRENT_DATE + interval '3 months'
),
task_weeks AS (
  SELECT 
    t.consultant_id,
    w.week_start,
    w.week_end,
    t.estimated_hours * 
    LEAST(
      GREATEST(
        0,
        LEAST(t.end_date, w.week_end) - GREATEST(t.start_date, w.week_start) + 1
      )::float / 
      GREATEST(1, (t.end_date - t.start_date + 1)::float)
    ) as weekly_hours
  FROM tasks t
  CROSS JOIN weeks w
  WHERE t.status != 'completed'
    AND t.start_date <= w.week_end
    AND t.end_date >= w.week_start
)
SELECT 
  c.id as consultant_id,
  c.first_name,
  c.last_name,
  tw.week_start,
  COALESCE(SUM(tw.weekly_hours), 0) as total_hours
FROM consultants c
CROSS JOIN weeks w
LEFT JOIN task_weeks tw ON c.id = tw.consultant_id AND w.week_start = tw.week_start
WHERE c.status = 'active'
GROUP BY c.id, c.first_name, c.last_name, tw.week_start
ORDER BY c.last_name, c.first_name, tw.week_start;

-- Add delete policy for projects table
CREATE POLICY "Allow authenticated users to delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (true);

-- Función para obtener el resumen de carga de trabajo de los consultores
CREATE OR REPLACE FUNCTION get_consultant_workload_summary()
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  active_projects bigint,
  pending_hours numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH active_consultant_projects AS (
    SELECT 
      c.id AS consultant_id,
      COUNT(DISTINCT t.project_id) AS project_count
    FROM 
      consultants c
    JOIN 
      tasks t ON c.id = t.consultant_id
    JOIN 
      projects p ON t.project_id = p.id
    WHERE 
      c.status = 'active' AND
      p.status = 'active' AND
      t.status != 'completed'
    GROUP BY 
      c.id
  ),
  pending_hours AS (
    SELECT 
      c.id AS consultant_id,
      COALESCE(SUM(t.estimated_hours), 0)::numeric AS total_pending_hours
    FROM 
      consultants c
    LEFT JOIN 
      tasks t ON c.id = t.consultant_id
    WHERE 
      c.status = 'active' AND
      (t.status = 'pending' OR t.status = 'in-progress' OR t.status = 'blocked')
    GROUP BY 
      c.id
  )
  SELECT 
    c.id,
    c.first_name,
    c.last_name,
    COALESCE(acp.project_count, 0)::bigint AS active_projects,
    COALESCE(ph.total_pending_hours, 0)::numeric AS pending_hours
  FROM 
    consultants c
  LEFT JOIN 
    active_consultant_projects acp ON c.id = acp.consultant_id
  LEFT JOIN 
    pending_hours ph ON c.id = ph.consultant_id
  WHERE 
    c.status = 'active'
  ORDER BY 
    c.last_name, c.first_name;
END;
$$;

-- Actualizar la política de RLS para los nuevos campos
CREATE POLICY IF NOT EXISTS "Allow authenticated users to update project_fields"
  ON projects FOR UPDATE
  TO authenticated
  USING (true); 