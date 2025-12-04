<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :default-href="`/${cityId}/admin`"></ion-back-button>
        </ion-buttons>
        <ion-title>Edit Player</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="saveUserChanges" :disabled="saving">
            <ion-icon :icon="checkmarkOutline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="user" class="edit-page">
        <!-- Hero Header -->
        <div class="edit-hero">
          <div class="hero-content">
            <div class="avatar" :class="{ admin: isUserAdmin }">
              <span class="avatar-initials">{{ userInitials }}</span>
              <div class="position-badge" :class="positionClass">
                <ion-icon :icon="positionIcon"></ion-icon>
              </div>
              <div v-if="isUserAdmin" class="admin-badge">
                <ion-icon :icon="shieldCheckmarkOutline"></ion-icon>
              </div>
            </div>
            <h1 class="user-name">{{ user.name }}</h1>
            <p class="user-email">{{ user.email }}</p>
            <div class="city-context">
              <ion-icon :icon="locationOutline"></ion-icon>
              Editing for {{ cityStore.currentCity?.displayName || cityId }}
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs-container">
          <ion-segment v-model="activeTab" mode="ios">
            <ion-segment-button value="profile">
              <ion-label>Profile</ion-label>
            </ion-segment-button>
            <ion-segment-button value="pass">
              <ion-label>Pass</ion-label>
            </ion-segment-button>
            <ion-segment-button value="schedule">
              <ion-label>Schedule</ion-label>
            </ion-segment-button>
            <ion-segment-button value="permissions">
              <ion-label>Admin</ion-label>
            </ion-segment-button>
          </ion-segment>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
          <!-- Profile Tab -->
          <div v-show="activeTab === 'profile'" class="tab-panel">
            <div class="section-grid">
              <!-- Basic Info Card -->
              <div class="edit-card">
                <div class="card-header">
                  <ion-icon :icon="personOutline"></ion-icon>
                  <h3>Basic Information</h3>
                </div>

                <div class="form-group">
                  <label class="form-label">Name</label>
                  <ion-input
                    v-model="user.name"
                    placeholder="Player name"
                    class="form-input"
                  ></ion-input>
                </div>

                <div class="form-group">
                  <label class="form-label">Email</label>
                  <ion-input
                    v-model="user.email"
                    type="email"
                    placeholder="Email address"
                    class="form-input"
                  ></ion-input>
                </div>

                <div class="form-group">
                  <label class="form-label">Position</label>
                  <ion-select
                    v-model="user.position"
                    interface="action-sheet"
                    class="form-select"
                  >
                    <ion-select-option value="Forward">Forward</ion-select-option>
                    <ion-select-option value="Defense">Defense</ion-select-option>
                    <ion-select-option value="Goalie">Goalie</ion-select-option>
                  </ion-select>
                </div>

                <div class="form-group">
                  <label class="form-label">Games Played ({{ cityStore.currentCity?.name || 'This City' }})</label>
                  <ion-input
                    v-model.number="cityData.gamesPlayed"
                    type="number"
                    min="0"
                    class="form-input"
                  ></ion-input>
                </div>
              </div>

              <!-- Skill Level Card -->
              <div class="edit-card">
                <div class="card-header">
                  <ion-icon :icon="trophyOutline"></ion-icon>
                  <h3>Skill Level</h3>
                </div>

                <div class="skill-selector">
                  <button
                    v-for="level in skillLevels"
                    :key="level.value"
                    class="skill-option"
                    :class="{ active: user.skillLevel === level.value }"
                    @click="user.skillLevel = level.value"
                  >
                    <span class="level-number">{{ level.value }}</span>
                    <span class="level-name">{{ level.name }}</span>
                  </button>
                </div>
                <p class="skill-description">
                  {{ getSkillDescription(user.skillLevel) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Pass Tab -->
          <div v-show="activeTab === 'pass'" class="tab-panel">
            <div class="edit-card pass-edit-card">
              <div class="card-header">
                <ion-icon :icon="ticketOutline"></ion-icon>
                <h3>Skate Pass</h3>
                <span class="header-badge">All Cities</span>
              </div>

              <div class="form-group">
                <label class="form-label">Pass Type</label>
                <div class="pass-type-selector">
                  <button
                    v-for="passType in passTypes"
                    :key="passType.value"
                    class="pass-type-option"
                    :class="{ active: user.passType === passType.value }"
                    @click="selectPassType(passType.value)"
                  >
                    <ion-icon :icon="passType.icon"></ion-icon>
                    <span class="pass-type-name">{{ passType.name }}</span>
                    <span v-if="passType.games" class="pass-type-games">{{ passType.games }}</span>
                  </button>
                </div>
              </div>

              <div v-if="user.passType && user.passType !== 'full-season'" class="form-group">
                <label class="form-label">Games Remaining</label>
                <div class="games-remaining-control">
                  <button class="control-btn" @click="adjustGamesRemaining(-1)">
                    <ion-icon :icon="removeOutline"></ion-icon>
                  </button>
                  <ion-input
                    v-model.number="user.passGamesRemaining"
                    type="number"
                    min="0"
                    class="games-input"
                  ></ion-input>
                  <button class="control-btn" @click="adjustGamesRemaining(1)">
                    <ion-icon :icon="addOutline"></ion-icon>
                  </button>
                </div>
                <div class="pass-meter">
                  <div class="meter-bar">
                    <div class="meter-fill" :style="{ width: passPercentage + '%' }"></div>
                  </div>
                </div>
              </div>

              <div v-if="user.passType === 'full-season'" class="unlimited-status">
                <ion-icon :icon="infiniteOutline"></ion-icon>
                <span>Unlimited Games - Full Season Pass</span>
              </div>

              <div v-if="user.passStartDate" class="pass-date-info">
                <ion-icon :icon="calendarOutline"></ion-icon>
                <span>Pass started {{ formatDate(user.passStartDate) }}</span>
              </div>
            </div>
          </div>

          <!-- Schedule Tab -->
          <div v-show="activeTab === 'schedule'" class="tab-panel">
            <div class="edit-card">
              <div class="card-header">
                <ion-icon :icon="calendarOutline"></ion-icon>
                <h3>Regular Nights</h3>
                <span class="header-badge">{{ cityStore.currentCity?.name }}</span>
              </div>

              <p class="section-description">
                Select which nights this player regularly attends
              </p>

              <div v-if="citySchedules.length > 0" class="schedule-toggles">
                <div
                  v-for="schedule in citySchedules"
                  :key="schedule.id"
                  class="schedule-toggle-item"
                  :class="{ active: cityData.regulars[schedule.id] }"
                  @click="toggleRegular(schedule.id)"
                >
                  <div class="toggle-info">
                    <span class="toggle-day">{{ schedule.dayName }}</span>
                    <span class="toggle-details">
                      {{ formatTime(schedule.time) }} - {{ schedule.venue }}
                    </span>
                  </div>
                  <div class="toggle-switch">
                    <ion-toggle
                      :checked="cityData.regulars[schedule.id] || false"
                      @ionChange="handleToggleChange(schedule.id, $event)"
                    ></ion-toggle>
                  </div>
                </div>
              </div>

              <div v-else class="empty-state">
                <ion-icon :icon="calendarOutline"></ion-icon>
                <p>No schedules available for this city</p>
              </div>
            </div>
          </div>

          <!-- Permissions Tab -->
          <div v-show="activeTab === 'permissions'" class="tab-panel">
            <div class="edit-card permissions-card">
              <div class="card-header">
                <ion-icon :icon="shieldOutline"></ion-icon>
                <h3>Permissions</h3>
              </div>

              <div class="permission-item" v-if="authStore.isSuperAdmin">
                <div class="permission-info">
                  <div class="permission-icon super-admin">
                    <ion-icon :icon="starOutline"></ion-icon>
                  </div>
                  <div class="permission-text">
                    <span class="permission-title">Super Admin</span>
                    <span class="permission-desc">Full access to all cities and features</span>
                  </div>
                </div>
                <ion-toggle
                  :checked="user.isSuperAdmin"
                  @ionChange="user.isSuperAdmin = $event.detail.checked"
                  color="warning"
                ></ion-toggle>
              </div>

              <div class="permission-item">
                <div class="permission-info">
                  <div class="permission-icon city-admin">
                    <ion-icon :icon="shieldCheckmarkOutline"></ion-icon>
                  </div>
                  <div class="permission-text">
                    <span class="permission-title">{{ cityStore.currentCity?.name || 'City' }} Admin</span>
                    <span class="permission-desc">Manage games and players for this city</span>
                  </div>
                </div>
                <ion-toggle
                  :checked="cityData.isAdmin"
                  @ionChange="cityData.isAdmin = $event.detail.checked"
                  color="success"
                ></ion-toggle>
              </div>

              <div class="permission-note">
                <ion-icon :icon="informationCircleOutline"></ion-icon>
                <span>Admin changes take effect immediately after saving</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Save Button (fixed at bottom on mobile) -->
        <div class="save-container">
          <ion-button
            expand="block"
            @click="saveUserChanges"
            :disabled="saving"
            class="save-button"
          >
            <ion-spinner v-if="saving" name="crescent" slot="start"></ion-spinner>
            <ion-icon v-else :icon="checkmarkOutline" slot="start"></ion-icon>
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </ion-button>
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
  IonButtons,
  IonBackButton,
  IonButton,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonIcon,
  IonSpinner,
  toastController,
} from "@ionic/vue";
import {
  checkmarkOutline,
  personOutline,
  trophyOutline,
  ticketOutline,
  calendarOutline,
  shieldOutline,
  shieldCheckmarkOutline,
  locationOutline,
  informationCircleOutline,
  infiniteOutline,
  starOutline,
  addOutline,
  removeOutline,
  closeOutline,
  fitnessOutline,
  handLeftOutline,
} from "ionicons/icons";
import { ref, computed, onMounted, reactive } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAdminStore } from "@/stores/admin";
import { useAuthStore } from "@/stores/auth";
import { useCityStore } from "@/stores/city";
import { useGameStore } from "@/stores/game";

const route = useRoute();
const router = useRouter();
const adminStore = useAdminStore();
const authStore = useAuthStore();
const cityStore = useCityStore();
const gameStore = useGameStore();

const user = ref(null);
const saving = ref(false);
const activeTab = ref("profile");

// City-specific data
const cityData = reactive({
  isAdmin: false,
  regulars: {},
  gamesPlayed: 0,
});

// Skill levels
const skillLevels = [
  { value: 1, name: "Beginner", description: "Basic skating ability but struggles with backward skating and crossovers" },
  { value: 2, name: "Intermediate", description: "A good mix of basic skills, decent knowledge of the game, and athletic ability" },
  { value: 3, name: "Advanced", description: "Advanced skills, strong physical shape, and a high understanding of the game" },
];

// Pass types
const passTypes = [
  { value: null, name: "No Pass", icon: closeOutline, games: null },
  { value: "5-game", name: "5 Game", icon: ticketOutline, games: "5 games" },
  { value: "10-game", name: "10 Game", icon: ticketOutline, games: "10 games" },
  { value: "full-season", name: "Full Season", icon: infiniteOutline, games: "Unlimited" },
];

// Computed
const cityId = computed(() => route.params.cityId);

const userInitials = computed(() => {
  const name = user.value?.name || "";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
});

const positionClass = computed(() => {
  const pos = user.value?.position?.toLowerCase();
  return pos === "goalie" ? "goalie" : pos === "defense" ? "defense" : "forward";
});

const positionIcon = computed(() => {
  const pos = user.value?.position?.toLowerCase();
  if (pos === "goalie") return handLeftOutline;
  if (pos === "defense") return shieldOutline;
  return fitnessOutline;
});

const isUserAdmin = computed(() => {
  return user.value?.isSuperAdmin || cityData.isAdmin;
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

const passPercentage = computed(() => {
  if (!user.value?.passType || user.value.passType === "full-season") return 100;
  const total = user.value.passType === "5-game" ? 5 : 10;
  return Math.min((user.value.passGamesRemaining / total) * 100, 100);
});

// Methods
const getSkillDescription = (level) => {
  const skill = skillLevels.find(s => s.value === level);
  return skill?.description || "Not set";
};

const selectPassType = (passType) => {
  user.value.passType = passType;
  if (passType === "5-game") {
    user.value.passGamesRemaining = 5;
    user.value.passStartDate = new Date().toISOString();
  } else if (passType === "10-game") {
    user.value.passGamesRemaining = 10;
    user.value.passStartDate = new Date().toISOString();
  } else if (passType === "full-season") {
    user.value.passGamesRemaining = 0;
    user.value.passStartDate = new Date().toISOString();
  } else {
    user.value.passGamesRemaining = 0;
    user.value.passStartDate = null;
  }
};

const adjustGamesRemaining = (amount) => {
  const newValue = (user.value.passGamesRemaining || 0) + amount;
  user.value.passGamesRemaining = Math.max(0, newValue);
};

const toggleRegular = (scheduleId) => {
  cityData.regulars[scheduleId] = !cityData.regulars[scheduleId];
};

const handleToggleChange = (scheduleId, event) => {
  cityData.regulars[scheduleId] = event.detail.checked;
};

const formatTime = (time) => {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const saveUserChanges = async () => {
  if (!user.value || saving.value) return;

  saving.value = true;

  const cityDataUpdate = {
    isAdmin: cityData.isAdmin,
    regulars: cityData.regulars,
    gamesPlayed: cityData.gamesPlayed,
  };

  const updates = {
    name: user.value.name,
    email: user.value.email,
    position: user.value.position,
    skillLevel: user.value.skillLevel,
    passType: user.value.passType,
    passGamesRemaining: user.value.passGamesRemaining,
    passStartDate: user.value.passStartDate,
    [`cityData.${cityId.value}`]: cityDataUpdate,
  };

  if (authStore.isSuperAdmin) {
    updates.isSuperAdmin = user.value.isSuperAdmin;
  }

  const result = await adminStore.updateUser(user.value.id, updates);

  const toast = await toastController.create({
    message: result.success ? "Player updated successfully!" : result.error,
    duration: 2000,
    color: result.success ? "success" : "danger",
  });
  await toast.present();

  saving.value = false;
};

// Lifecycle
onMounted(async () => {
  const userId = route.params.userId;

  if (cityId.value) {
    await cityStore.setCurrentCity(cityId.value);
    gameStore.setCurrentCity(cityId.value);
    await gameStore.subscribeToSchedules(cityId.value);
  }

  let foundUser = adminStore.allUsers.find((u) => u.id === userId);

  if (!foundUser) {
    await adminStore.loadAllUsers();
    foundUser = adminStore.allUsers.find((u) => u.id === userId);
  }

  if (foundUser) {
    user.value = {
      ...foundUser,
      isSuperAdmin: foundUser.isSuperAdmin || false,
      passType: foundUser.passType || null,
      passGamesRemaining: foundUser.passGamesRemaining || 0,
      passStartDate: foundUser.passStartDate || null,
    };

    const userCityData = foundUser.cityData?.[cityId.value] || {};
    cityData.isAdmin = userCityData.isAdmin || false;
    cityData.regulars = { ...(userCityData.regulars || {}) };
    cityData.gamesPlayed = userCityData.gamesPlayed || 0;

    // Legacy fallback for Halifax
    if (!foundUser.cityData?.[cityId.value] && cityId.value === "halifax") {
      cityData.isAdmin = foundUser.isAdmin || false;
      cityData.regulars = { ...(foundUser.regulars || {}) };
      cityData.gamesPlayed = foundUser.gamesPlayed || 0;
    }
  } else {
    const toast = await toastController.create({
      message: "User not found",
      duration: 2000,
      color: "danger",
    });
    await toast.present();
    router.push(`/${cityId.value}/admin`);
  }
});
</script>

<style scoped>
/* ========================================
   Edit User Page - Apple-Inspired Light Theme
   ======================================== */

.edit-page {
  min-height: 100%;
  background: var(--bg-secondary);
  padding-bottom: 100px;
}

/* ========================================
   Hero Section
   ======================================== */

.edit-hero {
  background: var(--bg-primary);
  padding: var(--space-xl) var(--space-md) var(--space-lg);
  text-align: center;
  border-bottom: 1px solid var(--separator-color);
}

.hero-content {
  position: relative;
}

.avatar {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-full);
  background: linear-gradient(180deg, #007aff 0%, #0056b3 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--space-md);
  position: relative;
  box-shadow: var(--shadow-sm);
}

.avatar.admin {
  background: linear-gradient(180deg, #ff9500 0%, #ff7b00 100%);
}

.avatar-initials {
  font-size: 24px;
  font-weight: 700;
  color: white;
}

.position-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--bg-primary);
  box-shadow: var(--shadow-xs);
}

.position-badge ion-icon {
  font-size: 12px;
  color: white;
}

.position-badge.forward {
  background: linear-gradient(180deg, #34c759 0%, #28a745 100%);
}

.position-badge.defense {
  background: linear-gradient(180deg, #007aff 0%, #0056b3 100%);
}

.position-badge.goalie {
  background: linear-gradient(180deg, #af52de 0%, #9a40c9 100%);
}

.admin-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-full);
  background: linear-gradient(180deg, #ff9500 0%, #ff7b00 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--bg-primary);
}

.admin-badge ion-icon {
  font-size: 10px;
  color: white;
}

.user-name {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 2px;
  letter-spacing: -0.02em;
}

.user-email {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 0 0 var(--space-sm);
}

.city-context {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--fill-tertiary);
  border-radius: var(--radius-full);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.city-context ion-icon {
  font-size: 14px;
  color: var(--accent-color);
}

/* ========================================
   Tabs - Apple Segment Style
   ======================================== */

.tabs-container {
  padding: var(--space-md);
  background: var(--bg-secondary);
  position: sticky;
  top: 0;
  z-index: 10;
}

ion-segment {
  --background: var(--fill-tertiary);
  border-radius: var(--radius-sm);
  padding: 2px;
}

ion-segment-button {
  --color: var(--text-secondary);
  --color-checked: var(--text-primary);
  --indicator-color: transparent;
  --border-radius: 6px;
  min-height: 32px;
  font-size: 13px;
  font-weight: 500;
  text-transform: none;
}

ion-segment-button::part(indicator-background) {
  background: var(--card-bg);
  box-shadow: var(--shadow-xs);
}

/* ========================================
   Tab Content
   ======================================== */

.tab-content {
  padding: 0 var(--space-md) var(--space-xl);
}

.tab-panel {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ========================================
   Section Grid
   ======================================== */

.section-grid {
  display: grid;
  gap: var(--space-md);
}

/* ========================================
   Edit Card
   ======================================== */

.edit-card {
  background: var(--card-bg);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  box-shadow: var(--shadow-sm);
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--separator-color);
}

.card-header ion-icon {
  font-size: 20px;
  color: var(--accent-color);
}

.card-header h3 {
  font-size: 17px;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
  flex: 1;
}

.header-badge {
  font-size: 11px;
  padding: 3px 8px;
  background: var(--accent-color-light);
  color: var(--accent-color);
  border-radius: var(--radius-sm);
  font-weight: 500;
}

.section-description {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 0 0 var(--space-md);
}

/* ========================================
   Form Elements
   ======================================== */

.form-group {
  margin-bottom: var(--space-md);
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 6px;
  font-weight: 500;
}

.form-input {
  --background: var(--bg-secondary);
  --color: var(--text-primary);
  --padding-start: 12px;
  --padding-end: 12px;
  --border-radius: var(--radius-sm);
  border: 1px solid var(--separator-color);
  transition: border-color var(--transition-fast);
}

.form-input:focus-within {
  border-color: var(--accent-color);
}

.form-select {
  --background: var(--bg-secondary);
  --color: var(--text-primary);
  --padding-start: 12px;
  --padding-end: 12px;
  border-radius: var(--radius-sm);
  width: 100%;
  border: 1px solid var(--separator-color);
}

/* ========================================
   Skill Selector
   ======================================== */

.skill-selector {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.skill-option {
  background: var(--bg-secondary);
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  padding: var(--space-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.skill-option:hover {
  background: var(--bg-tertiary);
}

.skill-option:active {
  transform: scale(0.97);
}

.skill-option.active {
  border-color: var(--accent-color);
  background: var(--accent-color-light);
}

.level-number {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.level-name {
  font-size: 11px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  font-weight: 500;
}

.skill-option.active .level-number { color: var(--accent-color); }
.skill-option.active .level-name { color: var(--accent-color); }

.skill-description {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

/* ========================================
   Pass Type Selector
   ======================================== */

.pass-type-selector {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-sm);
}

.pass-type-option {
  background: var(--bg-secondary);
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  padding: var(--space-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.pass-type-option:hover {
  background: var(--bg-tertiary);
}

.pass-type-option:active {
  transform: scale(0.97);
}

.pass-type-option.active {
  border-color: var(--accent-color);
  background: var(--accent-color-light);
}

.pass-type-option ion-icon {
  font-size: 24px;
  color: var(--text-tertiary);
}

.pass-type-option.active ion-icon {
  color: var(--accent-color);
}

.pass-type-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.pass-type-games {
  font-size: 12px;
  color: var(--text-tertiary);
}

/* ========================================
   Games Remaining Control
   ======================================== */

.games-remaining-control {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-sm);
}

.control-btn {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  background: var(--card-bg);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-color);
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-xs);
}

.control-btn:hover {
  background: var(--bg-tertiary);
}

.control-btn:active {
  transform: scale(0.92);
}

.control-btn ion-icon {
  font-size: 20px;
}

.games-input {
  flex: 1;
  text-align: center;
  --background: transparent;
  --color: var(--text-primary);
  font-size: 24px;
  font-weight: 700;
}

.pass-meter {
  margin-top: var(--space-sm);
}

.meter-bar {
  height: 6px;
  background: var(--fill-tertiary);
  border-radius: 3px;
  overflow: hidden;
}

.meter-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-color), #5aa5ff);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.unlimited-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: rgba(52, 199, 89, 0.1);
  border-radius: var(--radius-md);
  color: var(--color-success);
  font-weight: 600;
  font-size: 15px;
  margin-top: var(--space-md);
}

.unlimited-status ion-icon {
  font-size: 22px;
}

.pass-date-info {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-top: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  background: var(--fill-tertiary);
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--text-secondary);
}

/* ========================================
   Schedule Toggles
   ======================================== */

.schedule-toggles {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.schedule-toggle-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border-left: 4px solid var(--text-quaternary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.schedule-toggle-item.active {
  border-left-color: var(--color-success);
  background: rgba(52, 199, 89, 0.08);
}

.toggle-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toggle-day {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
}

.toggle-details {
  font-size: 14px;
  color: var(--text-secondary);
}

/* ========================================
   Permissions
   ======================================== */

.permissions-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.permission-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.permission-info {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.permission-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.permission-icon ion-icon {
  font-size: 20px;
  color: white;
}

.permission-icon.super-admin {
  background: linear-gradient(180deg, #ff9500 0%, #ff7b00 100%);
}

.permission-icon.city-admin {
  background: linear-gradient(180deg, #34c759 0%, #28a745 100%);
}

.permission-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.permission-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
}

.permission-desc {
  font-size: 14px;
  color: var(--text-secondary);
}

.permission-note {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--fill-tertiary);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--text-tertiary);
  margin-top: var(--space-xs);
}

/* ========================================
   Empty State
   ======================================== */

.empty-state {
  text-align: center;
  padding: var(--space-xl) var(--space-md);
  color: var(--text-tertiary);
}

.empty-state ion-icon {
  font-size: 48px;
  margin-bottom: var(--space-sm);
  color: var(--text-quaternary);
}

.empty-state p {
  font-size: 15px;
  margin: 0;
  color: var(--text-secondary);
}

/* ========================================
   Save Container
   ======================================== */

.save-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--space-md);
  background: linear-gradient(to top, var(--bg-secondary) 80%, transparent);
  z-index: 100;
}

.save-button {
  --background: var(--accent-color);
  --background-hover: var(--accent-color-hover);
  --border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 17px;
}

/* ========================================
   Loading State
   ======================================== */

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
}

/* ========================================
   Responsive
   ======================================== */

@media (min-width: 768px) {
  .edit-hero {
    padding: var(--space-xl) var(--space-lg);
  }

  .avatar {
    width: 88px;
    height: 88px;
  }

  .avatar-initials {
    font-size: 28px;
  }

  .user-name {
    font-size: 28px;
  }

  .tabs-container {
    max-width: 600px;
    margin: 0 auto;
    padding: var(--space-lg) var(--space-md);
  }

  .tab-content {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 var(--space-lg) var(--space-xl);
  }

  .section-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .save-container {
    max-width: 400px;
    left: 50%;
    transform: translateX(-50%);
  }

  .pass-type-selector {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 1024px) {
  .tab-content {
    max-width: 1000px;
  }

  .section-grid {
    gap: var(--space-lg);
  }
}
</style>
