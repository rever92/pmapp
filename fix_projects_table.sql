-- Verificar si las columnas ya existen antes de añadirlas
DO $$
BEGIN
    -- Verificar si la columna project_type existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'project_type'
    ) THEN
        -- Añadir la columna project_type como TEXT con restricción CHECK
        ALTER TABLE projects ADD COLUMN project_type TEXT CHECK (project_type IN ('PTD', 'KC360', 'EOI', 'IA', 'KCIA'));
    END IF;

    -- Verificar si la columna company_size existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'company_size'
    ) THEN
        -- Añadir la columna company_size como TEXT con restricción CHECK
        ALTER TABLE projects ADD COLUMN company_size TEXT CHECK (company_size IN ('Pequeña (1-30empl)', 'Mediana (30-70empl)', 'Grande (Más de 70)'));
    END IF;

    -- Verificar si la columna is_industry existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'is_industry'
    ) THEN
        -- Añadir la columna is_industry como BOOLEAN con valor por defecto
        ALTER TABLE projects ADD COLUMN is_industry BOOLEAN DEFAULT false;
    END IF;
END
$$;

-- Verificar si la política RLS ya existe antes de crearla
DO $$
BEGIN
    -- Verificar si la política ya existe
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'projects' AND policyname = 'Allow authenticated users to update project_type'
    ) THEN
        -- Actualizar la política de RLS para el nuevo campo
        CREATE POLICY "Allow authenticated users to update project_type"
          ON projects FOR UPDATE
          TO authenticated
          USING (true);
    END IF;
END
$$; 