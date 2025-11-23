<template>
  <div class="team-roster">
    <div class="team-section">
      <h3 class="team-title dark-team">Dark Team</h3>
      <ion-list>
        <ion-item>
          <ion-label>
            <p v-if="darkTeam.goalie">
              <span class="position-label">Goalie:</span> {{ darkTeam.goalie.name }} (Skill: {{ darkTeam.goalie.skillLevel || 3 }})
            </p>
            <p v-else><span class="position-label">Goalie:</span> <span class="empty-slot">-</span></p>
          </ion-label>
        </ion-item>

        <ion-item v-for="(forward, index) in 3" :key="'dark-f-' + index">
          <ion-label>
            <p v-if="darkTeam.forwards[index]">
              <span class="position-label">F:</span> {{ darkTeam.forwards[index].name }} (Skill: {{ darkTeam.forwards[index].skillLevel || 3 }})
            </p>
            <p v-else><span class="position-label">F:</span> <span class="empty-slot">-</span></p>
          </ion-label>
        </ion-item>

        <ion-item v-for="(defense, index) in 2" :key="'dark-d-' + index">
          <ion-label>
            <p v-if="darkTeam.defense[index]">
              <span class="position-label">D:</span> {{ darkTeam.defense[index].name }} (Skill: {{ darkTeam.defense[index].skillLevel || 3 }})
            </p>
            <p v-else><span class="position-label">D:</span> <span class="empty-slot">-</span></p>
          </ion-label>
        </ion-item>
      </ion-list>
      <div class="team-stats">
        <ion-badge color="dark">
          Avg Skill: {{ calculateAvgSkill(darkTeam).toFixed(1) }}
        </ion-badge>
      </div>
    </div>

    <div class="team-section">
      <h3 class="team-title light-team">Light Team</h3>
      <ion-list>
        <ion-item>
          <ion-label>
            <p v-if="lightTeam.goalie">
              <span class="position-label">Goalie:</span> {{ lightTeam.goalie.name }} (Skill: {{ lightTeam.goalie.skillLevel || 3 }})
            </p>
            <p v-else><span class="position-label">Goalie:</span> <span class="empty-slot">-</span></p>
          </ion-label>
        </ion-item>

        <ion-item v-for="(forward, index) in 3" :key="'light-f-' + index">
          <ion-label>
            <p v-if="lightTeam.forwards[index]">
              <span class="position-label">F:</span> {{ lightTeam.forwards[index].name }} (Skill: {{ lightTeam.forwards[index].skillLevel || 3 }})
            </p>
            <p v-else><span class="position-label">F:</span> <span class="empty-slot">-</span></p>
          </ion-label>
        </ion-item>

        <ion-item v-for="(defense, index) in 2" :key="'light-d-' + index">
          <ion-label>
            <p v-if="lightTeam.defense[index]">
              <span class="position-label">D:</span> {{ lightTeam.defense[index].name }} (Skill: {{ lightTeam.defense[index].skillLevel || 3 }})
            </p>
            <p v-else><span class="position-label">D:</span> <span class="empty-slot">-</span></p>
          </ion-label>
        </ion-item>
      </ion-list>
      <div class="team-stats">
        <ion-badge color="dark">
          Avg Skill: {{ calculateAvgSkill(lightTeam).toFixed(1) }}
        </ion-badge>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  IonList,
  IonItem,
  IonLabel,
  IonBadge
} from '@ionic/vue'

const props = defineProps({
  darkTeam: {
    type: Object,
    required: true,
    default: () => ({ goalie: null, forwards: [], defense: [] })
  },
  lightTeam: {
    type: Object,
    required: true,
    default: () => ({ goalie: null, forwards: [], defense: [] })
  }
})

const calculateAvgSkill = (team) => {
  const players = [
    team.goalie,
    ...team.forwards,
    ...team.defense
  ].filter(p => p !== null && p !== undefined)

  if (players.length === 0) return 0

  const totalSkill = players.reduce((sum, player) => sum + (player.skillLevel || 3), 0)
  return totalSkill / players.length
}
</script>

<style scoped>
.team-roster {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.team-section {
  width: 100%;
}

.team-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  padding: 0.5rem 0;
}

.dark-team {
  color: var(--ion-color-dark);
  border-bottom: 3px solid var(--ion-color-dark);
}

.light-team {
  color: #ffffff;
  border-bottom: 3px solid #ffffff;
}

.team-section ion-list {
  background: var(--ion-card-background, #fff);
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.empty-slot {
  color: var(--ion-color-medium);
  font-style: italic;
}

.team-stats {
  text-align: center;
  padding: 0.5rem;
}

.position-label {
  font-weight: 600;
  color: var(--ion-color-primary);
  margin-right: 0.25rem;
}

ion-label p {
  color: #ffffff;
}

/* Tablet and larger screens - display teams side by side */
@media (min-width: 768px) {
  .team-roster {
    flex-direction: row;
    gap: 1.5rem;
  }

  .team-section {
    flex: 1;
  }
}
</style>
