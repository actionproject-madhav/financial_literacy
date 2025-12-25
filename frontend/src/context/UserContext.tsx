import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react'
import authService from '../services/authService'
import apiService from '../services/apiService'

interface User {
  id: string
  email: string
  name: string
  picture?: string
  onboarding_completed?: boolean
}

interface UserContextType {
  user: User | null
  setUser: (user: User | null) => void
  refreshUserData: () => Promise<void>
  isLoading: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const useUser = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUserData = useCallback(async () => {
    if (!user) return
    
    try {
      const userId = user.email || user.id
      if (!userId) return
      
      const userProfile = await apiService.getUserProfile(userId)
      
      if (userProfile) {
        const updatedUser: User = {
          id: userProfile._id || userId,
          email: userProfile.email || user.email,
          name: userProfile.name || user.name,
          picture: userProfile.picture || user.picture,
          onboarding_completed: userProfile.onboarding_completed
        }
        
        setUser(updatedUser)
        localStorage.removeItem('user')
        localStorage.setItem('user', JSON.stringify(updatedUser))
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error refreshing user data:', error)
      }
    }
  }, [user])

  // Listen for storage changes and custom logout events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        const currentUser = authService.getCurrentUser()
        if (currentUser) {
          window.location.reload()
        } else {
          setUser(null)
          setIsLoading(false)
        }
      }
    }

    const handleLogout = () => {
      setUser(null)
      setIsLoading(false)
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('user-logout', handleLogout)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('user-logout', handleLogout)
    }
  }, [])

  useEffect(() => {
    const loadUserProfile = async () => {
      setIsLoading(true)
      const currentUser = authService.getCurrentUser()
      
      if (!currentUser) {
        setUser(null)
        setIsLoading(false)
        return
      }
      
      try {
        const userId = currentUser.email || currentUser.id
        
        if (!userId) {
          setUser({
            ...currentUser,
            onboarding_completed: false
          })
          setIsLoading(false)
          return
        }

        const userProfile = await apiService.getUserProfile(userId)
        
        if (userProfile) {
          const fullUser: User = {
            id: userProfile._id || userId,
            email: userProfile.email || currentUser.email || userId,
            name: userProfile.name || currentUser.name,
            picture: userProfile.picture || currentUser.picture,
            onboarding_completed: userProfile.onboarding_completed || false
          }
          
          setUser(fullUser)
          localStorage.removeItem('user')
          localStorage.setItem('user', JSON.stringify(fullUser))
        } else {
          const fallbackEmail = currentUser.email || userId
          if (!fallbackEmail) {
            setIsLoading(false)
            return
          }
          setUser({
            ...currentUser,
            email: fallbackEmail,
            onboarding_completed: false
          })
        }
      } catch (error) {
        const fallbackEmail = currentUser.email || currentUser.id
        if (!fallbackEmail) {
          setIsLoading(false)
          return
        }
        setUser({
          ...currentUser,
          email: fallbackEmail,
          onboarding_completed: false
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    loadUserProfile()
  }, [])

  const contextValue = useMemo(() => ({
    user,
    setUser,
    refreshUserData,
    isLoading
  }), [user, refreshUserData, isLoading])

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  )
}
