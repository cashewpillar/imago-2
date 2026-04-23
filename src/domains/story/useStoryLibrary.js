import { computed, ref, watch } from 'vue';
import { loadJson, saveJson } from '../../shared/lib/storage';

const STORAGE_KEY = 'imago.story.vue';

function createSeed() {
  return [
    {
      id: crypto.randomUUID(),
      title: 'Bluets',
      author: 'Maggie Nelson',
      createdAt: Date.now() - 86400000,
      notes: [
        {
          id: crypto.randomUUID(),
          quote: 'I have been trying to write a book about blue.',
          reflection: 'Opening lines that feel like a confession always land harder.',
          stance: 'yes',
          tags: ['voice', 'opening'],
          createdAt: Date.now() - 3600000,
        },
      ],
    },
  ];
}

export function useStoryLibrary() {
  const books = ref(loadJson(STORAGE_KEY, createSeed()));
  const selectedBookId = ref(books.value[0]?.id ?? null);

  watch(
    books,
    (value) => {
      saveJson(STORAGE_KEY, value);
    },
    { deep: true }
  );

  const selectedBook = computed(
    () => books.value.find((book) => book.id === selectedBookId.value) ?? null
  );

  function addBook(payload) {
    const book = {
      id: crypto.randomUUID(),
      title: payload.title.trim(),
      author: payload.author.trim(),
      createdAt: Date.now(),
      notes: [],
    };
    books.value.unshift(book);
    selectedBookId.value = book.id;
  }

  function removeBook(id) {
    books.value = books.value.filter((book) => book.id !== id);
    selectedBookId.value = books.value[0]?.id ?? null;
  }

  function addNote(payload) {
    if (!selectedBook.value) {
      return;
    }

    selectedBook.value.notes.unshift({
      id: crypto.randomUUID(),
      quote: payload.quote.trim(),
      reflection: payload.reflection.trim(),
      stance: payload.stance,
      tags: payload.tags
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
      createdAt: Date.now(),
    });
  }

  return {
    books,
    selectedBookId,
    selectedBook,
    addBook,
    removeBook,
    addNote,
  };
}
