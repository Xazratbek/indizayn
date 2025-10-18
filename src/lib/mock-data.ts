import type { Designer, Project } from './types';

export const designers: Designer[] = [
  { id: '1', name: 'Elena Rivera', avatarId: 'avatar-1', specialization: 'UI/UX', subscribers: 12500 },
  { id: '2', name: 'Ben Carter', avatarId: 'avatar-2', specialization: 'Motion', subscribers: 8200 },
  { id: '3', name: 'Anya Sharma', avatarId: 'avatar-3', specialization: 'Branding', subscribers: 23000 },
  { id: '4', name: 'Marcus Reid', avatarId: 'avatar-4', specialization: '3D Art', subscribers: 5400 },
  { id: '5', name: 'Sofia Chen', avatarId: 'avatar-5', specialization: 'Web Design', subscribers: 18900 },
];

export const projects: Project[] = [
  { id: '1', designerId: '4', name: 'Cosmic Drift', imageId: 'proj-1', tags: ['3D', 'Abstract', 'Cinema4D'], views: 15200, likes: 2300, description: 'A series of abstract explorations into cosmic phenomena, rendered with Octane.', tools: ['Cinema4D', 'Octane Render', 'After Effects'], createdAt: '2023-10-26' },
  { id: '2', designerId: '1', name: 'Fintech App "Volt"', imageId: 'proj-2', tags: ['UI/UX', 'Mobile', 'Finance'], views: 22800, likes: 3100, description: 'A sleek and intuitive UI/UX design for a next-generation mobile banking application.', tools: ['Figma', 'Principle', 'Illustrator'], createdAt: '2023-11-15' },
  { id: '3', designerId: '3', name: 'Koffee Branding', imageId: 'proj-3', tags: ['Branding', 'Logo', 'Packaging'], views: 32000, likes: 4500, description: 'Complete brand identity for a modern, artisanal coffee shop in downtown.', tools: ['Illustrator', 'Photoshop', 'InDesign'], createdAt: '2023-09-05' },
  { id: '4', designerId: '2', name: 'Kinetic Type Vol. 3', imageId: 'proj-4', tags: ['Motion', 'Typography', 'Animation'], views: 18500, likes: 2800, description: 'An experimental animation showcasing dynamic and expressive typography.', tools: ['After Effects', 'Illustrator'], createdAt: '2023-12-01' },
  { id: '5', designerId: '5', name: 'Mira E-commerce', imageId: 'proj-5', tags: ['Web Design', 'E-commerce', 'UI'], views: 45000, likes: 5800, description: 'A clean and minimalist website design for a high-end fashion retailer.', tools: ['Figma', 'Webflow', 'Photoshop'], createdAt: '2023-10-10' },
  { id: '6', designerId: '4', name: 'Modern Villa', imageId: 'proj-6', tags: ['3D', 'Architecture'], views: 9800, likes: 1200, description: 'Photorealistic architectural visualization of a modern cliffside villa.', tools: ['3ds Max', 'V-Ray', 'Photoshop'], createdAt: '2023-08-21' },
  { id: '7', designerId: '3', name: 'Quantum Start-up', imageId: 'proj-7', tags: ['Branding', 'Logo', 'Tech'], views: 11200, likes: 1500, description: 'A bold and futuristic logo for a quantum computing startup.', tools: ['Illustrator'], createdAt: '2023-11-28' },
  { id: '8', designerId: '1', name: 'RPG Character Set', imageId: 'proj-8', tags: ['Illustration', 'Game Art'], views: 7600, likes: 980, description: 'A collection of character designs for a fantasy role-playing game.', tools: ['Procreate', 'Photoshop'], createdAt: '2023-07-14' },
  { id: '9', designerId: '5', name: 'SaaS Dashboard', imageId: 'proj-9', tags: ['UI/UX', 'Web App', 'Data'], views: 51000, likes: 6200, description: 'A comprehensive and user-friendly dashboard design for a data analytics SaaS platform.', tools: ['Figma', 'React', 'D3.js'], createdAt: '2024-01-05' },
  { id: '10', designerId: '3', name: 'Organic Skincare Packaging', imageId: 'proj-10', tags: ['Packaging', 'Branding'], views: 24000, likes: 3300, description: 'Elegant and eco-friendly packaging design for an organic skincare line.', tools: ['Illustrator', 'Dimension'], createdAt: '2023-06-30' },
  { id: '11', designerId: '2', name: 'Global Trends Visualization', imageId: 'proj-11', tags: ['Motion', 'Data Viz', 'UI'], views: 21500, likes: 3000, description: 'An interactive motion graphic visualizing global economic trends over the last decade.', tools: ['After Effects', 'Lottie', 'Figma'], createdAt: '2023-09-18' },
  { id: '12', designerId: '1', name: 'Music Fest Poster', imageId: 'proj-12', tags: ['Illustration', 'Graphic Design'], views: 13500, likes: 1800, description: 'A vibrant and energetic poster design for the annual "Summer Wave" music festival.', tools: ['Photoshop', 'Illustrator'], createdAt: '2023-05-20' },
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
