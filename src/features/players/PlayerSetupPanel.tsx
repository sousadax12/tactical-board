import { nanoid } from 'nanoid'
import type { CSSProperties, ChangeEvent } from 'react'
import type { PlayerModel, TeamSide } from '../../domain/play/models'
import { useBoardStore } from '../../store'

const HOME_COLOR = '#E74C3C'
const AWAY_COLOR = '#3498DB'

const DEFAULT_POSITIONS: Record<TeamSide, { x: number; y: number }> = {
  home: { x: 0.25, y: 0.5 },
  away: { x: 0.75, y: 0.5 },
}

function getNextNumber(players: PlayerModel[], teamSide: TeamSide): number {
  const teamNumbers = players
    .filter((p) => p.teamSide === teamSide)
    .map((p) => p.number)
  for (let n = 1; ; n++) {
    if (!teamNumbers.includes(n)) return n
  }
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const panelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  padding: '16px',
  background: '#1a1a2e',
  color: '#e0e0e0',
  fontFamily: 'sans-serif',
  fontSize: '14px',
  borderRadius: '8px',
  minWidth: '200px',
}

const sectionStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}

const headingStyle: CSSProperties = {
  fontWeight: 700,
  fontSize: '13px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '4px',
}

const playerRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '4px 6px',
  background: 'rgba(255,255,255,0.05)',
  borderRadius: '4px',
}

const removeBtnStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#aaa',
  cursor: 'pointer',
  fontSize: '16px',
  lineHeight: 1,
  padding: '0 2px',
  marginLeft: 'auto',
  flexShrink: 0,
}

const addBtnStyle = (color: string): CSSProperties => ({
  padding: '6px 12px',
  background: color,
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '13px',
  alignSelf: 'flex-start',
})

const colorPickerStyle: CSSProperties = {
  width: '22px',
  height: '22px',
  padding: 0,
  border: '1px solid #555',
  borderRadius: '3px',
  cursor: 'pointer',
  flexShrink: 0,
}

const labelInputStyle: CSSProperties = {
  flex: 1,
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid #444',
  borderRadius: '3px',
  color: '#e0e0e0',
  fontSize: '12px',
  padding: '2px 5px',
  minWidth: 0,
}

// ─── Team section ─────────────────────────────────────────────────────────────

interface TeamSectionProps {
  label: string
  teamSide: TeamSide
  color: string
}

function TeamSection({ label, teamSide, color }: TeamSectionProps) {
  const players = useBoardStore((s) => s.players)
  const addPlayer = useBoardStore((s) => s.addPlayer)
  const updatePlayer = useBoardStore((s) => s.updatePlayer)
  const removePlayer = useBoardStore((s) => s.removePlayer)

  const teamPlayers = players.filter((p) => p.teamSide === teamSide)

  const handleAdd = () => {
    const number = getNextNumber(players, teamSide)
    const { x, y } = DEFAULT_POSITIONS[teamSide]
    const lastColor = teamPlayers.length > 0 ? teamPlayers[teamPlayers.length - 1].color : color
    const newPlayer: PlayerModel = {
      id: nanoid(),
      teamSide,
      number,
      label: `${teamSide === 'home' ? 'H' : 'A'}${number}`,
      x,
      y,
      color: lastColor,
    }
    addPlayer(newPlayer)
  }

  return (
    <div style={sectionStyle}>
      <div style={{ ...headingStyle, color }}>{label}</div>
      {teamPlayers.length === 0 && (
        <div style={{ color: '#666', fontSize: '12px' }}>No players added</div>
      )}
      {teamPlayers.map((p) => (
        <div key={p.id} style={playerRowStyle}>
          <input
            type="color"
            value={p.color}
            style={colorPickerStyle}
            title="Pick color"
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updatePlayer(p.id, { color: e.target.value })
            }
          />
          <span style={{ fontSize: '11px', color: '#888', flexShrink: 0 }}>#{p.number}</span>
          <input
            type="text"
            value={p.label}
            style={labelInputStyle}
            maxLength={4}
            title="Edit label"
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updatePlayer(p.id, { label: e.target.value })
            }
          />
          <button
            style={removeBtnStyle}
            onClick={() => removePlayer(p.id)}
            aria-label={`Remove player ${p.number}`}
          >
            ×
          </button>
        </div>
      ))}
      <button
        style={addBtnStyle(color)}
        onClick={handleAdd}
        aria-label={`Add ${label} player`}
      >
        + Add Player
      </button>
    </div>
  )
}

// ─── Ball section ─────────────────────────────────────────────────────────────

function BallSection() {
  const balls = useBoardStore((s) => s.balls)
  const addBall = useBoardStore((s) => s.addBall)
  const updateBall = useBoardStore((s) => s.updateBall)
  const removeBall = useBoardStore((s) => s.removeBall)

  return (
    <div style={sectionStyle}>
      <div style={{ ...headingStyle, color: '#e0e0e0' }}>Balls</div>
      {balls.length === 0 && (
        <div style={{ color: '#666', fontSize: '12px' }}>No balls placed</div>
      )}
      {balls.map((ball, index) => (
        <div key={ball.id} style={playerRowStyle}>
          <input
            type="color"
            value={ball.color}
            style={colorPickerStyle}
            title="Pick color"
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updateBall(ball.id, { color: e.target.value })
            }
          />
          <span style={{ fontSize: '12px' }}>Ball {index + 1}</span>
          <button
            style={removeBtnStyle}
            onClick={() => removeBall(ball.id)}
            aria-label={`Remove ball ${index + 1}`}
          >
            ×
          </button>
        </div>
      ))}
      <button
        style={addBtnStyle('#555')}
        onClick={() => addBall(0.5, 0.5, balls.length > 0 ? balls[balls.length - 1].color : undefined)}
        aria-label="Add ball"
      >
        + Add Ball
      </button>
    </div>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function PlayerSetupPanel() {
  return (
    <div style={panelStyle}>
      <BallSection />
      <TeamSection label="Home Team" teamSide="home" color={HOME_COLOR} />
      <TeamSection label="Away Team" teamSide="away" color={AWAY_COLOR} />
    </div>
  )
}
