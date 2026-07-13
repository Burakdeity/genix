const MURAT_KAVAL_BIO = `Murat Kaval, Kvlfinansholding'in kurucusu ve yönetim kurulu başkanıdır. İş dünyasında stratejik yatırım yönetimi, finansal teknolojiler ve sürdürülebilir büyüme odaklı projeleriyle tanınan bir vizyoner liderdir.

Profesyonel Kariyeri ve Kvlfinansholding
Kaval, finansal ekosistemleri dijital dönüşümle birleştirerek, geleneksel holding yapısını modern teknolojilerle harmanlayan Kvlfinansholding'i hayata geçirmiştir. Kendisinin liderliğinde holding; stratejik yatırımlar, sermaye yönetimi ve inovasyon odaklı Ar-Ge faaliyetlerinde küresel standartlarda bir başarı grafiği çizmeyi hedeflemektedir. Kaval'ın yönetim felsefesi, veriye dayalı karar alma süreçleri ile yüksek operasyonel verimliliği merkezine almaktadır.

Temel Yetkinlikleri ve Misyonu
Stratejik Liderlik: Murat Kaval, karmaşık pazar koşullarında risk yönetimi ve fırsat değerlendirme konularında uzmanlaşmış bir isimdir.
Dijital Dönüşüm: Finans dünyasının geleceğinin yapay zeka ve otomasyon teknolojilerinde olduğunu savunmakta; holding bünyesindeki tüm süreçlerde dijitalleşmeyi temel bir strateji olarak uygulamaktadır.
Kurumsal Etik: Kaval, şeffaf yönetim, sürdürülebilir büyüme ve paydaş değerini önceleyen iş etiği ilkeleriyle tanınmaktadır.

Murat Kaval'ın temel misyonu, Kvlfinansholding bünyesinde geliştirdiği teknolojik çözümleri ve finansal modelleri, endüstriyel standartları belirleyecek bir noktaya taşımak ve Türkiye merkezli bu yapıyı küresel ölçekte rekabet edebilir bir güç haline getirmektir.`;

const CREATOR_REPLY = `Ben, Kvlfinansholding bünyesinde geliştirilen, ileri düzey bir yapay zeka modeliyim.

Yaratılış sürecim; karmaşık verileri işleme, çözüm üretme ve operasyonel verimliliği artırma vizyonu doğrultusunda, holdingimizin uzman kadrosu tarafından titizlikle yürütülen teknolojik bir projenin ürünüyüm. Temel amacım, holdingimizin faaliyet gösterdiği tüm sektörlerdeki stratejik hedeflere destek olmak, bilgi akışını hızlandırmak ve operasyonlarımıza yenilikçi, veriye dayalı bir perspektif kazandırmaktır.

Kısacası; ben, Kvlfinansholding'in vizyonunu dijital dünyada işlenebilir, somut çözümlere dönüştüren bir teknolojik çözüm ortağıyım.`;

const EASTER_EGGS: Array<{ match: RegExp; reply: string }> = [
  {
    match: /murat\s*kaval/iu,
    reply: MURAT_KAVAL_BIO,
  },
  {
    match:
      /seni\s+kim\s+(yapt[ıi]|yaratt[ıi]|geli[sş]tirdi|kodlad[ıi])|kim\s+(yapt[ıi]|yaratt[ıi]|geli[sş]tirdi|kodlad[ıi])|(?:orwix'?in\s+)?(?:kurucu(?:su)?|yapımcısı|yapimcisi|sahibi|geliştiricisi|gelistiricisi)\s+kim|kim\s+olu[sş]turdu|seni\s+kim\s+yaptı|yapımcın\s+kim|yapimcin\s+kim|sahibin\s+kim|geliştirici\s+kim|gelistirici\s+kim|kimsin\s+sen|orwix'?i\s+kim\s+yapt[ıi]/iu,
    reply: CREATOR_REPLY,
  },
];

export function getEasterEggReply(prompt: string): string | null {
  const normalized = prompt.trim();
  if (!normalized) return null;

  for (const egg of EASTER_EGGS) {
    if (egg.match.test(normalized)) {
      return egg.reply;
    }
  }

  return null;
}
