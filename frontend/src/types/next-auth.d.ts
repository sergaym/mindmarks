// types/next-auth.d.ts
import 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    full_name?: string;
    is_active: boolean;
    is_superuser: boolean;
    created_at: string;
    accessToken: string;
    refreshToken?: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      full_name?: string;
      is_active: boolean;
      is_superuser: boolean;
      accessToken: string;
    };
    expires: string;
    error?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    email: string;
    full_name?: string;
    is_active: boolean;
    is_superuser: boolean;
    accessToken: string;
    refreshToken?: string;
    accessTokenExpires: number;
    error?: string;
  }
}
