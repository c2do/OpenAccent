<p align="center">
  <img src="../../docs/assets/banner.svg" alt="OpenAccent" width="100%">
</p>

<p align="center"><b>AI से वैसे बात करें, जैसे अपने इलाके के किसी इंसान से करते हैं।</b></p>

<p align="center">
  <a href="../../LICENSE"><img src="https://img.shields.io/badge/code-MIT-0F766E" alt="Code: MIT"></a>
  <a href="../../data/LICENSE"><img src="https://img.shields.io/badge/data-CC%20BY--SA%204.0-0F766E" alt="Data: CC BY-SA 4.0"></a>
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-server-4338CA" alt="MCP server"></a>
  <img src="https://img.shields.io/badge/focus-Arabic%20dialects-4338CA" alt="Focus: Arabic dialects">
  <img src="https://img.shields.io/badge/status-early%20development-F59E0B" alt="Status: early development">
</p>

<p align="center">
  🌐 <a href="../../README.md">English</a> · <a href="README.ar.md">العربية</a> · <a href="README.es.md">Español</a> · <a href="README.pt-BR.md">Português</a> · <a href="README.fr.md">Français</a> · <a href="README.de.md">Deutsch</a> · <b>हिन्दी</b> · <a href="README.tr.md">Türkçe</a>
</p>

> 🤖 यह अनुवाद एक AI ने तैयार किया है। अगर हिन्दी आपकी भाषा है, तो इसे बेहतर बनाने में मदद करें — यह प्रोजेक्ट ठीक इसी तरह की चीज़ सुधारने के लिए है।

OpenAccent दुनिया की बोलियों का एक ओपन-सोर्स शब्दकोश है — देश के हिसाब से व्यवस्थित, समुदाय द्वारा बनाया गया और मूल वक्ताओं द्वारा जाँचा गया। यह इस बात की निजी याद भी रखता है कि *आप* कैसे बोलते हैं। दोनों [MCP](https://modelcontextprotocol.io) के ज़रिए Claude जैसे AI असिस्टेंट तक पहुँचते हैं।

> **स्थिति: शुरुआती विकास।** सब कुछ आपके कंप्यूटर पर लोकल रूप से चलता है। हम सबसे ज़्यादा बोली जाने वाली अरबी बोलियों से शुरुआत कर रहे हैं, जिन्हें खुले स्रोतों से भरा जा रहा है और मूल वक्ता जाँच रहे हैं। इंस्टॉल: [`docs/setup.md`](../../docs/setup.md)।

## समस्या

AI मॉडल बोलियों में कमज़ोर हैं:

- एक ही जवाब में **बोलियाँ मिला देते हैं**।
- बातचीत के बीच में **शब्द और बोली बदल देते हैं**।
- **शब्द गढ़ लेते हैं**, या ऐसे दुर्लभ शब्द बोलते हैं जो कोई नहीं बोलता।
- अगली बातचीत में **आपकी सुधारी हुई बातें भूल जाते हैं**।

कभी ऐसा नहीं लगता कि आप अपने इलाके के किसी असली इंसान से बात कर रहे हैं।

## OpenAccent इसे कैसे ठीक करता है

| हिस्सा | क्या करता है |
|---|---|
| 📖 **शब्दकोश** | हर देश और हर बोली का एक फ़ोल्डर, हर शब्द की एक फ़ाइल। हर शब्द अपना स्रोत बताता है, और कुछ भी तब तक *सत्यापित* नहीं होता जब तक कोई मूल वक्ता मंज़ूरी न दे। |
| 🧭 **बोली गाइड** | हर बोली कैसी सुनाई देती है और कैसे काम करती है, और AI उसमें आम तौर पर क्या गलतियाँ करता है। |
| 🧠 **निजी याददाश्त** | आपकी बोली, आपके शब्द, आपके सुधार। यह आपके कंप्यूटर पर रहती है, और आपके सुधार शब्दकोश से ऊपर माने जाते हैं। |
| 🗣️ **आपके बोलने का तरीका सीखता है** | एक से ज़्यादा बोलियाँ बोलते हैं? बीच में अंग्रेज़ी मिलाते हैं? छोटा लिखते हैं, या अरबीज़ी (Arabizi) में? OpenAccent यह आपके अपने संदेशों से समझ लेता है (सिर्फ़ गिनती, संदेश कभी नहीं) और AI से कहता है कि वह आपके अंदाज़ में बात करे। |
| 🔍 **जवाब की जाँच** | गलत बोली के शब्द, दुर्लभ शब्द, उच्चारण की तरह लिखे गए शब्द, और पहले सुधारे गए शब्द चिह्नित करता है। |

## चैट से आगे: कहानियाँ, गाने, स्क्रिप्ट और गेम

बोली ही किसी किरदार को असली बनाती है। OpenAccent किसी भी लिखने वाले AI को एक बोली के शब्द, आवाज़ें और नियम देता है, फिर हर पंक्ति की जाँच करता है।

| लिखें… | OpenAccent क्या करता है |
|---|---|
| 📚 **कहानियाँ और उपन्यास** | काहिरा की एक दादी और कासाब्लांका का उसका पोता एक ही दृश्य में हो सकते हैं, दोनों अपनी-अपनी बोली में: हर किरदार को एक बोली कार्ड मिलता है, और हर पंक्ति उसी किरदार की बोली के हिसाब से जाँची जाती है। कहानी को ज़रूरत हो तो पुराने या दुर्लभ शब्दों की छूट है। |
| 🎵 **गीत के बोल** | रोज़मर्रा के वे शब्द जो लोग सच में गाते हैं, एक ही एकसार बोली में। दुर्लभ और पुराने शब्द भी चलेंगे, अगर वे गाने में जमते हों। |
| 🎬 **फ़िल्म, टीवी और पॉडकास्ट स्क्रिप्ट** | संवाद उसी तरह लिखे जाते हैं जैसे अभिनेताओं को बोलने हैं (كيف के लिए फ़ल्लाही *تشيف*)। दृश्य माँगे तो किरदार गाली दे सकते हैं; किसी समुदाय को नीचा दिखाने वाले अपशब्द हमेशा चिह्नित किए जाते हैं। |
| 🎮 **गेम डायलॉग** | ऐसे NPC जो किसी ख़ास जगह के लगते हैं, और सैकड़ों पंक्तियों तक वैसे ही बने रहते हैं। |

OpenAccent इंस्टॉल करके Claude से यह पूछकर देखें:

- *"एक छोटा दृश्य लिखो: एक इराकी टैक्सी ड्राइवर किराए को लेकर एक लेबनानी पर्यटक से बहस करता है। दोनों को अपनी-अपनी बोली में रखना।"*
- *"मोरक्को की किसी शादी के गाने का मुखड़ा लिखो।"*
- *"इस संवाद को दोबारा लिखो ताकि किरदार मिस्री लगें, आधुनिक मानक अरबी वाले नहीं।"*

### इस पर क्या बनाया जा सकता है

OpenAccent एक MCP सर्वर, एक CLI और एक खुला डेटासेट (CC BY-SA) है, इसलिए आप इसके ऊपर अपना कुछ बना सकते हैं:

- गीत या पटकथा लिखने का असिस्टेंट जो हर किरदार को उसकी बोली में रखे।
- गेम डायलॉग टूल जो हज़ारों NPC पंक्तियों में बोलियों की मिलावट जाँचे।
- सबटाइटल और डबिंग की गुणवत्ता जाँच: किसी स्क्रिप्ट पर `check_reply` चलाएँ और गलत बोली वाली पंक्तियाँ पकड़ें।
- किसी स्थानीय कारोबार का चैटबॉट जो उस शहर के लोगों की तरह बात करे।
- भाषा सीखने का ऐप जो वही बोली सिखाए जो लोग सच में बोलते हैं।

**डेवलपर्स, शुरुआत के लिए अच्छे योगदान:** किसी नई भाषा के लिए टेक्स्ट नॉर्मलाइज़र, आपकी बोली के लिए eval प्रॉम्प्ट, किसी और खुले लाइसेंस वाले डेटासेट का इम्पोर्टर, या CLI पर आधारित कोई एडिटर प्लगइन। देखें [`docs/design.md`](../../docs/design.md)।

## बोलियाँ

**पहले अरबी।** हम सबसे ज़्यादा बोली जाने वाली अरबी बोलियों से शुरुआत कर रहे हैं:

<table>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/eg.svg" width="44" alt="Egypt"><br><b>मिस्री</b><br><sub>मिस्र</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/sy.svg" width="44" alt="Syria"><br><b>लेवेंटाइन</b><br><sub>सीरिया · लेबनान · जॉर्डन · फ़िलिस्तीन</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/sa.svg" width="44" alt="Saudi Arabia"><br><b>सऊदी और खाड़ी</b><br><sub>सऊदी अरब · खाड़ी देश</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/iq.svg" width="44" alt="Iraq"><br><b>इराकी</b><br><sub>इराक</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/sd.svg" width="44" alt="Sudan"><br><b>सूडानी</b><br><sub>सूडान</sub></td></tr>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/ma.svg" width="44" alt="Morocco"><br><b>मोरक्को की दारिजा</b><br><sub>मोरक्को</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/dz.svg" width="44" alt="Algeria"><br><b>अल्जीरिया की दारजा</b><br><sub>अल्जीरिया</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/tn.svg" width="44" alt="Tunisia"><br><b>ट्यूनीशिया की देरजा</b><br><sub>ट्यूनीशिया</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/lb.svg" width="44" alt="Lebanon"><br><b>लेबनानी</b><br><sub>लेबनान</sub></td><td align="center" width="20%"><img src="../../docs/assets/flags/jo.svg" width="44" alt="Jordan"><br><b>जॉर्डनी</b><br><sub>जॉर्डन</sub></td></tr>
</table>

**ये भी शुरू हो चुकी हैं:** मैक्सिकन स्पैनिश, स्पेन की स्पैनिश, फ़्रेंच और तुर्की में ड्राफ़्ट शब्द हैं। अमेरिकी, ब्रिटिश और भारतीय अंग्रेज़ी, जर्मन, ब्राज़ीलियन पुर्तगाली और हिन्दी तैयार हैं और बेहतर स्रोतों का इंतज़ार कर रही हैं।

<details>
<summary>पहली विश्व लहर (14 बोलियाँ)</summary>

<table>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/us.svg" width="44" alt="United States"><br><b>अमेरिकी</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/gb.svg" width="44" alt="United Kingdom"><br><b>ब्रिटिश</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/in.svg" width="44" alt="India"><br><b>भारतीय अंग्रेज़ी</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/mx.svg" width="44" alt="Mexico"><br><b>मैक्सिकन स्पैनिश</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/es.svg" width="44" alt="Spain"><br><b>स्पेन की स्पैनिश</b></td></tr>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/br.svg" width="44" alt="Brazil"><br><b>ब्राज़ीलियन पुर्तगाली</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/fr.svg" width="44" alt="France"><br><b>फ़्रांस की फ़्रेंच</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/de.svg" width="44" alt="Germany"><br><b>जर्मनी की जर्मन</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/tr.svg" width="44" alt="Turkey"><br><b>तुर्की</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/in.svg" width="44" alt="India"><br><b>हिन्दी</b></td></tr>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/eg.svg" width="44" alt="Egypt"><br><b>मिस्री</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/sa.svg" width="44" alt="Saudi Arabia"><br><b>सऊदी</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/sy.svg" width="44" alt="Syria"><br><b>सीरियाई</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/lb.svg" width="44" alt="Lebanon"><br><b>लेबनानी अरबी</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/ma.svg" width="44" alt="Morocco"><br><b>मोरक्को की दारिजा</b></td></tr>
</table>

</details>

शब्द [विक्षनरी](https://en.wiktionary.org) (CC BY-SA 4.0) से आते हैं, क्षेत्र के अनुसार छाँटे और आम इस्तेमाल के हिसाब से क्रमबद्ध। हर आयात किया गया शब्द तब तक **ड्राफ़्ट** रहता है जब तक कोई मूल वक्ता उसकी समीक्षा न करे।

## योगदान दें

कोडिंग की ज़रूरत नहीं।

- **इनमें से कोई बोली बोलते हैं?** हमें सबसे ज़्यादा **समीक्षकों** की ज़रूरत है। एक issue खोलें और बताएँ कि आप कौन सी बोली बोलते हैं। हर बोली की एक छोटी गाइड है (वह कैसी सुनाई देती है, AI उसमें क्या गलतियाँ करता है), जो ड्राफ़्ट के रूप में लिखी गई है और किसी ऐसे व्यक्ति का इंतज़ार कर रही है जो उसे बोलते हुए बड़ा हुआ हो।
- **कोई शब्द या बोली जोड़नी है?** आसान फ़ॉर्म जल्द आ रहे हैं। अभी के लिए [`data/README.md`](../../data/README.md) देखें।
- **इस अनुवाद को बेहतर बना सकते हैं?** ज़रूर बनाइए!

## लाइसेंस

- **कोड:** [MIT](../../LICENSE)
- **शब्दकोश डेटा** (`data/`): [CC BY-SA 4.0](../../data/LICENSE), विकिपीडिया वाला ही लाइसेंस। डेटा हमेशा खुला रहेगा।
