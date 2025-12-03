import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useCityStore } from './city'

export const useAdminStore = defineStore('admin', () => {
  const allGames = ref([])
  const allUsers = ref([])
  const gameSchedules = ref([])
  const selectedGame = ref(null)
  const loading = ref(false)
  const currentCityId = ref(null)
  let unsubscribeGame = null

  // Load game schedules for a specific city
  const loadGameSchedules = async (cityId) => {
    const city = cityId || currentCityId.value || useCityStore().currentCityId
    currentCityId.value = city

    try {
      const schedulesRef = collection(db, 'gameSchedules')
      let q

      if (city) {
        q = query(schedulesRef, where('cityId', '==', city), orderBy('order', 'asc'))
      } else {
        q = query(schedulesRef, orderBy('order', 'asc'))
      }

      const querySnapshot = await getDocs(q)

      gameSchedules.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      return { success: true }
    } catch (error) {
      console.error('Error loading game schedules:', error)
      return { success: false, error: error.message }
    }
  }

  const updateGameSchedule = async (scheduleId, scheduleData) => {
    try {
      const docRef = doc(db, 'gameSchedules', scheduleId)
      await updateDoc(docRef, {
        ...scheduleData,
        updatedAt: new Date().toISOString()
      })

      await loadGameSchedules(currentCityId.value)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const addGameSchedule = async (scheduleData, cityId) => {
    const city = cityId || currentCityId.value
    try {
      const scheduleId = `${city}_${scheduleData.dayName.toLowerCase()}_${scheduleData.time.replace(':', '')}_${scheduleData.venue.toLowerCase().replace(/\s+/g, '')}`
      const docRef = doc(db, 'gameSchedules', scheduleId)

      await setDoc(docRef, {
        id: scheduleId,
        cityId: city,
        ...scheduleData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      await loadGameSchedules(city)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const deleteGameSchedule = async (scheduleId) => {
    try {
      const docRef = doc(db, 'gameSchedules', scheduleId)
      await deleteDoc(docRef)

      await loadGameSchedules(currentCityId.value)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Load all games for a specific city
  const loadAllGames = async (cityId) => {
    const city = cityId || currentCityId.value || useCityStore().currentCityId
    currentCityId.value = city

    loading.value = true
    try {
      const gamesRef = collection(db, 'games')
      let q

      if (city) {
        q = query(gamesRef, where('cityId', '==', city), orderBy('date', 'desc'))
      } else {
        q = query(gamesRef, orderBy('date', 'desc'))
      }

      const querySnapshot = await getDocs(q)

      allGames.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      return { success: true }
    } catch (error) {
      console.error('Error loading games:', error)
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  const loadAllUsers = async () => {
    loading.value = true
    try {
      const usersRef = collection(db, 'users')
      const querySnapshot = await getDocs(usersRef)

      allUsers.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  const loadGameById = async (gameId) => {
    if (unsubscribeGame) {
      unsubscribeGame()
    }

    loading.value = true
    try {
      const docRef = doc(db, 'games', gameId)

      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        loading.value = false
        return { success: false, error: 'Game not found' }
      }

      unsubscribeGame = onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
          selectedGame.value = { id: doc.id, ...doc.data() }
        }
        loading.value = false
      }, (error) => {
        loading.value = false
      })

      return { success: true }
    } catch (error) {
      loading.value = false
      return { success: false, error: error.message }
    }
  }

  const stopGameListener = () => {
    if (unsubscribeGame) {
      unsubscribeGame()
      unsubscribeGame = null
    }
  }

  const movePlayerFromWaitlist = async (gameId, playerUid) => {
    try {
      const docRef = doc(db, 'games', gameId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        return { success: false, error: 'Game not found' }
      }

      const game = docSnap.data()
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

  const removePlayerFromGame = async (gameId, playerUid, fromWaitlist = false) => {
    try {
      const docRef = doc(db, 'games', gameId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        return { success: false, error: 'Game not found' }
      }

      const game = docSnap.data()
      const playerList = fromWaitlist ? game.waitlist : game.players
      const player = playerList?.find(p => p.uid === playerUid)

      if (!player) {
        return { success: false, error: 'Player not found' }
      }

      const updateField = fromWaitlist ? 'waitlist' : 'players'
      await updateDoc(docRef, {
        [updateField]: arrayRemove(player)
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Toggle super admin status
  const toggleUserSuperAdmin = async (userId, isSuperAdmin) => {
    try {
      const userDocRef = doc(db, 'users', userId)
      await updateDoc(userDocRef, {
        isSuperAdmin: !isSuperAdmin
      })

      await loadAllUsers()
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Toggle city admin status for a specific city
  const toggleUserCityAdmin = async (userId, cityId, isAdmin) => {
    try {
      const userDocRef = doc(db, 'users', userId)
      const userSnap = await getDoc(userDocRef)

      if (!userSnap.exists()) {
        return { success: false, error: 'User not found' }
      }

      const userData = userSnap.data()
      const cityData = userData.cityData || {}
      const currentCityData = cityData[cityId] || {}

      await updateDoc(userDocRef, {
        [`cityData.${cityId}.isAdmin`]: !isAdmin
      })

      await loadAllUsers()
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Legacy toggle for backward compatibility
  const toggleUserAdmin = async (userId, isAdmin) => {
    try {
      const userDocRef = doc(db, 'users', userId)
      await updateDoc(userDocRef, {
        isAdmin: !isAdmin
      })

      await loadAllUsers()
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const markGameAsPlayed = async (gameId) => {
    try {
      const docRef = doc(db, 'games', gameId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        return { success: false, error: 'Game not found' }
      }

      const game = docSnap.data()
      const players = game.players || []
      const cityId = game.cityId

      for (const player of players) {
        const userDocRef = doc(db, 'users', player.uid)
        const userSnap = await getDoc(userDocRef)

        if (userSnap.exists()) {
          const userData = userSnap.data()
          const updates = {}

          // Update city-specific gamesPlayed if available
          if (cityId && userData.cityData?.[cityId]) {
            updates[`cityData.${cityId}.gamesPlayed`] = increment(1)
          } else {
            // Legacy: update global gamesPlayed
            updates.gamesPlayed = increment(1)
          }

          // Decrement global pass (passes are valid for all cities)
          if (userData.passType && userData.passType !== 'full-season') {
            if (userData.passGamesRemaining > 0) {
              updates.passGamesRemaining = increment(-1)
            }
          }

          const gameHistoryEntry = {
            gameId: gameId,
            cityId: cityId,
            date: game.date,
            scheduleKey: game.scheduleKey,
            venue: game.venue,
            time: game.time,
            status: 'played'
          }
          updates.gameHistory = arrayUnion(gameHistoryEntry)

          await updateDoc(userDocRef, updates)
        }
      }

      await updateDoc(docRef, {
        status: 'completed',
        completedAt: new Date().toISOString()
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Update user regulars for a specific city
  const updateUserRegulars = async (userId, regulars, cityId) => {
    try {
      const userDocRef = doc(db, 'users', userId)

      if (cityId) {
        await updateDoc(userDocRef, {
          [`cityData.${cityId}.regulars`]: regulars
        })
      } else {
        // Legacy: update global regulars
        await updateDoc(userDocRef, {
          regulars: regulars
        })
      }

      await loadAllUsers()
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Update user city data
  const updateUserCityData = async (userId, cityId, cityData) => {
    try {
      const userDocRef = doc(db, 'users', userId)
      await updateDoc(userDocRef, {
        [`cityData.${cityId}`]: cityData
      })

      await loadAllUsers()
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const updateUser = async (userId, userData) => {
    try {
      const userDocRef = doc(db, 'users', userId)
      await updateDoc(userDocRef, userData)

      await loadAllUsers()
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const updateTeamAssignments = async (gameId, teamAssignments) => {
    try {
      const docRef = doc(db, 'games', gameId)
      await updateDoc(docRef, {
        teamAssignments: teamAssignments
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const movePlayerToTeam = async (gameId, player, fromList, toList) => {
    try {
      const docRef = doc(db, 'games', gameId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        return { success: false, error: 'Game not found' }
      }

      const game = docSnap.data()

      let updates = {}
      if (fromList === 'players') {
        const playerData = game.players?.find(p => p.uid === player.uid)
        if (playerData) {
          updates.players = arrayRemove(playerData)
        }
      } else if (fromList === 'waitlist') {
        const playerData = game.waitlist?.find(p => p.uid === player.uid)
        if (playerData) {
          updates.waitlist = arrayRemove(playerData)
        }
      }

      await updateDoc(docRef, updates)

      updates = {}
      if (toList === 'players') {
        updates.players = arrayUnion(player)
      } else if (toList === 'waitlist') {
        updates.waitlist = arrayUnion(player)
      }

      await updateDoc(docRef, updates)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Set current city for admin operations
  const setCurrentCity = (cityId) => {
    currentCityId.value = cityId
  }

  return {
    allGames,
    allUsers,
    gameSchedules,
    selectedGame,
    loading,
    currentCityId,
    loadAllGames,
    loadAllUsers,
    loadGameSchedules,
    updateGameSchedule,
    addGameSchedule,
    deleteGameSchedule,
    loadGameById,
    stopGameListener,
    movePlayerFromWaitlist,
    removePlayerFromGame,
    toggleUserAdmin,
    toggleUserSuperAdmin,
    toggleUserCityAdmin,
    markGameAsPlayed,
    updateUserRegulars,
    updateUserCityData,
    updateUser,
    updateTeamAssignments,
    movePlayerToTeam,
    setCurrentCity
  }
})
