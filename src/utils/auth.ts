export const checkAuth = async (context: any) => {
  try {
    // Aquí movemos la lógica que estaba en el middleware
    const session = await getSession(context);
    return session;
  } catch (error) {
    console.error('Error en la autenticación:', error);
    return null;
  }
} 