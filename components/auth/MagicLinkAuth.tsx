'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useSearchParams } from 'next/navigation';

export function MagicLinkAuth() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams?.get('error');
    if (error) {
      toast.error(`Error de autenticación: ${decodeURIComponent(error)}`);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      toast.success('¡Revisa tu correo electrónico para el enlace de inicio de sesión!');
      setEmail(''); // Limpiar el campo después de enviar
    } catch (error: any) {
      toast.error(`Error: ${error.message || 'Ha ocurrido un error al enviar el enlace'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 w-full max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold text-center">Iniciar Sesión</h2>
      <form onSubmit={handleLogin} className="flex flex-col space-y-4 w-full">
        <div>
          <Input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full"
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar enlace mágico'}
        </Button>
      </form>
    </div>
  );
} 