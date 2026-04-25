import React, { useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CategoryCard from './CategoryCard';
import { Category } from '@/constants/categories';

interface Props {
    categories: Category[];
    selectedIds: string[];
    onToggle: (id: string) => void;
}

const CategoryCarousel: React.FC<Props> = ({ categories, selectedIds, onToggle }) => {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        align: 'center',
        containScroll: 'trimSnaps',
        loop: true,
        dragFree: true,
        skipSnaps: true,
    });

    const [selected, setSelected] = useState(0);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 640px)');
        const onChange = () => setIsMobile(mq.matches);
        onChange();
        mq.addEventListener?.('change', onChange);
        // fallback for older browsers
        mq.addListener?.(onChange as any);
        return () => {
            mq.removeEventListener?.('change', onChange);
            mq.removeListener?.(onChange as any);
        };
    }, []);

   useEffect(() => {
  if (!emblaApi) return;

  const onSelect = () => {
    setSelected(emblaApi.selectedScrollSnap());
  };

  emblaApi.on('select', onSelect);
  emblaApi.on('reInit', onSelect);

emblaApi.scrollTo(Math.floor(categories.length / 3));
  onSelect(); // sync immediately
  

  return () => {
    emblaApi.off('select', onSelect);
    emblaApi.off('reInit', onSelect);
  };
}, [emblaApi]);
    return (
        <div className="relative">
            <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex items-center gap-1 py-6 px-4">
                    {categories.map((cat, idx) => {
                        const offset = idx - selected;
                        const abs = Math.abs(offset);
                        const scale = abs === 1
                            ? 0.85
                            : Math.max(0.7, 1 - abs * 0.5);
                        const rotateY = offset * -5;
                        const zIndex = abs <= 1 ? 50 : 30 - abs;
                        return (
                            <div
                                key={cat.id}
                                className="flex-shrink-0 w-[190px] relative"
                                style={{
                                    transform: isMobile ? 'none' : `scale(${scale}) rotateY(${rotateY}deg)`,
                                    transition: 'transform 300ms',
                                    zIndex: isMobile ? 'auto' : zIndex,
                                }}
                            >
                                <CategoryCard
                                    category={cat}
                                    isSelected={selectedIds.includes(cat.id)}
                                    variant="detailed"
                                    showImage={true}
                                    onClick={() => onToggle(cat.id)}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Buttons */}
            <button
                onClick={() => emblaApi?.scrollPrev()}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white shadow p-2"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>

            <button
                onClick={() => emblaApi?.scrollNext()}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white shadow p-2"
            >
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>
    );
};
export default CategoryCarousel;
