-- Crear tabla para registros de tiempo
CREATE TABLE IF NOT EXISTS time_entries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  hours numeric(5,2) NOT NULL CHECK (hours > 0),
  date date NOT NULL DEFAULT CURRENT_DATE,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear índices para búsquedas frecuentes
CREATE INDEX idx_time_entries_task_id ON time_entries(task_id);
CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX idx_time_entries_date ON time_entries(date);

-- Habilitar RLS
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad corregidas para evitar recursión infinita
CREATE POLICY "Users can view their own time entries"
  ON time_entries FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    (SELECT role FROM user_roles WHERE user_id = auth.uid() LIMIT 1) = 'admin'
  );

CREATE POLICY "Users can insert their own time entries"
  ON time_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    (SELECT role FROM user_roles WHERE user_id = auth.uid() LIMIT 1) = 'admin'
  );

CREATE POLICY "Users can update their own time entries"
  ON time_entries FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    (SELECT role FROM user_roles WHERE user_id = auth.uid() LIMIT 1) = 'admin'
  );

CREATE POLICY "Users can delete their own time entries"
  ON time_entries FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    (SELECT role FROM user_roles WHERE user_id = auth.uid() LIMIT 1) = 'admin'
  );

-- Vista para obtener el total de horas por tarea
CREATE OR REPLACE VIEW task_time_summary AS
SELECT 
  t.id as task_id,
  t.project_id,
  t.name as task_name,
  t.estimated_hours,
  COALESCE(SUM(te.hours), 0) as actual_hours,
  COUNT(DISTINCT te.date) as work_days
FROM tasks t
LEFT JOIN time_entries te ON t.id = te.task_id
GROUP BY t.id, t.project_id, t.name, t.estimated_hours;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_time_entries_updated_at
  BEFORE UPDATE ON time_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at(); 