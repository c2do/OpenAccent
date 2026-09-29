# Install OpenAccent in Claude Desktop

[العربية ⬇](#بالعربي)

OpenAccent runs **on your computer**. There is no server and no account, and your memory stays on your machine.

## 1. Install
1. Download **`openaccent.mcpb`** from the latest [release](https://github.com/c2do/OpenAccent/releases).
2. Double-click it, or drag it into Claude Desktop. Claude Desktop shows an install screen: click **Install**.
3. Optional: change where your memory file is kept. The default is `~/.openaccent/memory.json`.

## 2. Tell Claude to use it (recommended)
Claude's apps don't always call tools on their own. Add this line to **Claude → Settings → Profile → personal preferences**:

> Use OpenAccent at the start of every conversation, and check replies in my dialect with it.

## 3. Try it
- "Talk to me in Egyptian Arabic."
- "I'm from a village near Ramallah and I say هسّا, not هلأ." Claude saves this to your memory.
- "Write a short story where a grandmother from Mexico talks to her grandson from Spain."
- "Give me a portable version of my dialect settings." Paste the result into ChatGPT or any other AI.

## Your memory
- It's a plain JSON file you can open and read (the path is in step 1).
- To delete something, tell Claude "forget that", or delete the file.
- Nothing is sent anywhere. Sharing a word with the public dictionary only happens through a link you open yourself.

## Without Claude Desktop
Run `npx openaccent-mcp export <dialect>` (for example `ar-eg`, `es-mx`, `en-us-general`) and paste the text into any AI's custom instructions.

---

<div dir="rtl">

## بالعربي

OpenAccent بيشتغل **على جهازك**: ما في سيرفر، ما في حساب، وذاكرتك بتضل عندك.

### 1. التنزيل
1. نزّل ملف **`openaccent.mcpb`** من آخر [إصدار](https://github.com/c2do/OpenAccent/releases).
2. اعمله **دبل كليك**، أو اسحبه على Claude Desktop، واكبس **Install**.

### 2. قول لـ Claude يستعمله (منصوح فيه)
حط هاد السطر بـ **Claude ← Settings ← Profile ← personal preferences**:

> Use OpenAccent at the start of every conversation, and check replies in my dialect with it.

### 3. جرّب
- "احكي معي فلاحي"
- "أنا بقول هسّا مش هلأ": بيحفظها بذاكرتك
- "اكتبلي قصة قصيرة فيها ستّ مصرية بتحكي مع حفيدها المكسيكي"
- "أعطيني نسخة جاهزة من إعدادات لهجتي": والنص اللي بيطلع بتلزقه بـ ChatGPT أو أي AI تاني

### ذاكرتك
- ملف نصي بتقدر تفتحه وتقرأه
- بتقدر تقول لـ Claude "انسى هاد"، أو تمسح الملف
- ما في إشي بيطلع من جهازك

</div>
