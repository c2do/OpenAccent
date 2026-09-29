<p align="center">
  <img src="../../docs/assets/banner.svg" alt="OpenAccent" width="100%">
</p>

<p align="center"><b>تحدّث مع الذكاء الاصطناعي كما تتحدّث مع شخص من بلدك.</b></p>

<p align="center">
  <a href="../../LICENSE"><img src="https://img.shields.io/badge/code-MIT-0F766E" alt="Code: MIT"></a>
  <a href="../../data/LICENSE"><img src="https://img.shields.io/badge/data-CC%20BY--SA%204.0-0F766E" alt="Data: CC BY-SA 4.0"></a>
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-server-4338CA" alt="MCP server"></a>
  <img src="https://img.shields.io/badge/focus-Arabic%20dialects-4338CA" alt="Focus: Arabic dialects">
  <img src="https://img.shields.io/badge/status-early%20development-F59E0B" alt="Status: early development">
</p>

<p align="center">
  🌐 <a href="../../README.md">English</a> · <b>العربية</b> · <a href="README.es.md">Español</a> · <a href="README.pt-BR.md">Português</a> · <a href="README.fr.md">Français</a> · <a href="README.de.md">Deutsch</a> · <a href="README.hi.md">हिन्दी</a> · <a href="README.tr.md">Türkçe</a>
</p>

<div dir="rtl">

> 🤖 كُتبت هذه الترجمة بالذكاء الاصطناعي. إن كانت العربية لغتك، ساعدنا في تحسينها — فهذا بالضبط ما وُجد المشروع لإصلاحه.

OpenAccent قاموس مفتوح المصدر للهجات العالم، مرتّب حسب الدول، يبنيه المجتمع ويؤكّده الناطقون الأصليون بكل لهجة. ويحتفظ أيضاً بذاكرة شخصية لطريقة كلامك **أنت**. ويصل الاثنان إلى Claude وغيره من المساعدين عبر [MCP](https://modelcontextprotocol.io).

> **الحالة: مرحلة مبكرة من التطوير.** كل شيء يعمل محلياً على جهازك. نبدأ بأكثر اللهجات العربية انتشاراً، تُملأ من مصادر مفتوحة ويراجعها ناطقون أصليون. التثبيت: [`docs/setup.md`](../../docs/setup.md).

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
| 🗣️ **يتعلّم طريقة كلامك** | تتكلّم أكثر من لهجة؟ تخلط معها الإنجليزية؟ تكتب باختصار، أو بالعربيزي؟ يلتقط OpenAccent ذلك من رسائلك أنت (يحفظ أعداداً فقط، لا الرسائل نفسها) ويطلب من الذكاء الاصطناعي أن يجاريك. |
| 🔍 **فحص الرد** | يشير إلى الكلمات التي من لهجة خاطئة، والكلمات النادرة، والكلمات المكتوبة كما تُنطق، والكلمات التي صحّحتها من قبل. |
| 🎭 **بطاقات اللهجات** | للقصص والأغاني والسيناريوهات وحوارات الألعاب: أعطِ الشخصيات أصواتاً من أي لهجة، مع قواعد لكل نوع من الكتابة. |
| 📋 **نص تعليمات محمول** | نص قصير تضعه في التعليمات المخصّصة لأي ذكاء اصطناعي (Claude وChatGPT و…)، يُولَّد على جهازك: `openaccent-mcp export <dialect>`. |

## أبعد من المحادثة: قصص وأغانٍ وسيناريوهات وألعاب

اللهجة هي ما يجعل الشخصية حقيقية. يعطي OpenAccent أي ذكاء اصطناعي يكتب كلماتِ اللهجة وأصواتها وقواعدها، ثم يفحص كل سطر.

| تكتب… | ماذا يفعل OpenAccent |
|---|---|
| 📚 **القصص والروايات** | جدّة من القاهرة وحفيدها من الدار البيضاء يمكن أن يجتمعا في مشهد واحد، كلٌّ بلهجته: لكل شخصية بطاقة لهجة، ويُفحص كل سطر على لهجة صاحبه. والكلمات القديمة أو النادرة مسموحة حين تحتاجها القصة. |
| 🎵 **كلمات الأغاني** | كلمات يومية يغنّيها الناس فعلاً، بلهجة واحدة متّسقة. ولا بأس بالكلمات النادرة والقديمة حين تناسب الأغنية. |
| 🎬 **سيناريوهات الأفلام والمسلسلات والبودكاست** | جُمل مكتوبة كما يجب أن ينطقها الممثلون (*تشيف* الفلاحية بدل كيف). ويمكن للشخصيات أن تشتم إن تطلّب المشهد ذلك، أما الألفاظ العنصرية المهينة فيُنبَّه عليها دائماً. |
| 🎮 **حوارات الألعاب** | شخصيات غير قابلة للعب (NPC) تبدو وكأنها من مكان محدد، وتبقى كذلك عبر مئات الأسطر. |

جرّب أن تطلب من Claude بعد تثبيت OpenAccent:

- *"اكتب لي مشهد قصير: سوّاق تاكسي عراقي يتخانق مع سائح لبناني على الأجرة. خلّي كل واحد يحكي بلهجته."*
- *"اكتب لي لازمة (كورَس) لأغنية عرس مغربي."*
- *"أعد كتابة هذا الحوار بحيث تحكي الشخصيات مصري، مش فصحى."*

### أفكار تبني عليها

OpenAccent خادم MCP وأداة سطر أوامر (CLI) ومجموعة بيانات مفتوحة (CC BY-SA)، فيمكنك أن تبني فوقه:

- مساعد لكتابة الأغاني أو السيناريو يُبقي كل شخصية على لهجتها.
- أداة لحوارات الألعاب تفحص آلاف أسطر الـNPC بحثاً عن خلط اللهجات.
- ضبط جودة الترجمة المرئية والدبلجة: شغّل `check_reply` على النص لاصطياد الأسطر المكتوبة بلهجة خاطئة.
- روبوت محادثة لمتجر أو شركة محلية يتكلّم مثل أهل تلك المدينة.
- تطبيق لتعلّم اللغات يعلّم اللهجة التي يتكلّمها الناس فعلاً.

**للمطوّرين، مساهمات أولى مناسبة:** مُطبِّع نصوص (normalizer) للغة جديدة، أو أسئلة تقييم (eval prompts) للهجتك، أو مستورد لمجموعة بيانات أخرى برخصة مفتوحة، أو إضافة لمحرّر نصوص مبنية على الـCLI. راجع [`docs/design.md`](../../docs/design.md).

## اللهجات

**العربية أولاً.** نبدأ بأكثر اللهجات العربية انتشاراً:

<table>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/eg.svg" width="44" alt="Egypt"><br><b>المصرية</b><br><sub>مصر</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/sy.svg" width="44" alt="Syria"><br><b>الشامية</b><br><sub>سوريا · لبنان · الأردن · فلسطين</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/sa.svg" width="44" alt="Saudi Arabia"><br><b>السعودية والخليجية</b><br><sub>السعودية · الخليج</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/iq.svg" width="44" alt="Iraq"><br><b>العراقية</b><br><sub>العراق</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/sd.svg" width="44" alt="Sudan"><br><b>السودانية</b><br><sub>السودان</sub></td></tr>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/ma.svg" width="44" alt="Morocco"><br><b>الدارجة المغربية</b><br><sub>المغرب</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/dz.svg" width="44" alt="Algeria"><br><b>الدارجة الجزائرية</b><br><sub>الجزائر</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/tn.svg" width="44" alt="Tunisia"><br><b>الدارجة التونسية</b><br><sub>تونس</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/lb.svg" width="44" alt="Lebanon"><br><b>اللبنانية</b><br><sub>لبنان</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/jo.svg" width="44" alt="Jordan"><br><b>الأردنية</b><br><sub>الأردن</sub></td></tr>
</table>

**بدأنا أيضاً:** الإسبانية المكسيكية والإسبانية (إسبانيا) والفرنسية والتركية فيها كلمات مسوّدة. أما الإنجليزية الأمريكية والبريطانية والهندية، والألمانية، والبرتغالية البرازيلية، واللغة الهندية (Hindi) فهي مُعدّة وتنتظر مصادر أفضل.

<details>
<summary>الدفعة العالمية الأولى (14 لهجة)</summary>

<table>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/us.svg" width="44" alt="United States"><br><b>الإنجليزية الأمريكية</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/gb.svg" width="44" alt="United Kingdom"><br><b>البريطانية</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/in.svg" width="44" alt="India"><br><b>الهندية</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/mx.svg" width="44" alt="Mexico"><br><b>الإسبانية المكسيكية</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/es.svg" width="44" alt="Spain"><br><b>الإسبانية (إسبانيا)</b></td></tr>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/br.svg" width="44" alt="Brazil"><br><b>البرتغالية البرازيلية</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/fr.svg" width="44" alt="France"><br><b>الفرنسية (فرنسا)</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/de.svg" width="44" alt="Germany"><br><b>الألمانية (ألمانيا)</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/tr.svg" width="44" alt="Turkey"><br><b>التركية</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/in.svg" width="44" alt="India"><br><b>الهندية</b></td></tr>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/eg.svg" width="44" alt="Egypt"><br><b>العربية المصرية</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/sa.svg" width="44" alt="Saudi Arabia"><br><b>السعودية</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/sy.svg" width="44" alt="Syria"><br><b>السورية</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/lb.svg" width="44" alt="Lebanon"><br><b>اللبنانية</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/ma.svg" width="44" alt="Morocco"><br><b>الدارجة المغربية</b></td></tr>
</table>

</details>

تأتي الكلمات من [ويكاموس](https://en.wiktionary.org) (رخصة CC BY-SA 4.0)، مصفّاة حسب المنطقة ومرتّبة حسب شيوع الاستعمال. تبدأ كل كلمة **مسوّدة** حتى يراجعها ناطق أصلي باللهجة.

## ساهم معنا

لا تحتاج إلى البرمجة.

- **هل تتحدّث إحدى هذه اللهجات؟** أكثر ما نحتاجه **مراجعون**. افتح issue وأخبرنا بلهجتك. لكل لهجة دليل قصير (كيف تُنطق، والأخطاء التي يقع فيها الذكاء الاصطناعي) مكتوب كمسوّدة، ينتظر شخصاً نشأ على هذه اللهجة.
- **تريد إضافة كلمة أو لهجة؟** نماذج سهلة قادمة قريباً. حالياً راجع [`data/README.md`](../../data/README.md).
- **تستطيع تحسين هذه الترجمة؟** نرحّب بذلك! فقد كتبها الذكاء الاصطناعي، وهذا بالضبط ما وُجد هذا المشروع لإصلاحه.

## الرخصة

- **الكود:** [MIT](../../LICENSE)
- **بيانات القاموس** (`data/`): [CC BY-SA 4.0](../../data/LICENSE)، الرخصة نفسها التي تستعملها ويكيبيديا، فتبقى البيانات مفتوحة إلى الأبد.

</div>
