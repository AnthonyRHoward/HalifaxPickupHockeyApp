import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Capacitor } from '@capacitor/core'
import { FirebaseAuthentication } from '@capacitor-firebase/authentication'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '@/config/firebase'

const isNative = Capacitor.isNativePlatform()

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const userProfile = ref(null)
  const loading = ref(true)
  let unsubscribeProfile = null

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => userProfile.value?.isAdmin || false)

  const initAuth = async () => {
    if (isNative) {
      // For native platforms, get current user and set up listener
      try {
        const result = await FirebaseAuthentication.getCurrentUser()
        if (result.user) {
          user.value = result.user
          await loadUserProfile(result.user.uid)
        }

        // Listen for auth state changes on native
        FirebaseAuthentication.addListener('authStateChange', async (change) => {
          if (change.user) {
            user.value = change.user
            await loadUserProfile(change.user.uid)
          } else {
            user.value = null
            userProfile.value = null
          }
        })
      } catch (error) {
        console.error('Native auth init error:', error)
      }
      loading.value = false
    } else {
      // Web platform - use Firebase web SDK
      return new Promise((resolve) => {
        onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            user.value = firebaseUser
            await loadUserProfile(firebaseUser.uid)
          } else {
            user.value = null
            userProfile.value = null
          }
          loading.value = false
          resolve(firebaseUser)
        })
      })
    }
  }

  const loadUserProfile = async (uid) => {
    console.log('Loading user profile for UID:', uid)
    // Unsubscribe from previous listener if it exists
    if (unsubscribeProfile) {
      unsubscribeProfile()
    }

    try {
      const docRef = doc(db, 'users', uid)
      console.log('Setting up Firestore listener for user:', uid)

      // Set up real-time listener
      unsubscribeProfile = onSnapshot(docRef, (doc) => {
        console.log('Firestore snapshot received, exists:', doc.exists())
        if (doc.exists()) {
          console.log('User profile data:', doc.data())
          userProfile.value = { id: doc.id, ...doc.data() }
        } else {
          console.log('User profile document does not exist!')
        }
      }, (error) => {
        console.error('Error in user profile snapshot:', error)
      })
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  const stopProfileListener = () => {
    if (unsubscribeProfile) {
      unsubscribeProfile()
      unsubscribeProfile = null
    }
  }

  const login = async (email, password) => {
    try {
      if (isNative) {
        // Use native authentication on iOS/Android
        const result = await FirebaseAuthentication.signInWithEmailAndPassword({
          email,
          password
        })
        user.value = result.user
        await loadUserProfile(result.user.uid)
      } else {
        // Use web SDK on web
        const result = await signInWithEmailAndPassword(auth, email, password)
        user.value = result.user
        await loadUserProfile(result.user.uid)
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message || error.code }
    }
  }

  const register = async (email, password, userData) => {
    try {
      let result
      if (isNative) {
        // Use native authentication on iOS/Android
        result = await FirebaseAuthentication.createUserWithEmailAndPassword({
          email,
          password
        })
      } else {
        // Use web SDK on web
        result = await createUserWithEmailAndPassword(auth, email, password)
      }

      user.value = result.user

      const profileData = {
        email: email,
        name: userData.name,
        position: userData.position || 'Forward',
        skillLevel: userData.skillLevel || 3,
        regulars: userData.regulars || {
          'sunday_1030pm_civic': false,
          'monday_11pm_forum': false,
          'tuesday_1030pm_forum': false,
          'thursday_1030pm_civic': false,
          'friday_1030pm_forum': false,
          'saturday_1030pm_forum': false
        },
        gamesPlayed: 0,
        isAdmin: false,
        gameHistory: [],
        passType: null,
        passGamesRemaining: 0,
        passStartDate: null,
        createdAt: new Date().toISOString()
      }

      await setDoc(doc(db, 'users', result.user.uid), profileData)
      userProfile.value = { id: result.user.uid, ...profileData }

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message || error.code }
    }
  }

  const logout = async () => {
    try {
      stopProfileListener()
      if (isNative) {
        await FirebaseAuthentication.signOut()
      } else {
        await signOut(auth)
      }
      user.value = null
      userProfile.value = null
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message || error.code }
    }
  }

  const updateUserProfile = async (updates) => {
    try {
      const docRef = doc(db, 'users', user.value.uid)
      await setDoc(docRef, updates, { merge: true })
      // No need to update manually - real-time listener will handle it
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  return {
    user,
    userProfile,
    loading,
    isAuthenticated,
    isAdmin,
    initAuth,
    login,
    register,
    logout,
    updateUserProfile,
    loadUserProfile,
    stopProfileListener
  }
})
