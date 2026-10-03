import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function ImagePreview({ url, alt = 'Foto', index = 0, total = 1, onClose, onPrev, onNext }) {
  const boxRef = useRef(null);
  const stageRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ sx: 0, sy: 0, ox: 0, oy: 0, moved: false });

  useEffect(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, [url]);

  useEffect(() => {
    const el = boxRef.current;
    try {
      if (el?.requestFullscreen && !document.fullscreenElement) {
        const p = el.requestFullscreen();
        if (p?.catch) p.catch(() => {});
      }
    } catch {  }
    return () => {
      try { if (document.fullscreenElement) document.exitFullscreen(); } catch {  }
    };
  }, []);

  const handleClose = (e) => {
    e?.stopPropagation?.();
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch {  }
    onClose?.();
  };

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onWheel = (e) => {
      e.preventDefault();
      setScale((s) => {
        const nx = e.deltaY < 0 ? Math.min(4, +(s + 0.25).toFixed(2)) : Math.max(1, +(s - 0.25).toFixed(2));
        if (nx === 1) setOffset({ x: 0, y: 0 });
        return nx;
      });
    };
    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, []);

  const startDrag = (cx, cy) => {
    if (scale <= 1) return;
    dragRef.current = { sx: cx, sy: cy, ox: offset.x, oy: offset.y, moved: false };
    setDragging(true);
  };
  const moveDrag = (cx, cy) => {
    if (!dragging) return;
    if (Math.abs(cx - dragRef.current.sx) + Math.abs(cy - dragRef.current.sy) > 4) dragRef.current.moved = true;
    setOffset({
      x: dragRef.current.ox + (cx - dragRef.current.sx),
      y: dragRef.current.oy + (cy - dragRef.current.sy),
    });
  };
  const endDrag = () => setDragging(false);

  const toggleZoom = (e) => {
    e.stopPropagation();
    if (dragRef.current.moved) return;
    if (scale === 1) setScale(2);
    else { setScale(1); setOffset({ x: 0, y: 0 }); }
  };

  if (!url) return null;

  return createPortal(
    <div className="img-preview" ref={boxRef} onClick={handleClose} role="dialog" aria-modal="true" aria-label="Foto fullscreen">
      <button className="img-preview__close" aria-label="Tutup" onClick={handleClose}>
        <X size={20} />
      </button>

      {total > 1 && (
        <>
          <button className="img-preview__nav img-preview__nav--left" aria-label="Foto sebelumnya" onClick={(e) => { e.stopPropagation(); onPrev?.(); }}>
            <ChevronLeft size={22} />
          </button>
          <button className="img-preview__nav img-preview__nav--right" aria-label="Foto berikutnya" onClick={(e) => { e.stopPropagation(); onNext?.(); }}>
            <ChevronRight size={22} />
          </button>
          <span className="img-preview__count">{index + 1} / {total}</span>
        </>
      )}

      <div
        className="img-preview__stage"
        ref={stageRef}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
        onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchStart={(e) => { const t = e.touches[0]; startDrag(t.clientX, t.clientY); }}
        onTouchMove={(e) => moveDrag(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={endDrag}
      >
        <img
          src={url}
          alt={alt}
          draggable={false}
          onClick={toggleZoom}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            cursor: scale === 1 ? 'zoom-in' : dragging ? 'grabbing' : 'zoom-out',
            transition: dragging ? 'none' : 'transform 0.18s ease-out',
          }}
        />
      </div>
    </div>,
    document.body
  );
}

