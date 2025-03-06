-- Asignar rol de administrador
DO $$
BEGIN
    -- Intentar actualizar si el usuario ya tiene un rol
    UPDATE public.user_roles
    SET role = 'admin'
    WHERE user_id = 'ea2e21fa-0d6e-435c-9d26-cb680d711950';

    -- Si no se actualizó ninguna fila, insertar nuevo registro
    IF NOT FOUND THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES ('ea2e21fa-0d6e-435c-9d26-cb680d711950', 'admin');
    END IF;
END $$; 