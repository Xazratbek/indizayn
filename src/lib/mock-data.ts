import type { Designer, Project } from './types';

export const designers: Designer[] = [
  { id: '1', name: 'Elena Rivera', avatarId: 'avatar-1', specialization: 'UI/UX Dizayn', subscribers: 12500 },
  { id: '2', name: 'Ben Carter', avatarId: 'avatar-2', specialization: 'Harakatli Grafika', subscribers: 8200 },
  { id: '3', name: 'Anya Sharma', avatarId: 'avatar-3', specialization: 'Brending', subscribers: 23000 },
  { id: '4', name: 'Marcus Reid', avatarId: 'avatar-4', specialization: '3D San\'at', subscribers: 5400 },
  { id: '5', name: 'Sofia Chen', avatarId: 'avatar-5', specialization: 'Veb Dizayn', subscribers: 18900 },
];

export const projects: Project[] = [
  { id: '1', designerId: '4', name: 'Kosmik Drift', imageId: 'proj-1', tags: ['3D', 'Abstrakt', 'Cinema4D'], views: 15200, likes: 2300, description: 'Oktan bilan yaratilgan kosmik hodisalarga oid mavhum izlanishlar seriyasi.', tools: ['Cinema4D', 'Octane Render', 'After Effects'], createdAt: '2023-10-26' },
  { id: '2', designerId: '1', name: 'Fintech Ilovasi "Volt"', imageId: 'proj-2', tags: ['UI/UX', 'Mobil', 'Moliya'], views: 22800, likes: 3100, description: 'Yangi avlod mobil bank ilovasi uchun zamonaviy va intuitiv UI/UX dizayni.', tools: ['Figma', 'Principle', 'Illustrator'], createdAt: '2023-11-15' },
  { id: '3', designerId: '3', name: 'Koffee Brendingi', imageId: 'proj-3', tags: ['Brending', 'Logotip', 'Qadoqlash'], views: 32000, likes: 4500, description: 'Shahar markazidagi zamonaviy, hunarmandchilik qahvaxonasi uchun to\'liq brend identifikatsiyasi.', tools: ['Illustrator', 'Photoshop', 'InDesign'], createdAt: '2023-09-05' },
  { id: '4', designerId: '2', name: 'Kinetik Tipografiya 3-jild', imageId: 'proj-4', tags: ['Harakat', 'Tipografiya', 'Animatsiya'], views: 18500, likes: 2800, description: 'Dinamik va ifodali tipografiyani namoyish etuvchi eksperimental animatsiya.', tools: ['After Effects', 'Illustrator'], createdAt: '2023-12-01' },
  { id: '5', designerId: '5', name: 'Mira E-tijorat', imageId: 'proj-5', tags: ['Veb Dizayn', 'E-tijorat', 'UI'], views: 45000, likes: 5800, description: 'Yuqori darajadagi moda chakana savdosi uchun toza va minimalist veb-sayt dizayni.', tools: ['Figma', 'Webflow', 'Photoshop'], createdAt: '2023-10-10' },
  { id: '6', designerId: '4', name: 'Zamonaviy Villa', imageId: 'proj-6', tags: ['3D', 'Arxitektura'], views: 9800, likes: 1200, description: 'Zamonaviy qoyatosh villasining fotorealistik arxitektura vizualizatsiyasi.', tools: ['3ds Max', 'V-Ray', 'Photoshop'], createdAt: '2023-08-21' },
  { id: '7', designerId: '3', name: 'Kvant Start-api', imageId: 'proj-7', tags: ['Brending', 'Logotip', 'Texnologiya'], views: 11200, likes: 1500, description: 'Kvant hisoblash startapi uchun jasur va futuristik logotip.', tools: ['Illustrator'], createdAt: '2023-11-28' },
  { id: '8', designerId: '1', name: 'RPG Belgilar Toplami', imageId: 'proj-8', tags: ['Illustratsiya', 'O\'yin San\'ati'], views: 7600, likes: 980, description: 'Fantastik rolli o\'yin uchun personajlar dizaynlari to\'plami.', tools: ['Procreate', 'Photoshop'], createdAt: '2023-07-14' },
  { id: '9', designerId: '5', name: 'SaaS Boshqaruv Paneli', imageId: 'proj-9', tags: ['UI/UX', 'Veb Ilova', 'Ma\'lumotlar'], views: 51000, likes: 6200, description: 'Ma\'lumotlarni tahlil qilish SaaS platformasi uchun keng qamrovli va foydalanuvchilarga qulay boshqaruv paneli dizayni.', tools: ['Figma', 'React', 'D3.js'], createdAt: '2024-01-05' },
  { id: '10', designerId: '3', name: 'Organik Teri Parvarishi Qadog\'i', imageId: 'proj-10', tags: ['Qadoqlash', 'Brending'], views: 24000, likes: 3300, description: 'Organik teri parvarishi liniyasi uchun oqlangan va ekologik toza qadoqlash dizayni.', tools: ['Illustrator', 'Dimension'], createdAt: '2023-06-30' },
  { id: '11', designerId: '2', name: 'Global Trendlar Vizualizatsiyasi', imageId: 'proj-11', tags: ['Harakat', 'Ma\'lumotlar Vizi', 'UI'], views: 21500, likes: 3000, description: 'Oxirgi o\'n yillikdagi global iqtisodiy tendentsiyalarni vizualizatsiya qiluvchi interaktiv harakatli grafika.', tools: ['After Effects', 'Lottie', 'Figma'], createdAt: '2023-09-18' },
  { id: '12', designerId: '1', name: 'Musiqa Festivali Posteri', imageId: 'proj-12', tags: ['Illustratsiya', 'Grafik Dizayn'], views: 13500, likes: 1800, description: 'Har yili o\'tkaziladigan "Yoz To\'lqini" musiqa festivali uchun yorqin va jo\'shqin poster dizayni.', tools: ['Photoshop', 'Illustrator'], createdAt: '2023-05-20' },
];

// Helper to get all projects for a designer
export const getProjectsByDesigner = (designerId: string): Project[] => {
  return projects.filter(p => p.designerId === designerId);
};

// Helper to combine project and designer data
export const getFullProjectDetails = (projectId: string) => {
  const project = projects.find(p => p.id === projectId);
  if (!project) return null;
  const designer = designers.find(d => d.id === project.designerId);
  return { ...project, designer };
};

export const getFullProjects = () => {
  return projects.map(project => {
    const designer = designers.find(d => d.id === project.designerId);
    return { ...project, designer };
  });
};
