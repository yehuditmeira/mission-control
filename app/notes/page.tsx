'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProjectSwitcher } from '@/components/project-switcher';
import { Input } from '@/components/ui/input';
import { Note } from '@/lib/types';
import { Pin, Trash2, StickyNote } from 'lucide-react';

type NoteWithProject = Note & { project_name?: string; project_color?: string };

function NotesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectFilter = searchParams.get('project') || 'all';
  const [notes, setNotes] = useState<NoteWithProject[]>([]);
  const [newTitle, setNewTitle] = useState('');

  const fetchNotes = useCallback(() => {
    const params = new URLSearchParams();
    if (projectFilter !== 'all') params.set('project_id', projectFilter);
    fetch(`/api/notes?${params}`).then(r => r.json()).then(setNotes);
  }, [projectFilter]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const createNote = async () => {
    if (!newTitle.trim()) return;
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim() }),
    });
    const note = await res.json();
    setNewTitle('');
    router.push(`/notes/${note.id}`);
  };

  const deleteNote = async (id: number) => {
    await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    fetchNotes();
  };

  const togglePin = async (note: NoteWithProject) => {
    await fetch(`/api/notes/${note.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned: !note.pinned }),
    });
    fetchNotes();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Notes</h1>
        <ProjectSwitcher />
      </div>

      <Input
        value={newTitle}
        onChange={e => setNewTitle(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && createNote()}
        placeholder="Type a note and press Enter..."
        className="mb-6"
        autoFocus
      />

      {notes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <StickyNote className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
          <p className="text-lg mb-2">No notes yet</p>
          <p className="text-sm">Click &quot;New Note&quot; to start writing</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map(note => (
            <div
              key={note.id}
              className="bg-white rounded-lg border border-neutral-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => router.push(`/notes/${note.id}`)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-sm truncate flex-1">{note.title}</h3>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => { e.stopPropagation(); togglePin(note); }}
                      className={`p-1 rounded ${note.pinned ? 'text-neutral-600' : 'text-neutral-400 hover:text-neutral-600'}`}
                    >
                      <Pin className="w-3 h-3" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); deleteNote(note.id); }}
                      className="p-1 rounded text-neutral-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                {note.content && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{note.content.slice(0, 200)}</p>
                )}
                <div className="flex items-center gap-2 mt-3">
                  {note.project_name && (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: note.project_color }} />
                      <span className="text-[10px] text-muted-foreground">{note.project_name}</span>
                    </div>
                  )}
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {new Date(note.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

export default function NotesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NotesContent />
    </Suspense>
  );
}
