import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import { loginUser, refreshToken, fetchUser } from "@/lib/api/auth";

// Function to handle token refresh
async function refreshAccessToken(token: JWT) {
  try {
    if (!token.refreshToken) {
      return {
        ...token,
        error: "RefreshAccessTokenError",
      };
    }
    
    const refreshedTokens = await refreshToken(token.refreshToken);

    if (!refreshedTokens) {
      return {
        ...token,
        error: "RefreshAccessTokenError",
      };
    }

    // Fetch the latest user data to ensure we have up-to-date information
    try {
      const userData = await fetchUser(refreshedTokens.access_token);
      
      return {
        ...token,
        accessToken: refreshedTokens.access_token,
        refreshToken: refreshedTokens.refresh_token,
        accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        is_active: userData.is_active,
        is_superuser: userData.is_superuser,
      };
    } catch (userFetchError) {
      const isAuthError = userFetchError instanceof Error && 
          (userFetchError.message.includes('Status: 401') || 
           userFetchError.message.includes('Status: 403') || 
           userFetchError.message.includes('Not authorized'));
      
      if (!isAuthError) {
        console.error("Error fetching updated user data during token refresh:", userFetchError);
      }
      
      // If we can't fetch user data, still update the tokens but return an error
      return {
        ...token,
        accessToken: refreshedTokens.access_token,
        refreshToken: refreshedTokens.refresh_token,
        accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
        error: "UserDataRefreshError",
      };
    }
  } catch (error) {
    // Only log if not an authorization error
    const isAuthError = error instanceof Error && 
      (error.message.includes('Status: 401') || 
       error.message.includes('Status: 403') || 
       error.message.includes('Not authorized'));
    
    if (!isAuthError) {
      console.error("Error refreshing access token:", error);
    }
    
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'Email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) {
          return null;
        }

        // Type check the credentials
        const email = credentials.email;
        const password = credentials.password;
        
        if (typeof email !== 'string' || typeof password !== 'string') {
          return null;
        }

        try {
          // Now we can safely pass string values to loginUser
          const user = await loginUser(email, password);
          return user;
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      // Initial sign in
      if (user) {
        return {
          ...token,
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          is_active: user.is_active,
          is_superuser: user.is_superuser,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          accessTokenExpires: Date.now() + 24 * 60 * 60 * 1000, // Default to 24 hours
        };
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Access token has expired, try to refresh it
      return refreshAccessToken(token);
    },
    session: async ({ session, token }) => {
      if (token.error) {
        // If there was an error refreshing the token or user data, pass it to the client
        session.error = token.error;
      } else {
        // No errors, update session with token data
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.full_name = token.full_name as string | undefined;
        session.user.is_active = token.is_active as boolean;
        session.user.is_superuser = token.is_superuser as boolean;
        session.user.accessToken = token.accessToken as string;
      }
      
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
}); 