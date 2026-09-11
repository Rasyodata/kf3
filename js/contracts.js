/* ============================================================
   EMG İmar — İnşaat Sözleşmeleri Kütüphanesi
   Standart taşeron / uygulama sözleşme şablonları
   (Genel bilgilendirme amaçlıdır; hukuki danışmanlık yerine geçmez.)
   ============================================================ */

// Placeholder'lar buildContract() ile doldurulur:
// {ISVEREN} {YUKLENICI} {ISYERI} {BEDEL} {SURE} {TARIH}
const CONTRACT_STD = [
  { t: '1. TARAFLAR', d: 'İşbu sözleşme; bir tarafta İşveren (Ana Yüklenici) sıfatıyla {ISVEREN} ile diğer tarafta Yüklenici (Taşeron) sıfatıyla {YUKLENICI} arasında, aşağıdaki şartlarla {TARIH} tarihinde imzalanmıştır. İşin yapılacağı yer: {ISYERI}.' },
  { t: '2. SÖZLEŞMENİN KONUSU VE KAPSAMI', d: '{KONU} İşler; onaylı uygulama projeleri, teknik şartname, ilgili standartlar (TS 500, TS 498, Deprem Yönetmeliği vb.) ve fen/sanat kurallarına uygun olarak yapılacaktır.' },
  { t: '3. İŞİN SÜRESİ VE İŞ PROGRAMI', d: 'İşe başlama tarihinden itibaren işin toplam süresi {SURE} olup, Yüklenici İşverence onaylı iş programına uymakla yükümlüdür. Mücbir sebep halleri saklıdır.' },
  { t: '4. SÖZLEŞME BEDELİ', d: 'İşin toplam bedeli KDV hariç {BEDEL} olarak belirlenmiştir. Bedel; sözleşme eki birim fiyat cetveli / götürü bedel esasına göre hesaplanır. Birim fiyatlara girmeyen imalatlar yeni birim fiyat tutanağı ile belirlenir.' },
  { t: '5. ÖDEME ŞEKLİ (HAKEDİŞ)', d: 'Ödemeler, gerçekleşen imalat metrajları üzerinden düzenlenen dönemsel (aylık) hakediş raporlarına göre yapılır. Hakediş tutarından sözleşmede belirlenen oranda teminat kesintisi (stopaj/kesin teminat) uygulanır. Onaylanan hakediş ödemesi en geç 30 gün içinde gerçekleştirilir.' },
  { t: '6. MALZEME, EKİPMAN VE İŞÇİLİK', d: '{MALZEME} İş makinesi, kalıp, iskele, el aletleri ve sarf malzemelerinin temini {EKIPMAN}. Yüklenici, kalifiye işçi ve usta çalıştırmakla yükümlüdür.' },
  { t: '7. İŞ SAĞLIĞI VE GÜVENLİĞİ (İSG)', d: '6331 sayılı İş Sağlığı ve Güvenliği Kanunu kapsamındaki tüm yükümlülükler, kişisel koruyucu donanım (KKD) temini ve saha güvenliği önlemleri Yükleniciye aittir. İSG ihlallerinden doğacak her türlü hukuki/cezai sorumluluk Yükleniciye aittir.' },
  { t: '8. İŞİN TESLİMİ VE MUAYENESİ', d: 'Tamamlanan imalatlar İşveren/kontrol teşkilatınca yazılı tutanakla teslim alınır. Kurulan kalıp, donatı ve imalatların uygunluğu tutanağa bağlanmadan sonraki imalatlara geçilemez. Ayıplı/kusurlu imalatlar Yüklenici tarafından ücretsiz düzeltilir.' },
  { t: '9. GECİKME VE CEZAİ ŞART', d: 'Yüklenicinin kusuru ile işin süresinde tamamlanmaması halinde, geciken her takvim günü için sözleşme bedelinin ‰1 (binde bir) oranında gecikme cezası uygulanır. Toplam ceza tutarı bedelin %10\'unu aştığında İşveren sözleşmeyi feshedebilir.' },
  { t: '10. TEMİNAT', d: 'Yüklenici, sözleşme bedelinin %6\'sı oranında kesin teminat verir veya bu tutar hakedişlerden kesinti yoluyla tahsil edilir. Teminat, kesin kabul ve garanti süresi sonunda iade edilir.' },
  { t: '11. AYIP VE GARANTİ', d: 'Yüklenici, teslim tarihinden itibaren imalatlarının işçilik kusurlarına karşı 24 ay (taşıyıcı sistemde ilgili mevzuat süresince) garanti verir. Bu süre içinde ortaya çıkan işçilik kaynaklı ayıplar ücretsiz giderilir.' },
  { t: '12. SÖZLEŞMENİN FESHİ', d: 'Tarafların sözleşme hükümlerine aykırı davranması ve verilen sürede aykırılığın giderilmemesi halinde karşı taraf sözleşmeyi tek taraflı feshedebilir. Fesih halinde tamamlanan işlerin bedeli tasfiye hesabı ile ödenir.' },
  { t: '13. DEVİR VE ALT TAŞERON', d: 'Yüklenici, İşverenin yazılı onayı olmadan işi kısmen veya tamamen bir başkasına devredemez, alt taşerona veremez.' },
  { t: '14. UYUŞMAZLIKLARIN ÇÖZÜMÜ VE YÜRÜRLÜK', d: 'İşbu sözleşmeden doğacak uyuşmazlıklarda {ISYERI} Mahkemeleri ve İcra Daireleri yetkilidir. 14 maddeden ibaret sözleşme iki nüsha olarak düzenlenmiş ve taraflarca imza altına alınmıştır.' },
];

const CONTRACTS = [
  {
    id: 'anahtar', icon: '🔑', name: 'Anahtar Teslim İnşaat Sözleşmesi', tag: 'Malzeme + İşçilik + Sorumluluk',
    desc: 'Yüklenici; malzeme, işçilik ve tüm teknik sorumluluğu üstlenerek yapıyı projeye uygun, kullanıma hazır (anahtar teslim) tamamlar.',
    konu: 'Sözleşme konusu iş; {ISYERI} adresindeki yapının anahtar teslim esasıyla; kaba ve ince inşaat imalatlarının tamamı, mekanik ve elektrik tesisatı ile çevre düzenlemesi dahil olmak üzere tamamlanmasıdır.',
    scope: ['Kaba + ince inşaatın tamamı', 'Mekanik & elektrik tesisat', 'Malzeme temini yükleniciye ait', 'Ruhsat/iskan sürecine teknik destek', 'Kullanıma hazır teslim'],
    malzeme: 'Tüm malzemeler, proje ve şartnameye uygun kalitede Yüklenici tarafından temin edilir.',
    ekipman: 'Yükleniciye aittir.',
  },
  {
    id: 'iscilik', icon: '🛠️', name: 'Sadece İşçilik (Malzeme İşverenden) Sözleşmesi', tag: 'Yalnızca İşgücü',
    desc: 'Malzeme İşveren tarafından sahaya temin edilir; Yüklenici yalnızca kalifiye işçilik ve uygulamayı sağlar.',
    konu: 'Sözleşme konusu iş; İşverence sahaya temin edilen malzemelerle belirtilen imalatların yalnızca işçilik (uygulama) olarak yapılmasıdır.',
    scope: ['Yalnızca işçilik / uygulama', 'Malzeme İşveren tarafından temin edilir', 'Fire ve zayiattan Yüklenici sorumlu', 'Metraj bazlı birim fiyat', 'El aleti Yükleniciye ait'],
    malzeme: 'Ana imalat malzemeleri İşveren tarafından şantiyeye teslim edilir; Yüklenici malzemeyi özenle kullanır, fire ve zayiattan sorumludur.',
    ekipman: 'El aletleri Yükleniciye, iş makineleri İşverene aittir.',
  },
  {
    id: 'kaba', icon: '🏗️', name: 'Kaba İnşaat (Taşıyıcı Sistem) Sözleşmesi', tag: 'Kalıp + Demir + Beton',
    desc: 'Temel, subasman ve tüm betonarme taşıyıcı sistemin (kalıp-demir-beton) yapımını kapsayan taşeron sözleşmesi.',
    konu: 'Sözleşme konusu iş; temel ve subasman betonu, betonarme kalıp, donatı (demir) montajı, beton dökümü ve vibrasyonu ile imalat sırasındaki yatay/düşey taşımaları kapsayan kaba inşaat imalatlarıdır.',
    scope: ['Temel, subasman, perde, kolon, kiriş, döşeme', 'Kalıp kurulum-söküm', 'Donatı kesim-büküm-montaj', 'Beton döküm ve sıkıştırma', 'Yatay/düşey taşımalar dahil'],
    malzeme: 'Beton, demir ve kalıp malzemesi sözleşmede belirlenen tarafça temin edilir (malzemeli/malzemesiz seçeneğine göre).',
    ekipman: 'Kalıp, iskele ve vinç organizasyonu sözleşmede belirlenir.',
  },
  {
    id: 'demir', icon: '🔩', name: 'Demir (Donatı) İşçiliği Sözleşmesi', tag: 'Betonarme Donatı',
    desc: 'Betonarme donatının projeye ve TS 500’e uygun kesimi, bükümü, yerine montajı ve bağlanması işçiliğini kapsar.',
    konu: 'Sözleşme konusu iş; betonarme projelerine ve TS 500 standardına uygun olarak donatının kesilmesi, bükülmesi, yerine montajı, bindirme/eklerin kurallara uygun yapılması ve bağ teli ile bağlanmasıdır.',
    scope: ['Donatı kesim ve büküm', 'Projeye uygun yerleşim ve bindirme', 'Paspayı ve etriye sıklaştırması', 'Bağ teli ile montaj', 'Beton öncesi kontrol tutanağı'],
    malzeme: 'Nervürlü/düz donatı ve bağ teli İşveren tarafından temin edilir; Yüklenici yalnızca işçilik verir (aksi belirtilmedikçe).',
    ekipman: 'Kesme-bükme tezgâhı ve el aletleri Yükleniciye aittir.',
  },
  {
    id: 'kalip', icon: '🧱', name: 'Kalıp İşçiliği Sözleşmesi', tag: 'Ahşap / Sistem Kalıp',
    desc: 'Betonarme elemanların ahşap veya sistem kalıbının teknik kurallara uygun kurulması, iskelesi ve sökümü işçiliği.',
    konu: 'Sözleşme konusu iş; betonarme elemanların projeye uygun kalıbının kurulması, terazi/şakül ayarı, desteklenmesi (iskele), beton sonrası uygun sürede sökümü ve temizliğidir.',
    scope: ['Kalıp kurulum ve terazi/şakül', 'İskele ve destekleme', 'Kalıp temizliği ve yağlama', 'Uygun sürede söküm', 'Yeniden kullanım için istifleme'],
    malzeme: 'Kalıp malzemesi (kontrplak, kereste, sistem kalıp) sözleşmede belirlenen tarafça temin edilir.',
    ekipman: 'İskele ve el aletleri Yükleniciye aittir.',
  },
  {
    id: 'sivamant', icon: '🎨', name: 'Sıva & Mantolama Uygulama Sözleşmesi', tag: 'İnce İşler',
    desc: 'Kaba/ince sıva, alçı sıva-saten ve dış cephe ısı yalıtım (mantolama) uygulamalarını kapsar.',
    konu: 'Sözleşme konusu iş; iç mekân kara/kaba ve alçı sıva-saten uygulamaları ile dış cephe ısı yalıtım levhası (EPS/XPS) montajı, sıva/file ve son kat kaplama/boya uygulamalarıdır.',
    scope: ['İç kaba ve alçı sıva, saten', 'Dış cephe mantolama (EPS/XPS)', 'File-donatı sıvası', 'Köşe profilleri ve fugalar', 'Son kat kaplama/boya'],
    malzeme: 'Sıva, yapıştırıcı, levha ve profil malzemeleri sözleşmede belirlenen tarafça temin edilir.',
    ekipman: 'İskele, mikser ve el aletleri Yükleniciye aittir.',
  },
  {
    id: 'tesisat', icon: '⚡', name: 'Elektrik & Sıhhi Tesisat Sözleşmesi', tag: 'Mekanik / Elektrik',
    desc: 'Bina içi elektrik tesisatı ile temiz/pis su ve ısıtma sıhhi tesisat imalatlarının montajını kapsar.',
    konu: 'Sözleşme konusu iş; projeye ve ilgili yönetmeliklere uygun olarak elektrik tesisatı (kablo, boru, buat, pano) ile sıhhi tesisatın (temiz/pis su, ısıtma, doğalgaz) montaj işçiliğidir.',
    scope: ['Elektrik boru, kablo, buat, pano', 'Temiz/pis su tesisatı', 'Isıtma ve doğalgaz hattı', 'Test ve devreye alma', 'As-built (imalat sonu) kroki'],
    malzeme: 'Tesisat malzemeleri sözleşmede belirlenen tarafça temin edilir; testler Yüklenici sorumluluğundadır.',
    ekipman: 'Tesisatçı el aletleri ve test cihazları Yükleniciye aittir.',
  },
  {
    id: 'genel', icon: '📄', name: 'Genel Taşeronluk / Uygulama Sözleşmesi', tag: 'Çok Amaçlı',
    desc: 'Belirli bir imalat kalemi için taraflarca kapsamı doldurulabilen genel amaçlı taşeronluk sözleşmesi.',
    konu: 'Sözleşme konusu iş; taraflarca ekli teknik şartnamede tanımlanan imalat kalemlerinin, birim fiyat/götürü esasına göre yapılmasıdır.',
    scope: ['Serbestçe tanımlanabilir kapsam', 'Birim fiyat veya götürü bedel', 'Ekli teknik şartname', 'Hakediş bazlı ödeme', 'Genel şartlar geçerli'],
    malzeme: 'Malzeme temini sözleşme eki şartnamede belirlenir.',
    ekipman: 'Ekipman temini sözleşme eki şartnamede belirlenir.',
  },
];
const contractById = (id) => CONTRACTS.find(c => c.id === id);
