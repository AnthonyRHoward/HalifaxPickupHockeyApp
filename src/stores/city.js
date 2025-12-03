import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy
} from 'firebase/firestore'
import { db } from '@/config/firebase'

export const useCityStore = defineStore('city', () => {
  const cities = ref([])
  const currentCity = ref(null)
  const loading = ref(false)
  const citiesLoaded = ref(false)
  let unsubscribeCities = null

  // Computed properties
  const activeCities = computed(() => {
    return cities.value.filter(city => city.isActive)
  })

  const currentCityId = computed(() => {
    return currentCity.value?.id || null
  })

  const currentCityDisplayName = computed(() => {
    return currentCity.value?.displayName || 'Nova Adult Hockey'
  })

  const currentCityLogo = computed(() => {
    return currentCity.value?.logo || '/logos/default.png'
  })

  const currentCityEmail = computed(() => {
    return currentCity.value?.contactEmail || ''
  })

  const currentCityColor = computed(() => {
    return currentCity.value?.primaryColor || '#4f001e'
  })

  // Load all cities from Firestore
  const loadCities = async () => {
    if (citiesLoaded.value) return { success: true }

    loading.value = true
    try {
      const citiesRef = collection(db, 'cities')
      const q = query(citiesRef, orderBy('name', 'asc'))
      const querySnapshot = await getDocs(q)

      cities.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      citiesLoaded.value = true
      return { success: true }
    } catch (error) {
      console.error('Error loading cities:', error)
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  // Subscribe to real-time city updates
  const subscribeToCities = () => {
    if (unsubscribeCities) {
      unsubscribeCities()
    }

    return new Promise((resolve) => {
      try {
        const citiesRef = collection(db, 'cities')
        const q = query(citiesRef, orderBy('name', 'asc'))
        let isFirstSnapshot = true

        unsubscribeCities = onSnapshot(q, (querySnapshot) => {
          cities.value = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          citiesLoaded.value = true

          if (isFirstSnapshot) {
            isFirstSnapshot = false
            resolve({ success: true })
          }
        }, (error) => {
          console.error('Error subscribing to cities:', error)
          if (isFirstSnapshot) {
            isFirstSnapshot = false
            resolve({ success: false, error: error.message })
          }
        })
      } catch (error) {
        resolve({ success: false, error: error.message })
      }
    })
  }

  // Stop listening to city updates
  const stopCitiesListener = () => {
    if (unsubscribeCities) {
      unsubscribeCities()
      unsubscribeCities = null
    }
  }

  // Set the current city by ID
  const setCurrentCity = async (cityId) => {
    if (!cityId) {
      currentCity.value = null
      return { success: true }
    }

    // Try to find in already loaded cities
    let city = cities.value.find(c => c.id === cityId || c.slug === cityId)

    if (!city) {
      // Load from Firestore if not found
      try {
        const docRef = doc(db, 'cities', cityId)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          city = { id: docSnap.id, ...docSnap.data() }
        }
      } catch (error) {
        console.error('Error loading city:', error)
        return { success: false, error: error.message }
      }
    }

    if (city) {
      currentCity.value = city
      // Store in localStorage for persistence
      localStorage.setItem('lastCityId', cityId)
      return { success: true, city }
    }

    return { success: false, error: 'City not found' }
  }

  // Get city by ID
  const getCityById = (cityId) => {
    return cities.value.find(c => c.id === cityId || c.slug === cityId)
  }

  // Get the last used city from localStorage
  const getLastCityId = () => {
    return localStorage.getItem('lastCityId')
  }

  // Clear current city
  const clearCurrentCity = () => {
    currentCity.value = null
  }

  // Admin: Create a new city
  const createCity = async (cityData) => {
    try {
      const cityId = cityData.slug || cityData.name.toLowerCase().replace(/\s+/g, '-')
      const docRef = doc(db, 'cities', cityId)

      await setDoc(docRef, {
        ...cityData,
        id: cityId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      await loadCities()
      return { success: true, cityId }
    } catch (error) {
      console.error('Error creating city:', error)
      return { success: false, error: error.message }
    }
  }

  // Admin: Update a city
  const updateCity = async (cityId, cityData) => {
    try {
      const docRef = doc(db, 'cities', cityId)
      await updateDoc(docRef, {
        ...cityData,
        updatedAt: new Date().toISOString()
      })

      await loadCities()
      return { success: true }
    } catch (error) {
      console.error('Error updating city:', error)
      return { success: false, error: error.message }
    }
  }

  // Initialize cities for first-time setup (creates Halifax and Bridgewater)
  const initializeDefaultCities = async () => {
    const defaultCities = [
      {
        id: 'halifax',
        name: 'Halifax',
        displayName: 'Halifax Pickup Hockey',
        slug: 'halifax',
        logo: '/logos/halifax.png',
        contactEmail: 'halifaxpickuphockey@gmail.com',
        primaryColor: '#4f001e',
        isActive: true
      },
      {
        id: 'bridgewater',
        name: 'Bridgewater',
        displayName: 'Bridgewater Adult Hockey',
        slug: 'bridgewater',
        logo: '/logos/bridgewater.png',
        contactEmail: 'southshorepickuphockey@gmail.com',
        primaryColor: '#1a4d1a',
        isActive: true
      }
    ]

    for (const city of defaultCities) {
      const docRef = doc(db, 'cities', city.id)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        await setDoc(docRef, {
          ...city,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }
    }

    await loadCities()
    return { success: true }
  }

  return {
    // State
    cities,
    currentCity,
    loading,
    citiesLoaded,

    // Computed
    activeCities,
    currentCityId,
    currentCityDisplayName,
    currentCityLogo,
    currentCityEmail,
    currentCityColor,

    // Actions
    loadCities,
    subscribeToCities,
    stopCitiesListener,
    setCurrentCity,
    getCityById,
    getLastCityId,
    clearCurrentCity,
    createCity,
    updateCity,
    initializeDefaultCities
  }
})
