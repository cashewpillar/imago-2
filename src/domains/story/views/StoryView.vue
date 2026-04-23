<template>
  <div class="story">
    <div class="story__app">
      <div class="story__top">
        <RouterLink to="/" class="story__back">← imago</RouterLink>
        <h1>library</h1>
      </div>

      <div class="story__grid">
        <section class="story__panel">
          <h2 class="story__label">add a book</h2>
          <BookComposer @submit="handleBookSubmit" />
        </section>

        <section class="story__panel">
          <h2 class="story__label">library</h2>
          <BookList :books="books" :selected-id="selectedBookId" @select="selectedBookId = $event" />
        </section>

        <section class="story__panel story__panel--wide">
          <template v-if="selectedBook">
            <div class="story__book-header">
              <div>
                <h2 class="story__book-title">{{ selectedBook.title }}</h2>
                <p class="story__book-author">{{ selectedBook.author }}</p>
              </div>
              <BaseButton variant="ghost" @click="removeBook(selectedBook.id)">remove</BaseButton>
            </div>
            <NoteComposer :stances="stanceOptions" @submit="handleNoteSubmit" />
          </template>
          <EmptyState
            v-else
            title="no book selected"
            copy="pick a book from the library or add one to start collecting notes."
          />
        </section>

        <section class="story__panel story__panel--wide">
          <template v-if="selectedBook">
            <NoteList v-if="selectedBook.notes.length" :notes="selectedBook.notes" :stances="stanceOptions" />
            <EmptyState
              v-else
              title="no highlights yet"
              copy="capture a line and a reflection to start filling this notebook."
            />
          </template>
          <EmptyState
            v-else
            title="your notes will show up here"
            copy="this keeps the reading flow close to the original single-page library feel."
          />
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router';
import BaseButton from '../../../shared/components/BaseButton.vue';
import EmptyState from '../../../shared/components/EmptyState.vue';
import { useStoryLibrary } from '../useStoryLibrary';
import { stanceOptions } from '../story.types';
import BookComposer from '../components/BookComposer.vue';
import BookList from '../components/BookList.vue';
import NoteComposer from '../components/NoteComposer.vue';
import NoteList from '../components/NoteList.vue';

const { books, selectedBookId, selectedBook, addBook, removeBook, addNote } = useStoryLibrary();

function handleBookSubmit(draft) {
  addBook(draft);
  draft.title = '';
  draft.author = '';
}

function handleNoteSubmit(draft) {
  addNote(draft);
  draft.quote = '';
  draft.reflection = '';
  draft.tags = '';
  draft.stance = 'yes';
}
</script>

<style scoped>
.story {
  min-height: 100vh;
  background: #f7f6f2;
  color: #1a1a18;
}

.story__app {
  max-width: 980px;
  margin: 0 auto;
  padding: 1.5rem 1rem 5rem;
}

.story__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 1.75rem;
}

.story__top h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 400;
  font-family: Georgia, "Times New Roman", serif;
}

.story__back {
  text-decoration: none;
  color: #6b6b67;
  font-size: 14px;
}

.story__grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 12px;
  align-items: start;
}

.story__panel {
  background: #ffffff;
  border: 0.5px solid rgba(0, 0, 0, 0.09);
  border-radius: 12px;
  padding: 1rem 1.25rem;
}

.story__panel--wide {
  grid-column: 2;
}

.story__label {
  margin: 0 0 12px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #a0a09b;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.story__book-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 12px;
  margin-bottom: 1rem;
}

.story__book-title {
  margin: 0;
  font-size: 24px;
  font-weight: 400;
  font-family: Georgia, "Times New Roman", serif;
}

.story__book-author {
  margin: 4px 0 0;
  color: #6b6b67;
  font-size: 13px;
}

.story :deep(.button--ghost) {
  border: none;
  padding: 6px 4px;
  color: #7f77dd;
  background: transparent;
  text-transform: lowercase;
}

.story :deep(.empty) {
  border: none;
  padding: 2rem 1rem;
  background: transparent;
}

.story :deep(.empty__title) {
  font-family: Georgia, "Times New Roman", serif;
  font-weight: 400;
}

@media (max-width: 820px) {
  .story__grid {
    grid-template-columns: 1fr;
  }

  .story__panel--wide {
    grid-column: auto;
  }
}
</style>
