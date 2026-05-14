<script setup>
import { inject, ref } from 'vue';
import AfterlightShell from '../components/AfterlightShell.vue';
import AfterlightEntryForm from '../components/AfterlightEntryForm.vue';
import { createAfterlightEntry } from '../services/afterlightDb';
import { formatHeaderDate } from '../services/afterlightAnalytics';

const { showToast } = inject('appShell');

const formRef = ref(null);
const saving = ref(false);
const status = ref({ message: '', type: 'ok' });

async function submit(formData) {
  if (saving.value) return;
  saving.value = true;
  status.value = { message: '', type: 'ok' };

  try {
    await createAfterlightEntry(formData);
    formRef.value?.reset();
    status.value = { message: 'logged. awareness +1.', type: 'ok' };
    showToast('Afterlight entry saved', 'success');
  } catch (error) {
    status.value = { message: error.message || 'Could not save the entry.', type: 'err' };
    showToast(error.message || 'Save failed', 'error');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <AfterlightShell title="track" :meta="formatHeaderDate()">
    <div class="al-divider" />
    <AfterlightEntryForm
      ref="formRef"
      :saving="saving"
      @submit="submit"
    />
    <section v-if="status.message" class="al-section">
      <div class="al-status" :class="status.type">
        {{ status.message }}
      </div>
    </section>
  </AfterlightShell>
</template>

<style scoped>
@import '../styles/afterlight.css';
</style>
