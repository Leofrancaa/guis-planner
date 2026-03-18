import { create } from 'zustand';
import { Subject, Event, Note, StudentSubject, Scope } from '@/types';
import { fetchApi } from '@/lib/api';
import { useToastStore } from './toastStore';

const toast = () => useToastStore.getState().addToast;

interface StoreState {
  subjects: Subject[];
  events: Event[];
  notes: Note[];
  loading: boolean;
  error: string | null;

  // Global Loader
  fetchAll: () => Promise<void>;

  // Subjects
  fetchSubjects: () => Promise<void>;
  addSubject: (subject: { name: string; professor: string; color: string; hours?: number; credits?: number; scope?: Scope; classGroupId?: string }) => Promise<void>;
  updateSubject: (id: string, subject: Partial<Subject> & { credits?: number }) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  updateSubjectTracking: (id: string, tracking: Partial<StudentSubject>) => Promise<void>;

  // Events
  fetchEvents: () => Promise<void>;
  addEvent: (event: { title: string; date: string; type: Event['type']; subjectId?: string; scope?: Scope; gradeLabel?: string }) => Promise<void>;
  toggleEventCompletion: (id: string) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;

  // Notes
  fetchNotes: () => Promise<void>;
  addNote: (note: { title: string; content: string; subjectId: string }) => Promise<void>;
  updateNote: (id: string, note: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  subjects: [],
  events: [],
  notes: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const [subjects, events, notes] = await Promise.all([
        fetchApi('/subjects'),
        fetchApi('/events'),
        fetchApi('/notes')
      ]);
      set({ subjects, events, notes, loading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      set({ error: message, loading: false });
    }
  },

  fetchSubjects: async () => {
    try {
      const subjects = await fetchApi('/subjects');
      set({ subjects });
    } catch (err) { console.error(err); }
  },

  addSubject: async (subject) => {
    try {
      const payload: Record<string, unknown> = {
        name: subject.name,
        professor: subject.professor,
        color: subject.color,
        hours: subject.hours || subject.credits || 60,
        scope: subject.scope || 'INDIVIDUAL',
      };
      if (subject.classGroupId) payload.classGroupId = subject.classGroupId;
      const newSubject = await fetchApi('/subjects', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      set((state) => ({ subjects: [...state.subjects, newSubject] }));
      toast()('Matéria criada com sucesso!', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao criar matéria';
      toast()(message, 'error');
      console.error(err);
    }
  },

  updateSubject: async (id, subject) => {
    try {
      const payload = {
        name: subject.name,
        professor: subject.professor,
        color: subject.color,
        hours: subject.hours || subject.credits || 60,
      };
      const updated = await fetchApi(`/subjects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      set((state) => ({
        subjects: state.subjects.map(s => s.id === id ? { ...s, ...updated } : s)
      }));
      toast()('Matéria atualizada!', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar matéria';
      toast()(message, 'error');
      console.error(err);
    }
  },

  deleteSubject: async (id) => {
    try {
      await fetchApi(`/subjects/${id}`, { method: 'DELETE' });
      set((state) => ({ subjects: state.subjects.filter(s => s.id !== id) }));
      toast()('Matéria removida', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao remover matéria';
      toast()(message, 'error');
      console.error(err);
    }
  },

  updateSubjectTracking: async (id, tracking) => {
    try {
      const updated = await fetchApi(`/subjects/${id}/tracking`, {
        method: 'PUT',
        body: JSON.stringify(tracking)
      });
      set((state) => ({
        subjects: state.subjects.map(s => {
          if (s.id === id) {
            return { ...s, studentSubjects: [updated] };
          }
          return s;
        })
      }));
      toast()('Notas salvas!', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar notas';
      toast()(message, 'error');
      console.error(err);
    }
  },

  fetchEvents: async () => {
    try {
      const events = await fetchApi('/events');
      set({ events });
    } catch (err) { console.error(err); }
  },

  addEvent: async (event) => {
    try {
      const payload: Record<string, unknown> = {
        title: event.title,
        date: event.date,
        type: event.type,
        subjectId: event.subjectId,
        scope: event.scope || 'INDIVIDUAL',
      };
      if (event.gradeLabel) payload.gradeLabel = event.gradeLabel;
      const newEvent = await fetchApi('/events', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      set((state) => ({ events: [...state.events, newEvent] }));
      toast()('Evento criado!', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao criar evento';
      toast()(message, 'error');
      console.error(err);
    }
  },

  toggleEventCompletion: async (id) => {
    const event = get().events.find(e => e.id === id);
    if (!event) return;
    try {
      const updated = await fetchApi(`/events/${id}/completion`, {
        method: 'PUT',
        body: JSON.stringify({ completed: !event.completed })
      });
      set((state) => ({
        events: state.events.map(e => e.id === id ? { ...e, completed: updated.completed } : e)
      }));
      const msg = updated.completed ? 'Tarefa concluída ✓' : 'Tarefa desmarcada';
      toast()(msg, updated.completed ? 'success' : 'info');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar evento';
      toast()(message, 'error');
      console.error(err);
    }
  },

  deleteEvent: async (id) => {
    try {
      await fetchApi(`/events/${id}`, { method: 'DELETE' });
      set((state) => ({ events: state.events.filter(e => e.id !== id) }));
      toast()('Evento removido', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao remover evento';
      toast()(message, 'error');
      console.error(err);
    }
  },

  fetchNotes: async () => {
    try {
      const notes = await fetchApi('/notes');
      set({ notes });
    } catch (err) { console.error(err); }
  },

  addNote: async (note) => {
    try {
      const newNote = await fetchApi('/notes', {
        method: 'POST',
        body: JSON.stringify({ title: note.title, content: note.content, subjectId: note.subjectId })
      });
      set((state) => ({ notes: [newNote, ...state.notes] }));
      toast()('Nota criada!', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao criar nota';
      toast()(message, 'error');
      console.error(err);
    }
  },

  updateNote: async (id, note) => {
    try {
      const updated = await fetchApi(`/notes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ title: note.title, content: note.content, subjectId: note.subjectId })
      });
      set((state) => ({
        notes: state.notes.map(n => n.id === id ? { ...n, ...updated } : n)
      }));
      toast()('Nota salva!', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar nota';
      toast()(message, 'error');
      console.error(err);
    }
  },

  deleteNote: async (id) => {
    try {
      await fetchApi(`/notes/${id}`, { method: 'DELETE' });
      set((state) => ({ notes: state.notes.filter(n => n.id !== id) }));
      toast()('Nota removida', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao remover nota';
      toast()(message, 'error');
      console.error(err);
    }
  },
}));
