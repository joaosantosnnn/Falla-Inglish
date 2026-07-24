export interface ProfileBanner {
  id: string;
  name: string;
  imageUrl: string; // CSS background: gradiente, cor ou imagem no formato url(...)
  price: number;
  unlockedByDefault: boolean;
  isAnimated?: boolean;
  animationType?: 'gradient' | 'hue' | 'shimmer' | 'stripes';
}

export const PROFILE_BANNERS: ProfileBanner[] = [
  {
    id: 'banner_classic',
    name: 'Twilight Falla',
    imageUrl: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
    price: 0,
    unlockedByDefault: true
  },
  {
    id: 'banner_pastel',
    name: 'Doce Pastel 🌸',
    imageUrl: 'linear-gradient(135deg, #fbcfe8 0%, #fef08a 100%)',
    price: 0,
    unlockedByDefault: true
  },
  {
    id: 'banner_animated_aurora',
    name: 'Aurora Boreal (Animado) ✨',
    imageUrl: 'linear-gradient(135deg, #059669 0%, #3b82f6 30%, #8b5cf6 60%, #ec4899 100%)',
    price: 40,
    unlockedByDefault: false,
    isAnimated: true,
    animationType: 'gradient'
  },
  {
    id: 'banner_animated_disco',
    name: 'Vibe Arco-Íris (Animado) 🌈',
    imageUrl: 'linear-gradient(90deg, #ff007f, #7f00ff, #00f0ff, #ff007f)',
    price: 50,
    unlockedByDefault: false,
    isAnimated: true,
    animationType: 'hue'
  },
  {
    id: 'banner_animated_shimmer_gold',
    name: 'Luxo Cromado (Animado) 💎',
    imageUrl: 'linear-gradient(135deg, #1e293b 0%, #475569 50%, #1e293b 100%)',
    price: 45,
    unlockedByDefault: false,
    isAnimated: true,
    animationType: 'shimmer'
  },
  {
    id: 'banner_animated_stripes_neon',
    name: 'Grelha Neon (Animado) 🚥',
    imageUrl: 'linear-gradient(135deg, #111827 0%, #312e81 100%)',
    price: 35,
    unlockedByDefault: false,
    isAnimated: true,
    animationType: 'stripes'
  },
  {
    id: 'banner_galactic',
    name: 'Espaço Sideral 🌌',
    imageUrl: 'radial-gradient(circle at top right, #3b0764, #0f172a 70%)',
    price: 25,
    unlockedByDefault: false
  },
  {
    id: 'banner_trophy',
    name: 'Troféu de Ouro 🏆',
    imageUrl: 'linear-gradient(135deg, #f59e0b 0%, #eab308 30%, #fbbf24 60%, #b45309 100%)',
    price: 35,
    unlockedByDefault: false
  },
  {
    id: 'banner_sunset',
    name: 'Pôr do Sol Quente 🌅',
    imageUrl: 'linear-gradient(135deg, #f97316 0%, #ef4444 60%, #ec4899 100%)',
    price: 20,
    unlockedByDefault: false
  },
  {
    id: 'banner_geometric',
    name: 'Pixel Cyberpunk 🤖',
    imageUrl: 'linear-gradient(90deg, #14b8a6 0%, #06b6d4 50%, #3b82f6 100%)',
    price: 30,
    unlockedByDefault: false
  }
];

