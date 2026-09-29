# OpenAccent

**Talk to AI like you'd talk to someone from home.**

OpenAccent is an open-source, community-built dictionary of the world's dialects, verified by native speakers, plus a personal memory of how *you* speak. Both are served to AI assistants like Claude through [MCP](https://modelcontextprotocol.io).

> **Status: early development (v0.1 in progress).** Nothing is installable yet. Follow along, or help build the dictionary.

[العربية ⬇](#بالعربي)

## The problem

AI models are bad at dialects:

- They **mix dialects** in one reply.
- They **drift**, switching words and dialect mid-conversation.
- They **invent words**, or use rare terms nobody says.
- They **forget your corrections** by the next chat.

It never feels like talking to a real person from your place.

## How OpenAccent fixes it

| Piece | What it does |
|---|---|
| 📖 **Dictionary** | One file per word, organized as a tree of dialects (e.g. Arabic → Levantine → Palestinian → Rural). Nothing is marked *verified* until a native speaker of that dialect approves it. |
| 🧭 **Dialect guides** | How each dialect sounds and works, and the mistakes AI models commonly make in it. |
| 🧠 **Personal memory** | Your dialect, your words, your corrections. It stays on your machine, and your corrections beat the dictionary. |
| 🔍 **Reply check** | Flags words from the wrong dialect, rare words, and words you've corrected before. |

We're starting with **Palestinian Rural (Fallahi) Arabic** and **General American English**, and growing to every dialect from there.

## Contribute

You don't need to code. Once the forms are live (coming in v0.1), you'll be able to:

- **Add a word** to your dialect.
- **Fix a word** that's wrong.
- **Add a new dialect.**
- **Become a reviewer** for your dialect. We especially need **native American English** speakers right now.

For the plan, see [`docs/design.md`](docs/design.md) and [`docs/plans/v0.1-implementation-plan.md`](docs/plans/v0.1-implementation-plan.md).

## License

- **Code:** [MIT](LICENSE)
- **Dictionary data** (`data/`): [CC BY-SA 4.0](data/LICENSE), the same license as Wikipedia. The data stays open forever.

---

<div dir="rtl">

## بالعربي

**احكي مع الذكاء الاصطناعي زي ما بتحكي مع حدا من بلدك.**

OpenAccent مشروع مفتوح المصدر لقاموس لهجات العالم، بيبنيه المجتمع وبيأكّده أهل كل لهجة، ومعه ذاكرة شخصية لطريقة حكيك **إنت**. والاثنين بيوصلوا لـ Claude وغيره عن طريق MCP.

> **الحالة: بأول التطوير (بنشتغل على v0.1).** لسا ما في إشي جاهز للتنزيل.

### المشكلة
- الموديلات **بتخلط اللهجات** بنفس الرد.
- **بتغيّر كلماتها** بنص المحادثة.
- **بتألّف كلمات**، أو بتحكي مصطلحات نادرة.
- **بتنسى تصحيحاتك** بالمحادثة الجاية.

### الحل
| القطعة | شو بتعمل |
|---|---|
| 📖 **قاموس** | كل كلمة ملف، ومرتبة بشجرة لهجات. وما في كلمة بتصير "مؤكدة" إلا إذا وافق عليها حدا من أهل اللهجة. |
| 🧭 **دليل لكل لهجة** | كيف بتنلفظ اللهجة وكيف بتشتغل، وشو الأغلاط اللي بيعملها الـ AI فيها. |
| 🧠 **ذاكرة شخصية** | لهجتك، كلماتك، وتصحيحاتك. محفوظة على جهازك، وتصحيحك بيغلب القاموس. |
| 🔍 **فحص الرد** | بيعلّم على الكلمات اللي من لهجة غلط، والكلمات النادرة، والكلمات اللي صححتها قبل. |

بنبدأ بـ **الفلسطيني الفلاحي** و**الإنجليزي الأمريكي**، ومن هناك لكل لهجات العالم.

### ساهم معنا
ما بدها برمجة. قريباً (بـ v0.1) رح تقدر:
- تضيف كلمة من لهجتك
- تصحّح كلمة غلط
- تضيف لهجة جديدة
- تصير مراجع للهجتك

### الرخصة
- **الكود:** MIT
- **القاموس:** CC BY-SA 4.0، نفس رخصة ويكيبيديا، يعني بيضل مفتوح للأبد.

</div>
