import React, { useEffect, useRef, useState } from 'react';
import { Course, ModuleBanner, ModuleBannerMode } from '../types';
import { ChevronDown, ChevronUp, ImagePlus, Loader2, Trash2, Upload, GripVertical } from 'lucide-react';
import {
  addModuleBanner,
  deleteModuleBanner,
  getBannerMode,
  listModuleBanners,
  reorderModuleBanners,
  saveModuleToCourse,
  setBannerMode,
  uploadModuleMedia,
} from '../services/moduleMediaService';

interface Props {
  courses: Course[];
  onRefresh: () => void;
}

export default function ModuleMediaManager({ courses, onRefresh }: Props) {
  const [courseId, setCourseId] = useState(courses[0]?.id || '');
  const course = courses.find((item) => item.id === courseId) || courses[0];
  const [moduleId, setModuleId] = useState(course?.modules?.[0]?.id || '');
  const module = course?.modules?.find((item) => item.id === moduleId) || course?.modules?.[0];
  const [banners, setBanners] = useState<ModuleBanner[]>([]);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<ModuleBannerMode>(() => getBannerMode());
  const mascotInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!course?.modules.some((item) => item.id === moduleId)) setModuleId(course?.modules?.[0]?.id || '');
  }, [courseId]);

  useEffect(() => {
    if (!module?.id) return setBanners([]);
    void listModuleBanners(module.id).then(setBanners);
  }, [module?.id]);

  const uploadMascot = async (file?: File) => {
    if (!file || !course || !module) return;
    setBusy(true);
    try {
      const uploaded = await uploadModuleMedia(module.id, file, 'mascot', setProgress);
      await saveModuleToCourse(course.id, module.id, { mascotUrl: uploaded.url });
      await Promise.resolve(onRefresh());
    } catch (error: any) {
      alert(error.message || 'Não foi possível enviar o mascote.');
    } finally {
      setBusy(false); setProgress(0);
    }
  };

  const uploadBanners = async (files: FileList | null) => {
    if (!files?.length || !module) return;
    setBusy(true);
    try {
      let order = banners.length;
      for (const file of Array.from(files)) {
        const uploaded = await uploadModuleMedia(module.id, file, 'banner', setProgress);
        await addModuleBanner(module.id, uploaded.url, uploaded.path, order++);
      }
      setBanners(await listModuleBanners(module.id));
    } catch (error: any) {
      alert(error.message || 'Não foi possível enviar os banners.');
    } finally {
      setBusy(false); setProgress(0);
    }
  };

  const move = async (from: number, to: number) => {
    if (from === to) return;
    const next = [...banners];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setBanners(next);
    await reorderModuleBanners(next);
  };

  if (!course || !module) return <p className="text-xs font-bold text-slate-500">Cadastre um curso e um módulo antes de importar mídias.</p>;

  return (
    <section className="lg:col-span-2 rounded-3xl border-2 border-slate-200 bg-white p-5 space-y-5">
      <div>
        <h3 className="font-black text-slate-800 text-sm">Mascote e banners do módulo</h3>
        <p className="text-[11px] font-bold text-slate-500">Escolha o curso e o módulo. Depois importe um mascote ou vários banners; o upload e o salvamento são automáticos.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        <select value={course.id} onChange={(e) => setCourseId(e.target.value)} className="rounded-xl border-2 border-slate-200 p-2 text-xs font-bold">
          {courses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select value={module.id} onChange={(e) => setModuleId(e.target.value)} className="rounded-xl border-2 border-slate-200 p-2 text-xs font-bold">
          {course.modules.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
        <select value={mode} onChange={(e) => { const value = e.target.value as ModuleBannerMode; setMode(value); setBannerMode(value); }} className="rounded-xl border-2 border-slate-200 p-2 text-xs font-bold">
          <option value="random">Banners aleatórios</option>
          <option value="carousel">Carrossel automático</option>
        </select>
      </div>

      {busy && <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-falla-blue transition-all" style={{ width: `${progress}%` }} /></div>}

      <div className="grid md:grid-cols-[260px_1fr] gap-5">
        <div className="space-y-3">
          <h4 className="text-xs font-black text-slate-700">Mascote</h4>
          <button type="button" onClick={() => mascotInput.current?.click()} disabled={busy} className="w-full min-h-48 rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50 flex flex-col items-center justify-center gap-2 overflow-hidden">
            {module.mascotUrl ? <img src={module.mascotUrl} alt={`Mascote de ${module.title}`} className="h-48 w-full object-contain" loading="lazy" /> : <><Upload size={28}/><span className="text-xs font-black">Selecionar mascote</span></>}
          </button>
          <input ref={mascotInput} type="file" accept="image/png,image/webp,image/gif,image/svg+xml,image/jpeg" hidden onChange={(e) => void uploadMascot(e.target.files?.[0])}/>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-700">Banners</h4>
            <button type="button" onClick={() => bannerInput.current?.click()} disabled={busy} className="rounded-xl bg-falla-blue px-3 py-2 text-[10px] font-black text-white flex items-center gap-1">
              {busy ? <Loader2 size={13} className="animate-spin"/> : <ImagePlus size={13}/>} Importar Banner
            </button>
            <input ref={bannerInput} type="file" multiple accept="image/png,image/webp,image/gif,image/svg+xml,image/jpeg" hidden onChange={(e) => void uploadBanners(e.target.files)}/>
          </div>
          <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void uploadBanners(e.dataTransfer.files); }} className="min-h-48 rounded-2xl border-2 border-dashed border-slate-200 p-3">
            {banners.length === 0 ? <div className="h-40 flex items-center justify-center text-center text-[11px] font-bold text-slate-400">Arraste vários banners aqui ou clique em Importar Banner.</div> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {banners.map((banner, index) => (
                  <div key={banner.id} draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', String(index))} onDrop={(e) => { e.preventDefault(); void move(Number(e.dataTransfer.getData('text/plain')), index); }} onDragOver={(e) => e.preventDefault()} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    <img src={banner.imageUrl} alt={`Banner ${index + 1}`} className="h-28 w-full object-cover" loading="lazy" />
                    <span className="absolute left-2 top-2 rounded-lg bg-black/45 p-1 text-white"><GripVertical size={13}/></span>
                    <div className="absolute bottom-2 right-2 flex gap-1">
                      <button type="button" disabled={index === 0} onClick={() => void move(index, index - 1)} className="min-h-11 min-w-11 rounded-lg bg-white/90 p-2 text-slate-700 shadow disabled:opacity-40" aria-label="Mover banner para cima"><ChevronUp size={16}/></button>
                      <button type="button" disabled={index === banners.length - 1} onClick={() => void move(index, index + 1)} className="min-h-11 min-w-11 rounded-lg bg-white/90 p-2 text-slate-700 shadow disabled:opacity-40" aria-label="Mover banner para baixo"><ChevronDown size={16}/></button>
                    </div>
                    <button type="button" onClick={async () => { await deleteModuleBanner(banner); setBanners(await listModuleBanners(module.id)); }} className="absolute right-2 top-2 min-h-11 min-w-11 rounded-lg bg-white/90 p-2 text-red-600 shadow" aria-label="Remover banner"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
