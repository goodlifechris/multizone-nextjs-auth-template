
//packages/auth/index.tsx
import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@repo/database"
import { generateUUID } from "./lib/uuid"
import { checkUserSubscription } from "./lib/subscription"

// Extended User type
interface ExtendedUser {
  id: string
  email: string
  name?: string
  image?: string
  role: string
  isNewUser?: boolean
  hasActiveSubscription?: boolean
  isSuperAdmin?: boolean
  primaryTenantId?: string
}

// SAFE user query - only uses fields that definitely exist
async function safeFindUserByEmail(email: string) {
  try {
    // Query with EXPLICIT field selection
    const users = await prisma.$queryRaw`
      SELECT id, email, name, created_at, updated_at, role
      FROM users 
      WHERE email = ${email}
      LIMIT 1
    `
    
    return Array.isArray(users) && users.length > 0 ? users[0] : null
  } catch (error) {
    console.error('Error in safeFindUserByEmail:', error)
    return null
  }
}

// Find user by OAuth account
async function findUserByOAuthAccount(provider: string, providerAccountId: string) {
  try {
    const accounts = await prisma.$queryRaw<{ userId: string }[]>`
      SELECT "userId" FROM accounts 
      WHERE provider = ${provider} 
      AND "providerAccountId" = ${providerAccountId}
      LIMIT 1
    `
    
    if (Array.isArray(accounts) && accounts.length > 0 && accounts[0].userId) {
      const users = await prisma.$queryRaw`
        SELECT id, email, name, created_at, updated_at, role
        FROM users 
        WHERE id = ${accounts[0].userId}
        LIMIT 1
      `
      return Array.isArray(users) && users.length > 0 ? users[0] : null
    }
    return null
  } catch (error) {
    console.error('Error in findUserByOAuthAccount:', error)
    return null
  }
}

// Check if OAuth account exists globally
async function checkOAuthAccountExists(provider: string, providerAccountId: string) {
  try {
    const accounts = await prisma.$queryRaw`
      SELECT id, "userId" FROM accounts 
      WHERE provider = ${provider} 
      AND "providerAccountId" = ${providerAccountId}
      LIMIT 1
    `
    return Array.isArray(accounts) && accounts.length > 0 ? accounts[0] : null
  } catch (error) {
    console.error('Error in checkOAuthAccountExists:', error)
    return null
  }
}

// Update OAuth account tokens
async function updateOAuthAccount(accountData: any, existingAccountId: string) {
  try {
    await prisma.accounts.update({
      where: {
        id: existingAccountId,
      },
      data: {
        refresh_token: accountData.refresh_token,
        access_token: accountData.access_token,
        expires_at: accountData.expires_at,
        token_type: accountData.token_type,
        scope: accountData.scope,
        id_token: accountData.id_token,
        session_state: accountData.session_state,
      },
    })
    console.log("🔄 OAuth account tokens updated")
  } catch (error) {
    console.error('Error updating OAuth account:', error)
  }
}

// SAFE user creation - only with fields that exist
async function safeCreateUser(userData: any) {
  try {
    // Create user with raw SQL to avoid Prisma schema issues
    const userId = generateUUID()
    
    await prisma.$executeRaw`
      INSERT INTO users (id, name, email, created_at, updated_at, role)
      VALUES (
        ${userId}, 
        ${userData.name || userData.email.split('@')[0] || 'User'}, 
        ${userData.email}, 
        ${new Date()}, 
        ${new Date()}, 
        ${'user'}
      )
    `
    
    return { id: userId, email: userData.email, name: userData.name }
  } catch (error) {
    console.error('Error in safeCreateUser:', error)
    throw error
  }
}

// Create OAuth account with upsert logic
async function createOrUpdateOAuthAccount(account: any, userId: string) {
  try {
    // Try to find existing account
    const existingAccount = await prisma.accounts.findFirst({
      where: {
        provider: account.provider,
        providerAccountId: account.providerAccountId,
      },
    })

    if (existingAccount) {
      // Account exists, check if it belongs to this user
      if (existingAccount.userId !== userId) {
        console.log("⚠️ OAuth account already linked to different user:", {
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          currentUserId: userId,
          linkedUserId: existingAccount.userId
        })
        
        // For now, we'll skip linking to avoid conflicts
        // You might want to implement account merging logic here
        console.log("Skipping OAuth linking - account already exists elsewhere")
        return false
      } else {
        // Update existing account
        await prisma.accounts.update({
          where: { id: existingAccount.id },
          data: {
            refresh_token: account.refresh_token,
            access_token: account.access_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
            session_state: account.session_state,
          },
        })
        console.log("🔄 OAuth account updated")
        return true
      }
    } else {
      // Create new account
      await prisma.accounts.create({
        data: {
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refresh_token: account.refresh_token,
          access_token: account.access_token,
          expires_at: account.expires_at,
          token_type: account.token_type,
          scope: account.scope,
          id_token: account.id_token,
          session_state: account.session_state,
          userId: userId,
        },
      })
      console.log("✅ New OAuth account created")
      return true
    }
  } catch (error) {
    console.error('Error creating/updating OAuth account:', error)
    return false
  }
}

// Main auth options
// Main auth options
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  // CRITICAL: Cookie configuration for multi-app setup
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax', // Changed from 'strict' to allow cross-origin
        path: '/',
        secure:false,
        // Remove domain for localhost to allow cookie sharing between ports
        // domain: process.env.NODE_ENV === 'production' ? '.yourdomain.com' : undefined
      }
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      }
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      }
    }
  },
  
  // Disable secure cookies for local development
  // useSecureCookies: process.env.NODE_ENV === 'production',
  useSecureCookies: false,
  
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("🔐 Sign in attempt:", { 
        email: user.email,
        accountProvider: account?.provider,
        providerAccountId: account?.providerAccountId?.substring(0, 10) + '...'
      })
      
      try {
        let existingUser = null
        
        // 1. First, check if OAuth account exists (highest priority)
        if (account) {
          const oauthUser = await findUserByOAuthAccount(
            account.provider, 
            account.providerAccountId
          )
          
          if (oauthUser) {
            existingUser = oauthUser
            console.log("👤 User found via OAuth account:", existingUser.id)
          }
        }
        
        // 2. If no OAuth user found, check by email
        if (!existingUser && user.email) {
          existingUser = await safeFindUserByEmail(user.email)
          if (existingUser) {
            console.log("👤 User found via email:", existingUser.id)
          }
        }
        
        if (existingUser) {
          console.log("👤 Existing user processing:", existingUser.id)
          
          // Use shared subscription check
          const subscriptionCheck = await checkUserSubscription(
            existingUser.id, 
            existingUser.role || 'user'
          )    
          
          console.log('🔍 SignIn subscription check:', {
            userId: existingUser.id,
            role: existingUser.role,
            hasSubscription: subscriptionCheck.hasActiveSubscription,
            primaryTenantId: subscriptionCheck.primaryTenantId,
            isSuperAdmin: subscriptionCheck.isSuperAdmin
          })
          
          // Update last login
          try {
            await prisma.$executeRaw`
              UPDATE users 
              SET updated_at = ${new Date()}, 
                  last_login_at = ${new Date()}
              WHERE id = ${existingUser.id}
            `
          } catch (e) {
            console.log('⚠️ Could not update last_login_at')
          }
          
          // Link or update OAuth account
          if (account) {
            await createOrUpdateOAuthAccount(account, existingUser.id)
          }
          
          // Add custom properties to user object
          const extendedUser = user as ExtendedUser
          extendedUser.id = existingUser.id
          extendedUser.isNewUser = false
          extendedUser.hasActiveSubscription = subscriptionCheck.hasActiveSubscription
          extendedUser.role = existingUser.role || 'user'
          extendedUser.isSuperAdmin = subscriptionCheck.isSuperAdmin
          
          if (subscriptionCheck.primaryTenantId) {
            extendedUser.primaryTenantId = subscriptionCheck.primaryTenantId
          }
          
          return true
        } else {
          // 3. Create new user (no existing user found)
          console.log("👤 Creating new user for email:", user.email)
          
          // Check if OAuth account already exists globally before creating user
          if (account) {
            const existingOAuthAccount = await checkOAuthAccountExists(
              account.provider,
              account.providerAccountId
            )
            
            if (existingOAuthAccount) {
              console.log("❌ Cannot create new user - OAuth account already linked to user:", 
                existingOAuthAccount.userId)
              // You might want to redirect to an error page or show a message
              return false
            }
          }
          
          const newUser = await safeCreateUser({
            name: user.name || profile?.name || user.email!.split('@')[0] || 'User',
            email: user.email!,
          })
          
          console.log("✅ New user created with ID:", newUser.id)
          
          // Try to add image if it exists
          if (user.image) {
            try {
              await prisma.$executeRaw`
                UPDATE users SET image = ${user.image} WHERE id = ${newUser.id}
              `
            } catch (e) {
              console.log("⚠️ Could not set user image")
            }
          }
          
          // Create OAuth account if it doesn't exist
          if (account) {
            await createOrUpdateOAuthAccount(account, newUser.id)
          }
          
          // Create a default tenant for the user
          const defaultTenant = await prisma.tenant.create({
            data: {
              id: generateUUID(),
              name: user.name || 'My Workspace',
              slug: user.email!.split('@')[0].toLowerCase() + '-' + Date.now(),
              plan: 'free',
              status: 'active',
              tier: 'starter',
              description: 'Default workspace',
              created_at: new Date(),
              updated_at: new Date(),
            },
          })
          
          // Link user to tenant
          await prisma.user_tenant.create({
            data: {
              id: generateUUID(),
              userId: newUser.id,
              tenantId: defaultTenant.id,
              role: 'owner',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          })
          
          // Create user log entry
          await prisma.user_log.create({
            data: {
              id: generateUUID(),
              user_id: newUser.id,
              action: 'USER_CREATED',
              resource: 'users',
              resource_id: newUser.id,
              details: { 
                via: 'google_oauth',
                email: newUser.email,
                has_subscription: false,
              },
              created_at: new Date(),
            },
          })
          
          console.log("✅ New user fully set up with ID:", newUser.id)
          
          // New user has no active subscription
          const extendedUser = user as ExtendedUser
          extendedUser.id = newUser.id
          extendedUser.isNewUser = true
          extendedUser.hasActiveSubscription = false
          extendedUser.role = 'user'
          extendedUser.isSuperAdmin = false
          extendedUser.primaryTenantId = defaultTenant.id
          
          return true
        }
      } catch (error) {
        console.error("❌ Error in signIn callback:", error)
        console.error("Error details:", JSON.stringify(error, null, 2))
        return false
      }
    },
    
    async jwt({ token, user, account, trigger }) {
      console.log("🔑 JWT callback triggered", { 
        trigger, 
        userId: token.id,
        currentHasSubscription: token.hasActiveSubscription 
      })
      
      // Initial sign in
      if (user) {
        const extendedUser = user as ExtendedUser
        token.id = extendedUser.id
        token.email = extendedUser.email || undefined
        token.name = extendedUser.name || undefined
        token.isNewUser = extendedUser.isNewUser || false
        token.role = extendedUser.role || 'user'
        token.isSuperAdmin = extendedUser.isSuperAdmin || false
        
        console.log('🔑 JWT - Initial sign in data:', {
          userId: token.id,
          role: token.role,
          hasSubscription: token.hasActiveSubscription,
          isSuperAdmin: token.isSuperAdmin
        })
      }
      
      // Always refresh user data from database
      if (token.id) {
        try {
          // Get fresh user data using raw SQL
          const users = await prisma.$queryRaw`
            SELECT id, email, name, role
            FROM users 
            WHERE id = ${token.id}
          `
          
          const dbUser = Array.isArray(users) && users.length > 0 ? users[0] : null
          
          if (dbUser) {
            // Update basic info
            token.name = dbUser.name
            token.email = dbUser.email
            token.role = dbUser.role || 'user'
            token.isSuperAdmin = dbUser.role === 'super_admin'
            
            // Check subscription status
            const subscriptionCheck = await checkUserSubscription(
              token.id as string, 
              dbUser.role || 'user'
            )
            
            token.hasActiveSubscription = subscriptionCheck.hasActiveSubscription
            
            console.log('🔑 JWT subscription check:', {
              userId: token.id,
              role: dbUser.role,
              isSuperAdmin: token.isSuperAdmin,
              hasSubscription: token.hasActiveSubscription,
              source: 'database check'
            })
            
            if (subscriptionCheck.primaryTenantId) {
              token.primaryTenantId = subscriptionCheck.primaryTenantId
            }
          }
        } catch (error) {
          console.error("❌ Error in JWT callback:", error)
          token.hasActiveSubscription = false
          token.isSuperAdmin = false
        }
      }
      
      // Add OAuth info only on initial sign in
      if (account && user) {
        token.accessToken = account.access_token
        token.provider = account.provider
        token.providerAccountId = account.providerAccountId
      }
      
      return token
    },
    
    async session({ session, token }) {
      console.log("👥 Session callback - Creating session from token:", {
        tokenId: token.id,
        tokenEmail: token.email,
        tokenHasSubscription: token.hasActiveSubscription
      })
      
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.isNewUser = token.isNewUser as boolean
        session.user.hasActiveSubscription = token.hasActiveSubscription as boolean
        session.user.role = token.role as string
        session.user.isSuperAdmin = token.isSuperAdmin as boolean
        
        console.log('✅ Session user set:', {
          id: session.user.id,
          email: session.user.email,
          hasActiveSubscription: session.user.hasActiveSubscription,
          role: session.user.role
        })
      }
      
      return session
    },
    
  // In your authOptions (packages/auth/index.ts)
  async redirect({ url, baseUrl }) {
    // Allow internal auth routes
    if (url.startsWith('/api/auth')) {
      return `${baseUrl}${url}`
    }

    // Allow same-origin relative URLs
    if (url.startsWith('/')) {
      return `${baseUrl}${url}`
    }

    // Allow external URLs
    if (url.startsWith('http')) {
      return url
    }

    return baseUrl
  },
  },
  
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    newUser: "/auth/new-user",
  },
  
  secret: process.env.NEXTAUTH_SECRET!,
  
  debug: process.env.NODE_ENV === "development",
}