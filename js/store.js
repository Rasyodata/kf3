/* ============================================================
   SahaPro — Veri Katmanı (localStorage tabanlı)
   ============================================================ */
const DB_KEY = 'sahapro_db_v5';
const SESSION_KEY = 'sahapro_session_v1';

const todayISO = (d = new Date()) => d.toISOString().slice(0, 10);
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return todayISO(d); };

/* ---- İş Aşamaları (WBS) — inşaat taahhüt iş akışı ---- */
const PHASES = [
  { id: 'ph1', no: 1, name: 'Projelendirme ve Ruhsat', icon: '📐', color: '#a78bfa', subs: [
    { id: 's1a', name: 'İmar durumu analizi ve zemin etüdü' },
    { id: 's1b', name: 'Mimari, statik, elektrik ve mekanik projelerin çizilmesi' },
    { id: 's1c', name: 'Yapı ruhsatının (inşaat izni) alınması' },
  ]},
  { id: 'ph2', no: 2, name: 'Şantiye Kurulumu ve Mobilizasyon', icon: '🚧', color: '#f4c150', subs: [
    { id: 's2a', name: 'Arsa temizliği ve çevre güvenliği (çit, tabela)' },
    { id: 's2b', name: 'Konteyner, geçici elektrik ve su hatlarının kurulması' },
    { id: 's2c', name: 'İş güvenliği (İSG) önlemlerinin alınması' },
  ]},
  { id: 'ph3', no: 3, name: 'Altyapı ve Hafriyat İşleri', icon: '🚜', color: '#ff8a65', subs: [
    { id: 's3a', name: 'Arazi aplikasyonu (sınırların belirlenmesi)' },
    { id: 's3b', name: 'Hafriyat (kazı) ve toprağın taşınması' },
    { id: 's3c', name: 'İksa, iksa kazıkları veya istinat duvarı' },
  ]},
  { id: 'ph4', no: 4, name: 'Kaba Yapı (Taşıyıcı Sistem)', icon: '🏗️', color: '#ff7a18', subs: [
    { id: 's4a', name: 'Grobeton dökümü ve temel yalıtımı (izolasyon)' },
    { id: 's4b', name: 'Temel demir bağlama ve temel betonu dökümü' },
    { id: 's4c', name: 'Betonarme/çelik karkas (kolon, kiriş, perde, döşeme)' },
    { id: 's4d', name: 'Dış ve iç duvar örümü (tuğla, gazbeton, bims)' },
    { id: 's4e', name: 'Çatı karkası, yalıtımı ve kaplaması' },
  ]},
  { id: 'ph5', no: 5, name: 'İnce Yapı ve Tesisat (Bitirme)', icon: '🔧', color: '#29b6f6', subs: [
    { id: 's5a', name: 'Mekanik tesisat (temiz/pis su, kalorifer, havalandırma, yangın)' },
    { id: 's5b', name: 'Elektrik tesisatı (kablo kanalı, boru, buat)' },
    { id: 's5c', name: 'Sıva (kara/alçı sıva) ve şap betonu dökümü' },
    { id: 's5d', name: 'Doğrama (pencere ve dış kapılar)' },
    { id: 's5e', name: 'Mantolama (ısı/su yalıtımı) ve dış cephe' },
    { id: 's5f', name: 'Zemin ve duvar kaplama (seramik, parke, mermer)' },
    { id: 's5g', name: 'İç kapı, mutfak/banyo dolabı, vitrifiye montajı' },
    { id: 's5h', name: 'Son kat boya, aydınlatma armatürü ve priz' },
  ]},
  { id: 'ph6', no: 6, name: 'Çevre Düzenleme ve Peyzaj', icon: '🌳', color: '#2ecc71', subs: [
    { id: 's6a', name: 'Atık temizliği ve konteynerlerin kaldırılması' },
    { id: 's6b', name: 'Bahçe duvarı, yürüyüş yolu, otopark' },
    { id: 's6c', name: 'Yeşillendirme, ağaçlandırma, bahçe aydınlatması' },
  ]},
  { id: 'ph7', no: 7, name: 'Kabul, İskan ve Teslim', icon: '🔑', color: '#26c6da', subs: [
    { id: 's7a', name: 'Yapı denetim ve belediye kontrolleri' },
    { id: 's7b', name: 'Yapı kullanma izin belgesi (İskan) alınması' },
    { id: 's7c', name: 'Anahtar tesliminin gerçekleştirilmesi' },
  ]},
];
const PHASE_SUBS = PHASES.flatMap(ph => ph.subs.map(s => ({ ...s, phaseId: ph.id, phaseNo: ph.no })));
const subById = (id) => PHASE_SUBS.find(s => s.id === id);
const phaseById = (id) => PHASES.find(p => p.id === id);

/* ---- Tohum (seed) verisi ---- */
function seedData() {
  const users = [
    { id: 'u1', name: 'Murat Gençtürk', email: 'murat@emgimar.com', pass: '1234', role: 'yetkili',  title: 'İnşaat Mühendisi / Şirket Yetkilisi', phone: '0555 859 13 64', color: '#ff7a18' },
    { id: 'u2', name: 'Fatih Gençtürk', email: 'fatih@emgimar.com', pass: '1234', role: 'muhendis', title: 'İnşaat Mühendisi / Proje Müdürü',      phone: '0538 768 12 08', color: '#29b6f6' },
    { id: 'u3', name: 'Hasan Yıldırım', email: 'sef@emgimar.com',   pass: '1234', role: 'muhendis', title: 'Şantiye Şefi',                     phone: '0532 210 44 55', color: '#a78bfa' },
    { id: 'u4', name: 'Ahmet Demir',    email: 'saha@emgimar.com',  pass: '1234', role: 'muhendis', title: 'Saha Mühendisi',                   phone: '0532 330 66 77', color: '#2ecc71' },
    { id: 'u5', name: 'Ramazan Çelik',  email: 'usta@emgimar.com',  pass: '1234', role: 'calisan',  title: 'Kalıp Ustası',                     phone: '0533 411 22 33', color: '#f4c150' },
    { id: 'u6', name: 'Yusuf Aydın',    email: 'yusuf@emgimar.com', pass: '1234', role: 'calisan',  title: 'Demir Ustası',                     phone: '0533 522 33 44', color: '#ef5b5b' },
    { id: 'u7', name: 'Osman Şahin',    email: 'osman@emgimar.com', pass: '1234', role: 'calisan',  title: 'Sıva / Mantolama Ustası',          phone: '0533 633 44 55', color: '#26c6da' },
    { id: 'u8', name: 'Kemal Doğan',    email: 'kemal@emgimar.com', pass: '1234', role: 'calisan',  title: 'Beton / Kalıp Ekip Başı',          phone: '0534 744 55 66', color: '#ff8a65' },
    { id: 'u9', name: 'İbrahim Yılmaz', email: 'ibrahim@emgimar.com',pass: '1234', role: 'calisan', title: 'Boya Ustası',                      phone: '0534 855 66 77', color: '#9ccc65' },
    { id: 'u10', name: 'Selim Kaya',    email: 'selim@emgimar.com', pass: '1234', role: 'calisan',  title: 'İş Makinesi Operatörü',            phone: '0534 966 77 88', color: '#ba68c8' },
    { id: 'u12', name: 'Elif Şahin',    email: 'muhasebe@emgimar.com',pass: '1234',role: 'muhasebe', title: 'Muhasebe & Finans Sorumlusu',      phone: '0536 120 45 67', color: '#20c997' },
    { id: 'u11', name: 'Deniz Üye',     email: 'uye@emgimar.com',   pass: '1234', role: 'uye',      title: 'Üye (Proje Takip)',                phone: '0535 000 00 00', color: '#78909c' },
  ];

  const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=60`;
  const COVERS = [
    'photo-1503387762-592deb58ef4e','photo-1486406146926-c627a92ad1ab','photo-1512917774080-9991f1c4c750',
    'photo-1519494026892-80bbd2d6fd0d','photo-1581092160562-40aa08e78837','photo-1449824913935-59a10b8d2000',
    'photo-1565636285505-a392bb733492','photo-1590274853856-f22d5ee3d228',
  ];

  // EMG İmar gerçek proje portföyü (PDF): [ad, işveren, konum, tür, durum, ilerleme%, altbaşlık, kapsam, bütçe]
  const rows = [
    // DEVAM EDEN PROJELER
    ['EN Yapı The En Residence Projesi','EN Yapı','Kocasinan, Kayseri','Konut','devam',62,'7 Blok Konut + 1 Blok Ofis · 59.000 m²','Malzemeli kaba inşaat, kalıp ve demir yapılması işleri',185000000],
    ['Kaynak İnşaat Point 17 İnşaatı','Kaynak İnşaat','Melikgazi, Kayseri','Konut','devam',55,'3 Blok · Bodrum, Zemin + 9 Normal Kat','Duvar ve kaba sıva; alçı sıva, saten alçı, boya; cephe mantolama ve boya işleri',72000000],
    ['Fikret Özdin Kazım Karabekir Kentsel Dönüşüm','Fikret Özdin','Kocasinan, Kayseri','Kentsel Dönüşüm','devam',40,'3 Blok · Bodrum, Zemin + 9 Normal Kat','Malzemeli kaba inşaat, kalıp ve demir yapılması işleri',96000000],
    ['Fikret Özdin Çay Bağları Villaları','Fikret Özdin','Talas, Kayseri','Villa','devam',35,'4 Adet Villa','Malzemeli kaba inşaat, kalıp ve demir yapılması işleri',28000000],
    ['Çınar İnşaat Erkilet Projesi','Çınar İnşaat','Erkilet, Kayseri','Konut','devam',20,'Bodrum, Zemin + 9 Normal Kat','Kalıp yapılması işleri',34000000],
    // BİTEN PROJELER
    ['Karademir İnşaat Kıranardı Villaları','Karademir İnşaat','Talas, Kayseri','Villa','tamamlandi',100,'Bodrum + Zemin + 1 Normal Kat','Kaba inşaat; kalıp, demir ve beton işleri',24000000],
    ['Karademir İnşaat Şehir Hastanesi Bir Blok','Karademir İnşaat','Kocasinan, Kayseri','Kamu (Sağlık)','tamamlandi',100,'Bodrum + Zemin + 9 Normal Kat','Kaba inşaat; kalıp, demir ve beton işleri',68000000],
    ['Karademir İnşaat Beyaz Şehir Bir Blok','Karademir İnşaat','Melikgazi, Kayseri','Konut','tamamlandi',100,'Bodrum + Zemin + 13 Normal Kat','Kaba inşaat; kalıp, demir ve beton işleri',58000000],
    ['Karademir İnşaat Becen Villaları','Karademir İnşaat','Talas, Kayseri','Villa','tamamlandi',100,'Bodrum + Zemin + 1 Normal Kat','Kaba inşaat; kalıp, demir ve beton işleri',22000000],
    ['Mehmet Karademir & MBK İnşaat Talas Bir Blok','MBK İnşaat','Talas, Kayseri','Konut','tamamlandi',100,'Bodrum + Zemin + 9 Normal Kat','Kaba inşaat; kalıp, demir ve beton işleri',46000000],
    ['Eşal İnşaat Bir Blok İnşaatı','Eşal İnşaat','Kocasinan, Kayseri','Konut','tamamlandi',100,'Bodrum + Zemin + 6 Normal Kat','Kaba inşaat; kalıp, demir ve beton işleri',30000000],
    ['Yılboğa İnşaat Bir Blok İnşaatı','Yılboğa İnşaat','Melikgazi, Kayseri','Konut','tamamlandi',100,'Bodrum + Zemin + Asma + 11 Normal Kat','Kaba inşaat; kalıp, demir ve beton işleri',52000000],
    ['Orhan İnşaat Belsin 1 Bir Blok','Orhan İnşaat','Kocasinan, Kayseri','Konut','tamamlandi',100,'Bodrum + Zemin + 13 Normal Kat','Kaba inşaat; kalıp, demir ve beton işleri',55000000],
    ['Orhan İnşaat Belsin 2 Bir Blok','Orhan İnşaat','Kocasinan, Kayseri','Konut','tamamlandi',100,'Bodrum + Zemin + 10 Normal Kat','Kaba inşaat; kalıp, demir ve beton işleri',44000000],
    ['Yoka İnşaat Esentepe Bir Blok','Yoka İnşaat','Melikgazi, Kayseri','Konut','tamamlandi',100,'Bodrum + Zemin + 11 Normal Kat','Kaba inşaat; kalıp, demir ve beton işleri',48000000],
    ['Dulda İnşaat Sardunya Projesi','Dulda İnşaat','Talas, Kayseri','Konut','tamamlandi',100,'Bodrum + Zemin + 9 Normal Kat','Duvar yapılması işleri',12000000],
    ['Dulda İnşaat Liva Projesi','Dulda İnşaat','Talas, Kayseri','Konut','tamamlandi',100,'Bodrum + Zemin + 5 Normal Kat + Çatı','Duvar yapılması işleri',9000000],
    ['Ella Yapı Talas Projesi','Ella Yapı','Talas, Kayseri','Konut','tamamlandi',100,'Bodrum + Zemin + 8 Normal Kat + Çatı','Kalıp, demir; duvar; alçı sıva, saten, boya, mantolama ve kara sıva işleri',40000000],
    ['Dekopark İnşaat İşyeri İnşaatı','Dekopark İnşaat','Kocasinan, Kayseri','Ticari','tamamlandi',100,'Bodrum, Zemin + 2 Normal Kat','Kalıp, demir; duvar, kaba sıva; alçı sıva, saten; cephe mantolama ve boya işleri',18000000],
    ['Erkilet Adalet Villaları (28 Adet)','Adalet Yapı','Erkilet, Kayseri','Villa','tamamlandi',100,'Zemin + 1 Normal Kat','Duvar; alçı sıva, saten; cephe mantolama ve boya işleri',42000000],
    ['Kam Mimarlık Nish Garden Villaları (7 Adet)','Kam Mimarlık','Talas, Kayseri','Villa','tamamlandi',100,'Zemin + 1 Normal Kat','Duvar yapılması işleri',15000000],
    ['Yaba Mimarlık Loca Becen Villaları','Yaba Mimarlık','Talas, Kayseri','Villa','tamamlandi',100,'8 + 2 Adet Villa','Duvar; kara sıva, alçı sıva ve boya; dış cephe mantolama işleri',26000000],
    ['Yılboğa İnşaat Sağlık Ocağı İnşaatı','Yılboğa İnşaat','Kayseri','Kamu (Sağlık)','tamamlandi',100,'Sağlık Ocağı','Kaba inşaat; kalıp, demir, beton ve duvar işleri',20000000],
    ['Eylül İnşaat Projesi','Eylül İnşaat','Melikgazi, Kayseri','Konut','tamamlandi',100,'Zemin + 14 Normal Kat','İç kara/kaba/ince sıva; alçı sıva ve boya; cephe boya ve mantolama; ıslak zeminler',60000000],
    ['Şahin İnşaat Projesi','Şahin İnşaat','Kocasinan, Kayseri','Konut','tamamlandi',100,'Zemin + Asma Kat + 7 Normal Kat','İç kara/kaba/ince sıva; alçı sıva; duvar işleri (tüm blok)',33000000],
    ['TEOB Yapı Bünyan Toprak Projesi','TEOB Yapı','Bünyan, Kayseri','Konut','tamamlandi',100,'Toprak Projesi','Kaba inşaat; kalıp, demir ve beton işleri',25000000],
    ['Özel Akaryakıt İstasyonu İnşaatı','Özel','Kayseri','Endüstriyel','tamamlandi',100,'Akaryakıt İstasyonu','Kaba inşaat; kalıp, demir ve beton işleri',14000000],
    ['Kayseri Şeker Fabrikası Gemerek Akaryakıt İstasyonu','Kayseri Şeker Fabrikası','Gemerek, Sivas','Endüstriyel','tamamlandi',100,'Akaryakıt İstasyonu','Kaba inşaat; kalıp, demir ve beton işleri',16000000],
    ['Vol Yapı İnşaat Villaları','Vol Yapı İnşaat','Talas, Kayseri','Villa','tamamlandi',100,'Villa Projesi','Kaba inşaat; kalıp, demir, beton ve duvar işleri',30000000],
    ['Çağan Grup Kepez 24 Derslikli Okul','Çağan Grup','Kayseri','Kamu (Eğitim)','tamamlandi',100,'Bodrum + Zemin + 3 Normal Kat · 24 Derslik','Kaba inşaat; kalıp, demir ve beton işleri',38000000],
    ['Niğde Gümüştaş Madencilik Silo İnşaatı','Gümüştaş Madencilik / Can Ataklı İnş.','Niğde','Endüstriyel','tamamlandi',100,'Silo İnşaatı','Kaba inşaat; kalıp, demir ve beton işleri',22000000],
    ['Sivas Demirağ Organize Genç Tekstil Temel','Genç Tekstil','Sivas OSB','Endüstriyel','tamamlandi',100,'Temel İnşaatı','Temel kaba inşaat; kalıp, demir ve beton işleri',19000000],
    ['Sivas Türk Telekom Binası İnşaatı','Türk Telekom','Sivas','Kamu','tamamlandi',100,'Telekom Binası','Bina iç ve dış tadilat işleri',7000000],
    ['Ürgüp Afet Konutları İnşaatı','Kamu','Ürgüp, Nevşehir','Kamu (Konut)','tamamlandi',100,'Afet Konutları','Kalıp, demir, beton ve briket duvar işleri',34000000],
    ['Sivas İmranlı Mandıra Tesisleri İnşaatı','Özel','İmranlı, Sivas','Endüstriyel (Tarım)','tamamlandi',100,'Mandıra Tesisi','Kalıp, demir ve beton işleri',11000000],
    ['Sivas İmranlı Belediyesi Düğün Salonu','İmranlı Belediyesi','İmranlı, Sivas','Kamu','tamamlandi',100,'Düğün Salonu','Kalıp, demir ve beton işleri',9000000],
    ['Sivas Altınyayla Belediyesi İş Merkezi','Altınyayla Belediyesi','Altınyayla, Sivas','Ticari','tamamlandi',100,'İş Merkezi','Kalıp, demir ve beton işleri',13000000],
    ['Sivas TCDD Sanat Yapıları (110 km)','TCDD','Sivas','Altyapı','tamamlandi',100,'110 km İçerisindeki Sanat Yapıları','Kalıp, demir ve beton işleri',45000000],
    ['Sivas TCDD Köprü İnşaatı','TCDD','Sivas','Altyapı','tamamlandi',100,'Köprü İnşaatı','Kalıp, demir ve beton işleri',28000000],
    ['Sivas TCDD Yeşilyurt İstasyon İnşaatı','TCDD','Yeşilyurt, Sivas','Altyapı','tamamlandi',100,'İstasyon İnşaatı','Kalıp, demir ve beton işleri',17000000],
    ['Sivas Mimarsinan İlköğretim Okulu','Milli Eğitim Bakanlığı','Sivas','Kamu (Eğitim)','tamamlandi',100,'İlköğretim Okulu','Kalıp, demir ve beton işleri',15000000],
  ];

  // Detay erişimi olan mühendisler (proje bazlı yetki tohumu)
  const engineerIds = users.filter(u => u.role === 'muhendis' || u.role === 'yetkili').map(u => u.id);
  const pad = (n) => String(n).padStart(2, '0');
  // Tahmini inşaat alanı (m²) — altbaşlıktaki kat/blok/adet bilgisinden türetilir
  const estArea = (subtitle, type, i) => {
    const s = subtitle || '';
    const mM2 = s.match(/([\d.]+)\s*m²/i);
    if (mM2) return parseInt(mM2[1].replace(/\./g, ''), 10); // ör. "59.000 m²" -> 59000
    const perFloor = { 'Konut': 720, 'Kentsel Dönüşüm': 720, 'Ticari': 900, 'Kamu': 850, 'Kamu (Sağlık)': 950, 'Kamu (Eğitim)': 900, 'Kamu (Konut)': 700, 'Endüstriyel': 1200, 'Endüstriyel (Tarım)': 800, 'Villa': 260, 'Altyapı': 500 }[type] || 700;
    const adet = s.match(/(\d+)\s*(\+\s*\d+\s*)?Adet/i);
    if ((type === 'Villa' || /Villa/i.test(s)) && adet) {
      const nums = (adet[0].match(/\d+/g) || ['1']).map(Number);
      const count = nums.reduce((a, b) => a + b, 0);
      return count * perFloor * 2; // villa: ~2 kat
    }
    const blok = s.match(/(\d+)\s*Blok/i);
    const blocks = blok ? parseInt(blok[1], 10) : 1;
    const katNums = [...s.matchAll(/(\d+)\.?\s*(?:Normal\s*)?Kat/gi)].map(m => parseInt(m[1], 10));
    let floors = katNums.length ? Math.max(...katNums) : 6;
    if (/Bodrum/i.test(s)) floors += 1;
    if (/Zemin/i.test(s)) floors += 1;
    if (/Asma/i.test(s)) floors += 1;
    if (/Çatı/i.test(s)) floors += 1;
    const base = katNums.length ? blocks * floors * perFloor : perFloor * (blocks + 4); // kat bilgisi yoksa kaba tahmin
    return Math.round(base / 50) * 50;
  };
  const projects = rows.map((r, i) => {
    const [name, client, location, type, status, progress, subtitle, scope, budget] = r;
    const mgr = ['u2','u3','u4'][i % 3];
    const team = [...new Set([mgr, 'u' + (5 + (i % 6)), 'u' + (5 + ((i + 2) % 6)), 'u' + (5 + ((i + 4) % 6))])];
    const spent = status === 'tamamlandi' ? Math.round(budget * (0.95 + (i % 5) * 0.01)) : Math.round(budget * progress / 100);
    const startY = status === 'devam' ? 2024 : (2020 + (i % 5));
    const endY = status === 'devam' ? (2026 + (i % 2)) : (startY + 1 + (i % 2));
    return {
      id: 'p' + (i + 1),
      code: 'EMG-' + startY + '-' + pad(i + 1),
      name, client, location, type, status, progress,
      budget, spent, area: estArea(subtitle, type, i),
      start: `${startY}-${pad((i % 9) + 1)}-01`,
      end: `${endY}-${pad(((i + 5) % 12) + 1)}-28`,
      manager: mgr, team, subtitle,
      access: [...new Set([mgr, ...team.filter(id => engineerIds.includes(id))])], // sadece mühendisler + yönetici; üye/çalışan admin onayıyla eklenir
      desc: `${subtitle ? subtitle + '. ' : ''}Yapılan işler: ${scope}.`,
      scope,
      cover: img(COVERS[i % COVERS.length]),
    };
  });

  const mkTask = (id, pid, title, assignee, date, status, prio, desc, s='08:00', e='17:00') =>
    ({ id, projectId: pid, title, assignee, date, status, priority: prio, desc, start: s, end: e });
  const tasks = [
    mkTask('t1','p1','The En Residence — 7. kat kolon demir montajı','u6', addDays(0),'devam','high','A Blok 7. kat kolon demirleri.'),
    mkTask('t2','p1','The En Residence — döşeme kalıbı sökümü','u5', addDays(0),'devam','mid','B Blok 5. kat döşeme kalıp söküm.','08:00','12:00'),
    mkTask('t3','p1','Ofis bloğu — beton dökümü organizasyonu','u3', addDays(2),'bekliyor','high','Pompa+mikser 06:00 sevk.','06:00','14:00'),
    mkTask('t4','p2','Point 17 — cephe mantolama uygulaması','u7', addDays(0),'devam','mid','2. blok kuzey cephe mantolama.'),
    mkTask('t5','p2','Point 17 — 4. kat alçı sıva','u7', addDays(1),'bekliyor','mid','Islak hacim alçı sıva.'),
    mkTask('t6','p2','Point 17 — saten alçı ve boya','u9', addDays(3),'bekliyor','low','3. kat daireleri saten + boya.'),
    mkTask('t7','p3','Kazım Karabekir — temel demir bağlama','u6', addDays(0),'devam','high','C Blok temel demir bağlama.'),
    mkTask('t8','p3','Kazım Karabekir — malzeme teslim (demir)','u8', addDays(1),'bekliyor','high','24 ton nervürlü demir teslim/sayım.'),
    mkTask('t9','p4','Çay Bağları — villa 2 kalıp montajı','u5', addDays(0),'devam','mid','Villa 2 perde kalıbı.'),
    mkTask('t10','p4','Çay Bağları — villa 3 demir montajı','u6', addDays(2),'bekliyor','mid','Villa 3 kolon-kiriş demir.'),
    mkTask('t11','p5','Erkilet — bodrum kat kalıp işleri','u5', addDays(1),'bekliyor','mid','Bodrum perde kalıp.'),
    mkTask('t12','p5','Erkilet — İSG saha denetimi','u4', addDays(0),'bekliyor','high','Aylık İSG denetim turu.','10:00','12:00'),
    mkTask('t13','p1','Hakediş dosyası hazırlama (aylık)','u2', addDays(4),'bekliyor','mid','Dönem hakediş evrakı.'),
    mkTask('t14','p2','Kule vinç periyodik bakımı','u10', addDays(5),'bekliyor','mid','3 aylık vinç bakımı.'),
  ];

  const mkMat = (id, pid, phaseId, name, unit, required, inStock, note='') =>
    ({ id, projectId: pid, phaseId, name, unit, required, inStock, note });
  const materials = [
    mkMat('m1','p1','ph4','C30 Hazır Beton','m³', 320, 320, ''),
    mkMat('m2','p1','ph4','Nervürlü İnşaat Demiri Ø14','ton', 42, 12, 'Acil sipariş gerekli'),
    mkMat('m3','p1','ph4','Kalıp Kontrplak (18 mm)','adet', 900, 380, '7. kat için yetersiz'),
    mkMat('m4','p2','ph5','Alçı Sıva Torbası','adet', 1600, 1600, ''),
    mkMat('m5','p2','ph5','Mantolama EPS Levha (5 cm)','m²', 2800, 900, 'Kuzey cephe için eksik'),
    mkMat('m6','p2','ph5','Saten Alçı','kg', 1200, 1200, ''),
    mkMat('m7','p2','ph5','Dış Cephe Boyası','kg', 700, 250, ''),
    mkMat('m8','p3','ph4','Nervürlü İnşaat Demiri Ø16','ton', 60, 0, 'KRİTİK — stok yok'),
    mkMat('m9','p3','ph4','C30 Hazır Beton','m³', 240, 80, 'Temel dökümü için eksik'),
    mkMat('m10','p4','ph4','Kalıp Kerestesi','m³', 45, 45, ''),
    mkMat('m11','p4','ph4','Bağ Teli','kg', 500, 120, ''),
    mkMat('m12','p5','ph4','Kalıp Kontrplak (18 mm)','adet', 400, 400, ''),
    mkMat('m13','p5','ph2','İSG Ekipmanı (baret/yelek)','set', 40, 28, ''),
  ];

  const attendance = {};
  const workers = users.filter(u => u.role === 'calisan');
  for (let i = 1; i <= 10; i++) {
    const day = addDays(-i);
    workers.forEach((w, idx) => {
      let st = 'tam';
      if ((i + idx) % 9 === 0) st = 'izin';
      else if ((i + idx) % 7 === 0) st = 'yok';
      else if ((i + idx) % 5 === 0) st = 'yarim';
      attendance[`${w.id}_${day}`] = st;
    });
  }

  const activity = [
    { id: 'a1', text: '<b>Fatih Gençtürk</b> "Point 17 — hafriyat nakliyesi" işini tamamladı', proj: 'Kaynak İnşaat Point 17', time: '2 saat önce', user: 'u2' },
    { id: 'a2', text: '<b>Hasan Yıldırım</b> "The En Residence — 6. kat beton dökümü" görevini oluşturdu', proj: 'EN Yapı The En Residence', time: '4 saat önce', user: 'u3' },
    { id: 'a3', text: '<b>Ahmet Demir</b> Çay Bağları villa 2 kalıp işlerini başlattı', proj: 'Fikret Özdin Çay Bağları', time: '5 saat önce', user: 'u4' },
    { id: 'a4', text: '<b>Ramazan Çelik</b> günlük puantaj bildirimini yaptı', proj: '—', time: 'Dün', user: 'u5' },
    { id: 'a5', text: '<b>Murat Gençtürk</b> "Çınar İnşaat Erkilet" projesini sisteme ekledi', proj: 'Çınar İnşaat Erkilet', time: '2 gün önce', user: 'u1' },
  ];

  return { users, projects, tasks, attendance, activity, materials };
}

/* ---- Store ---- */
const Store = {
  db: null,
  load() {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) { try { this.db = JSON.parse(raw); } catch { this.db = seedData(); this.save(); } }
    else { this.db = seedData(); this.save(); }
    return this.db;
  },
  save() { localStorage.setItem(DB_KEY, JSON.stringify(this.db)); },
  reset() { this.db = seedData(); this.save(); },

  // Kullanıcı / oturum
  users: () => Store.db.users,
  userById: (id) => Store.db.users.find(u => u.id === id),
  authenticate(email, pass) {
    const u = Store.db.users.find(x => x.email.toLowerCase() === email.toLowerCase().trim() && x.pass === pass);
    return u || null;
  },
  getSession() { const id = localStorage.getItem(SESSION_KEY); return id ? Store.userById(id) : null; },
  setSession(id) { localStorage.setItem(SESSION_KEY, id); },
  clearSession() { localStorage.removeItem(SESSION_KEY); },

  // Projeler
  projects: () => Store.db.projects,
  projectById: (id) => Store.db.projects.find(p => p.id === id),
  addProject(p) { p.id = 'p' + Date.now(); Store.db.projects.unshift(p); Store.save(); return p; },
  updateProject(id, patch) { Object.assign(Store.projectById(id), patch); Store.save(); },
  deleteProject(id) {
    Store.db.projects = Store.db.projects.filter(p => p.id !== id);
    Store.db.tasks = Store.db.tasks.filter(t => t.projectId !== id);
    Store.save();
  },

  // Görevler
  tasks: () => Store.db.tasks,
  tasksByProject: (pid) => Store.db.tasks.filter(t => t.projectId === pid),
  tasksByUser: (uid) => Store.db.tasks.filter(t => t.assignee === uid),
  addTask(t) { t.id = 't' + Date.now(); Store.db.tasks.unshift(t); Store.save(); return t; },
  updateTask(id, patch) { const t = Store.db.tasks.find(x => x.id === id); if (t) { Object.assign(t, patch); Store.save(); } },
  deleteTask(id) { Store.db.tasks = Store.db.tasks.filter(t => t.id !== id); Store.save(); },

  // Puantaj
  attendance: () => Store.db.attendance,
  setAttendance(uid, date, status) { Store.db.attendance[`${uid}_${date}`] = status; Store.save(); },
  getAttendance(uid, date) { return Store.db.attendance[`${uid}_${date}`] || null; },

  // Malzeme / stok
  materials: () => Store.db.materials || (Store.db.materials = []),
  materialsByProject: (pid) => Store.materials().filter(m => m.projectId === pid),
  materialStatus(m) {
    if (m.inStock <= 0 && m.required > 0) return 'kritik';
    if (m.inStock < m.required) return 'eksik';
    return 'yeterli';
  },
  missingMaterials: () => Store.materials().filter(m => m.inStock < m.required),
  addMaterial(m) { m.id = 'm' + Date.now(); Store.materials().push(m); Store.save(); return m; },
  updateMaterial(id, patch) { const m = Store.materials().find(x => x.id === id); if (m) { Object.assign(m, patch); Store.save(); } },
  deleteMaterial(id) { Store.db.materials = Store.materials().filter(m => m.id !== id); Store.save(); },

  // İş aşamaları (WBS) — proje ilerlemesinden türetilir, override project.wbs ile kalıcı
  projectWbs(pid) {
    const p = Store.projectById(pid); if (!p) return {};
    const total = PHASE_SUBS.length;
    const doneCount = Math.round((p.progress / 100) * total);
    const state = {};
    PHASE_SUBS.forEach((s, i) => { state[s.id] = i < doneCount ? 'done' : (i === doneCount && p.progress > 0 && p.progress < 100 ? 'active' : 'pending'); });
    if (p.wbs) Object.assign(state, p.wbs);
    return state;
  },
  setWbs(pid, subId, status) {
    const p = Store.projectById(pid); if (!p) return;
    p.wbs = p.wbs || {};
    p.wbs[subId] = status;
    Store.save();
  },

  // Teklif talepleri (kesin hesap)
  quotes: () => Store.db.quotes || (Store.db.quotes = []),
  addQuote(q) { q.id = 'q' + Date.now(); q.date = todayISO(); q.handled = false; Store.quotes().unshift(q); Store.save(); return q; },
  updateQuote(id, patch) { const q = Store.quotes().find(x => x.id === id); if (q) { Object.assign(q, patch); Store.save(); } },
  deleteQuote(id) { Store.db.quotes = Store.quotes().filter(q => q.id !== id); Store.save(); },

  // Tanıtım dosyası indirme kayıtları (lead)
  leads: () => Store.db.leads || (Store.db.leads = []),
  addLead(l) { l.id = 'l' + Date.now(); l.date = todayISO(); l.handled = false; Store.leads().unshift(l); Store.save(); return l; },
  updateLead(id, patch) { const l = Store.leads().find(x => x.id === id); if (l) { Object.assign(l, patch); Store.save(); } },
  deleteLead(id) { Store.db.leads = Store.leads().filter(l => l.id !== id); Store.save(); },

  // İş başvuruları (usta / taşeron)
  applications: () => Store.db.applications || (Store.db.applications = []),
  addApplication(a) { a.id = 'ap' + Date.now(); a.date = todayISO(); a.handled = false; Store.applications().unshift(a); Store.save(); return a; },
  updateApplication(id, patch) { const a = Store.applications().find(x => x.id === id); if (a) { Object.assign(a, patch); Store.save(); } },
  deleteApplication(id) { Store.db.applications = Store.applications().filter(a => a.id !== id); Store.save(); },

  // Üyelik (kayıt)
  register({ name, email, pass, phone }) {
    if (Store.db.users.some(u => u.email.toLowerCase() === email.toLowerCase().trim())) return { error: 'exists' };
    const colors = ['#78909c', '#8d6e63', '#5c6bc0', '#26a69a', '#7e57c2'];
    const u = { id: 'u' + Date.now(), name, email: email.trim(), pass, role: 'uye', title: 'Üye (Proje Takip)', phone: phone || '—', color: colors[Store.db.users.length % colors.length] };
    Store.db.users.push(u); Store.save();
    return { user: u };
  },

  // Proje detay erişim yetkisi (admin verir)
  canViewProject(projectId, userId) {
    const u = Store.userById(userId); if (!u) return false;
    if (u.role === 'yetkili') return true;
    const p = Store.projectById(projectId); if (!p) return false;
    return (p.access || []).includes(userId);
  },
  grantAccess(projectId, userId) {
    const p = Store.projectById(projectId); if (!p) return;
    p.access = p.access || [];
    if (!p.access.includes(userId)) p.access.push(userId);
    Store.save();
  },
  revokeAccess(projectId, userId) {
    const p = Store.projectById(projectId); if (!p) return;
    p.access = (p.access || []).filter(id => id !== userId);
    Store.save();
  },
  // Bir üyeye erişim verilmiş projeler
  projectsForUser(userId) {
    const u = Store.userById(userId);
    if (u && u.role === 'yetkili') return Store.projects();
    return Store.projects().filter(p => (p.access || []).includes(userId));
  },

  activity: () => Store.db.activity,
  logActivity(text, proj, userId) {
    Store.db.activity.unshift({ id: 'a' + Date.now(), text, proj: proj || '—', time: 'Az önce', user: userId });
    Store.db.activity = Store.db.activity.slice(0, 30);
    Store.save();
  },
};
