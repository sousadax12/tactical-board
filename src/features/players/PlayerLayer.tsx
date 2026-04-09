import { Layer } from 'react-konva'
import type { CourtScale } from '../../hooks/useCourtScale'
import type { ID } from '../../domain/play/models'
import { useBoardStore } from '../../store'
import PlayerToken from './PlayerToken'
import BallToken from './BallToken'

export interface PlayerLayerProps {
  scale: CourtScale
  onStartEdit: (id: ID, pixelX: number, pixelY: number, label: string) => void
}

export default function PlayerLayer({ scale, onStartEdit }: PlayerLayerProps) {
  const players = useBoardStore((s) => s.players)
  const balls = useBoardStore((s) => s.balls)
  const selectedId = useBoardStore((s) => s.selectedId)
  const updatePlayer = useBoardStore((s) => s.updatePlayer)
  const setSelectedId = useBoardStore((s) => s.setSelectedId)
  const moveBall = useBoardStore((s) => s.moveBall)

  const handleSelect = (id: ID) => setSelectedId(id)

  const handlePlayerDragEnd = (id: ID, normX: number, normY: number) => {
    updatePlayer(id, { x: normX, y: normY })
  }

  const handleBallDragEnd = (id: ID, normX: number, normY: number) => {
    moveBall(id, normX, normY)
  }

  return (
    <Layer>
      {players.map((player) => (
        <PlayerToken
          key={player.id}
          player={player}
          scale={scale}
          isSelected={selectedId === player.id}
          onSelect={handleSelect}
          onDragEnd={handlePlayerDragEnd}
          onDoubleClick={onStartEdit}
        />
      ))}
      {balls.map((ball) => (
        <BallToken
          key={ball.id}
          ball={ball}
          scale={scale}
          isSelected={selectedId === ball.id}
          onSelect={handleSelect}
          onDragEnd={handleBallDragEnd}
        />
      ))}
    </Layer>
  )
}
