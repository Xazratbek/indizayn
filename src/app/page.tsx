import Link from 'next/link';
import { Eye, Heart, MoveRight, Palette, UserCheck, ThumbsUp } from 'lucide-react';
import ThreeShowcase from '@/components/three-showcase';
import { Button } from '@/components/ui/button';
import { designers, projects as allProjects } from '@/lib/mock-data';
import PortfolioCard from '@/components/portfolio-card';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const featuredDesigners = designers.slice(0, 5);
const featuredProjects = allProjects.sort((a, b) => b.likes - a.likes).slice(0, 4);

const advantages = [
    {
        icon: <Palette className="w-10 h-10 text-primary" />,
        title: "Portfoliongizni Namoyish Eting",
        description: "O'z ijodiy ishlaringizni keng auditoriyaga taqdim eting va professionallar hamjamiyatidan fikr-mulohazalar oling."
    },
    {
        icon: <UserCheck className="w-10 h-10 text-primary" />,
        title: "Dizaynerlarga Obuna Bo'ling",
        description: "O'zingiz yoqtirgan dizaynerlarning ijodini kuzatib boring va ularning so'nggi ishlaridan birinchilardan bo'lib xabardor bo'ling."
    },
    {
        icon: <ThumbsUp className="w-10 h-10 text-primary" />,
        title: "Ishlarni Baholang va Fikr Bildiring",
        description: "Boshqa dizaynerlarning ishlariga 'layk' bosing, izohlar qoldiring va ijodiy muhokamalarda faol ishtirok eting."
    }
];

export default function Home() {
  return (
    <div className="flex flex-col">
      <section className="relative w-full h-[60vh] md:h-[80vh] bg-background">
        <ThreeShowcase />
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-4">
          <h1 className="font-headline text-4xl md:text-7xl font-bold tracking-tighter text-foreground">
            inDizayn-ga Xush Kelibsiz!
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Dizaynerlar uchun o'z ishlarini namoyish etish, ilhomlanish va global hamjamiyat bilan bog'lanish uchun eng zo'r platforma.
          </p>
          <Button asChild size="lg" className="mt-8 bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/browse">Boshlash <MoveRight className="ml-2" /></Link>
          </Button>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-headline text-3xl md:text-4xl font-bold">Platformaning afzalliklari</h2>
            <p className="text-muted-foreground mt-2">Nima uchun dizaynerlar bizni tanlashadi?</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {advantages.map((adv, index) => (
                <Card key={index} className="text-center p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                    <CardHeader className="items-center">
                        <div className="p-4 bg-primary/10 rounded-full mb-4">
                            {adv.icon}
                        </div>
                        <CardTitle className="font-headline text-xl">{adv.title}</CardTitle>
                        <CardDescription className="pt-2">{adv.description}</CardDescription>
                    </CardHeader>
                </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-secondary/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-headline text-3xl md:text-4xl font-bold">Tavsiya Etilgan Loyihalar</h2>
            <p className="text-muted-foreground mt-2">Iste'dodli hamjamiyatimizdan tanlab olingan loyihalar.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProjects.map(project => (
              <PortfolioCard key={project.id} project={project} />
            ))}
          </div>
           <div className="text-center mt-12">
            <Button asChild variant="outline">
              <Link href="/browse">Barcha Loyihalarni Ko'rish</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
