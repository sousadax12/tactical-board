import { nanoid } from 'nanoid'
import type { Play, PlayFrame } from '../../domain/play/models'
import { useBoardStore } from '../../store'
import { useLibraryStore } from '../../store'

const styles = {
  container: {
    padding: '12px',
    color: '#e0e0e0',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  } as React.CSSProperties,
  title: {
    fontSize: '14px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    color: '#a0a0c0',
  } as React.CSSProperties,
  saveBtn: {
    padding: '5px 10px',
    fontSize: '12px',
    fontWeight: 600,
    background: '#3a3aff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  } as React.CSSProperties,
  emptyState: {
    padding: '24px 12px',
    textAlign: 'center' as const,
    color: '#606080',
    fontSize: '13px',
  } as React.CSSProperties,
  playCard: {
    background: '#12122a',
    border: '1px solid #2a2a4a',
    borderRadius: '6px',
    padding: '10px',
    marginBottom: '8px',
  } as React.CSSProperties,
  playName: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#e0e0ff',
    marginBottom: '2px',
  } as React.CSSProperties,
  playDescription: {
    fontSize: '12px',
    color: '#808098',
    marginBottom: '4px',
    minHeight: '16px',
  } as React.CSSProperties,
  playMeta: {
    fontSize: '11px',
    color: '#505070',
    marginBottom: '6px',
  } as React.CSSProperties,
  tagsRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '4px',
    marginBottom: '8px',
  } as React.CSSProperties,
  tag: {
    padding: '1px 6px',
    fontSize: '11px',
    background: '#1e1e4a',
    color: '#8080c0',
    borderRadius: '3px',
    border: '1px solid #2a2a5a',
  } as React.CSSProperties,
  actions: {
    display: 'flex',
    gap: '6px',
  } as React.CSSProperties,
  loadBtn: {
    flex: 1,
    padding: '4px 8px',
    fontSize: '12px',
    background: '#1a3a1a',
    color: '#60c060',
    border: '1px solid #2a5a2a',
    borderRadius: '4px',
    cursor: 'pointer',
  } as React.CSSProperties,
  deleteBtn: {
    padding: '4px 8px',
    fontSize: '12px',
    background: '#3a1a1a',
    color: '#c06060',
    border: '1px solid #5a2a2a',
    borderRadius: '4px',
    cursor: 'pointer',
  } as React.CSSProperties,
}

function formatDate(epochMs: number): string {
  return new Date(epochMs).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function LibraryPanel() {
  const plays = useLibraryStore((s) => s.plays)
  const deletePlay = useLibraryStore((s) => s.deletePlay)

  function handleSaveCurrent(): void {
    const name = window.prompt('Enter a name for this play:')
    if (!name || name.trim() === '') return

    const boardState = useBoardStore.getState()

    const frame: PlayFrame = {
      id: nanoid(),
      players: boardState.players.map((p) => ({ ...p })),
      ball: boardState.ball ? { ...boardState.ball } : null,
      annotations: boardState.annotations.map((a) => ({ ...a })),
    }

    const now = Date.now()
    const play: Play = {
      id: nanoid(),
      name: name.trim(),
      description: '',
      createdAt: now,
      updatedAt: now,
      frames: [frame],
      tags: [],
    }

    useLibraryStore.getState().savePlay(play)
  }

  function handleLoad(play: Play): void {
    useBoardStore.getState().loadFrame(play.frames[0])
    window.alert(`Loaded play: "${play.name}"`)
  }

  function handleDelete(id: string): void {
    const confirmed = window.confirm('Delete this play?')
    if (confirmed) {
      deletePlay(id)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>Play Library</span>
        <button style={styles.saveBtn} onClick={handleSaveCurrent}>
          Save Current
        </button>
      </div>

      {plays.length === 0 ? (
        <div style={styles.emptyState}>
          No plays saved yet. Set up the board and click "Save Current" to store a play.
        </div>
      ) : (
        plays.map((play) => (
          <div key={play.id} style={styles.playCard}>
            <div style={styles.playName}>{play.name}</div>
            {play.description && (
              <div style={styles.playDescription}>{play.description}</div>
            )}
            <div style={styles.playMeta}>{formatDate(play.createdAt)}</div>
            {play.tags.length > 0 && (
              <div style={styles.tagsRow}>
                {play.tags.map((tag) => (
                  <span key={tag} style={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div style={styles.actions}>
              <button style={styles.loadBtn} onClick={() => handleLoad(play)}>
                Load
              </button>
              <button style={styles.deleteBtn} onClick={() => handleDelete(play.id)}>
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
