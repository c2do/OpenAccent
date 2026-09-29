# OpenAccent

[English](../../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Português](README.pt-BR.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [हिन्दी](README.hi.md) · **Türkçe**

> 🤖 Bu çeviri bir yapay zekâ tarafından hazırlandı. Türkçe senin dilinse, düzeltmemize yardım et — bu proje tam da bu tür şeyleri düzeltmek için var.

**Yapay zekâyla, memleketinden biriyle konuşur gibi konuş.**

OpenAccent, dünyadaki ağızların ülkelere göre düzenlenmiş, topluluk tarafından oluşturulan ve anadili konuşanlarca doğrulanan açık kaynaklı bir sözlüğüdür. Ayrıca *senin* nasıl konuştuğunu hatırlayan kişisel bir hafıza tutar. İkisi de [MCP](https://modelcontextprotocol.io) üzerinden Claude gibi yapay zekâ asistanlarına sunulur.

> **Durum: erken geliştirme.** MCP sunucusu yerelde çalışıyor ve ilk 14 ağız açık kaynaklardan dolduruluyor. Henüz kurulabilir bir sürüm yok.

## Sorun

Yapay zekâ modelleri ağızlarda kötü:

- Aynı cevapta **ağızları karıştırıyorlar**.
- Konuşmanın ortasında **kelime ve ağız değiştiriyorlar**.
- **Kelime uyduruyorlar** ya da kimsenin kullanmadığı nadir terimler kullanıyorlar.
- Bir sonraki sohbette **düzeltmelerini unutuyorlar**.

Hiçbir zaman memleketinden gerçek biriyle konuşuyormuş gibi hissettirmiyor.

## OpenAccent bunu nasıl çözüyor

| Parça | Ne yapar |
|---|---|
| 📖 **Sözlük** | Her ülke ve her ağız için bir klasör, her kelime için bir dosya. Her kelime kaynağını belirtir ve anadili konuşan biri onaylamadan hiçbir şey *doğrulanmış* sayılmaz. |
| 🧭 **Ağız rehberleri** | Her ağzın nasıl duyulduğu ve işlediği, yapay zekânın onda sık yaptığı hatalar. |
| 🧠 **Kişisel hafıza** | Ağzın, kelimelerin, düzeltmelerin. Bilgisayarında kalır ve düzeltmelerin sözlüğün önüne geçer. |
| 🔍 **Cevap kontrolü** | Yanlış ağızdan kelimeleri, nadir kelimeleri, okunduğu gibi yazılmış kelimeleri ve daha önce düzelttiğin kelimeleri işaretler. |

## İlk dalga: 14 ağız

🇺🇸 · 🇬🇧 · 🇮🇳 · 🇲🇽 · 🇪🇸 · 🇧🇷 · 🇫🇷 · 🇩🇪 · 🇹🇷 · 🇮🇳 · 🇪🇬 · 🇸🇦 · 🇸🇾 · 🇱🇧 · 🇲🇦

Amerikan · İngiliz · Hint İngilizcesi · Meksika İspanyolcası · İspanya İspanyolcası · Brezilya Portekizcesi · Fransa Fransızcası · Almanya Almancası · Türkçe · Hintçe · Mısır · Suudi · Suriye · Lübnan Arapçası · Fas Dariccesi

Kelimeler [Vikisözlük](https://en.wiktionary.org)'ten (CC BY-SA 4.0) gelir; bölgeye göre süzülür ve kullanım sıklığına göre sıralanır. İçe aktarılan her kelime, anadili konuşan biri inceleyene kadar **taslak** olarak kalır.

## Katkıda bulun

Kod yazmana gerek yok.

- **Bu ağızlardan birini mi konuşuyorsun?** En çok **gözden geçirenlere** ihtiyacımız var. Bir issue aç ve hangisini konuştuğunu söyle.
- **Kelime ya da ağız mı eklemek istiyorsun?** Kolay formlar yakında. Şimdilik [`data/README.md`](../../data/README.md) dosyasına bak.
- **Bu çeviriyi düzeltebilir misin?** Lütfen!

## Lisans

- **Kod:** [MIT](../../LICENSE)
- **Sözlük verisi** (`data/`): [CC BY-SA 4.0](../../data/LICENSE), Vikipedi ile aynı lisans. Veriler sonsuza dek açık kalır.
