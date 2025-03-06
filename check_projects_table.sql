-- Verificar la estructura de la tabla projects
SELECT 
    column_name, 
    data_type, 
    udt_name
FROM 
    information_schema.columns 
WHERE 
    table_name = 'projects'
ORDER BY 
    ordinal_position;

-- Verificar los tipos personalizados
SELECT 
    typname, 
    typtype, 
    typelem
FROM 
    pg_type 
WHERE 
    typname IN ('project_type', 'company_size_type');

-- Verificar las políticas RLS
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual
FROM 
    pg_policies 
WHERE 
    tablename = 'projects'; 