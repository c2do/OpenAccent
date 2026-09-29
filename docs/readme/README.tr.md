<p align="center">
  <img src="../../docs/assets/banner.svg" alt="OpenAccent" width="100%">
</p>

<p align="center"><b>Yapay zekâyla, memleketinden biriyle konuşur gibi konuş.</b></p>

<p align="center">
  <a href="../../LICENSE"><img src="https://img.shields.io/badge/code-MIT-0F766E" alt="Code: MIT"></a>
  <a href="../../data/LICENSE"><img src="https://img.shields.io/badge/data-CC%20BY--SA%204.0-0F766E" alt="Data: CC BY-SA 4.0"></a>
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-server-4338CA" alt="MCP server"></a>
  <img src="https://img.shields.io/badge/dialects-14%20in%20wave%201-4338CA" alt="14 dialects in wave 1">
  <img src="https://img.shields.io/badge/status-early%20development-F59E0B" alt="Status: early development">
</p>

<p align="center">
  <a href="../../README.md"><img src="https://img.shields.io/badge/English-64748B?style=for-the-badge" alt="English"></a>
  <a href="README.ar.md"><img src="https://img.shields.io/badge/%D8%A7%D9%84%D8%B9%D8%B1%D8%A8%D9%8A%D8%A9-64748B?style=for-the-badge" alt="العربية"></a>
  <a href="README.es.md"><img src="https://img.shields.io/badge/Espa%C3%B1ol-64748B?style=for-the-badge" alt="Español"></a>
  <a href="README.pt-BR.md"><img src="https://img.shields.io/badge/Portugu%C3%AAs-64748B?style=for-the-badge" alt="Português"></a>
  <a href="README.fr.md"><img src="https://img.shields.io/badge/Fran%C3%A7ais-64748B?style=for-the-badge" alt="Français"></a>
  <a href="README.de.md"><img src="https://img.shields.io/badge/Deutsch-64748B?style=for-the-badge" alt="Deutsch"></a>
  <a href="README.hi.md"><img src="https://img.shields.io/badge/%E0%A4%B9%E0%A4%BF%E0%A4%A8%E0%A5%8D%E0%A4%A6%E0%A5%80-64748B?style=for-the-badge" alt="हिन्दी"></a>
  <a href="README.tr.md"><img src="https://img.shields.io/badge/T%C3%BCrk%C3%A7e-4338CA?style=for-the-badge" alt="Türkçe"></a>
</p>

> 🤖 Bu çeviri bir yapay zekâ tarafından hazırlandı. Türkçe senin dilinse, düzeltmemize yardım et — bu proje tam da bu tür şeyleri düzeltmek için var.

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

<table>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/us.svg" width="44" alt="United States"><br><b>Amerikan</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/gb.svg" width="44" alt="United Kingdom"><br><b>İngiliz</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/in.svg" width="44" alt="India"><br><b>Hint İngilizcesi</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/mx.svg" width="44" alt="Mexico"><br><b>Meksika İspanyolcası</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/es.svg" width="44" alt="Spain"><br><b>İspanya İspanyolcası</b></td></tr>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/br.svg" width="44" alt="Brazil"><br><b>Brezilya Portekizcesi</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/fr.svg" width="44" alt="France"><br><b>Fransa Fransızcası</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/de.svg" width="44" alt="Germany"><br><b>Almanya Almancası</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/tr.svg" width="44" alt="Turkey"><br><b>Türkçe</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/in.svg" width="44" alt="India"><br><b>Hintçe</b></td></tr>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/eg.svg" width="44" alt="Egypt"><br><b>Mısır</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/sa.svg" width="44" alt="Saudi Arabia"><br><b>Suudi</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/sy.svg" width="44" alt="Syria"><br><b>Suriye</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/lb.svg" width="44" alt="Lebanon"><br><b>Lübnan Arapçası</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/ma.svg" width="44" alt="Morocco"><br><b>Fas Dariccesi</b></td></tr>
</table>

Kelimeler [Vikisözlük](https://en.wiktionary.org)'ten (CC BY-SA 4.0) gelir; bölgeye göre süzülür ve kullanım sıklığına göre sıralanır. İçe aktarılan her kelime, anadili konuşan biri inceleyene kadar **taslak** olarak kalır.

## Katkıda bulun

Kod yazmana gerek yok.

- **Bu ağızlardan birini mi konuşuyorsun?** En çok **gözden geçirenlere** ihtiyacımız var. Bir issue aç ve hangisini konuştuğunu söyle.
- **Kelime ya da ağız mı eklemek istiyorsun?** Kolay formlar yakında. Şimdilik [`data/README.md`](../../data/README.md) dosyasına bak.
- **Bu çeviriyi düzeltebilir misin?** Lütfen!

## Lisans

- **Kod:** [MIT](../../LICENSE)
- **Sözlük verisi** (`data/`): [CC BY-SA 4.0](../../data/LICENSE), Vikipedi ile aynı lisans. Veriler sonsuza dek açık kalır.
