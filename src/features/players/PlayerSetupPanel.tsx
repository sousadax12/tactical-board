import { nanoid } from 'nanoid'
import type { CSSProperties } from 'react'
import type { PlayerModel, TeamSide } from '../../domain/play/models'
import { useBoardStore } from '../../store'

const HOME_COLOR = '#E74C3C'
const AWAY_COLOR = '#3498DB'

const DEFAULT_POSITIONS: Record<TeamSide, { x: number; y: number }> = {
  home: { x: 0.25, y: 0.5 },
  away: { x: 0.75, y: 0.5 },
}

const MAX_PLAYERS_PER_TEAM = 7

function getNextNumber(players: PlayerModel[], teamSide: TeamSide): number {
  const teamNumbers = players
    .filter((p) => p.teamSide === teamSide)
    .map((p) => p.number)
  for (let n = 1; n <= MAX_PLAYERS_PER_TEAM; n++) {
    if (!teamNumbers.includes(n)) return n
  }
  return teamNumbers.length + 1
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
  justifyContent: 'space-between',
  padding: '4px 8px',
  background: 'rgba(255,255,255,0.05)',
  borderRadius: '4px',
}

const dotStyle = (color: string): CSSProperties => ({
  display: 'inline-block',
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  background: color,
  marginRight: '8px',
  flexShrink: 0,
})

const removeBtnStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#aaa',
  cursor: 'pointer',
  fontSize: '16px',
  lineHeight: 1,
  padding: '0 4px',
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

// ─── Sub-component ────────────────────────────────────────────────────────────

interface TeamSectionProps {
  label: string
  teamSide: TeamSide
  color: string
}

function TeamSection({ label, teamSide, color }: TeamSectionProps) {
  const players = useBoardStore((s) => s.players)
  const addPlayer = useBoardStore((s) => s.addPlayer)
  const removePlayer = useBoardStore((s) => s.removePlayer)

  const teamPlayers = players.filter((p) => p.teamSide === teamSide)
  const canAdd = teamPlayers.length < MAX_PLAYERS_PER_TEAM

  const handleAdd = () => {
    if (!canAdd) return
    const number = getNextNumber(players, teamSide)
    const { x, y } = DEFAULT_POSITIONS[teamSide]
    const newPlayer: PlayerModel = {
      id: nanoid(),
      teamSide,
      number,
      label: `${teamSide === 'home' ? 'H' : 'A'}${number}`,
      x,
      y,
      color,
    }
    addPlayer(newPlayer)
  }

  return (
    <div style={sectionStyle}>
      <div style={{ ...headingStyle, color }}>
        {label}
      </div>
      {teamPlayers.length === 0 && (
        <div style={{ color: '#666', fontSize: '12px' }}>No players added</div>
      )}
      {teamPlayers.map((p) => (
        <div key={p.id} style={playerRowStyle}>
          <span>
            <span style={dotStyle(color)} />
            #{p.number} — {p.label}
          </span>
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
        disabled={!canAdd}
        aria-label={`Add ${label} player`}
      >
        + Add Player
      </button>
    </div>
  )
}

// ─── Ball section ─────────────────────────────────────────────────────────────

function BallSection() {
  const ball = useBoardStore((s) => s.ball)
  const placeBall = useBoardStore((s) => s.placeBall)
  const removeBall = useBoardStore((s) => s.removeBall)

  return (
    <div style={sectionStyle}>
      <div style={{ ...headingStyle, color: '#e0e0e0' }}>Ball</div>
      {ball ? (
        <div style={playerRowStyle}>
          <span>⚽ On court</span>
          <button style={removeBtnStyle} onClick={removeBall} aria-label="Remove ball">×</button>
        </div>
      ) : (
        <button
          style={addBtnStyle('#555')}
          onClick={() => placeBall(0.5, 0.5)}
          aria-label="Place ball"
        >
          + Place Ball
        </button>
      )}
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
