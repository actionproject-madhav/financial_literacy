// Basic API service for backend operations
// Normalize API base URL (remove trailing slash to prevent double slashes)
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '')

export interface UserProfile {
  _id: string
  email: string
  name: string
  picture?: string
  onboarding_completed?: boolean
}

class APIService {
  // ===== USER PROFILE =====
  
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/user/${userId}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      return data.success ? data.user : null
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }
  
  async updateOnboarding(userId: string, onboardingData: {
    onboarding_completed?: boolean
  }): Promise<boolean> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout
    
    try {
      const userIdentifier = userId.includes('@') ? userId : userId;
      
      const response = await fetch(`${API_BASE_URL}/auth/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        signal: controller.signal,
        body: JSON.stringify({
          user_id: userIdentifier,
          ...onboardingData
        })
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        console.error('Onboarding error:', errorData);
        throw new Error(errorData.error || `Failed to save onboarding: ${response.status}`);
      }
      
      const data = await response.json()
      return data.success || false
    } catch (error: any) {
      clearTimeout(timeoutId)
      
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        throw new Error('Request timeout')
      }
      
      console.error('Error updating onboarding:', error)
      throw error
    }
  }
}

export const apiService = new APIService()
export default apiService
