<template>
  <ion-app>
    <ion-menu content-id="main-content" type="overlay">
      <ion-header>
        <ion-toolbar>
          <ion-title>Menu</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content class="menu-content">
        <div class="menu-top">
          <ion-list>
            <ion-item button @click="navigateTo('/')" lines="none">
              <ion-icon slot="start" name="home-outline"></ion-icon>
              <ion-label>Home</ion-label>
            </ion-item>

            <ion-item button @click="navigateTo('/about')" lines="none">
              <ion-icon slot="start" name="information-circle-outline"></ion-icon>
              <ion-label>About</ion-label>
            </ion-item>

            <ion-item v-if="authStore.isAdmin" button @click="navigateTo('/admin')" lines="none">
              <ion-icon slot="start" name="settings"></ion-icon>
              <ion-label>Admin</ion-label>
            </ion-item>

            <ion-item v-if="!authStore.isAuthenticated" button @click="navigateTo('/login')" lines="none">
              <ion-icon slot="start" name="log-in-outline"></ion-icon>
              <ion-label>Login</ion-label>
            </ion-item>

            <ion-item v-else button @click="navigateTo('/profile')" lines="none">
              <ion-icon slot="start" name="person-outline"></ion-icon>
              <ion-label>Profile</ion-label>
            </ion-item>
          </ion-list>
        </div>

        <div v-if="authStore.isAuthenticated" class="menu-bottom">
          <ion-list>
            <ion-item button @click="handleLogout" lines="none" color="danger">
              <ion-icon slot="start" name="log-out-outline"></ion-icon>
              <ion-label>Logout</ion-label>
            </ion-item>
          </ion-list>
        </div>
      </ion-content>
    </ion-menu>

    <ion-router-outlet id="main-content" />
  </ion-app>
</template>

<script setup>
import {
  IonApp,
  IonRouterOutlet,
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  toastController,
  menuController
} from '@ionic/vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const navigateTo = async (path) => {
  await menuController.close()
  router.push(path)
}

const handleLogout = async () => {
  await menuController.close()
  const result = await authStore.logout()

  const toast = await toastController.create({
    message: result.success ? 'Logged out successfully!' : 'Logout failed',
    duration: 2000,
    color: result.success ? 'success' : 'danger'
  })
  await toast.present()

  if (result.success) {
    router.push('/')
  }
}
</script>

<style>
body {
  --ion-background-color: #1a1a1a;
  --ion-text-color: #ffffff;
}

/* Global header/toolbar styling */
ion-header ion-toolbar {
  --background: #4f001e;
  --color: white;
}

ion-header ion-title {
  color: white;
}

ion-header ion-button {
  --color: white;
}

ion-header ion-back-button {
  --color: white;
}

ion-item ion-textarea {
  padding-top: 20px !important;
}

ion-item ion-input {
  --padding-top: 20px;
  margin-top: 20px !important;
}

ion-item ion-select {
  margin-top: 8px !important;
}

ion-item {
  --padding-top: 8px;
  --padding-bottom: 8px;
  --inner-padding-top: 8px;
  --inner-padding-bottom: 8px;
  margin-top: 8px;
  margin-bottom: 8px;
  min-height: 56px;
}

ion-card {
  --background: #2d2d2d;
  --color: #ffffff;
}

a {
  color: #66b3ff;
}

.toast-success {
  --background: #2dd36f;
}

.toast-danger {
  --background: #eb445a;
}

.toast-warning {
  --background: #ffc409;
}

ion-menu .menu-content {
  --padding-top: 0;
  --padding-bottom: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

ion-menu .menu-top {
  flex: 1;
  overflow-y: auto;
}

ion-menu .menu-bottom {
  margin-top: auto;
  border-top: 1px solid var(--ion-color-light);
  padding-top: 0.5rem;
}

ion-menu ion-list {
  padding: 1rem 0;
}

ion-menu ion-item {
  --padding-start: 1rem;
  --inner-padding-end: 1rem;
  margin: 0.25rem 0;
  font-size: 1.1rem;
}

ion-menu ion-icon {
  font-size: 1.5rem;
  margin-right: 0.5rem;
}

ion-menu-button {
  color: white !important;
  --color: white !important;
}
</style>
