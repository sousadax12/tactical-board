import Konva from 'konva'

export function exportAsPng(stage: Konva.Stage, filename: string): void {
  const dataUrl = stage.toDataURL({ pixelRatio: 2 })
  const anchor = document.createElement('a')
  anchor.download = `${filename}.png`
  anchor.href = dataUrl
  anchor.click()
}
