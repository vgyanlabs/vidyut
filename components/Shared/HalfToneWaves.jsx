"use client"

import { useEffect, useRef } from 'react'

export default function Component() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId
    let time = 0

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const drawHalftoneWave = () => {
      const gridSize = 20
      const rows = Math.ceil(canvas.height / gridSize)
      const cols = Math.ceil(canvas.width / gridSize)

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const centerX = x * gridSize
          const centerY = y * gridSize
          const distanceFromCenter = Math.sqrt(
            Math.pow(centerX - canvas.width / 2, 2) + 
            Math.pow(centerY - canvas.height / 2, 2)
          )
          const maxDistance = Math.sqrt(
            Math.pow(canvas.width / 2, 2) + 
            Math.pow(canvas.height / 2, 2)
          )
          const normalizedDistance = distanceFromCenter / maxDistance
          
          const waveOffset = Math.sin(normalizedDistance * 10 - time) * 0.5 + 0.5
          const size = gridSize * waveOffset * 0.8

          ctx.beginPath()
          ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2)
          const yellow = [255, 214, 0]
          const white = [255, 255, 255]
          const blue = [22, 128, 255]
          const t = waveOffset
          const r = Math.round(yellow[0] * t + white[0] * (1 - t))
          const g = Math.round(yellow[1] * t + white[1] * (1 - t))
          const b = Math.round(yellow[2] * t + white[2] * (1 - t))
          const blend = 0.2 + 0.3 * (1 - t)
          const finalR = Math.round(r * (1 - blend) + blue[0] * blend)
          const finalG = Math.round(g * (1 - blend) + blue[1] * blend)
          const finalB = Math.round(b * (1 - blend) + blue[2] * blend)
          ctx.fillStyle = `rgba(${finalR}, ${finalG}, ${finalB}, ${0.5 * waveOffset})`
          ctx.fill()
        }
      }
    }

    const animate = () => {
      ctx.fillStyle = '#1680FF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      drawHalftoneWave()

      time += 0.05
      animationFrameId = requestAnimationFrame(animate)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    animate()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  return <canvas ref={canvasRef} className="w-full h-screen bg-black" />
}
