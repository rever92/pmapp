import { MagicLinkAuth } from '@/components/auth/MagicLinkAuth';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      redirect('/dashboard');
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md">
          <MagicLinkAuth />
        </div>
      </div>
    );
  } catch (error: any) {
    console.error('Error al cargar la página de login:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-red-600">Error al cargar la página</h2>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }
}