<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :default-href="`/${cityId}`"></ion-back-button>
        </ion-buttons>
        <ion-title>Profile</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="confirmLogout" color="medium">
            <ion-icon :icon="logOutOutline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="authStore.userProfile" class="profile-page">
        <!-- Hero Header -->
        <div class="profile-hero">
          <div class="hero-content">
            <div class="avatar">
              <span class="avatar-initials">{{ userInitials }}</span>
              <div class="position-badge" :class="positionClass">
                <ion-icon :icon="positionIcon"></ion-icon>
              </div>
            </div>
            <h1 class="user-name">{{ authStore.userProfile.name }}</h1>
            <p class="user-email">{{ authStore.userProfile.email }}</p>
            <div class="skill-badge" :class="`skill-${authStore.userProfile.skillLevel}`">
              Level {{ authStore.userProfile.skillLevel }}
            </div>
          </div>

          <!-- Quick Stats -->
          <div class="quick-stats">
            <div class="stat-item">
              <ion-icon :icon="gameControllerOutline"></ion-icon>
              <span class="stat-value">{{ cityGamesPlayed }}</span>
              <span class="stat-label">Games</span>
            </div>
            <div class="stat-item" :class="passStatusClass">
              <ion-icon :icon="ticketOutline"></ion-icon>
              <span class="stat-value">{{ passStatusValue }}</span>
              <span class="stat-label">Pass</span>
            </div>
            <div class="stat-item">
              <ion-icon :icon="calendarOutline"></ion-icon>
              <span class="stat-value">{{ regularNightsCount }}</span>
              <span class="stat-label">Regular</span>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs-container">
          <ion-segment v-model="activeTab" mode="ios">
            <ion-segment-button value="overview">
              <ion-label>Overview</ion-label>
            </ion-segment-button>
            <ion-segment-button value="pass">
              <ion-label>Pass</ion-label>
            </ion-segment-button>
            <ion-segment-button value="schedule">
              <ion-label>Schedule</ion-label>
            </ion-segment-button>
            <ion-segment-button value="history">
              <ion-label>History</ion-label>
            </ion-segment-button>
          </ion-segment>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
          <!-- Overview Tab -->
          <div v-show="activeTab === 'overview'" class="tab-panel">
            <div class="section-grid">
              <!-- Player Info Card -->
              <div class="info-card">
                <div class="card-header">
                  <ion-icon :icon="personOutline"></ion-icon>
                  <h3>Player Info</h3>
                </div>
                <div class="info-row">
                  <span class="info-label">Position</span>
                  <span class="info-value">
                    <ion-icon :icon="positionIcon" class="position-icon"></ion-icon>
                    {{ authStore.userProfile.position }}
                  </span>
                </div>
                <div class="info-row">
                  <span class="info-label">City</span>
                  <span class="info-value">{{ cityStore.currentCity?.name || 'Not Set' }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Member Since</span>
                  <span class="info-value">{{ memberSince }}</span>
                </div>
              </div>

              <!-- Skill Level Card -->
              <div class="info-card skill-card">
                <div class="card-header">
                  <ion-icon :icon="trophyOutline"></ion-icon>
                  <h3>Skill Level</h3>
                </div>
                <div class="skill-selector">
                  <button
                    v-for="level in skillLevels"
                    :key="level.value"
                    class="skill-option"
                    :class="{ active: authStore.userProfile.skillLevel === level.value }"
                    @click="updateSkillLevel(level.value)"
                  >
                    <span class="level-number">{{ level.value }}</span>
                    <span class="level-name">{{ level.name }}</span>
                  </button>
                </div>
                <p class="skill-description">
                  {{ currentSkillDescription }}
                </p>
              </div>
            </div>
          </div>

          <!-- Pass Tab -->
          <div v-show="activeTab === 'pass'" class="tab-panel">
            <div class="pass-card" :class="{ 'no-pass': !passInfo.passType }">
              <div v-if="passInfo.passType" class="pass-content">
                <div class="pass-header">
                  <ion-icon :icon="ticketOutline" class="pass-icon"></ion-icon>
                  <div class="pass-title">
                    <h3>{{ passTypeName }}</h3>
                    <span class="pass-valid">Valid for all cities</span>
                  </div>
                </div>

                <div class="pass-details">
                  <div v-if="passInfo.passType !== 'full-season'" class="pass-meter">
                    <div class="meter-label">
                      <span>Games Remaining</span>
                      <span class="meter-value" :class="{ danger: passInfo.passGamesRemaining === 0 }">
                        {{ passInfo.passGamesRemaining }}
                      </span>
                    </div>
                    <div class="meter-bar">
                      <div class="meter-fill" :style="{ width: passPercentage + '%' }"></div>
                    </div>
                  </div>
                  <div v-else class="unlimited-badge">
                    <ion-icon :icon="infiniteOutline"></ion-icon>
                    <span>Unlimited Games</span>
                  </div>

                  <div v-if="passInfo.passStartDate" class="pass-date">
                    <ion-icon :icon="calendarOutline"></ion-icon>
                    <span>Started {{ formatPassDate(passInfo.passStartDate) }}</span>
                  </div>
                </div>
              </div>

              <div v-else class="no-pass-content">
                <ion-icon :icon="ticketOutline" class="no-pass-icon"></ion-icon>
                <h3>No Active Pass</h3>
                <p>Contact an admin to purchase a skate pass.</p>
                <div class="pass-options">
                  <div class="pass-option">
                    <span class="option-name">5-Game Pass</span>
                  </div>
                  <div class="pass-option">
                    <span class="option-name">10-Game Pass</span>
                  </div>
                  <div class="pass-option featured">
                    <span class="option-name">Full Season</span>
                    <span class="option-badge">Best Value</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Schedule Tab -->
          <div v-show="activeTab === 'schedule'" class="tab-panel">
            <div class="schedule-header">
              <h3>Regular Nights</h3>
              <p class="schedule-city">{{ cityStore.currentCity?.name || 'Current City' }}</p>
            </div>

            <div v-if="citySchedules.length > 0" class="schedule-list">
              <div
                v-for="schedule in citySchedules"
                :key="schedule.id"
                class="schedule-item"
                :class="{ regular: isRegularForSchedule(schedule.id) }"
              >
                <div class="schedule-day">
                  <span class="day-name">{{ schedule.dayName }}</span>
                  <span class="day-time">{{ formatTime(schedule.time) }}</span>
                </div>
                <div class="schedule-venue">
                  <ion-icon :icon="locationOutline"></ion-icon>
                  {{ schedule.venue }}
                </div>
                <div class="schedule-status">
                  <ion-badge :color="isRegularForSchedule(schedule.id) ? 'success' : 'medium'">
                    {{ isRegularForSchedule(schedule.id) ? 'Regular' : 'Not Regular' }}
                  </ion-badge>
                </div>
              </div>
            </div>

            <div v-else class="empty-state">
              <ion-icon :icon="calendarOutline"></ion-icon>
              <p>No schedules available for this city</p>
            </div>

            <p class="schedule-note">
              <ion-icon :icon="informationCircleOutline"></ion-icon>
              Contact an admin to modify your regular status
            </p>
          </div>

          <!-- History Tab -->
          <div v-show="activeTab === 'history'" class="tab-panel">
            <div v-if="filteredGameHistory.length > 0" class="history-list">
              <div
                v-for="(game, index) in sortedGameHistory"
                :key="index"
                class="history-item"
              >
                <div class="history-date">
                  <span class="date-day">{{ formatHistoryDay(game.date) }}</span>
                  <span class="date-month">{{ formatHistoryMonth(game.date) }}</span>
                </div>
                <div class="history-details">
                  <span class="history-venue">{{ game.venue }}</span>
                  <span class="history-time">{{ formatTime(game.time) }}</span>
                </div>
                <ion-badge :color="game.status === 'played' ? 'success' : 'warning'">
                  {{ game.status === 'played' ? 'Played' : 'Confirmed' }}
                </ion-badge>
              </div>
            </div>

            <div v-else class="empty-state">
              <ion-icon :icon="gameControllerOutline"></ion-icon>
              <h3>No Games Yet</h3>
              <p>Check in for your first game!</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-else class="loading-state">
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
  IonButton,
  IonButtons,
  IonBackButton,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonBadge,
  IonIcon,
  IonSpinner,
  toastController,
  alertController,
} from "@ionic/vue";
import {
  logOutOutline,
  personOutline,
  trophyOutline,
  ticketOutline,
  calendarOutline,
  gameControllerOutline,
  locationOutline,
  informationCircleOutline,
  infiniteOutline,
  shieldOutline,
  fitnessOutline,
  handLeftOutline,
} from "ionicons/icons";
import { computed, ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useCityStore } from "@/stores/city";
import { useGameStore } from "@/stores/game";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const cityStore = useCityStore();
const gameStore = useGameStore();

const activeTab = ref("overview");

// Skill levels configuration
const skillLevels = [
  { value: 1, name: "Beginner", description: "Basic skating ability but struggles with backward skating and crossovers" },
  { value: 2, name: "Intermediate", description: "A good mix of basic skills, decent knowledge of the game, and athletic ability" },
  { value: 3, name: "Advanced", description: "Advanced skills, strong physical shape, and a high understanding of the game" },
];

// Computed properties
const cityId = computed(() => route.params.cityId);

const userInitials = computed(() => {
  const name = authStore.userProfile?.name || "";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
});

const positionClass = computed(() => {
  const pos = authStore.userProfile?.position?.toLowerCase();
  return pos === "goalie" ? "goalie" : pos === "defense" ? "defense" : "forward";
});

const positionIcon = computed(() => {
  const pos = authStore.userProfile?.position?.toLowerCase();
  if (pos === "goalie") return handLeftOutline;
  if (pos === "defense") return shieldOutline;
  return fitnessOutline;
});

const cityGamesPlayed = computed(() => authStore.getCityGamesPlayed(cityId.value));

const passInfo = computed(() => authStore.getPassInfo());

const passStatusClass = computed(() => {
  if (!passInfo.value.passType) return "no-pass";
  if (passInfo.value.passType === "full-season") return "unlimited";
  if (passInfo.value.passGamesRemaining === 0) return "expired";
  return "active";
});

const passStatusValue = computed(() => {
  if (!passInfo.value.passType) return "None";
  if (passInfo.value.passType === "full-season") return "Full";
  return passInfo.value.passGamesRemaining;
});

const passTypeName = computed(() => {
  const types = {
    "5-game": "5 Game Pass",
    "10-game": "10 Game Pass",
    "full-season": "Full Season Pass",
  };
  return types[passInfo.value.passType] || "Unknown";
});

const passPercentage = computed(() => {
  if (!passInfo.value.passType || passInfo.value.passType === "full-season") return 100;
  const total = passInfo.value.passType === "5-game" ? 5 : 10;
  return (passInfo.value.passGamesRemaining / total) * 100;
});

const regularNightsCount = computed(() => {
  return citySchedules.value.filter(s => isRegularForSchedule(s.id)).length;
});

const citySchedules = computed(() => {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const schedules = gameStore.gameSchedules;

  return Object.entries(schedules)
    .map(([id, schedule]) => ({
      id,
      dayName: dayNames[schedule.day],
      day: schedule.day,
      time: schedule.time,
      venue: schedule.venue,
    }))
    .sort((a, b) => a.day - b.day);
});

const currentSkillDescription = computed(() => {
  const level = skillLevels.find(l => l.value === authStore.userProfile?.skillLevel);
  return level?.description || "Not set";
});

const memberSince = computed(() => {
  const date = authStore.userProfile?.createdAt;
  if (!date) return "Unknown";
  return new Date(date).toLocaleDateString("en-US", { month: "short", year: "numeric" });
});

const filteredGameHistory = computed(() => {
  const history = authStore.userProfile?.gameHistory || [];
  return history.filter(game => !game.cityId || game.cityId === cityId.value);
});

const sortedGameHistory = computed(() => {
  return [...filteredGameHistory.value].sort((a, b) => new Date(b.date) - new Date(a.date));
});

// Methods
const isRegularForSchedule = (scheduleId) => {
  return authStore.isRegularForSchedule(scheduleId, cityId.value);
};

const updateSkillLevel = async (newLevel) => {
  if (authStore.userProfile?.skillLevel === newLevel) return;

  const result = await authStore.updateUserProfile({ skillLevel: newLevel });
  const toast = await toastController.create({
    message: result.success ? "Skill level updated!" : "Failed to update",
    duration: 2000,
    color: result.success ? "success" : "danger",
  });
  await toast.present();
};

const confirmLogout = async () => {
  const alert = await alertController.create({
    header: "Logout",
    message: "Are you sure you want to logout?",
    buttons: [
      { text: "Cancel", role: "cancel" },
      {
        text: "Logout",
        role: "destructive",
        handler: handleLogout,
      },
    ],
  });
  await alert.present();
};

const handleLogout = async () => {
  const result = await authStore.logout();
  if (result.success) {
    const toast = await toastController.create({
      message: "Logged out successfully!",
      duration: 2000,
      color: "success",
    });
    await toast.present();
    router.push("/");
  }
};

const formatTime = (time) => {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
};

const formatPassDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatHistoryDay = (dateString) => {
  return new Date(dateString).getDate();
};

const formatHistoryMonth = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", { month: "short" });
};

// Lifecycle
onMounted(async () => {
  if (cityId.value) {
    await cityStore.setCurrentCity(cityId.value);
    gameStore.setCurrentCity(cityId.value);
    await gameStore.subscribeToSchedules(cityId.value);
  }
});
</script>

<style scoped>
.profile-page {
  min-height: 100%;
  background: var(--ion-background-color);
}

/* Hero Section */
.profile-hero {
  background: linear-gradient(135deg, #4f001e 0%, #2d0011 100%);
  padding: 2rem 1rem 1.5rem;
  text-align: center;
}

.hero-content {
  margin-bottom: 1.5rem;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  position: relative;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.avatar-initials {
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
}

.position-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #2d0011;
}

.position-badge ion-icon {
  font-size: 14px;
  color: white;
}

.position-badge.forward { background: #3880ff; }
.position-badge.defense { background: #2dd36f; }
.position-badge.goalie { background: #ffc409; }

.user-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0 0 0.25rem;
}

.user-email {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 0.75rem;
}

.skill-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  color: white;
}

.skill-badge.skill-1 { background: #92949c; }
.skill-badge.skill-2 { background: #3880ff; }
.skill-badge.skill-3 { background: #2dd36f; }

/* Quick Stats */
.quick-stats {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  margin: 0 0.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-item ion-icon {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.7);
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
}

.stat-label {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-item.no-pass .stat-value { color: #92949c; }
.stat-item.expired .stat-value { color: #eb445a; }
.stat-item.unlimited .stat-value { color: #2dd36f; }
.stat-item.active .stat-value { color: #3880ff; }

/* Tabs */
.tabs-container {
  padding: 1rem;
  background: var(--ion-background-color);
  position: sticky;
  top: 0;
  z-index: 10;
}

ion-segment {
  --background: #2d2d2d;
  border-radius: 8px;
}

ion-segment-button {
  --color: #92949c;
  --color-checked: white;
  --indicator-color: #4f001e;
  --border-radius: 6px;
  min-height: 36px;
  font-size: 0.85rem;
}

/* Tab Content */
.tab-content {
  padding: 0 1rem 2rem;
}

.tab-panel {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Section Grid */
.section-grid {
  display: grid;
  gap: 1rem;
}

/* Info Card */
.info-card {
  background: #2d2d2d;
  border-radius: 12px;
  padding: 1.25rem;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.card-header ion-icon {
  font-size: 1.25rem;
  color: #4f001e;
}

.card-header h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: white;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.info-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.info-label {
  font-size: 0.9rem;
  color: #92949c;
}

.info-value {
  font-size: 0.9rem;
  color: white;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.position-icon {
  font-size: 1rem;
  color: #3880ff;
}

/* Skill Card */
.skill-selector {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.skill-option {
  background: #3d3d3d;
  border: 2px solid transparent;
  border-radius: 8px;
  padding: 0.75rem 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.skill-option:hover {
  background: #4d4d4d;
}

.skill-option.active {
  border-color: #4f001e;
  background: rgba(79, 0, 30, 0.2);
}

.level-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
}

.level-name {
  font-size: 0.7rem;
  color: #92949c;
  text-transform: uppercase;
}

.skill-option.active .level-number { color: #ff6b9d; }
.skill-option.active .level-name { color: #ff6b9d; }

.skill-description {
  font-size: 0.85rem;
  color: #92949c;
  margin: 0;
  line-height: 1.4;
}

/* Pass Card */
.pass-card {
  background: #2d2d2d;
  border-radius: 12px;
  overflow: hidden;
}

.pass-content {
  padding: 1.5rem;
}

.pass-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.pass-icon {
  font-size: 2.5rem;
  color: #3880ff;
}

.pass-title h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.25rem;
  color: white;
}

.pass-valid {
  font-size: 0.8rem;
  color: #2dd36f;
}

.pass-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pass-meter {
  background: #3d3d3d;
  border-radius: 8px;
  padding: 1rem;
}

.meter-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #92949c;
}

.meter-value {
  font-weight: 600;
  color: #3880ff;
}

.meter-value.danger {
  color: #eb445a;
}

.meter-bar {
  height: 8px;
  background: #4d4d4d;
  border-radius: 4px;
  overflow: hidden;
}

.meter-fill {
  height: 100%;
  background: linear-gradient(90deg, #3880ff, #5a9dff);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.unlimited-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(45, 211, 111, 0.1);
  border-radius: 8px;
  color: #2dd36f;
  font-weight: 600;
}

.unlimited-badge ion-icon {
  font-size: 1.5rem;
}

.pass-date {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #92949c;
}

.pass-date ion-icon {
  font-size: 1rem;
}

/* No Pass State */
.no-pass-content {
  padding: 2rem 1.5rem;
  text-align: center;
}

.no-pass-icon {
  font-size: 3rem;
  color: #92949c;
  margin-bottom: 1rem;
}

.no-pass-content h3 {
  font-size: 1.25rem;
  color: white;
  margin: 0 0 0.5rem;
}

.no-pass-content p {
  font-size: 0.9rem;
  color: #92949c;
  margin: 0 0 1.5rem;
}

.pass-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.pass-option {
  background: #3d3d3d;
  border-radius: 8px;
  padding: 0.75rem 0.5rem;
  text-align: center;
}

.pass-option.featured {
  background: rgba(79, 0, 30, 0.3);
  border: 1px solid #4f001e;
}

.option-name {
  display: block;
  font-size: 0.8rem;
  color: white;
  font-weight: 500;
}

.option-badge {
  display: block;
  font-size: 0.65rem;
  color: #ff6b9d;
  margin-top: 0.25rem;
}

/* Schedule Section */
.schedule-header {
  margin-bottom: 1rem;
}

.schedule-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  margin: 0 0 0.25rem;
}

.schedule-city {
  font-size: 0.85rem;
  color: #92949c;
  margin: 0;
}

.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.schedule-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  background: #2d2d2d;
  border-radius: 12px;
  border-left: 3px solid #92949c;
}

.schedule-item.regular {
  border-left-color: #2dd36f;
}

.schedule-day {
  text-align: center;
  min-width: 70px;
}

.day-name {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: white;
}

.day-time {
  display: block;
  font-size: 0.75rem;
  color: #92949c;
}

.schedule-venue {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #c4c4c4;
}

.schedule-venue ion-icon {
  font-size: 1rem;
  color: #92949c;
}

.schedule-note {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  font-size: 0.8rem;
  color: #92949c;
}

.schedule-note ion-icon {
  font-size: 1rem;
}

/* History Section */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.history-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1rem;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #2d2d2d;
  border-radius: 10px;
}

.history-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 40px;
  padding: 0.5rem;
  background: #3d3d3d;
  border-radius: 8px;
}

.date-day {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  line-height: 1;
}

.date-month {
  font-size: 0.65rem;
  color: #92949c;
  text-transform: uppercase;
}

.history-details {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.history-venue {
  font-size: 0.9rem;
  color: white;
  font-weight: 500;
}

.history-time {
  font-size: 0.8rem;
  color: #92949c;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #92949c;
}

.empty-state ion-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 1.1rem;
  color: white;
  margin: 0 0 0.5rem;
}

.empty-state p {
  font-size: 0.9rem;
  margin: 0;
}

/* Loading State */
.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
}

/* Responsive */
@media (min-width: 768px) {
  .profile-hero {
    padding: 2.5rem 2rem 2rem;
  }

  .avatar {
    width: 100px;
    height: 100px;
  }

  .avatar-initials {
    font-size: 2rem;
  }

  .user-name {
    font-size: 1.75rem;
  }

  .quick-stats {
    max-width: 400px;
    margin: 0 auto;
  }

  .tabs-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 1.5rem 1rem;
  }

  .tab-content {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 2rem 2rem;
  }

  .section-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .schedule-item {
    padding: 1.25rem 1.5rem;
  }
}

@media (min-width: 1024px) {
  .tab-content {
    max-width: 1000px;
  }

  .section-grid {
    gap: 1.5rem;
  }

  .pass-options {
    max-width: 400px;
    margin: 0 auto;
  }
}
</style>
