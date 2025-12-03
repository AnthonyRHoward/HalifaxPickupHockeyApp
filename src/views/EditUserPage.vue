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

  if (result.success) {
    router.push(`/${cityId.value}/admin`);
  }
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
.edit-page {
  min-height: 100%;
  background: var(--ion-background-color);
  padding-bottom: 100px;
}

/* Hero Section */
.edit-hero {
  background: linear-gradient(135deg, #2d4a2d 0%, #1a2e1a 100%);
  padding: 2rem 1rem 1.5rem;
  text-align: center;
}

.hero-content {
  position: relative;
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

.avatar.admin {
  border-color: #ffc409;
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
  border: 2px solid #1a2e1a;
}

.position-badge ion-icon {
  font-size: 14px;
  color: white;
}

.position-badge.forward { background: #3880ff; }
.position-badge.defense { background: #2dd36f; }
.position-badge.goalie { background: #ffc409; }

.admin-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #ffc409;
  display: flex;
  align-items: center;
  justify-content: center;
}

.admin-badge ion-icon {
  font-size: 14px;
  color: #1a2e1a;
}

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

.city-context {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 20px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.9);
}

.city-context ion-icon {
  font-size: 1rem;
}

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
  --indicator-color: #2d4a2d;
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

/* Edit Card */
.edit-card {
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
  color: #2d4a2d;
}

.card-header h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: white;
  flex: 1;
}

.header-badge {
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  background: rgba(45, 74, 45, 0.3);
  color: #7ec87e;
  border-radius: 4px;
}

.section-description {
  font-size: 0.85rem;
  color: #92949c;
  margin: 0 0 1rem;
}

/* Form Elements */
.form-group {
  margin-bottom: 1rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 0.85rem;
  color: #92949c;
  margin-bottom: 0.5rem;
}

.form-input {
  --background: #3d3d3d;
  --color: white;
  --padding-start: 1rem;
  --padding-end: 1rem;
  --border-radius: 8px;
  border: 1px solid transparent;
  transition: border-color 0.2s;
}

.form-input:focus-within {
  border-color: #2d4a2d;
}

.form-select {
  --background: #3d3d3d;
  --color: white;
  --padding-start: 1rem;
  --padding-end: 1rem;
  border-radius: 8px;
  width: 100%;
}

/* Skill Selector */
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
  border-color: #2d4a2d;
  background: rgba(45, 74, 45, 0.2);
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

.skill-option.active .level-number { color: #7ec87e; }
.skill-option.active .level-name { color: #7ec87e; }

.skill-description {
  font-size: 0.85rem;
  color: #92949c;
  margin: 0;
  line-height: 1.4;
}

/* Pass Type Selector */
.pass-type-selector {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.pass-type-option {
  background: #3d3d3d;
  border: 2px solid transparent;
  border-radius: 10px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.pass-type-option:hover {
  background: #4d4d4d;
}

.pass-type-option.active {
  border-color: #3880ff;
  background: rgba(56, 128, 255, 0.1);
}

.pass-type-option ion-icon {
  font-size: 1.5rem;
  color: #92949c;
}

.pass-type-option.active ion-icon {
  color: #3880ff;
}

.pass-type-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: white;
}

.pass-type-games {
  font-size: 0.7rem;
  color: #92949c;
}

/* Games Remaining Control */
.games-remaining-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #3d3d3d;
  border-radius: 8px;
  padding: 0.5rem;
}

.control-btn {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #4d4d4d;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: background 0.2s;
}

.control-btn:hover {
  background: #5d5d5d;
}

.control-btn ion-icon {
  font-size: 1.25rem;
}

.games-input {
  flex: 1;
  text-align: center;
  --background: transparent;
  --color: white;
  font-size: 1.5rem;
  font-weight: 700;
}

.pass-meter {
  margin-top: 0.75rem;
}

.meter-bar {
  height: 6px;
  background: #4d4d4d;
  border-radius: 3px;
  overflow: hidden;
}

.meter-fill {
  height: 100%;
  background: linear-gradient(90deg, #3880ff, #5a9dff);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.unlimited-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(45, 211, 111, 0.1);
  border-radius: 8px;
  color: #2dd36f;
  font-weight: 600;
  margin-top: 1rem;
}

.unlimited-status ion-icon {
  font-size: 1.5rem;
}

.pass-date-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  font-size: 0.85rem;
  color: #92949c;
}

/* Schedule Toggles */
.schedule-toggles {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.schedule-toggle-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: #3d3d3d;
  border-radius: 10px;
  border-left: 3px solid #92949c;
  cursor: pointer;
  transition: all 0.2s ease;
}

.schedule-toggle-item.active {
  border-left-color: #2dd36f;
  background: rgba(45, 211, 111, 0.1);
}

.toggle-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.toggle-day {
  font-size: 0.95rem;
  font-weight: 600;
  color: white;
}

.toggle-details {
  font-size: 0.8rem;
  color: #92949c;
}

/* Permissions */
.permissions-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.permission-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: #3d3d3d;
  border-radius: 10px;
}

.permission-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.permission-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.permission-icon ion-icon {
  font-size: 1.25rem;
  color: white;
}

.permission-icon.super-admin {
  background: linear-gradient(135deg, #ffc409, #e0a800);
}

.permission-icon.city-admin {
  background: linear-gradient(135deg, #2dd36f, #28ba62);
}

.permission-text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.permission-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: white;
}

.permission-desc {
  font-size: 0.8rem;
  color: #92949c;
}

.permission-note {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  font-size: 0.8rem;
  color: #92949c;
  margin-top: 0.5rem;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: #92949c;
}

.empty-state ion-icon {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
  opacity: 0.5;
}

.empty-state p {
  font-size: 0.9rem;
  margin: 0;
}

/* Save Container */
.save-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  background: linear-gradient(to top, var(--ion-background-color) 80%, transparent);
  z-index: 100;
}

.save-button {
  --background: #2d4a2d;
  --background-hover: #3d5a3d;
  font-weight: 600;
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
  .edit-hero {
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
    gap: 1.5rem;
  }
}
</style>
