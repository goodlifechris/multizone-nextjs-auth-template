// lib/subscription.ts
import { prisma } from "@repo/database"

interface SubscriptionCheckResult {
  hasActiveSubscription: boolean
  primaryTenantId: string | null
  isSuperAdmin: boolean
}

/**
 * Check if a user has an active subscription
 * This is the SINGLE source of truth for subscription checking
 */
export async function checkUserSubscription(
  userId: string, 
  userRole?: string
): Promise<SubscriptionCheckResult> {
  console.log('🔍 checkUserSubscription called:', { userId, userRole })
  
  try {
    // Super admins always have access
    if (userRole === 'super_admin') {
      console.log('👑 User is super_admin, granting full access')
      return {
        hasActiveSubscription: true,
        primaryTenantId: null,
        isSuperAdmin: true
      }
    }

    // First, get all user tenants with their subscriptions
    const userTenants = await prisma.user_tenant.findMany({
      where: { 
        userId: userId,
      },
      include: {
        tenant: {
          include: {
            tenant_subscription: true // This is a single object or null
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log('🔍 Raw tenant data - Total tenants:', userTenants.length)
    
    if (userTenants.length === 0) {
      console.log('⚠️ No tenants found for user')
      return {
        hasActiveSubscription: false,
        primaryTenantId: null,
        isSuperAdmin: false
      }
    }

    // Check each tenant for active subscriptions
    const now = new Date()
    const validActiveTenants = userTenants.filter(ut => {
      // Skip deleted tenants
      if (ut.tenant.deleted_at !== null) {
        console.log(`🗑️ Tenant ${ut.tenantId} is deleted, skipping`)
        return false
      }
      
      // Check if tenant has a subscription
      const subscription = ut.tenant.tenant_subscription
      if (!subscription) {
        console.log(`📭 Tenant ${ut.tenantId} has no subscription`)
        return false
      }
      
      console.log(`🔍 Checking subscription ${subscription.id} for tenant ${ut.tenantId}:`, {
        status: subscription.status,
        canceled_at: subscription.canceled_at,
        current_period_end: subscription.current_period_end?.toISOString(),
        now: now.toISOString()
      })
      
      // Check if subscription is active, trialing, or past due
      const isValidStatus = ['active', 'trialing', 'past_due'].includes(subscription.status)
      const isNotCanceled = subscription.canceled_at === null
      
      // Check if current_period_end exists and is in the future
      let isNotExpired = false
      if (subscription.current_period_end) {
        isNotExpired = subscription.current_period_end > now
      }
      
      const isActive = isValidStatus && isNotCanceled && isNotExpired
      
      console.log(`📊 Tenant ${ut.tenantId} active? ${isActive}`, {
        isValidStatus,
        isNotCanceled,
        isNotExpired,
        current_period_end_exists: !!subscription.current_period_end
      })
      
      return isActive
    })

    const hasActiveSubscription = validActiveTenants.length > 0
    const primaryTenantId = validActiveTenants[0]?.tenantId || userTenants[0]?.tenantId || null

    console.log('✅ Final subscription check result:', {
      userId,
      hasActiveSubscription,
      primaryTenantId,
      totalTenants: userTenants.length,
      activeTenants: validActiveTenants.length,
      tenants: userTenants.map(ut => {
        const subscription = ut.tenant.tenant_subscription
        return {
          tenantId: ut.tenantId,
          tenantName: ut.tenant.name,
          deleted: ut.tenant.deleted_at !== null,
          hasSubscription: !!subscription,
          subscriptionStatus: subscription?.status || 'none',
          subscriptionId: subscription?.id || 'none',
          periodEnd: subscription?.current_period_end?.toISOString() || 'none',
          canceledAt: subscription?.canceled_at || null
        }
      })
    })

    return {
      hasActiveSubscription,
      primaryTenantId,
      isSuperAdmin: false
    }
  } catch (error) {
    console.error('❌ Error checking user subscription:', error)
    return {
      hasActiveSubscription: false,
      primaryTenantId: null,
      isSuperAdmin: false
    }
  }
}