-- Verificar si los tipos ya existen antes de crearlos
DO $$
BEGIN
    -- Verificar si el tipo project_type ya existe
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_type 
        WHERE typname = 'project_type'
    ) THEN
        -- Crear el tipo project_type
        CREATE TYPE project_type AS ENUM ('PTD', 'KC360', 'EOI', 'IA', 'KCIA');
    END IF;

    -- Verificar si el tipo company_size_type ya existe
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_type 
        WHERE typname = 'company_size_type'
    ) THEN
        -- Crear el tipo company_size_type
        CREATE TYPE company_size_type AS ENUM ('Pequeña (1-30empl)', 'Mediana (30-70empl)', 'Grande (Más de 70)');
    END IF;
END
$$;

-- Verificar si las columnas ya existen antes de añadirlas
DO $$
BEGIN
    -- Verificar si la columna project_type existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'project_type'
    ) THEN
        -- Añadir campo de tipo de proyecto a la tabla de proyectos
        ALTER TABLE projects 
        ADD COLUMN project_type project_type;
    END IF;

    -- Verificar si la columna company_size existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'company_size'
    ) THEN
        -- Añadir campo de tamaño de empresa a la tabla de proyectos
        ALTER TABLE projects
        ADD COLUMN company_size company_size_type;
    END IF;

    -- Verificar si la columna is_industry existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'is_industry'
    ) THEN
        -- Añadir campo de industria a la tabla de proyectos
        ALTER TABLE projects
        ADD COLUMN is_industry boolean DEFAULT false;
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