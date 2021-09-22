import { debounce } from './debounce.js'
import { convertDegreesToRadian as degrees } from './unnamed/convertDegreesToRadian.js'
import { createFullDocumentCanvas } from './unnamed/createFullDocumentCanvas/createFullDocumentCanvas.js'
import { distance } from './unnamed/distance.js'

async function main() {
  const { canvas, context } = createFullDocumentCanvas()
  document.body.appendChild(canvas)

  let angle = degrees(60)

  const pencil = document.querySelector('.pencil')

  const setAngle = document.querySelector('.set-angle')
  setAngle.addEventListener('click', function () {
    try {
      angle = degrees(parseFloat(prompt('Angle:')))
    } catch (error) {
      console.error(error)
    }
  })

  context.lineWidth = 1
  context.lineCap = 'round'

  let isDrawing = false
  let lastPoint
  window.addEventListener('pointerdown', (event) => {
    if (isLeftMouseButton(event)) {
      isDrawing = true
      const point = eventToPoint(event)
      drawLine(point, point)
      lastPoint = point
    }
  })

  window.addEventListener('pointermove', (event) => {
    const point = eventToPoint(event)
    pencil.style.left = `${ point.x }px`
    pencil.style.top = `${ point.y }px`
    if (isDrawing) {
      drawLine(lastPoint, point)
      lastPoint = point
    }
  })

  function drawLine(a, b) {
    let rotationAngle = 0
    while (rotationAngle < degrees(360)) {
      drawRotatedLine(a, b, rotationAngle)
      rotationAngle += angle
    }
  }

  function drawRotatedLine(a, b, rotationAngle) {
    const center = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    }

    const rotatedA = rotatePoint(center, a, rotationAngle)
    const rotatedB = rotatePoint(center, b, rotationAngle)

    line(rotatedA, rotatedB)
  }

  function rotatePoint(origin, point, angle) {
    const angleToPoint = Math.atan2(
      point.y - origin.y,
      point.x - origin.x,
    )

    const angleToRotatedPoint = angleToPoint + angle

    const distanceToPoint = distance(origin, point)

    const rotatedPoint = {
      x: origin.x + distanceToPoint * Math.cos(angleToRotatedPoint),
      y: origin.y + distanceToPoint * Math.sin(angleToRotatedPoint),
    }

    return rotatedPoint
  }

  window.addEventListener('pointerup', (event) => {
    isDrawing = false
  })

  window.addEventListener('wheel', (event) => {
    const deltaY = event.deltaY
    if (deltaY !== 0) {
      if (deltaY < 0) {
        context.lineWidth *= 2
      } else if (deltaY > 0) {
        context.lineWidth = Math.max(1, context.lineWidth / 2)
      }
      const pencilRadius = 0.5 * context.lineWidth
      pencil.style.width = `${ 2 * pencilRadius }px`
      pencil.style.height = `${ 2 * pencilRadius }px`
      pencil.style.marginLeft = `${ -pencilRadius }px`
      pencil.style.marginTop = `${ -pencilRadius }px`
    }
  })

  function isLeftMouseButton(event) {
    return event.button === 0
  }

  function eventToPoint(event) {
    return { x: event.pageX, y: event.pageY }
  }

  function line(a, b) {
    context.beginPath()
    context.moveTo(a.x, a.y)
    context.lineTo(b.x, b.y)
    context.stroke()
  }
}

main()
