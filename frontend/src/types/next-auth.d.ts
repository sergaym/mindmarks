// types/next-auth.d.ts
import 'next-auth';
import 'next-auth/jwt';

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    accessToken?: string;
    user: {
      /** The user's id */
      id: string;
      /** The user's name */
      name?: string;
      /** The user's email */
      email?: string;
    }
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User {
    /** The user's id */
    id: string;
    /** The user's name */
    name?: string;
    /** The user's email address */
    email?: string;
    /** The user's access token */
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** The user's access token */
    accessToken?: string;
  }
}
