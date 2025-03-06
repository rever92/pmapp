-- Corregir políticas recursivas en user_roles

-- Eliminar la política recursiva existente
DROP POLICY IF EXISTS "Allow admins to manage roles" ON user_roles;

-- Crear una función de seguridad para verificar si un usuario es administrador
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  -- Consulta directa sin usar políticas RLS
  SELECT role INTO user_role
  FROM user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear políticas no recursivas usando la función de seguridad
CREATE POLICY "Allow admins to read all roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (
    auth.is_admin() OR auth.uid() = user_id
  );

CREATE POLICY "Allow admins to insert roles"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.is_admin()
  );

CREATE POLICY "Allow admins to update roles"
  ON user_roles FOR UPDATE
  TO authenticated
  USING (
    auth.is_admin()
  );

CREATE POLICY "Allow admins to delete roles"
  ON user_roles FOR DELETE
  TO authenticated
  USING (
    auth.is_admin()
  );

-- Corregir políticas recursivas en time_entries
DROP POLICY IF EXISTS "Users can view their own time entries" ON time_entries;
DROP POLICY IF EXISTS "Users can insert their own time entries" ON time_entries;
DROP POLICY IF EXISTS "Users can update their own time entries" ON time_entries;
DROP POLICY IF EXISTS "Users can delete their own time entries" ON time_entries;

-- Crear políticas no recursivas para time_entries
CREATE POLICY "Users can view their own time entries"
  ON time_entries FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR auth.is_admin()
  );

CREATE POLICY "Users can insert their own time entries"
  ON time_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR auth.is_admin()
  );

CREATE POLICY "Users can update their own time entries"
  ON time_entries FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR auth.is_admin()
  );

CREATE POLICY "Users can delete their own time entries"
  ON time_entries FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR auth.is_admin()
  );

-- Corregir políticas recursivas en consultants
DROP POLICY IF EXISTS "Allow admins and PMs to insert consultants" ON consultants;
DROP POLICY IF EXISTS "Allow admins and PMs to update consultants" ON consultants;

-- Crear una función para verificar si un usuario es admin o PM
CREATE OR REPLACE FUNCTION auth.is_admin_or_pm()
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  -- Consulta directa sin usar políticas RLS
  SELECT role INTO user_role
  FROM user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN user_role IN ('admin', 'project_manager');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear políticas no recursivas para consultants
CREATE POLICY "Allow admins and PMs to insert consultants"
  ON consultants FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.is_admin_or_pm()
  );

CREATE POLICY "Allow admins and PMs to update consultants"
  ON consultants FOR UPDATE
  TO authenticated
  USING (
    auth.is_admin_or_pm()
  ); 