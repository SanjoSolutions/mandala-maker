import './index.css'
import './material-design-icons/outlined.css'
import { convertDegreesToRadian as degrees } from './unnamed/convertDegreesToRadian.js'
import './unnamed/createFullDocumentCanvas/createFullDocumentCanvas.css'
import { createFullDocumentCanvas } from './unnamed/createFullDocumentCanvas/createFullDocumentCanvas.js'
import { distance } from './unnamed/distance.js'
import { ColorPicker } from './color-picker/ColorPicker.js'
import { hslToRgb } from './unnamed/hslToRgb.js'

async function main() {
  customElements.define('color-picker', ColorPicker)

  let width = window.innerWidth
  let height = window.innerHeight
  const { canvas, context } = createFullDocumentCanvas({
    afterCanvasSizeAndScaleSet() {
      if (window.innerHeight > height) {
        context.fillStyle = 'white'
        context.fillRect(0, height, window.innerWidth, window.innerHeight - height)
      }
      if (window.innerWidth > width) {
        context.fillStyle = 'white'
        context.fillRect(width, 0, window.innerWidth - width, window.innerHeight)
      }
      width = window.innerWidth
      height = window.innerHeight
    }
  })
  context.fillStyle = 'white'
  context.fillRect(0, 0, window.innerWidth, window.innerHeight)
  document.body.appendChild(canvas)
  let color = [0, 0, 0, 255]

  const $pickColor = document.querySelector('.pick-color')
  $pickColor.addEventListener('pointerdown', function (event) {
    event.stopPropagation()
  })
  $pickColor.addEventListener('click', function () {
    document.body.classList.toggle('picking-color')
  })

  const $pickedColor = document.querySelector('.picked-color')
  $pickedColor.style.backgroundColor = '#000'

  const $colorPickerContainer = document.querySelector('.color-picker')
  $colorPickerContainer.addEventListener('pointerdown', function (event) {
    event.stopPropagation()
  })

  const $colorPicker = $colorPickerContainer.querySelector('color-picker')
  $colorPicker.addEventListener('change', function (event) {
    const pickedColor = event.detail
    const { hue, saturation, lightness } = pickedColor
    const colorString = `hsl(${ hue }, ${ saturation * 100 }%, ${ lightness * 100 }%)`
    $pickedColor.style.backgroundColor = colorString
    context.strokeStyle = colorString
    const rgb = hslToRgb(hue / 360, saturation, lightness)
    color = [rgb[0], rgb[1], rgb[2], 255]
  })

  let angle = degrees(60)

  const pencil = document.querySelector('.pencil')

  const $fill = document.querySelector('.fill')
  $fill.addEventListener('pointerdown', function (event) {
    event.stopPropagation()
  })
  $fill.addEventListener('click', function () {
    document.body.classList.toggle('fill-mode')
  })

  function isFillModeActive() {
    return document.body.classList.contains('fill-mode')
  }

  const setAngle = document.querySelector('.set-angle')
  setAngle.addEventListener('pointerdown', function (event) {
    event.stopPropagation()
  })
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
      const point = eventToPoint(event)
      if (isFillModeActive()) {
        fill(canvas, context, point, color)
      } else {
        isDrawing = true
        drawLine(point, point)
        lastPoint = point
      }
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

export function fill(canvas, context, position, color) {
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  const filledOutColor = readColor(imageData, position)
  const alreadyVisitedPositions = new Set()
  setColor(imageData, position, color)
  alreadyVisitedPositions.add(position)
  let nextPositions = new Set(determineNeighbours(imageData, position))
  while (nextPositions.size >= 1) {
    const positions = nextPositions
    nextPositions = new Set()
    for (const position of positions) {
      const colorAtPosition = readColor(imageData, position)
      if (areColorsSimilar(colorAtPosition, filledOutColor)) {
        setColor(imageData, position, color)
        const neighbourPositions = determineNeighbours(imageData, position)
        for (const position of neighbourPositions) {
          if (!alreadyVisitedPositions.has(position)) {
            nextPositions.add(position)
          }
        }
      }
      alreadyVisitedPositions.add(position)
    }
  }

  context.putImageData(imageData, 0, 0)
}

function readColor(imageData, position) {
  const index = calculateIndex(imageData, position)
  const data = imageData.data
  return [
    data[index],
    data[index + 1],
    data[index + 2],
    data[index + 3],
  ]
}

function setColor(imageData, position, color) {
  const index = calculateIndex(imageData, position)
  for (let offset = 0; offset < 4; offset++) {
    imageData.data[index + offset] = color[offset]
  }
}

function areColorsSimilar(colorA, colorB) {
  for (let index = 0; index < 4; index++) {
    if (Math.abs(colorA[index] - colorB[index]) > 0x2) {
      return false
    }
  }
  return true
}

function calculateIndex(imageData, position) {
  const { x, y } = position
  return (y * imageData.width + x) * 4
}

function determineNeighbours(imageData, position) {
  const { x, y } = position
  const positions = []

  if (y >= 1) {
    positions.push({ x, y: y - 1 })
  }
  if (x <= imageData.width - 2) {
    positions.push({ x: x + 1, y })
  }
  if (y <= imageData.height - 2) {
    positions.push({ x, y: y + 1 })
  }
  if (x >= 1) {
    positions.push({ x: x - 1, y })
  }

  return positions
}

main()
