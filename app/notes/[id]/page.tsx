'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichEditor } from '@/components/rich-editor';
import { Note } from '@/lib/types';
import { ArrowLeft, Save } from 'lucide-react';

type NoteWithProject = Note & { project_name?: string; project_color?: string };

export default function NoteEditorPage() {
  const router = useRouter();
  const params = useParams();
  const [note, setNote] = useState<NoteWithProject | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchNote = useCallback(async () => {
    const res = await fetch(`/api/notes/${params.id}`);
    if (!res.ok) { router.push('/notes'); return; }
    const data = await res.json();
    setNote(data);
    setTitle(data.title);
    setContent(data.content);
    setLoaded(true);
  }, [params.id, router]);

  useEffect(() => { fetchNote(); }, [fetchNote]);

  const save = async () => {
    setSaving(true);
    await fetch(`/api/notes/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    });
    setSaving(false);
    setDirty(false);
  };

  if (!note || !loaded) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push('/notes')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div className="flex-1" />
        {note.project_name && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: note.project_color }} />
            <span className="text-sm text-muted-foreground">{note.project_name}</span>
          </div>
        )}
        <Button size="sm" onClick={save} disabled={saving || !dirty}>
          <Save className="w-4 h-4 mr-1" /> {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {/* Title */}
      <Input
        value={title}
        onChange={e => { setTitle(e.target.value); setDirty(true); }}
        onBlur={() => { if (dirty) save(); }}
        className="text-2xl font-bold border-none shadow-none px-0 h-auto focus-visible:ring-0 mb-4"
        placeholder="Note title..."
      />

      {/* Rich Text Editor */}
      <RichEditor
        content={content}
        onChange={(html) => { setContent(html); setDirty(true); }}
        onBlur={() => { if (dirty) save(); }}
      />

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
        <span>Last updated: {new Date(note.updated_at).toLocaleString()}</span>
        <span>{dirty ? 'Unsaved changes' : 'All changes saved'}</span>
      </div>
    </div>
  );
}
