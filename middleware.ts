import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rutas públicas que no requieren autenticación
const publicRoutes = ['/login', '/auth/callback']

export async function middleware(req: NextRequest) {
  try {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })

    // Obtener la sesión actual
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const isPublicRoute = publicRoutes.some(route => req.nextUrl.pathname.startsWith(route))
    const isStaticAsset = req.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js)$/)
    const isApiRoute = req.nextUrl.pathname.startsWith('/api')
    const isNextInternal = req.nextUrl.pathname.startsWith('/_next')

    // Permitir acceso a recursos estáticos y rutas de API
    if (isStaticAsset || isApiRoute || isNextInternal) {
      return res
    }

    // Si el usuario no está autenticado
    if (!session) {
      // Si intenta acceder a una ruta protegida, redirigir al login
      if (!isPublicRoute) {
        console.log('Redirigiendo a login - Usuario no autenticado intentando acceder a:', req.nextUrl.pathname)
        return NextResponse.redirect(new URL('/login', req.url))
      }
      return res
    }

    // Si el usuario está autenticado
    if (session) {
      // Si intenta acceder a rutas públicas (login), redirigir a la raíz
      if (isPublicRoute) {
        console.log('Redirigiendo a inicio - Usuario autenticado intentando acceder a:', req.nextUrl.pathname)
        return NextResponse.redirect(new URL('/', req.url))
      }
    }

    return res
  } catch (error) {
    console.error('Error en middleware:', error)
    // En caso de error, redirigir al login
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}