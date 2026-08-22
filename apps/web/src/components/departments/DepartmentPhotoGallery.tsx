import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import { departmentPhotoLabels, departmentPhotosBySlug } from './department-photos';

export function DepartmentPhotoGallery({ slug }: { slug: string }) {
  const photos = departmentPhotosBySlug[slug] ?? [];
  const labels = departmentPhotoLabels[slug];
  const [activeIndex, setActiveIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const isCarousel = photos.length >= 6;
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const thumbnailRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => setActiveIndex(0), [slug]);
  useEffect(() => {
    thumbnailRefs.current[activeIndex]?.scrollIntoView?.({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [activeIndex, reduceMotion]);
  if (!labels || photos.length === 0) return null;

  const move = (direction: number) => setActiveIndex(index => (index + direction + photos.length) % photos.length);
  const active = photos[activeIndex];

  return (
    <section className={`dept-photo-gallery ${isCarousel ? 'is-carousel' : 'is-grid'}`} aria-label={`${labels.name}照片实录`}>
      <header className="dept-photo-heading">
        <span><Camera aria-hidden="true" /> CLUB PHOTO LOG</span>
        <h2>{labels.title}</h2>
        <p>{labels.intro}</p>
      </header>

      {isCarousel ? <>
        <div
          className="dept-photo-stage"
          tabIndex={0}
          onKeyDown={event => {
            if (event.key === 'ArrowLeft') move(-1);
            if (event.key === 'ArrowRight') move(1);
          }}
          onTouchStart={event => {
            const touch = event.touches[0];
            touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
          }}
          onTouchEnd={event => {
            const start = touchStart.current;
            const touch = event.changedTouches[0];
            touchStart.current = null;
            if (!start || !touch) return;
            const deltaX = touch.clientX - start.x;
            const deltaY = touch.clientY - start.y;
            if (Math.abs(deltaX) >= 48 && Math.abs(deltaX) > Math.abs(deltaY)) move(deltaX < 0 ? 1 : -1);
          }}
          aria-roledescription="照片轮播"
          aria-label="照片轮播，使用左右方向键或滑动切换"
        >
          <motion.figure
            key={active.src}
            initial={reduceMotion ? false : { opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: reduceMotion ? 0 : .28 }}
          >
            <img src={active.src} alt={active.alt} loading={activeIndex === 0 ? 'eager' : 'lazy'} decoding="async" />
            <figcaption><small>{active.source}</small><strong>{active.caption}</strong></figcaption>
          </motion.figure>
          <button className="dept-photo-arrow is-prev" type="button" aria-label="上一张照片" onClick={() => move(-1)}><ChevronLeft aria-hidden="true" /></button>
          <button className="dept-photo-arrow is-next" type="button" aria-label="下一张照片" onClick={() => move(1)}><ChevronRight aria-hidden="true" /></button>
          <span className="dept-photo-counter" aria-live="polite">{activeIndex + 1} / {photos.length}</span>
        </div>
        <div className="dept-photo-thumbs" aria-label="照片缩略图列表">
          {photos.map((photo, index) => <button
            className={index === activeIndex ? 'is-active' : ''}
            type="button"
            key={photo.src}
            ref={element => { thumbnailRefs.current[index] = element; }}
            aria-label={`查看第 ${index + 1} 张照片：${photo.caption}`}
            aria-current={index === activeIndex ? 'true' : undefined}
            onClick={() => setActiveIndex(index)}
          ><img src={photo.src} alt="" loading="lazy" decoding="async" /><span>{String(index + 1).padStart(2, '0')}</span></button>)}
        </div>
      </> : <div className="dept-photo-grid">
        {photos.map((photo, index) => <motion.figure
          key={photo.src}
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-8% 0px' }}
          transition={{ duration: reduceMotion ? 0 : .45, delay: index * .06 }}
        >
          <img src={photo.src} alt={photo.alt} loading="lazy" decoding="async" />
          <figcaption><small>{photo.source}</small><strong>{photo.caption}</strong></figcaption>
        </motion.figure>)}
      </div>}
    </section>
  );
}
