export type ApiKeys = {
  grokKey: string;
  googleBooksKey: string;
  geminiKey: string;
};

export type Book = {
  id: string;
  title: string;
  author: string;
  genre: string[];
  themes: string[];
  description: string;
  thumbnail: string;
  pageCount: number;
  status: "read" | "interested";
  rating: number | null;
  note: string | null;
  addedVia: "text" | "scan";
  dateAdded: string;
};

const API_KEYS_KEY = "bookmatch-api-keys";
const BOOKS_KEY = "bookmatch-books";

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function saveApiKeys(keys: ApiKeys): boolean {
  try {
    return safeSetItem(API_KEYS_KEY, JSON.stringify(keys));
  } catch {
    return false;
  }
}

export function getApiKeys(): ApiKeys | null {
  try {
    const raw = safeGetItem(API_KEYS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ApiKeys;
  } catch {
    return null;
  }
}

export function hasApiKeys(): boolean {
  try {
    const keys = getApiKeys();
    return (
      keys !== null &&
      !!keys.grokKey &&
      !!keys.googleBooksKey &&
      !!keys.geminiKey
    );
  } catch {
    return false;
  }
}

export function getBooks(): Book[] {
  try {
    const raw = safeGetItem(BOOKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Book[]) : [];
  } catch {
    return [];
  }
}

export function saveBooks(books: Book[]): boolean {
  try {
    return safeSetItem(BOOKS_KEY, JSON.stringify(books));
  } catch {
    return false;
  }
}

export function addBook(book: Book): boolean {
  try {
    return saveBooks([...getBooks(), book]);
  } catch {
    return false;
  }
}

export function updateBook(id: string, updates: Partial<Book>): boolean {
  try {
    return saveBooks(
      getBooks().map((book) =>
        book.id === id ? { ...book, ...updates } : book
      )
    );
  } catch {
    return false;
  }
}
