import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (!code) {
      throw new Error('No se proporcionó código de autenticación');
    }

    // Intercambiar el código por una sesión
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      throw error;
    }

    // Verificar que la sesión se haya creado correctamente
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      throw sessionError || new Error('No se pudo crear la sesión');
    }

    // Redirigir a la página principal con la sesión establecida
    const response = NextResponse.redirect(new URL('/', requestUrl.origin));

    // Asegurar que las cookies de sesión se establezcan correctamente
    response.cookies.set('sb-access-token', session.access_token, {
      path: '/',
      secure: true,
      sameSite: 'lax',
    });
    response.cookies.set('sb-refresh-token', session.refresh_token!, {
      path: '/',
      secure: true,
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    console.error('Error en el callback de autenticación:', error);
    // En caso de error, redirigir a login con el mensaje de error
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(error.message || 'Error de autenticación')}`,
        request.url
      )
    );
  }
}