-- Crear tipo enum para roles
CREATE TYPE user_role AS ENUM ('admin', 'project_manager', 'consultant');

-- Añadir tabla de roles de usuario
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'consultant',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Añadir columna para mapear usuarios con consultores
ALTER TABLE consultants
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Crear índice para búsquedas rápidas por user_id
CREATE INDEX idx_consultants_user_id ON consultants(user_id);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);

-- Añadir políticas RLS para roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Políticas para user_roles
CREATE POLICY "Allow users to read their own role"
  ON user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Corregir la política para evitar recursión infinita
CREATE POLICY "Allow admins to manage roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM user_roles WHERE user_id = auth.uid() LIMIT 1) = 'admin'
  );

-- Función para verificar rol
CREATE OR REPLACE FUNCTION auth.check_user_role(required_role user_role)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Modificar políticas existentes para incluir control de roles
DROP POLICY IF EXISTS "Allow authenticated users to read consultants" ON consultants;
CREATE POLICY "Allow users to read consultants"
  ON consultants FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert consultants" ON consultants;
CREATE POLICY "Allow admins and PMs to insert consultants"
  ON consultants FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM user_roles WHERE user_id = auth.uid() LIMIT 1) IN ('admin', 'project_manager')
  );

DROP POLICY IF EXISTS "Allow authenticated users to update consultants" ON consultants;
CREATE POLICY "Allow admins and PMs to update consultants"
  ON consultants FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM user_roles WHERE user_id = auth.uid() LIMIT 1) IN ('admin', 'project_manager')
  );

-- Función helper para asignar rol inicial
CREATE OR REPLACE FUNCTION auth.assign_initial_role()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'consultant');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para asignar rol automáticamente al crear usuario
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION auth.assign_initial_role(); 