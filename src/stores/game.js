import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  increment,
  query,
  where,
  getDocs,
  orderBy
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuthStore } from './auth'
import { useCityStore } from './city'

export const useGameStore = defineStore('game', () => {
  const games = ref([])
  const currentGame = ref(null)
  const loading = ref(false)
  const schedulesLoaded = ref(false)
  const currentCityId = ref(null)
  let unsubscribeGame = null
  let unsubscribeSchedules = null

  // Dynamic schedules loaded from Firestore (city-filtered)
  const gameSchedules = ref({})

  // Legacy export for backward compatibility
  const GAME_SCHEDULES = gameSchedules

  // Subscribe to schedules for a specific city
  const subscribeToSchedules = (cityId) => {
    // Unsubscribe from existing listener if any
    if (unsubscribeSchedules) {
      unsubscribeSchedules()
    }

    // Update current city - get from param or city store
    currentCityId.value = cityId || useCityStore().currentCityId

    if (!currentCityId.value) {
      console.warn('No city ID provided for schedule subscription')
      schedulesLoaded.value = true
      return Promise.resolve({ success: false, error: 'No city ID' })
    }

    return new Promise((resolve) => {
      try {
        const schedulesRef = collection(db, 'gameSchedules')
        const q = query(
          schedulesRef,
          where('cityId', '==', currentCityId.value),
          orderBy('order', 'asc')
        )
        let isFirstSnapshot = true

        unsubscribeSchedules = onSnapshot(q, (querySnapshot) => {
          const schedules = {}
          querySnapshot.docs.forEach(doc => {
            const data = doc.data()
            if (data.isActive) {
              schedules[doc.id] = {
                day: data.dayOfWeek,
                time: data.time,
                venue: data.venue,
                cityId: data.cityId
              }
            }
          })
          gameSchedules.value = schedules
          schedulesLoaded.value = true

          // Resolve the promise after first snapshot
          if (isFirstSnapshot) {
            isFirstSnapshot = false
            resolve({ success: true })
          }
        }, (error) => {
          console.error('Error subscribing to schedules:', error)
          schedulesLoaded.value = true
          if (isFirstSnapshot) {
            isFirstSnapshot = false
            resolve({ success: false, error: error.message })
          }
        })
      } catch (error) {
        schedulesLoaded.value = true
        resolve({ success: false, error: error.message })
      }
    })
  }

  const stopSchedulesListener = () => {
    if (unsubscribeSchedules) {
      unsubscribeSchedules()
      unsubscribeSchedules = null
    }
    schedulesLoaded.value = false
    gameSchedules.value = {}
  }

  // Get today's game ID for the current city
  const getTodayGameId = (cityId) => {
    const city = cityId || currentCityId.value
    if (!city) return null

    const now = new Date()
    const dayOfWeek = now.getDay()
    const dateString = now.toISOString().split('T')[0]

    const schedules = gameSchedules.value
    const gameKey = Object.keys(schedules).find(key => {
      const schedule = schedules[key]
      return schedule.day === dayOfWeek
    })

    return gameKey ? `${dateString}_${gameKey}` : null
  }

  const getTodayGameScheduleKey = (cityId) => {
    const city = cityId || currentCityId.value
    if (!city) return null

    const now = new Date()
    const dayOfWeek = now.getDay()

    const schedules = gameSchedules.value
    return Object.keys(schedules).find(key => {
      const schedule = schedules[key]
      return schedule.day === dayOfWeek
    })
  }

  const isCheckInAllowed = () => {
    const now = new Date()
    const hours = now.getHours()
    return hours >= 8 && hours < 18
  }

  const loadTodayGame = async (cityId) => {
    const city = cityId || currentCityId.value
    const gameId = getTodayGameId(city)
    if (!gameId) return null

    if (unsubscribeGame) {
      unsubscribeGame()
    }

    loading.value = true
    try {
      const docRef = doc(db, 'games', gameId)

      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        const scheduleKey = getTodayGameScheduleKey(city)
        const schedule = gameSchedules.value[scheduleKey]

        const newGame = {
          date: new Date().toISOString().split('T')[0],
          scheduleKey: scheduleKey,
          cityId: city,
          venue: schedule.venue,
          time: schedule.time,
          players: [],
          waitlist: [],
          createdAt: new Date().toISOString()
        }

        await setDoc(docRef, newGame)
      }

      unsubscribeGame = onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
          currentGame.value = { id: doc.id, ...doc.data() }
        }
        loading.value = false
      }, (error) => {
        loading.value = false
      })

      return currentGame.value
    } catch (error) {
      loading.value = false
      return null
    }
  }

  const stopGameListener = () => {
    if (unsubscribeGame) {
      unsubscribeGame()
      unsubscribeGame = null
    }
    currentGame.value = null
  }

  const checkIn = async (cityId) => {
    const authStore = useAuthStore()
    if (!authStore.user || !authStore.userProfile) {
      return { success: false, error: 'Must be logged in' }
    }

    if (!isCheckInAllowed()) {
      return { success: false, error: 'Check-in only allowed between 8 AM and 6 PM' }
    }

    const city = cityId || currentCityId.value
    const gameId = getTodayGameId(city)
    if (!gameId) {
      return { success: false, error: 'No game scheduled for today' }
    }

    // Check if user is already checked in to any game today (across all cities)
    const todayDate = new Date().toISOString().split('T')[0]
    try {
      const gamesRef = collection(db, 'games')
      const todayGamesQuery = query(gamesRef, where('date', '==', todayDate))
      const todayGamesSnapshot = await getDocs(todayGamesQuery)

      for (const gameDoc of todayGamesSnapshot.docs) {
        const gameData = gameDoc.data()
        const isInPlayers = gameData.players?.some(p => p.uid === authStore.user.uid)
        const isInWaitlist = gameData.waitlist?.some(p => p.uid === authStore.user.uid)

        if (isInPlayers || isInWaitlist) {
          // User is already checked in to a game today
          const otherCityId = gameData.cityId
          if (otherCityId !== city) {
            const cityStore = useCityStore()
            const otherCity = cityStore.getCityById(otherCityId)
            const cityName = otherCity?.name || otherCityId
            return { success: false, error: `You are already checked in for a game in ${cityName} today. Please check out there first.` }
          }
        }
      }
    } catch (error) {
      console.error('Error checking for existing check-ins:', error)
      // Continue with check-in if we can't verify (fail open for better UX)
    }

    const scheduleKey = getTodayGameScheduleKey(city)

    // Check if user is a regular for this schedule (using city-scoped data)
    const isRegular = authStore.isRegularForSchedule(scheduleKey, city)

    try {
      const docRef = doc(db, 'games', gameId)

      const playerData = {
        uid: authStore.user.uid,
        name: authStore.userProfile.name,
        position: authStore.userProfile.position,
        skillLevel: authStore.userProfile.skillLevel || 2,
        checkedInAt: new Date().toISOString()
      }

      if (isRegular) {
        await updateDoc(docRef, {
          players: arrayUnion(playerData)
        })
      } else {
        await updateDoc(docRef, {
          waitlist: arrayUnion(playerData)
        })
      }

      return { success: true, isRegular }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const checkOut = async (cityId) => {
    const authStore = useAuthStore()
    if (!authStore.user) {
      return { success: false, error: 'Must be logged in' }
    }

    const city = cityId || currentCityId.value
    const gameId = getTodayGameId(city)
    if (!gameId) {
      return { success: false, error: 'No game scheduled for today' }
    }

    try {
      const docRef = doc(db, 'games', gameId)
      const game = currentGame.value

      const playerInGame = game.players?.find(p => p.uid === authStore.user.uid)
      const playerInWaitlist = game.waitlist?.find(p => p.uid === authStore.user.uid)

      if (playerInGame) {
        await updateDoc(docRef, {
          players: arrayRemove(playerInGame)
        })
      } else if (playerInWaitlist) {
        await updateDoc(docRef, {
          waitlist: arrayRemove(playerInWaitlist)
        })
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const moveFromWaitlist = async (playerUid, cityId) => {
    const city = cityId || currentCityId.value
    const gameId = getTodayGameId(city)
    if (!gameId) return { success: false, error: 'No game scheduled' }

    try {
      const docRef = doc(db, 'games', gameId)
      const game = currentGame.value

      const player = game.waitlist?.find(p => p.uid === playerUid)
      if (!player) {
        return { success: false, error: 'Player not found in waitlist' }
      }

      await updateDoc(docRef, {
        waitlist: arrayRemove(player),
        players: arrayUnion(player)
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const userCheckedIn = computed(() => {
    const authStore = useAuthStore()
    if (!authStore.user || !currentGame.value) return false

    const inPlayers = currentGame.value.players?.some(p => p.uid === authStore.user.uid)
    const inWaitlist = currentGame.value.waitlist?.some(p => p.uid === authStore.user.uid)

    return inPlayers || inWaitlist
  })

  const balanceTeams = (players) => {
    if (!players || players.length === 0) {
      return {
        darkTeam: { goalie: null, forwards: [], defense: [] },
        lightTeam: { goalie: null, forwards: [], defense: [] }
      }
    }

    let goalies = players.filter(p => p.position === 'Goalie')
    let forwards = players.filter(p => p.position === 'Forward')
    let defense = players.filter(p => p.position === 'Defense')

    const sortBySkill = (a, b) => (b.skillLevel || 2) - (a.skillLevel || 2)

    goalies.sort(sortBySkill)
    forwards.sort(sortBySkill)
    defense.sort(sortBySkill)

    const idealForwards = 6
    const idealDefense = 4

    if (forwards.length > idealForwards && defense.length < idealDefense) {
      const excessForwards = forwards.length - idealForwards
      const defenseNeeded = idealDefense - defense.length
      const toConvert = Math.min(excessForwards, defenseNeeded)

      const convertedPlayers = forwards.splice(idealForwards, toConvert)
      defense.push(...convertedPlayers)
      defense.sort(sortBySkill)
    }
    else if (defense.length > idealDefense && forwards.length < idealForwards) {
      const excessDefense = defense.length - idealDefense
      const forwardsNeeded = idealForwards - forwards.length
      const toConvert = Math.min(excessDefense, forwardsNeeded)

      const convertedPlayers = defense.splice(idealDefense, toConvert)
      forwards.push(...convertedPlayers)
      forwards.sort(sortBySkill)
    }

    const darkTeam = { goalie: null, forwards: [], defense: [] }
    const lightTeam = { goalie: null, forwards: [], defense: [] }

    if (goalies.length > 0) darkTeam.goalie = goalies[0]
    if (goalies.length > 1) lightTeam.goalie = goalies[1]

    let darkSkill = darkTeam.goalie?.skillLevel || 0
    let lightSkill = lightTeam.goalie?.skillLevel || 0

    forwards.forEach((player) => {
      if (darkSkill <= lightSkill) {
        darkTeam.forwards.push(player)
        darkSkill += player.skillLevel || 2
      } else {
        lightTeam.forwards.push(player)
        lightSkill += player.skillLevel || 2
      }
    })

    defense.forEach((player) => {
      if (darkSkill <= lightSkill) {
        darkTeam.defense.push(player)
        darkSkill += player.skillLevel || 2
      } else {
        lightTeam.defense.push(player)
        lightSkill += player.skillLevel || 2
      }
    })

    return { darkTeam, lightTeam }
  }

  // Set current city (for use when city changes)
  const setCurrentCity = (cityId) => {
    currentCityId.value = cityId
  }

  return {
    games,
    currentGame,
    currentCityId,
    loading,
    schedulesLoaded,
    gameSchedules,
    GAME_SCHEDULES,
    subscribeToSchedules,
    stopSchedulesListener,
    getTodayGameId,
    getTodayGameScheduleKey,
    isCheckInAllowed,
    loadTodayGame,
    stopGameListener,
    checkIn,
    checkOut,
    moveFromWaitlist,
    userCheckedIn,
    balanceTeams,
    setCurrentCity
  }
})
