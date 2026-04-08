import { Layer } from 'react-konva'
import type { CourtScale } from '../../hooks/useCourtScale'
import type { ID } from '../../domain/play/models'
import { useBoardStore } from '../../store'
import PlayerToken from './PlayerToken'
import BallToken from './BallToken'

export interface PlayerLayerProps {
  scale: CourtScale
}

export default function PlayerLayer({ scale }: PlayerLayerProps) {
  const players = useBoardStore((s) => s.players)
  const ball = useBoardStore((s) => s.ball)
  const selectedId = useBoardStore((s) => s.selectedId)
  const updatePlayer = useBoardStore((s) => s.updatePlayer)
  const setSelectedId = useBoardStore((s) => s.setSelectedId)
  const moveBall = useBoardStore((s) => s.moveBall)

  const handleSelect = (id: ID) => {
    setSelectedId(id)
  }

  const handleDragEnd = (id: ID, normX: number, normY: number) => {
    updatePlayer(id, { x: normX, y: normY })
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
          onDragEnd={handleDragEnd}
        />
      ))}
      {ball && (
        <BallToken
          ball={ball}
          scale={scale}
          onDragEnd={(nx, ny) => moveBall(nx, ny)}
        />
      )}
    </Layer>
  )
}
