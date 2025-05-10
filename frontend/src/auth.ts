// This file is no longer needed as we're using app/api/auth/[...nextauth]/route.ts directly
import { signIn, signOut } from "next-auth/react";

// Export only the functions needed for backwards compatibility
export { signIn, signOut };

// Note: Other code in this file has been moved to app/api/auth/[...nextauth]/route.ts 