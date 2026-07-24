import { supabase } from '../lib/supabaseClient';
import { Course, Module, ModuleBanner, ModuleBannerMode } from '../types';

const BUCKET = 'module-media';
const MODE_KEY = 'falla_module_banner_mode';

const safeSegment = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'module';

export async function optimizeImage(file: File, maxWidth = 1600, quality = 0.84): Promise<File> {
  if (file.type === 'image/gif' || file.type === 'image/svg+xml' || file.type === 'image/webp' && file.size < 450_000) return file;
  if (!file.type.startsWith('image/')) throw new Error('Selecione um arquivo de imagem válido.');

  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
  canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
  const context = canvas.getContext('2d');
  if (!context) return file;
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
  if (!blob) return file;
  return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.webp`, { type: 'image/webp' });
}

export async function uploadModuleMedia(moduleId: string, file: File, kind: 'mascot' | 'banner', onProgress?: (value: number) => void) {
  onProgress?.(15);
  const optimized = await optimizeImage(file, kind === 'mascot' ? 900 : 1600);
  onProgress?.(45);
  const ext = optimized.name.split('.').pop() || 'webp';
  const folder = safeSegment(moduleId);
  const filename = kind === 'mascot' ? `mascot.${ext}` : `banners/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const path = `modules/${folder}/${filename}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, optimized, {
    cacheControl: '31536000',
    upsert: kind === 'mascot',
    contentType: optimized.type,
  });
  if (error) throw error;
  onProgress?.(90);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  onProgress?.(100);
  return { url: data.publicUrl, path };
}

export async function saveModuleToCourse(courseId: string, moduleId: string, patch: Partial<Module>) {
  const { data, error } = await supabase.from('courses').select('data').eq('id', courseId).single();
  if (error) throw error;
  const course = data.data as Course;
  const updated: Course = {
    ...course,
    modules: course.modules.map((module) => module.id === moduleId ? { ...module, ...patch } : module),
  };
  const { error: updateError } = await supabase.from('courses').update({ data: updated }).eq('id', courseId);
  if (updateError) throw updateError;
  return updated;
}

export async function listModuleBanners(moduleId: string): Promise<ModuleBanner[]> {
  const { data, error } = await supabase.from('module_banners').select('*').eq('module_id', moduleId).order('display_order');
  if (error) {
    console.warn('module_banners indisponível; usando lista vazia.', error.message);
    return [];
  }
  return (data || []).map((row: any) => ({
    id: row.id,
    moduleId: row.module_id,
    imageUrl: row.image_url,
    storagePath: row.storage_path || undefined,
    displayOrder: row.display_order || 0,
  }));
}

export async function addModuleBanner(moduleId: string, imageUrl: string, storagePath: string, displayOrder: number) {
  const { data, error } = await supabase.from('module_banners').insert({
    module_id: moduleId,
    image_url: imageUrl,
    storage_path: storagePath,
    display_order: displayOrder,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function deleteModuleBanner(banner: ModuleBanner) {
  const { error } = await supabase.from('module_banners').delete().eq('id', banner.id);
  if (error) throw error;
  if (banner.storagePath) await supabase.storage.from(BUCKET).remove([banner.storagePath]);
}

export async function reorderModuleBanners(banners: ModuleBanner[]) {
  await Promise.all(banners.map((banner, index) => supabase.from('module_banners').update({ display_order: index }).eq('id', banner.id)));
}

export function getBannerMode(): ModuleBannerMode {
  return localStorage.getItem(MODE_KEY) === 'carousel' ? 'carousel' : 'random';
}

export function setBannerMode(mode: ModuleBannerMode) {
  localStorage.setItem(MODE_KEY, mode);
  window.dispatchEvent(new CustomEvent('falla:module-banner-mode', { detail: mode }));
}
