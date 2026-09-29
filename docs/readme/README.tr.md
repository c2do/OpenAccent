<p align="center">
  <img src="../../docs/assets/banner.svg" alt="OpenAccent" width="100%">
</p>

<p align="center"><b>Yapay zekâyla, memleketinden biriyle konuşur gibi konuş.</b></p>

<p align="center">
  <a href="../../LICENSE"><img src="https://img.shields.io/badge/code-MIT-0F766E" alt="Code: MIT"></a>
  <a href="../../data/LICENSE"><img src="https://img.shields.io/badge/data-CC%20BY--SA%204.0-0F766E" alt="Data: CC BY-SA 4.0"></a>
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-server-4338CA" alt="MCP server"></a>
  <img src="https://img.shields.io/badge/focus-Arabic%20dialects-4338CA" alt="Focus: Arabic dialects">
  <img src="https://img.shields.io/badge/status-early%20development-F59E0B" alt="Status: early development">
</p>

<p align="center">
  🌐 <a href="../../README.md">English</a> · <a href="README.ar.md">العربية</a> · <a href="README.es.md">Español</a> · <a href="README.pt-BR.md">Português</a> · <a href="README.fr.md">Français</a> · <a href="README.de.md">Deutsch</a> · <a href="README.hi.md">हिन्दी</a> · <b>Türkçe</b>
</p>

> 🤖 Bu çeviri bir yapay zekâ tarafından hazırlandı. Türkçe senin dilinse, düzeltmemize yardım et — bu proje tam da bu tür şeyleri düzeltmek için var.

OpenAccent, dünyadaki ağızların ülkelere göre düzenlenmiş, topluluk tarafından oluşturulan ve anadili konuşanlarca doğrulanan açık kaynaklı bir sözlüğüdür. Ayrıca *senin* nasıl konuştuğunu hatırlayan kişisel bir hafıza tutar. İkisi de [MCP](https://modelcontextprotocol.io) üzerinden Claude gibi yapay zekâ asistanlarına sunulur.

> **Durum: erken geliştirme.** Her şey yerelde, kendi bilgisayarında çalışıyor. En çok konuşulan Arapça ağızlarla başlıyoruz; açık kaynaklardan dolduruluyor ve anadili konuşanlarca gözden geçiriliyor. Kurulum: [`docs/setup.md`](../../docs/setup.md).

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
| 🗣️ **Nasıl konuştuğunu öğrenir** | Birden fazla ağız mı konuşuyorsun? Araya İngilizce mi katıyorsun? Kısa mı yazıyorsun, yoksa Arabizi ile mi? OpenAccent bunu kendi mesajlarından öğrenir (yalnızca sayımlar, mesajların kendisi asla) ve yapay zekâya sana uymasını söyler. |
| 🔍 **Cevap kontrolü** | Yanlış ağızdan kelimeleri, nadir kelimeleri, okunduğu gibi yazılmış kelimeleri ve daha önce düzelttiğin kelimeleri işaretler. |
| 🎭 **Ağız kartları** | Hikâyeler, şarkılar, senaryolar ve oyun diyalogları için: her ağızdan karakterleri seslendir, her yazı türü için ayrı kurallarla. |
| 📋 **Taşınabilir istem** | Herhangi bir yapay zekânın özel talimatları (Claude, ChatGPT, …) için kısa bir metin, kendi bilgisayarında üretilir: `openaccent-mcp export <dialect>`. |

## Sohbetin ötesinde: hikâyeler, şarkılar, senaryolar ve oyunlar

Bir karakteri gerçek kılan, ağzıdır. OpenAccent, yazan her yapay zekâya bir ağzın kelimelerini, seslerini ve kurallarını verir, sonra her satırı kontrol eder.

| Yazdığın… | OpenAccent ne yapar |
|---|---|
| 📚 **Hikâyeler ve romanlar** | Kahireli bir büyükanne ile Kazablankalı torunu aynı sahneyi, her biri kendi ağzıyla paylaşabilir: her karaktere bir ağız kartı verilir ve her satır o karakterin ağzına göre kontrol edilir. Hikâye gerektirdiğinde eski ya da nadir kelimelere izin verilir. |
| 🎵 **Şarkı sözleri** | İnsanların şarkılarda gerçekten söylediği gündelik kelimeler, tutarlı tek bir ağızla. Nadir ve eski kelimeler şarkıya yakışıyorsa sorun değil. |
| 🎬 **Film, dizi ve podcast senaryoları** | Replikler oyuncuların söylemesi gerektiği gibi yazılır (كيف yerine fellahi *تشيف*). Sahne gerektiriyorsa karakterler küfredebilir; aşağılayıcı hakaretler her zaman işaretlenir. |
| 🎮 **Oyun diyalogları** | Belirli bir yerden geliyormuş gibi konuşan ve yüzlerce satır boyunca öyle kalan NPC'ler. |

OpenAccent kuruluyken Claude'a şunları sormayı dene:

- *"Kısa bir sahne yaz: Iraklı bir taksi şoförü, Lübnanlı bir turistle ücret yüzünden tartışıyor. Her biri kendi ağzıyla konuşsun."*
- *"Faslı bir düğün şarkısı için nakarat yaz."*
- *"Bu diyaloğu yeniden yaz; karakterler Modern Standart Arapça gibi değil, Mısırlı gibi konuşsun."*

### Üzerine inşa edilebilecek fikirler

OpenAccent bir MCP sunucusu, bir CLI ve açık bir veri setidir (CC BY-SA), yani üzerine bir şeyler inşa edebilirsin:

- Her karakteri kendi ağzında tutan bir şarkı sözü ya da senaryo yazma asistanı.
- Binlerce NPC satırını ağız karışıklığına karşı tarayan bir oyun diyaloğu aracı.
- Altyazı ve dublaj kalite kontrolü: yanlış ağızdaki satırları yakalamak için bir senaryo üzerinde `check_reply` çalıştır.
- O şehrin insanları gibi konuşan, yerel işletmeler için bir sohbet botu.
- İnsanların gerçekten konuştuğu ağzı öğreten bir dil öğrenme uygulaması.

**Geliştiriciler, ilk katkı için iyi fikirler:** yeni bir dil için metin normalleştirici, kendi ağzın için değerlendirme (eval) istemleri, açık lisanslı başka bir veri seti için içe aktarıcı ya da CLI etrafında bir editör eklentisi. Bkz. [`docs/design.md`](../../docs/design.md).

## Ağızlar

**Önce Arapça.** En çok konuşulan Arapça ağızlarla başlıyoruz:

<table>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/eg.svg" width="44" alt="Egypt"><br><b>Mısır Arapçası</b><br><sub>Mısır</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/sy.svg" width="44" alt="Syria"><br><b>Levant Arapçası</b><br><sub>Suriye · Lübnan · Ürdün · Filistin</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/sa.svg" width="44" alt="Saudi Arabia"><br><b>Suudi ve Körfez Arapçası</b><br><sub>Suudi Arabistan · Körfez</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/iq.svg" width="44" alt="Iraq"><br><b>Irak Arapçası</b><br><sub>Irak</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/sd.svg" width="44" alt="Sudan"><br><b>Sudan Arapçası</b><br><sub>Sudan</sub></td></tr>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/ma.svg" width="44" alt="Morocco"><br><b>Fas Dariccesi</b><br><sub>Fas</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/dz.svg" width="44" alt="Algeria"><br><b>Cezayir Dariccesi</b><br><sub>Cezayir</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/tn.svg" width="44" alt="Tunisia"><br><b>Tunus Dariccesi</b><br><sub>Tunus</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/lb.svg" width="44" alt="Lebanon"><br><b>Lübnan Arapçası</b><br><sub>Lübnan</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/jo.svg" width="44" alt="Jordan"><br><b>Ürdün Arapçası</b><br><sub>Ürdün</sub></td></tr>
</table>

**Ayrıca başlananlar:** Meksika İspanyolcası, İspanya İspanyolcası, Fransızca ve Türkçenin taslak kelimeleri var. Amerikan, İngiliz ve Hint İngilizcesi, Almanca, Brezilya Portekizcesi ve Hintçe hazırlandı ve daha iyi kaynakları bekliyor.

<details>
<summary>İlk dünya dalgası (14 ağız)</summary>

<table>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/us.svg" width="44" alt="United States"><br><b>Amerikan</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/gb.svg" width="44" alt="United Kingdom"><br><b>İngiliz</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/in.svg" width="44" alt="India"><br><b>Hint İngilizcesi</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/mx.svg" width="44" alt="Mexico"><br><b>Meksika İspanyolcası</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/es.svg" width="44" alt="Spain"><br><b>İspanya İspanyolcası</b></td></tr>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/br.svg" width="44" alt="Brazil"><br><b>Brezilya Portekizcesi</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/fr.svg" width="44" alt="France"><br><b>Fransa Fransızcası</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/de.svg" width="44" alt="Germany"><br><b>Almanya Almancası</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/tr.svg" width="44" alt="Turkey"><br><b>Türkçe</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/in.svg" width="44" alt="India"><br><b>Hintçe</b></td></tr>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/eg.svg" width="44" alt="Egypt"><br><b>Mısır</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/sa.svg" width="44" alt="Saudi Arabia"><br><b>Suudi</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/sy.svg" width="44" alt="Syria"><br><b>Suriye</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/lb.svg" width="44" alt="Lebanon"><br><b>Lübnan Arapçası</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/ma.svg" width="44" alt="Morocco"><br><b>Fas Dariccesi</b></td></tr>
</table>

</details>

Kelimeler [Vikisözlük](https://en.wiktionary.org)'ten (CC BY-SA 4.0) gelir; bölgeye göre süzülür ve kullanım sıklığına göre sıralanır. İçe aktarılan her kelime, anadili konuşan biri inceleyene kadar **taslak** olarak kalır.

## Katkıda bulun

Kod yazmana gerek yok.

- **Bu ağızlardan birini mi konuşuyorsun?** En çok **gözden geçirenlere** ihtiyacımız var. Bir issue aç ve hangisini konuştuğunu söyle. Her ağzın kısa bir rehberi var (nasıl duyulduğu, yapay zekânın onda yaptığı hatalar); taslak olarak yazıldı ve o ağızla büyümüş birini bekliyor.
- **Kelime ya da ağız mı eklemek istiyorsun?** Kolay formlar yakında. Şimdilik [`data/README.md`](../../data/README.md) dosyasına bak.
- **Bu çeviriyi düzeltebilir misin?** Lütfen! Bir yapay zekâ tarafından hazırlandı; bu proje de tam olarak bu tür şeyleri düzeltmek için var.

## Lisans

- **Kod:** [MIT](../../LICENSE)
- **Sözlük verisi** (`data/`): [CC BY-SA 4.0](../../data/LICENSE), Vikipedi ile aynı lisans. Veriler sonsuza dek açık kalır.
