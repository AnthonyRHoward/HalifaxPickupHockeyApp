<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :default-href="`/${cityId}/admin`"></ion-back-button>
        </ion-buttons>
        <ion-title>Manage Teams</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="teams-container" v-if="adminStore.selectedGame">
        <h1>{{ formatDate(adminStore.selectedGame.date) }}</h1>
        <p class="subtitle">{{ adminStore.selectedGame.venue }} - {{ formatTime(adminStore.selectedGame.time) }}</p>

        <div class="teams-layout">
          <!-- Waitlist Section -->
          <ion-card class="waitlist-card">
            <ion-card-header>
              <ion-card-title>Waitlist ({{ sortedWaitlist.length }})</ion-card-title>
              <ion-card-subtitle>First come, first served</ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              <div
                class="drop-zone waitlist-zone"
                @drop="handleDrop($event, 'waitlist')"
                @dragover.prevent
                @dragenter.prevent
              >
                <ion-list v-if="sortedWaitlist.length > 0">
                  <ion-item
                    v-for="(player, index) in sortedWaitlist"
                    :key="player.uid"
                    :draggable="!isMobile"
                    @dragstart="!isMobile && handleDragStart($event, player, 'waitlist')"
                    @click="handlePlayerClick(player, 'waitlist')"
                    :button="isMobile"
                    class="draggable-player"
                  >
                    <ion-label>
                      <h2>{{ index + 1 }}. {{ player.name }}</h2>
                      <p>{{ player.position }} - Level {{ player.skillLevel || 2 }}</p>
                      <p class="check-in-time">{{ formatCheckInTime(player.checkedInAt) }}</p>
                    </ion-label>
                  </ion-item>
                </ion-list>
                <div v-else class="empty-zone">
                  <p>No players in waitlist</p>
                  <p class="hint">{{ isMobile ? 'Tap players to move them to waitlist' : 'Drag players here to move them back to waitlist' }}</p>
                </div>
              </div>
            </ion-card-content>
          </ion-card>

          <!-- Dark Team Section -->
          <ion-card class="team-card dark-team">
            <ion-card-header>
              <ion-card-title>Dark Team ({{ darkTeamPlayers.length }})</ion-card-title>
              <ion-card-subtitle>Avg Skill: {{ getAverageSkill(darkTeamPlayers).toFixed(1) }}</ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              <div
                class="drop-zone team-zone"
                @drop="handleDrop($event, 'dark')"
                @dragover.prevent
                @dragenter.prevent
              >
                <ion-list v-if="darkTeamPlayers.length > 0">
                  <ion-item
                    v-for="player in darkTeamPlayers"
                    :key="player.uid"
                    :draggable="!isMobile"
                    @dragstart="!isMobile && handleDragStart($event, player, 'dark')"
                    @click="handlePlayerClick(player, 'dark')"
                    :button="isMobile"
                    class="draggable-player"
                  >
                    <ion-label>
                      <h2>{{ player.name }}</h2>
                      <p>{{ player.position }} - Level {{ player.skillLevel || 2 }}</p>
                    </ion-label>
                  </ion-item>
                </ion-list>
                <div v-else class="empty-zone">
                  <p>No players assigned</p>
                  <p class="hint">{{ isMobile ? 'Tap players to assign them' : 'Drag players here' }}</p>
                </div>
              </div>
            </ion-card-content>
          </ion-card>

          <!-- Light Team Section -->
          <ion-card class="team-card light-team">
            <ion-card-header>
              <ion-card-title>Light Team ({{ lightTeamPlayers.length }})</ion-card-title>
              <ion-card-subtitle>Avg Skill: {{ getAverageSkill(lightTeamPlayers).toFixed(1) }}</ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              <div
                class="drop-zone team-zone"
                @drop="handleDrop($event, 'light')"
                @dragover.prevent
                @dragenter.prevent
              >
                <ion-list v-if="lightTeamPlayers.length > 0">
                  <ion-item
                    v-for="player in lightTeamPlayers"
                    :key="player.uid"
                    :draggable="!isMobile"
                    @dragstart="!isMobile && handleDragStart($event, player, 'light')"
                    @click="handlePlayerClick(player, 'light')"
                    :button="isMobile"
                    class="draggable-player"
                  >
                    <ion-label>
                      <h2>{{ player.name }}</h2>
                      <p>{{ player.position }} - Level {{ player.skillLevel || 2 }}</p>
                    </ion-label>
                  </ion-item>
                </ion-list>
                <div v-else class="empty-zone">
                  <p>No players assigned</p>
                  <p class="hint">{{ isMobile ? 'Tap players to assign them' : 'Drag players here' }}</p>
                </div>
              </div>
            </ion-card-content>
          </ion-card>
        </div>

        <!-- Auto-Balance Button -->
        <ion-button expand="block" @click="autoBalanceTeams" color="primary" class="ion-margin-top">
          <ion-icon :icon="shuffleOutline" slot="start"></ion-icon>
          Auto-Balance Teams
        </ion-button>
      </div>

      <div v-else class="loading-container">
        <ion-spinner></ion-spinner>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonSpinner,
  toastController,
  actionSheetController
} from '@ionic/vue'
import { shuffleOutline } from 'ionicons/icons'
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import { useGameStore } from '@/stores/game'
import { Capacitor } from '@capacitor/core'

const route = useRoute()
const router = useRouter()
const adminStore = useAdminStore()
const gameStore = useGameStore()

// Get city ID from route params
const cityId = computed(() => route.params.cityId)

const draggedPlayer = ref(null)
const dragSource = ref(null)
const isMobile = Capacitor.isNativePlatform()

onMounted(async () => {
  const gameId = route.params.gameId
  const result = await adminStore.loadGameById(gameId)

  if (!result.success) {
    const toast = await toastController.create({
      message: 'Game not found',
      duration: 2000,
      color: 'danger'
    })
    await toast.present()
    router.push(`/${cityId.value}/admin`)
    return
  }

  const game = adminStore.selectedGame
  const hasTeamAssignments = game.teamAssignments && (game.teamAssignments.dark || game.teamAssignments.light)

  if (game.players && game.players.length > 0) {
    if (!hasTeamAssignments) {
      await autoBalanceTeams()
    } else {
      const assignedUids = new Set([
        ...(game.teamAssignments.dark || []).map(p => p.uid),
        ...(game.teamAssignments.light || []).map(p => p.uid)
      ])

      const hasUnassignedPlayers = game.players.some(p => !assignedUids.has(p.uid))

      if (hasUnassignedPlayers) {
        await autoBalanceTeams()
      }
    }
  }
})

const sortedWaitlist = computed(() => {
  if (!adminStore.selectedGame?.waitlist) return []
  return [...adminStore.selectedGame.waitlist].sort((a, b) => {
    return new Date(a.checkedInAt) - new Date(b.checkedInAt)
  })
})

const teamAssignments = computed(() => {
  return adminStore.selectedGame?.teamAssignments || { dark: [], light: [] }
})

const darkTeamPlayers = computed(() => {
  return teamAssignments.value.dark || []
})

const lightTeamPlayers = computed(() => {
  return teamAssignments.value.light || []
})

const getAverageSkill = (players) => {
  if (!players || players.length === 0) return 0
  const total = players.reduce((sum, player) => sum + (player.skillLevel || 2), 0)
  return total / players.length
}

const handleDragStart = (event, player, source) => {
  draggedPlayer.value = player
  dragSource.value = source
  event.dataTransfer.effectAllowed = 'move'
}

const handlePlayerClick = async (player, source) => {
  if (!isMobile) return

  const buttons = []

  if (source !== 'waitlist') {
    buttons.push({
      text: 'Move to Waitlist',
      role: 'destructive',
      handler: () => movePlayer(player, source, 'waitlist')
    })
  }

  if (source !== 'dark') {
    buttons.push({
      text: 'Move to Dark Team',
      handler: () => movePlayer(player, source, 'dark')
    })
  }

  if (source !== 'light') {
    buttons.push({
      text: 'Move to Light Team',
      handler: () => movePlayer(player, source, 'light')
    })
  }

  buttons.push({
    text: 'Cancel',
    role: 'cancel'
  })

  const actionSheet = await actionSheetController.create({
    header: `Move ${player.name}`,
    subHeader: `${player.position} - Level ${player.skillLevel || 2}`,
    buttons
  })

  await actionSheet.present()
}

const movePlayer = async (player, source, target) => {
  const currentAssignments = { ...teamAssignments.value }
  if (!currentAssignments.dark) currentAssignments.dark = []
  if (!currentAssignments.light) currentAssignments.light = []

  if (source === 'waitlist' && (target === 'dark' || target === 'light')) {
    await adminStore.movePlayerToTeam(adminStore.selectedGame.id, player, 'waitlist', 'players')
    currentAssignments[target].push(player)
    await adminStore.updateTeamAssignments(adminStore.selectedGame.id, currentAssignments)
  }
  else if ((source === 'dark' || source === 'light') && target === 'waitlist') {
    currentAssignments[source] = currentAssignments[source].filter(p => p.uid !== player.uid)
    await adminStore.updateTeamAssignments(adminStore.selectedGame.id, currentAssignments)
    await adminStore.movePlayerToTeam(adminStore.selectedGame.id, player, 'players', 'waitlist')
  }
  else if ((source === 'dark' || source === 'light') && (target === 'dark' || target === 'light')) {
    currentAssignments[source] = currentAssignments[source].filter(p => p.uid !== player.uid)
    currentAssignments[target].push(player)
    await adminStore.updateTeamAssignments(adminStore.selectedGame.id, currentAssignments)
  }

  const toast = await toastController.create({
    message: 'Player moved successfully!',
    duration: 1000,
    color: 'success'
  })
  await toast.present()
}

const handleDrop = async (event, target) => {
  event.preventDefault()

  if (!draggedPlayer.value || dragSource.value === target) {
    return
  }

  const player = draggedPlayer.value
  const source = dragSource.value

  await movePlayer(player, source, target)

  draggedPlayer.value = null
  dragSource.value = null
}

const autoBalanceTeams = async () => {
  const allPlayers = adminStore.selectedGame.players || []
  const balanced = gameStore.balanceTeams(allPlayers)

  const newTeamAssignments = {
    dark: [],
    light: []
  }

  if (balanced.darkTeam.goalie) newTeamAssignments.dark.push(balanced.darkTeam.goalie)
  newTeamAssignments.dark.push(...balanced.darkTeam.forwards)
  newTeamAssignments.dark.push(...balanced.darkTeam.defense)

  if (balanced.lightTeam.goalie) newTeamAssignments.light.push(balanced.lightTeam.goalie)
  newTeamAssignments.light.push(...balanced.lightTeam.forwards)
  newTeamAssignments.light.push(...balanced.lightTeam.defense)

  await adminStore.updateTeamAssignments(adminStore.selectedGame.id, newTeamAssignments)

  const toast = await toastController.create({
    message: 'Teams auto-balanced!',
    duration: 2000,
    color: 'success'
  })
  await toast.present()
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const [year, month, day] = dateString.split('T')[0].split('-')
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatTime = (time) => {
  if (!time) return ''
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour > 12 ? hour - 12 : hour
  return `${displayHour}:${minutes} ${ampm}`
}

const formatCheckInTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}
</script>

<style scoped>
.teams-container {
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

h1 {
  text-align: center;
  margin-bottom: 0.5rem;
  font-size: 1.8rem;
}

.subtitle {
  text-align: center;
  color: var(--ion-color-medium);
  margin-bottom: 2rem;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
}

.teams-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.drop-zone {
  min-height: 200px;
  border: 2px dashed var(--ion-color-medium);
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.3s ease;
}

.drop-zone:hover {
  border-color: var(--ion-color-primary);
  background-color: rgba(var(--ion-color-primary-rgb), 0.05);
}

.draggable-player {
  cursor: move;
  user-select: none;
}

.draggable-player[button] {
  cursor: pointer;
}

.draggable-player:hover {
  --background: rgba(var(--ion-color-primary-rgb), 0.1);
}

.draggable-player:active {
  --background: rgba(var(--ion-color-primary-rgb), 0.15);
}

.empty-zone {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--ion-color-medium);
}

.empty-zone p {
  margin: 0.5rem 0;
}

.hint {
  font-size: 0.85rem;
  font-style: italic;
}

.check-in-time {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
  margin-top: 0.25rem;
}

.waitlist-card {
  border-left: 4px solid var(--ion-color-warning);
}

.team-card.dark-team {
  border-left: 4px solid #333;
}

.team-card.light-team {
  border-left: 4px solid #999;
}

@media (min-width: 768px) {
  .teams-layout {
    grid-template-columns: 1fr 1fr;
  }

  .waitlist-card {
    grid-column: 1 / -1;
  }
}

@media (min-width: 1200px) {
  .teams-layout {
    grid-template-columns: 1fr 1fr 1fr;
  }

  .waitlist-card {
    grid-column: auto;
  }
}
</style>
