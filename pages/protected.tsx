import { checkAuth } from '../utils/auth';

export async function getServerSideProps(context) {
  try {
    const session = await checkAuth(context);
    
    if (!session) {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }

    return {
      props: { session }
    };
  } catch (error) {
    console.error('Error al verificar autenticación:', error);
    return {
      redirect: {
        destination: '/error',
        permanent: false,
      },
    };
  }
} 