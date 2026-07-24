import React, { useEffect, useMemo, useState } from 'react';
import { ModuleBanner } from '../types';
import { getBannerMode, listModuleBanners } from '../services/moduleMediaService';

export default function ModuleBannerDisplay({ moduleId, title }: { moduleId: string; title: string }) {
  const [banners, setBanners] = useState<ModuleBanner[]>([]);
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const mode = getBannerMode();

  useEffect(() => {
    let active = true;
    setLoaded(false);
    void listModuleBanners(moduleId).then((items) => {
      if (!active) return;
      setBanners(items);
      setIndex(items.length ? Math.floor(Math.random() * items.length) : 0);
    });
    return () => { active = false; };
  }, [moduleId]);

  useEffect(() => {
    if (mode !== 'carousel' || banners.length < 2) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % banners.length), 5000);
    return () => window.clearInterval(timer);
  }, [mode, banners.length]);

  const banner = useMemo(() => banners[index], [banners, index]);
  if (!banner) return null;

  return (
    <div className="relative -mx-5 -mt-5 mb-4 h-36 overflow-hidden rounded-t-[1.35rem] bg-white/10">
      {!loaded && <div className="absolute inset-0 animate-pulse bg-white/15" />}
      <img
        src={banner.imageUrl}
        alt={`Banner do módulo ${title}`}
        className={`h-full w-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        loading="lazy"
        onLoad={() => setLoaded(true)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
    </div>
  );
}
