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