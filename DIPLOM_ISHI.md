
# "Dizaynerlar uchun loyihalar yuklash sayti" mavzusida Bitiruv Malakaviy Ishi

---

## MUNDARIJA

1.  **KIRISH**
    *   Mavzuning dolzarbligi va zaruriyati
    *   O'zbekistonda raqamli iqtisodiyot va dizayn sohasining rivojlanishi
    *   Ishning maqsadi va vazifalari
    *   Tadqiqot obyekti va predmeti
    *   Ishning ilmiy yangiligi va amaliy ahamiyati
    *   Tanlangan texnologiyalar to'plamining (stack) afzalliklari

2.  **ASOSIY QISM: ADABIYOTLAR VA TEXNOLOGIYALAR TAHLILI**
    *   **2.1. Mavjud platformalar tahlili**
        *   Behance: Global liderning funktsional tahlili
        *   Dribbble: Hamjamiyatga yo'naltirilgan platforma
        *   Awwwards: Sifat va ijodkorlikka urg'u
        *   Mahalliy platformalar bilan solishtirma tahlil va bozor bo'shlig'ini aniqlash
    *   **2.2. Xizmat ko'rsatuvchi texnologiyalar tahlili**
        *   Firebase (BaaS - Backend as a Service) vs. An'anaviy backend
        *   Cloudinary vs. Boshqa media saqlash xizmatlari (AWS S3, mahalliy saqlash)
    *   **2.3. Dasturiy ta'minotni ishlab chiqish texnologiyalarini tanlashni asoslash**
        *   Frontend: React va Next.js freymvorki
        *   UI komponentlar kutubxonasi: ShadCN UI va Tailwind CSS
        *   Ma'lumotlar bazasi: Firebase Firestore (NoSQL)
        *   Autentifikatsiya: NextAuth.js va Firebase Authentication
        *   Media fayllarni boshqarish: Cloudinary

3.  **AMALIY QISM: LOYIHANI ISHLAB CHIQISH**
    *   **3.1. Tizim arxitekturasi va diagrammalari (UML)**
        *   Use Case (Foydalanish varianti) diagrammasi
        *   Database ER (Entity-Relationship) diagrammasi (Firestore uchun)
        *   Foydalanuvchi oqimi (User Flow) diagrammasi
        *   Autentifikatsiya oqimi diagrammasi
    *   **3.2. Ma'lumotlar bazasini loyihalash**
        *   Firebase Firestore kolleksiyalari strukturasi (`users`, `projects`, `messages`, `notifications`, `comments`)
    *   **3.3. Asosiy funksionallikni amalga oshirish**
        *   Foydalanuvchi autentifikatsiyasi va profili
        *   Loyiha yuklash va boshqarish (CRUD)
        *   Real-time chat tizimi
        *   Like, comment va notification modullari
        *   Qidiruv va filtrlash tizimi
    *   **3.4. Dasturiy ta'minotni testlash**
        *   Komponentlarni testlash
        *   Firebase xavfsizlik qoidalarini testlash

4.  **XULOSA VA TAVSIYALAR**
    *   Olingan asosiy natijalar
    *   Loyihaning iqtisodiy samaradorligi va afzalliklari
    *   Kelajakda rivojlantirish istiqbollari
    *   O'qish jarayonida olingan bilim va tajribalar

5.  **FOYDALANILGAN ADABIYOTLAR RO'YXATI**

---

## 1. KIRISH

### Mavzuning dolzarbligi va zaruriyati

So'nggi yillarda O'zbekistonda axborot texnologiyalari va raqamli iqtisodiyot jadal sur'atlar bilan rivojlanmoqda. O‘zbekiston Respublikasi Prezidentining "Raqamli O‘zbekiston — 2030" strategiyasi bu yo‘nalishdagi islohotlarning asosiy harakatlantiruvchi kuchiga aylandi. Ushbu strategiya doirasida kreativ iqtisodiyot, jumladan, UI/UX (foydalanuvchi interfeysi/tajribasi), grafik dizayn, 3D modellashtirish va boshqa dizayn yo'nalishlari keskin o'sishni boshdan kechirmoqda.

IT Park Uzbekistan statistik ma'lumotlariga ko'ra, mamlakatdagi IT mutaxassislari va kompaniyalari soni yildan-yilga ortib bormoqda, bu esa o'z navbatida sifatli dizayn xizmatlariga bo'lgan talabni oshiradi. Mahalliy va xorijiy kompaniyalar o'z mahsulotlarining raqobatbardoshligini ta'minlash uchun professional dizaynerlarni faol izlamoqdalar.

Biroq, bu o'sish fonida bir qator muammolar ham ko'zga tashlanmoqda. Mahalliy dizaynerlar, ayniqsa, o'z faoliyatini endi boshlayotgan yosh mutaxassislar o'z ishlarini (portfoliosini) professional darajada namoyish etish, ish beruvchilar va hamjamiyat e'tiborini jalb qilish uchun yagona, markazlashgan va qulay platformaga ega emaslar. Ko'pchilik o'z ishlarini Behance yoki Dribbble kabi xalqaro platformalarda joylashtirishga majbur, bu esa quyidagi qiyinchiliklarni keltirib chiqaradi:

1.  **Mahalliy kontekstning yo'qligi:** Xalqaro platformalar O'zbekiston bozorining o'ziga xos talablari va madaniyatini hisobga olmaydi.
2.  **Til to'sig'i:** Interfeys va muloqot asosan ingliz tilida bo'lgani uchun ba'zi dizaynerlar va mahalliy ish beruvchilar uchun qiyinchilik tug'diradi.
3.  **Raqobat:** Global miqyosdagi yuqori raqobat yosh dizaynerlarga o'zini ko'rsatish imkoniyatini cheklaydi.
4.  **Networking imkoniyatlarining cheklanganligi:** Mahalliy dizaynerlar hamjamiyatini shakllantirish, tajriba almashish va hamkorlik qilish uchun bu platformalar qulay emas.

Shu sababli, O'zbekiston dizaynerlari uchun maxsus, zamonaviy texnologiyalar asosida qurilgan, milliy auditoriyaga yo'naltirilgan portfolio platformasini yaratish bugungi kunning dolzarb vazifalaridan biridir. Ushbu bitiruv malakaviy ishi aynan shu muammoni hal qilishga qaratilgan "inDizayn" loyihasini ishlab chiqishga bag'ishlanadi.

### Ishning maqsadi va vazifalari

**Ishning maqsadi:** O'zbekistonlik dizaynerlar uchun o'z ijodiy ishlarini namoyish etish, ish beruvchilar bilan aloqa o'rnatish va o'zaro tajriba almashish imkonini beruvchi, zamonaviy veb-texnologiyalar (Next.js, Firebase, Cloudinary) asosida qurilgan onlayn portfolio platformasini ishlab chiqish va uning samaradorligini ilmiy-texnik jihatdan asoslash.

Ushbu maqsadga erishish uchun quyidagi **vazifalar** belgilab olindi:

1.  Mavzu bo'yicha mavjud adabiyotlar va raqobatdosh platformalarni (Behance, Dribbble va boshqalar) tahlil qilish, ularning yutuq va kamchiliklarini o'rganish.
2.  Loyihaning texnik talablarini shakllantirish va zamonaviy veb-texnologiyalar (Next.js, Firebase, Cloudinary) to'plamini tanlashni ilmiy-amaliy jihatdan asoslash.
3.  Platformaning arxitekturasini loyihalash, ma'lumotlar bazasi strukturasini (Firebase Firestore kolleksiyalari) va tizimning asosiy diagrammalarini (Use Case, ER, User Flow) ishlab chiqish.
4.  Asosiy funksional modullarni amalga oshirish: foydalanuvchi autentifikatsiyasi, portfolio loyihalarini yuklash, real-time chat, interaktivlik (like/comment) va bildirishnomalar tizimi.
5.  Fayllarni (rasm, audio, video) saqlash va optimallashtirish uchun Cloudinary servisini integratsiya qilish.
6.  Firebase xavfsizlik qoidalari (Security Rules) yordamida ma'lumotlar xavfsizligini ta'minlash va uni testlash.
7.  Yaratilgan platformaning samaradorligini tahlil qilish va kelajakdagi rivojlantirish yo'nalishlarini belgilash.

### Ishning ilmiy yangiligi va amaliy ahamiyati

**Ilmiy yangiligi:** Ishning ilmiy yangiligi serverless (BaaS - Backend as a Service) arxitektura, xususan, Firebase platformasi imkoniyatlaridan foydalanib, real-time rejimida ishlaydigan, yuqori yuklanishlarga bardoshli va kam xarajatli ijtimoiy platformani mahalliy sharoitda yaratish metodologiyasini ishlab chiqishdan iborat. Shuningdek, NoSQL ma'lumotlar bazasi (Firestore) asosida murakkab munosabatlarni modellashtirish va samarali qidiruv algoritmlarini qurish masalalari tadqiq qilingan.

**Amaliy ahamiyati:** Ushbu ishning amaliy natijasi — "inDizayn" deb nomlangan, to'liq ishchi holatdagi veb-platformadir. U quyidagi amaliy ahamiyatga ega:
*   **Dizaynerlar uchun:** O'z ishlarini jamlash, professional portfolio yaratish va potentsial ish beruvchilarga oson taqdim etish uchun qulay vosita.
*   **Ish beruvchilar uchun:** O'zbekiston bozoridagi iqtidorli dizaynerlarni topish, ularning ishlari bilan tanishish va to'g'ridan-to'g'ri aloqaga chiqish uchun markazlashgan manba.
*   **Hamjamiyat uchun:** Mahalliy dizaynerlar o'rtasida sog'lom raqobat, bilim va tajriba almashinuvi uchun virtual maydon yaratadi, bu esa sohaning umumiy sifat darajasini oshirishga xizmat qiladi.
*   **Ta'lim uchun:** Ushbu loyiha zamonaviy veb-texnologiyalarni amalda qo'llash bo'yicha talabalar va yosh dasturchilar uchun amaliy qo'llanma bo'lib xizmat qilishi mumkin.

---

## 2. ADABIYOTLAR VA TEXNOLOGIYALAR TAHLILI

Bu bo'limda dizaynerlar uchun mavjud portfolio platformalari tahlil qilinadi va "inDizayn" loyihasining bozordagi o'rnini aniqlash uchun ularning yutuq va kamchiliklari solishtiriladi.

### 2.1. Mavjud platformalar tahlili

| Kriteriya | Behance (Adobe) | Dribbble | Awwwards | inDizayn (Maqsad) |
| :--- | :--- | :--- | :--- | :--- |
| **Asosiy yo'nalish**| Keng qamrovli loyihalarni batafsil ko'rsatish | Kichik "shot"lar, interfeys parchalari, tezkor fikrlar | Faqat veb-dizayn, yuqori sifatli saytlarni taqdirlash | O'zbekiston dizaynerlari uchun markazlashgan portfolio va hamjamiyat |
| **Foydalanuvchi bazasi**| Global, millionlab foydalanuvchilar | Global, asosan UI/UX dizaynerlar | Global, veb-studiyalar va agentliklar | Mahalliy (O'zbekiston), barcha turdagi dizaynerlar |
| **Interfeys tili** | Ko'p tilli (o'zbek tili yo'q) | Ingliz tili | Ingliz tili | **O'zbek tili (asosiy)**, rus, ingliz |
| **Monetizatsiya** | Adobe Creative Cloud obunasi, "Jobs" bo'limi | Pro obuna, "Jobs" bo'limi, frilans loyihalar | Saytlarni topshirish uchun to'lov, "Jobs" | Hozircha bepul, kelajakda "premium" funksiyalar yoki ish e'lonlari uchun to'lov |
| **Afzalliklari** | Katta auditoriya, Adobe integratsiyasi | Kuchli UI/UX hamjamiyati, trendlarni belgilaydi | Yuqori obro', sifat belgisi | Mahalliy bozorga moslashgan, til qulayligi, o'zbek dizaynerlari uchun markaz |
| **Kamchiliklari** | Yuqori raqobat, mahalliy bozorga e'tiborsizlik| Faqat kichik tasvirlar, loyihaning to'liq kontekstini berish qiyin | Faqat veb-dizayn bilan cheklangan, yuqori kirish talablari | Auditoriyasi endi shakllanmoqda |

### 2.2. Xizmat ko'rsatuvchi texnologiyalar tahlili

**Firebase (BaaS) vs. An'anaviy Backend (Node.js + SQL/NoSQL):**

An'anaviy yondashuvda backend uchun alohida server (masalan, Node.js, Python Django), ma'lumotlar bazasi (PostgreSQL, MongoDB) va ular orasidagi aloqani ta'minlaydigan API (REST yoki GraphQL) yaratish kerak bo'ladi. Bu katta mehnat va vaqt talab qiladi.

**Firebase** esa "Backend-as-a-Service" (BaaS) modelini taklif qiladi. U tayyor yechimlarni (autentifikatsiya, real-time ma'lumotlar bazasi, fayl saqlash) bitta platformada jamlaydi.

| Xususiyat | An'anaviy Backend | Firebase | "inDizayn" uchun tanlov sababi |
| :--- | :--- | :--- | :--- |
| **Rivojlanish tezligi**| Sekin (server, API, DB sozlamalari) | **Juda tez** (tayyor SDK'lar va API'lar) | Loyihani tezda bozorga chiqarish (MVP) uchun Firebase ideal. |
| **Real-time funksionallik**| Qo'shimcha texnologiyalar talab qiladi (WebSockets, Socket.io) | **Ichki funksiya** (Firestore `onSnapshot`) | Chat va bildirishnomalar kabi funksiyalar uchun zarur. |
| **Masshtablanish** | Qo'lda sozlash va boshqarishni talab qiladi (serverlar, yuklanish balansi) | **Avtomatik** (Google Cloud infratuzilmasi) | Foydalanuvchilar soni ortganda tizimning barqaror ishlashini ta'minlaydi. |
| **Xarajatlar** | Doimiy server xarajatlari (hatto foydalanuvchi bo'lmasa ham) | **"Foydalanganingcha to'la"** (bepul limitdan boshlanadi)| Startap loyihalar uchun boshlang'ich xarajatlarni minimallashtiradi. |
| **Xavfsizlik** | Dasturchi tomonidan to'liq amalga oshiriladi (autentifikatsiya, avtorizatsiya) | **Ichki mexanizmlar** (Firebase Auth, Security Rules) | Xavfsizlikni ta'minlashni soddalashtiradi va ishonchliligini oshiradi. |

**Cloudinary vs. Firebase Storage / AWS S3:**

| Xususiyat | Firebase Storage | AWS S3 | Cloudinary | "inDizayn" uchun tanlov sababi |
| :--- | :--- | :--- | :--- | :--- |
| **Asosiy vazifasi** | Fayllarni saqlash va yetkazib berish | Universal obyekt saqlash xizmati | **Media fayllarni boshqarish va optimallashtirish** | Bizga shunchaki saqlash emas, balki rasmlarni real-time optimallashtirish kerak. |
| **Rasm optimallashtirish**| Yo'q (alohida funksiya yozish kerak) | Yo'q (Lambda funksiyalari orqali amalga oshiriladi) | **URL orqali avtomatik** (o'lcham, format, sifatni o'zgartirish) | Sayt tezligini keskin oshiradi, mobil trafikni tejaydi. |
| **Format konvertatsiyasi**| Yo'q | Yo'q | **Avtomatik** (masalan, JPG'ni WebP'ga o'girish)| Eng yaxshi formatni avtomatik tanlab, sayt tezkorligini ta'minlaydi. |
| **Integratsiya** | Oson (Firebase ekotizimida) | O'rtacha (SDK orqali) | **Juda oson** (API va tayyor komponentlar) | Loyihaga tez integratsiya qilish imkonini beradi. |

Bu tahlillar "inDizayn" loyihasining talablariga Firebase va Cloudinary kombinatsiyasi eng optimal yechim ekanligini ko'rsatadi.

---

## 3. AMALIY QISM: LOYIHANI ISHLAB CHIQISH

### 3.1. Dasturiy ta'minotni ishlab chiqish texnologik stackini tanlashni ilmiy asoslash

Loyihaning muvaffaqiyati ko'p jihatdan to'g'ri tanlangan texnologiyalar to'plamiga (stack) bog'liq. "inDizayn" uchun texnologiyalarni tanlashda quyidagi mezonlarga asoslanildi: rivojlanish tezligi, masshtablanuvchanlik, real-time imkoniyatlari, hamjamiyat tomonidan qo'llab-quvvatlanishi va xarajatlar samaradorligi.

*   **Frontend (Next.js + React + TypeScript):**
    *   **React:** Komponentlarga asoslangan arxitekturasi tufayli UI'ni qayta ishlatiladigan, boshqarilishi oson bo'lgan qismlarga bo'lish imkonini beradi. Bu kodning sifati va rivojlantirish tezligini oshiradi.
    *   **Next.js:** React uchun ishlab chiqarish freymvorki bo'lib, u bir qator muhim afzalliklarga ega:
        *   **Server-Side Rendering (SSR) va Static Site Generation (SSG):** Bu qidiruv tizimlari optimizatsiyasi (SEO) uchun juda muhim, chunki sahifalar serverda tayyorlanib, qidiruv botlariga to'liq HTML-sahifa sifatida taqdim etiladi. Bu dizaynerlar profillari va loyihalarining Google kabi qidiruv tizimlarida oson topilishini ta'minlaydi.
        *   **App Router:** Fayllarga asoslangan marshrutlash (routing) tizimi kod strukturasini sodda va tushunarli qiladi.
        *   **Server Actions:** Formalarni yuborish va ma'lumotlarni o'zgartirish uchun alohida API yozish zaruratini yo'qotadi, bu esa backend mantig'ini frontend bilan birga yozish imkonini beradi.
    *   **TypeScript:** Statik tiplashtirish orqali dasturlash jarayonida yuzaga kelishi mumkin bo'lgan ko'plab xatoliklarning oldini oladi va kodni o'qish va qo'llab-quvvatlashni osonlashtiradi.

*   **Backend va Ma'lumotlar bazasi (Firebase Firestore):**
    *   **NoSQL Ma'lumotlar Bazasi:** Firestore hujjatlarga (documents) asoslangan NoSQL bazadir. Bu ijtimoiy platformalar uchun juda mos keladi, chunki ma'lumotlar strukturasi (masalan, foydalanuvchi profiliga yangi maydon qo'shish) an'anaviy SQL bazalariga qaraganda ancha moslashuvchan.
    *   **Kolleksiyalar va Hujjatlar:** `users/userID`, `projects/projectID` kabi ierarxik struktura ma'lumotlarni intuitiv tarzda tashkil etish imkonini beradi. Masalan, bir loyihaga tegishli izohlarni `projects/projectID/comments/commentID` ko'rinishida saqlash mantiqan to'g'ri va samarali.
    *   **Real-time Synchronization:** `onSnapshot` funksiyasi orqali ma'lumotlar bazasidagi har qanday o'zgarishni darhol klient tomonida aks ettirish mumkin. Bu chat va bildirishnomalar kabi funksiyalar uchun asosiy texnologiyadir.

*   **Autentifikatsiya (NextAuth.js + Firebase Authentication):**
    *   **Firebase Authentication:** Google, Facebook, email/parol kabi turli autentifikatsiya provayderlarini oson integratsiya qilish imkonini beradi. Bu xavfsiz va ishonchli yechimdir.
    *   **NextAuth.js:** Next.js ilovalari uchun maxsus ishlab chiqilgan kutubxona bo'lib, u sessiyalarni boshqarish, JWT tokenlari bilan ishlash va server tomoni himoyasini soddalashtiradi. Bizning loyihada u Firebase bilan birgalikda ishlatilib, foydalanuvchi sessiyasini Next.js serverida boshqaradi va klient tomonida Firebase'dan olingan ma'lumotlarni sinxronlaydi.

*   **Media Fayllarni Boshqarish (Cloudinary):**
    *   **On-the-fly Transformation:** Cloudinary'ning eng katta afzalligi — bu rasmlarni URL orqali real vaqt rejimida o'zgartirish imkoniyatidir. Masalan, bitta asl rasmni yuklab, uni turli o'lchamlarda (kichik thumbnail, o'rta, katta) va formatlarda (masalan, avtomatik ravishda WebP'ga o'girish) hech qanday backend kodi yozmasdan olish mumkin. Bu saytning yuklanish tezligini keskin oshiradi.
    *   **Content Delivery Network (CDN):** Barcha fayllar global CDN orqali yetkazib beriladi, bu esa dunyoning istalgan nuqtasidan fayllarning tez yuklanishini ta'minlaydi.

### 3.2. Funksionallik tahlili

Bu bo'limda platformaning asosiy funksiyalarining texnik amalga oshirilishi, xususan, Firebase Firestore'dan qanday foydalanilgani batafsil ko'rib chiqiladi.

#### Firebase Firestore Kolleksiya Tuzilishi:

*   `/users/{userId}` - Foydalanuvchilar (dizaynerlar va ish beruvchilar) profillari.
*   `/projects/{projectId}` - Dizaynerlar tomonidan yuklangan portfolio loyihalari.
*   `/projects/{projectId}/comments/{commentId}` - Muayyan loyihaga yozilgan izohlar (sub-kolleksiya).
*   `/projects/{projectId}/likes/{userId}` - Loyihani yoqtirgan foydalanuvchilar (spamga qarshi va hisob uchun).
*   `/messages/{messageId}` - Ikki foydalanuvchi o'rtasidagi xabarlar.
*   `/notifications/{notificationId}` - Foydalanuvchilar uchun bildirishnomalar (like, follow, comment, message).

#### Qidiruv/Filtrlash Algoritmlari:

Hozirgi bosqichda qidiruv va filtrlash asosan klient tomonida (client-side) amalga oshirilgan. `useCollection` hook'i orqali ma'lum bir kolleksiyadagi ma'lumotlar (masalan, barcha dizaynerlar) olinadi va keyin JavaScript `filter()` va `sort()` metodlari yordamida qayta ishlanadi.

**Texnik Talablar:**
*   `useCollection` orqali ma'lumotlarni `orderBy('subscriberCount', 'desc')` kabi birlamchi saralash bilan olish.
*   `useState` yordamida qidiruv so'zi va filtr qiymatlarini saqlash.
*   `useMemo` yordamida qidiruv/filtr natijalarini keshlash, bu esa har bir klaviatura bosilishida qayta hisoblashning oldini oladi.

**Kelajakdagi Rivojlanish:** Foydalanuvchilar soni keskin ortganda, klient tomonidagi filtrlash samarasiz bo'lib qoladi. Keyingi bosqichda Algolia yoki Elasticsearch kabi maxsus qidiruv xizmatlarini integratsiya qilish yoki Firestore'ning murakkabroq so'rov (`query`) imkoniyatlaridan foydalanish kerak bo'ladi.

#### Real-time Chat Tizimi:

Chat tizimi Firestore'ning real-time imkoniyatlariga to'liq asoslanadi.

**Texnik Talablar:**
*   Ikki foydalanuvchi (`currentUserId` va `selectedUserId`) o'rtasidagi barcha xabarlarni olish uchun `useCollection` hook'i va Firestore `query`'sidan foydalanish. So'rovda `or` va `where` operatorlari birgalikda ishlatiladi.
*   Xabarlar `createdAt` maydoni bo'yicha saralanadi.
*   Yangi xabar yuborish `addDoc` funksiyasi orqali amalga oshiriladi, `createdAt: serverTimestamp()` bilan birga.
*   Ovozli/video xabarlar avval Cloudinary'ga yuklanadi, olingan URL manzili esa Firestore'dagi `audioUrl` yoki `videoUrl` maydoniga yoziladi.
*   O'qilmagan xabarlar (`isRead: false`) `batch` yozuvlari orqali o'qilgan deb belgilanadi.
*   Yangi xabar kelganda, qabul qiluvchi uchun `/notifications` kolleksiyasiga `type: 'message'` bo'lgan yangi hujjat yaratiladi.

---

### 3.3. Diagrammalar va UML

*(Ushbu bo'limda diagrammalar matn ko'rinishida tasvirlangan. Haqiqiy diplom ishida bularni grafik vositalar yordamida chizish kerak bo'ladi).*

#### Use Case (Foydalanish Varianti) Diagrammasi:

*   **Aktorlar:**
    *   Tizimga kirmagan foydalanuvchi (Mehmon)
    *   Dizayner (Tizimga kirgan)
    *   Ish beruvchi (Kelajakdagi rol)

*   **Use Case'lar:**
    *   **Mehmon:**
        *   Saytni ko'zdan kechirish
        *   Dizaynerlar va loyihalarni qidirish
        *   Ro'yxatdan o'tish
    *   **Dizayner:**
        *   Tizimga kirish/chiqish
        *   Profilini tahrirlash (kontakt ma'lumotlarini qo'shish)
        *   Yangi loyiha yuklash
        *   O'z loyihalarini boshqarish (tahrirlash/o'chirish)
        *   Boshqa dizaynerlarga obuna bo'lish
        *   Loyihalarga like/comment qoldirish
        *   Boshqa foydalanuvchilar bilan chatda yozishish (matn, audio, video)
        *   Bildirishnomalarni ko'rish

#### Database ER (Entity-Relationship) Diagrammasi (Firestore uchun):

```
[User] --< (has many) -- [Project]
  | 1..*     |
  |          (designerId)
  |
  `--< (follows) >-- [User] (followers array)

[Project] --< (has many) -- [Comment]
  |
  `--< (liked by) >-- [User] (likes array)

[User] --< (sends/receives) >-- [Message]

[User] --< (receives) -- [Notification]
```
**Izoh:** Bu an'anaviy ER diagramma emas, balki Firestore'ning kolleksiya va hujjatlar munosabatini ifodalovchi sxema. Munosabatlar to'g'ridan-to'g'ri `reference`lar orqali emas, balki `ID`larni saqlash orqali amalga oshiriladi.

---

### 3.4. Amaliy qismdan namunalar

*(Ushbu bo'limda loyihadan olingan kod parchalari va interfeys skrinshotlari (matnli tasviri) keltiriladi).*

#### React Komponenti (`PortfolioCard.tsx`):
Bu komponent bitta loyihani kartochka ko'rinishida aks ettiradi.
*   Yuqori qism: Loyihaning asosiy rasmi (`Image`), `like` va `view` sonlari.
*   Pastki qism: Loyiha nomi, dizayner avatari va ismi, mutaxassisligi (`Badge`).

```jsx
// src/components/portfolio-card.tsx
// ... (imports)
export default function PortfolioCard({ project }) {
  // ... (hooks)
  return (
    <Card>
      <CardContent>
        <Image src={project.imageUrl} alt={project.name} />
        <div>
          <span>{project.likeCount}</span>
          <span>{project.viewCount}</span>
        </div>
      </CardContent>
      <div>
        <h3>{project.name}</h3>
        <div>
          <Avatar src={designer.photoURL} />
          <span>{designer.name}</span>
          <Badge>{designer.specialization}</Badge>
        </div>
      </div>
    </Card>
  );
}
```

#### Firebase Xavfsizlik Qoidalari (`firestore.rules`) Test Rejasi

Xavfsizlik qoidalarini testlash uchun Firebase Emulator Suite'dan foydalaniladi.

**Test holatlari:**
1.  **Foydalanuvchilar (`users`):**
    *   Foydalanuvchi faqat o'z profilini tahrirlay olishini tekshirish.
    *   Autentifikatsiyadan o'tgan har qanday foydalanuvchi boshqalarning profilini o'qiy olishini tekshirish.
    *   Autentifikatsiyadan o'tmagan foydalanuvchi hech qaysi profilni o'zgartira olmasligini tekshirish.
2.  **Loyihalar (`projects`):**
    *   Faqat loyiha egasi uni o'chirishi yoki tahrirlashi mumkinligini tekshirish.
    *   Har qanday autentifikatsiyadan o'tgan foydalanuvchi `like` qo'sha olishini tekshirish.
    *   `likeCount` va `viewCount`ni to'g'ridan-to'g'ri o'zgartirish mumkin emasligini, faqat `increment` orqali o'zgartirish mumkinligini tekshirish.
3.  **Xabarlar (`messages`):**
    *   Faqat xabar yuboruvchi va qabul qiluvchigina xabarni o'qiy olishini tekshirish.

---

## 4. XULOSA VA TAVSIYALAR

Ushbu bitiruv malakaviy ishi doirasida "inDizayn" deb nomlangan, dizaynerlar uchun ixtisoslashtirilgan portfolio platformasi muvaffaqiyatli ishlab chiqildi. Tadqiqot va amaliyot natijasida quyidagi xulosalarga kelindi:

1.  **Texnologik Samaradorlik:** Next.js, Firebase va Cloudinary kabi zamonaviy, serverless texnologiyalar to'plamini tanlash loyihani ishlab chiqish vaqtini sezilarli darajada qisqartirdi. Firebase'ning real-time ma'lumotlar bazasi va autentifikatsiya xizmatlari an'anaviy backend yozishga ketadigan oylik mehnatni tejashga imkon berdi.
2.  **Iqtisodiy Samaradorlik:** Firebase'ning "foydalanganingcha to'la" (pay-as-you-go) narxlash modeli loyihaning boshlang'ich va operatsion xarajatlarini minimallashtiradi. Doimiy serverlarni ijaraga olish va ularni boshqarish zarurati yo'qligi startaplar uchun moliyaviy jihatdan eng maqbul yondashuv ekanligini isbotladi.
3.  **Foydalanuvchi Tajribasi (UX) va Tezkorlik:** Cloudinary servisining tasvirlarni real-time optimallashtirish va CDN orqali yetkazib berish funksiyasi saytning yuklanish tezligini keskin oshirdi. Bu, ayniqsa, mobil qurilmalar va internet tezligi past bo'lgan hududlardagi foydalanuvchilar uchun yuqori sifatli tajribani ta'minlaydi.
4.  **Jamiyat uchun Foyda:** "inDizayn" platformasi O'zbekiston dizaynerlari uchun o'z iste'dodini namoyon qilish, hamkasblari bilan muloqot qilish va yangi ish imkoniyatlarini topish uchun yagona raqamli ekotizim yaratadi. Bu esa mamlakatda kreativ sohaning rivojlanishiga ijobiy turtki beradi.

**Kelajakda rivojlantirish imkoniyatlari:**
*   **Ish beruvchilar uchun maxsus kabinet** va vakansiyalar joylashtirish funksiyasini qo'shish.
*   **Monetizatsiya modellarini joriy etish:** "Premium" profil, loyihalarni yuqoriga chiqarish xizmati.
*   **Algolia kabi qidiruv tizimlarini integratsiya qilish** orqali yanada kuchli va tezkor qidiruv imkoniyatini yaratish.
*   Onlayn tanlovlar va master-klasslar o'tkazish uchun modullar qo'shish.

Ushbu loyiha ustida ishlash jarayonida zamonaviy veb-dasturlash, serverless arxitektura, NoSQL ma'lumotlar bazalarini loyihalash va real-time tizimlarni qurish bo'yicha chuqur nazariy va amaliy bilim va ko'nikmalarga ega bo'lindi.
