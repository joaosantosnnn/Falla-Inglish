export interface ProfileBanner {
  id: string;
  name: string;
  imageUrl: string; // We will use CSS background property values (like gradients or colors)
  price: number;
  unlockedByDefault: boolean;
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
