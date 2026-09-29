<p align="center">
  <img src="../../docs/assets/banner.svg" alt="OpenAccent" width="100%">
</p>

<p align="center"><b>تحدّث مع الذكاء الاصطناعي كما تتحدّث مع شخص من بلدك.</b></p>

<p align="center">
  <a href="../../LICENSE"><img src="https://img.shields.io/badge/code-MIT-0F766E" alt="Code: MIT"></a>
  <a href="../../data/LICENSE"><img src="https://img.shields.io/badge/data-CC%20BY--SA%204.0-0F766E" alt="Data: CC BY-SA 4.0"></a>
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-server-4338CA" alt="MCP server"></a>
  <img src="https://img.shields.io/badge/dialects-14%20in%20wave%201-4338CA" alt="14 dialects in wave 1">
  <img src="https://img.shields.io/badge/status-early%20development-F59E0B" alt="Status: early development">
</p>

<p align="center">
  <a href="../../README.md"><img src="https://img.shields.io/badge/English-64748B?style=for-the-badge" alt="English"></a>
  <a href="README.ar.md"><img src="https://img.shields.io/badge/%D8%A7%D9%84%D8%B9%D8%B1%D8%A8%D9%8A%D8%A9-4338CA?style=for-the-badge" alt="العربية"></a>
  <a href="README.es.md"><img src="https://img.shields.io/badge/Espa%C3%B1ol-64748B?style=for-the-badge" alt="Español"></a>
  <a href="README.pt-BR.md"><img src="https://img.shields.io/badge/Portugu%C3%AAs-64748B?style=for-the-badge" alt="Português"></a>
  <a href="README.fr.md"><img src="https://img.shields.io/badge/Fran%C3%A7ais-64748B?style=for-the-badge" alt="Français"></a>
  <a href="README.de.md"><img src="https://img.shields.io/badge/Deutsch-64748B?style=for-the-badge" alt="Deutsch"></a>
  <a href="README.hi.md"><img src="https://img.shields.io/badge/%E0%A4%B9%E0%A4%BF%E0%A4%A8%E0%A5%8D%E0%A4%A6%E0%A5%80-64748B?style=for-the-badge" alt="हिन्दी"></a>
  <a href="README.tr.md"><img src="https://img.shields.io/badge/T%C3%BCrk%C3%A7e-64748B?style=for-the-badge" alt="Türkçe"></a>
</p>

<div dir="rtl">

> 🤖 كُتبت هذه الترجمة بالذكاء الاصطناعي. إن كانت العربية لغتك، ساعدنا في تحسينها — فهذا بالضبط ما وُجد المشروع لإصلاحه.

OpenAccent قاموس مفتوح المصدر للهجات العالم، مرتّب حسب الدول، يبنيه المجتمع ويؤكّده الناطقون الأصليون بكل لهجة. ويحتفظ أيضاً بذاكرة شخصية لطريقة كلامك **أنت**. ويصل الاثنان إلى Claude وغيره من المساعدين عبر [MCP](https://modelcontextprotocol.io).

> **الحالة: مرحلة مبكرة من التطوير.** خادم MCP يعمل محلياً، وتُملأ أول 14 لهجة من مصادر مفتوحة. لا توجد نسخة جاهزة للتثبيت بعد.

## المشكلة

نماذج الذكاء الاصطناعي ضعيفة في اللهجات:

- **تخلط اللهجات** في الرد الواحد.
- **تغيّر كلماتها ولهجتها** في منتصف المحادثة.
- **تخترع كلمات**، أو تستعمل مصطلحات نادرة لا يقولها أحد.
- **تنسى تصحيحاتك** في المحادثة التالية.

فلا تشعر أبداً أنك تتحدّث مع إنسان حقيقي من بلدك.

## كيف يحلّ OpenAccent المشكلة

| الجزء | وظيفته |
|---|---|
| 📖 **القاموس** | مجلد لكل دولة ولكل لهجة، وملف لكل كلمة. لكل كلمة مصدر مذكور، ولا يُعدّ شيء *مؤكَّداً* حتى يوافق عليه ناطق أصلي باللهجة. |
| 🧭 **دليل لكل لهجة** | كيف تُنطق كل لهجة وكيف تعمل، والأخطاء التي يقع فيها الذكاء الاصطناعي عادةً. |
| 🧠 **ذاكرة شخصية** | لهجتك وكلماتك وتصحيحاتك. تبقى على جهازك، وتصحيحاتك مقدَّمة على القاموس. |
| 🔍 **فحص الرد** | يشير إلى الكلمات التي من لهجة خاطئة، والكلمات النادرة، والكلمات المكتوبة كما تُنطق، والكلمات التي صحّحتها من قبل. |

## الدفعة الأولى: 14 لهجة

<table>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/us.svg" width="44" alt="United States"><br><b>الإنجليزية الأمريكية</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/gb.svg" width="44" alt="United Kingdom"><br><b>البريطانية</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/in.svg" width="44" alt="India"><br><b>الهندية</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/mx.svg" width="44" alt="Mexico"><br><b>الإسبانية المكسيكية</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/es.svg" width="44" alt="Spain"><br><b>الإسبانية (إسبانيا)</b></td></tr>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/br.svg" width="44" alt="Brazil"><br><b>البرتغالية البرازيلية</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/fr.svg" width="44" alt="France"><br><b>الفرنسية (فرنسا)</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/de.svg" width="44" alt="Germany"><br><b>الألمانية (ألمانيا)</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/tr.svg" width="44" alt="Turkey"><br><b>التركية</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/in.svg" width="44" alt="India"><br><b>الهندية</b></td></tr>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/eg.svg" width="44" alt="Egypt"><br><b>العربية المصرية</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/sa.svg" width="44" alt="Saudi Arabia"><br><b>السعودية</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/sy.svg" width="44" alt="Syria"><br><b>السورية</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/lb.svg" width="44" alt="Lebanon"><br><b>اللبنانية</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/ma.svg" width="44" alt="Morocco"><br><b>الدارجة المغربية</b></td></tr>
</table>

تأتي الكلمات من [ويكاموس](https://en.wiktionary.org) (رخصة CC BY-SA 4.0)، مصفّاة حسب المنطقة ومرتّبة حسب شيوع الاستعمال. تبدأ كل كلمة **مسوّدة** حتى يراجعها ناطق أصلي باللهجة.

## ساهم معنا

لا تحتاج إلى البرمجة.

- **هل تتحدّث إحدى هذه اللهجات؟** أكثر ما نحتاجه **مراجعون**. افتح issue وأخبرنا بلهجتك.
- **تريد إضافة كلمة أو لهجة؟** نماذج سهلة قادمة قريباً. حالياً راجع [`data/README.md`](../../data/README.md).
- **تستطيع تحسين هذه الترجمة؟** نرحّب بذلك!

## الرخصة

- **الكود:** [MIT](../../LICENSE)
- **بيانات القاموس** (`data/`): [CC BY-SA 4.0](../../data/LICENSE)، الرخصة نفسها التي تستعملها ويكيبيديا، فتبقى البيانات مفتوحة إلى الأبد.

</div>
