import React, { useState, useEffect, useRef, useCallback } from 'react'
import PropTypes from 'prop-types'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CFormRange,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilMagnifyingGlass } from '@coreui/icons'

const CONTAINER_SIZE = 320
const CROP_DIAMETER = 260
const CROP_RADIUS = CROP_DIAMETER / 2
const CENTER = CONTAINER_SIZE / 2

const AvatarCropModal = ({ visible, imageSrc, onClose, onApply }) => {
  const [imageObj, setImageObj] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 })
  const containerRef = useRef(null)

  // Load image when imageSrc changes
  useEffect(() => {
    if (!imageSrc) {
      setImageObj(null)
      return
    }

    const img = new Image()
    img.onload = () => {
      setImageObj(img)
      setZoom(1)
      setPosition({ x: 0, y: 0 })
    }
    img.src = imageSrc
  }, [imageSrc])

  // Calculate base scale to ensure image covers crop circle
  const baseScale = imageObj
    ? Math.max(CROP_DIAMETER / imageObj.naturalWidth, CROP_DIAMETER / imageObj.naturalHeight)
    : 1
  const currentScale = baseScale * zoom

  // Clamp pan position so crop circle never shows blank space
  const clampPosition = useCallback(
    (pos, scale) => {
      if (!imageObj) return pos
      const imgW = imageObj.naturalWidth * scale
      const imgH = imageObj.naturalHeight * scale
      const maxPanX = Math.max(0, (imgW - CROP_DIAMETER) / 2)
      const maxPanY = Math.max(0, (imgH - CROP_DIAMETER) / 2)

      return {
        x: Math.min(maxPanX, Math.max(-maxPanX, pos.x)),
        y: Math.min(maxPanY, Math.max(-maxPanY, pos.y)),
      }
    },
    [imageObj],
  )

  // Update position clamp when zoom changes
  useEffect(() => {
    if (imageObj) {
      setPosition((prev) => clampPosition(prev, currentScale))
    }
  }, [zoom, clampPosition, currentScale, imageObj])

  /* ===============================
     DRAG HANDLERS (MOUSE & TOUCH)
  ============================== */
  const handleMouseDown = (e) => {
    e.preventDefault()
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    }
  }

  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return
    const touch = e.touches[0]
    setIsDragging(true)
    dragStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      posX: position.x,
      posY: position.y,
    }
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return
      const deltaX = e.clientX - dragStartRef.current.x
      const deltaY = e.clientY - dragStartRef.current.y
      const rawPos = {
        x: dragStartRef.current.posX + deltaX,
        y: dragStartRef.current.posY + deltaY,
      }
      setPosition(clampPosition(rawPos, currentScale))
    }

    const handleTouchMove = (e) => {
      if (!isDragging || e.touches.length !== 1) return
      const touch = e.touches[0]
      const deltaX = touch.clientX - dragStartRef.current.x
      const deltaY = touch.clientY - dragStartRef.current.y
      const rawPos = {
        x: dragStartRef.current.posX + deltaX,
        y: dragStartRef.current.posY + deltaY,
      }
      setPosition(clampPosition(rawPos, currentScale))
    }

    const handleEnd = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleEnd)
      window.addEventListener('touchmove', handleTouchMove)
      window.addEventListener('touchend', handleEnd)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleEnd)
    }
  }, [isDragging, clampPosition, currentScale])

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY * -0.002
    setZoom((prev) => Math.min(3, Math.max(1, prev + delta)))
  }

  /* ===============================
     APPLY CROP TO CIRCLE PNG
  ============================== */
  const handleApply = () => {
    if (!imageObj) return

    const outputSize = 320
    const canvas = document.createElement('canvas')
    canvas.width = outputSize
    canvas.height = outputSize
    const ctx = canvas.getContext('2d')

    // Circle clipping mask for WhatsApp-style circular output
    ctx.beginPath()
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()

    // Calculate source rect from natural image
    const srcCropSize = CROP_DIAMETER / currentScale
    const srcX = imageObj.naturalWidth / 2 - position.x / currentScale - srcCropSize / 2
    const srcY = imageObj.naturalHeight / 2 - position.y / currentScale - srcCropSize / 2

    ctx.drawImage(
      imageObj,
      srcX,
      srcY,
      srcCropSize,
      srcCropSize,
      0,
      0,
      outputSize,
      outputSize,
    )

    // Export as lightweight WebP with transparency, fallback to PNG
    let croppedDataUrl = canvas.toDataURL('image/webp', 0.88)
    if (!croppedDataUrl.startsWith('data:image/webp')) {
      croppedDataUrl = canvas.toDataURL('image/png')
    }

    onApply(croppedDataUrl)
    onClose()
  }

  return (
    <CModal visible={visible} onClose={onClose} alignment="center" backdrop="static">
      <CModalHeader>
        <CModalTitle>Sesuaikan Foto Profil</CModalTitle>
      </CModalHeader>
      <CModalBody className="p-4 d-flex flex-column align-items-center">
        <div
          ref={containerRef}
          style={{
            position: 'relative',
            width: `${CONTAINER_SIZE}px`,
            height: `${CONTAINER_SIZE}px`,
            overflow: 'hidden',
            userSelect: 'none',
            touchAction: 'none',
            cursor: isDragging ? 'grabbing' : 'grab',
            backgroundColor: '#111',
            borderRadius: '12px',
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onWheel={handleWheel}
        >
          {/* Base Image */}
          {imageObj && (
            <img
              src={imageSrc}
              alt="Crop target"
              draggable={false}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: `${imageObj.naturalWidth * currentScale}px`,
                height: `${imageObj.naturalHeight * currentScale}px`,
                transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px)`,
                maxWidth: 'none',
                maxHeight: 'none',
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Circular Vignette Mask */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          >
            <defs>
              <mask id="avatar-circle-mask">
                <rect width="100%" height="100%" fill="white" />
                <circle cx={CENTER} cy={CENTER} r={CROP_RADIUS} fill="black" />
              </mask>
            </defs>
            {/* Outer dark overlay */}
            <rect
              width="100%"
              height="100%"
              fill="rgba(0, 0, 0, 0.65)"
              mask="url(#avatar-circle-mask)"
            />
            {/* Circle boundary ring */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={CROP_RADIUS}
              fill="none"
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth="2"
            />
            {/* Inner guideline dash ring */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={CROP_RADIUS}
              fill="none"
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="1"
              strokeDasharray="6 4"
            />
          </svg>
        </div>

        {/* Zoom Slider Control */}
        <div className="w-100 mt-4 px-3" style={{ maxWidth: `${CONTAINER_SIZE}px` }}>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span className="small text-body-secondary d-flex align-items-center gap-1">
              <CIcon icon={cilMagnifyingGlass} size="sm" />
              <span>Perbesar Foto</span>
            </span>
            <span className="small fw-semibold text-body-secondary">
              {Math.round(zoom * 100)}%
            </span>
          </div>
          <CFormRange
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
          />
        </div>

        <div className="text-body-secondary small mt-2 text-center">
          Geser atau gunakan slider perbesar untuk memilih bagian foto yang diinginkan.
        </div>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="ghost" onClick={onClose}>
          Batal
        </CButton>
        <CButton color="primary" onClick={handleApply}>
          Pilih &amp; Terapkan
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

AvatarCropModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  imageSrc: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
}

export default AvatarCropModal

