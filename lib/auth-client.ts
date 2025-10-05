import { adminClient, oneTapClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

export const {
  signIn,
  signUp,
  useSession,
  signOut,
  getSession,
  updateUser,
  changePassword,
  forgetPassword,
  resetPassword,
  oneTap,
  admin,
} = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL!,
  trustedOrigins: [
    process.env.NODE_ENV !== "development"
      ? "https://www.gemsofindia.org"
      : "http://localhost:3000",
  ],
  plugins: [
    oneTapClient({
      clientId: process.env.NEXT_PUBLIC_ONE_TAP_CLIENT_ID!,
      promptOptions: {
        maxAttempts: 0,
      },
    }),
    adminClient(),
  ],
})
