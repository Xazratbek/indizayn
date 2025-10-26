
import { Users, Target, Eye } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AboutPage() {
  return (
    <div className="py-16 px-4 md:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="font-headline text-4xl md:text-5xl font-bold">Biz haqimizda</h1>
        <p className="text-muted-foreground mt-4 max-w-3xl mx-auto text-lg">
          Biz O'zbekistonning ijodkor dizaynerlarini bir joyга jamlash, ularning ishlarini namoyish etish va o'zaro tajriba almashishlari uchun yagona platforma yaratishni maqsad qilganmiz.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-12 mb-20 text-center">
        <div className="flex flex-col items-center">
          <Users className="w-16 h-16 text-primary mb-4" />
          <h2 className="font-headline text-2xl font-bold mb-2">Bizning Hamjamiyatimiz</h2>
          <p className="text-muted-foreground">
            Bizning platformamiz - bu UI/UX, grafika, 3D, harakatli grafika va boshqa ko'plab yo'nalishlardagi iqtidorli dizaynerlarning uyi. Bu yerda siz ilhom topishingiz, yangi g'oyalar bilan tanishishingiz va hamkasblaringiz bilan aloqa o'rnatishingiz mumkin.
          </p>
        </div>
        <div className="flex flex-col items-center">
          <Target className="w-16 h-16 text-primary mb-4" />
          <h2 className="font-headline text-2xl font-bold mb-2">Bizning Maqsadimiz</h2>
          <p className="text-muted-foreground">
            Asosiy maqsadimiz - O'zbekistonda dizayn sohasini rivojlantirishga hissa qo'shish, yosh iste'dodlarni qo'llab-quvvatlash va ularning ishlarini dunyo miqyosida tanitish uchun imkoniyatlar yaratishdir.
          </p>
        </div>
        <div className="flex flex-col items-center">
          <Eye className="w-16 h-16 text-primary mb-4" />
          <h2 className="font-headline text-2xl font-bold mb-2">Bizning Kelajagimiz</h2>
          <p className="text-muted-foreground">
            Biz doimiy ravishda platformamizni takomillashtirish ustida ishlaymiz. Kelajakda tanlovlar, master-klasslar va dizaynerlar uchun maxsus resurslarni joriy etishni rejalashtirganmiz. Biz bilan birga o'sing va rivojlaning!
          </p>
        </div>
      </div>

      <div className="bg-secondary rounded-lg p-10 text-center">
          <h2 className="font-headline text-3xl font-bold mb-4">Hamjamiyatimizga Qo'shiling</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            Agar siz dizayner bo'lsangiz va o'z ishingizni dunyoga ko'rsatishni istasangiz, bugunoq bizga qo'shiling. Profil yarating, portfoliongizni yuklang va ijodiy sayohatingizni boshlang!
          </p>
          <a href="/auth" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 rounded-md px-8">
            Ro'yxatdan o'tish
          </a>
      </div>
    </div>
  );
}

    