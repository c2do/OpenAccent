<p align="center">
  <img src="../../docs/assets/banner.svg" alt="OpenAccent" width="100%">
</p>

<p align="center"><b>AI से वैसे बात करें, जैसे अपने इलाके के किसी इंसान से करते हैं।</b></p>

<p align="center">
  <a href="../../LICENSE"><img src="https://img.shields.io/badge/code-MIT-0F766E" alt="Code: MIT"></a>
  <a href="../../data/LICENSE"><img src="https://img.shields.io/badge/data-CC%20BY--SA%204.0-0F766E" alt="Data: CC BY-SA 4.0"></a>
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-server-4338CA" alt="MCP server"></a>
  <img src="https://img.shields.io/badge/dialects-14%20in%20wave%201-4338CA" alt="14 dialects in wave 1">
  <img src="https://img.shields.io/badge/status-early%20development-F59E0B" alt="Status: early development">
</p>

<p align="center">
  🌐 <a href="../../README.md">English</a> · <a href="README.ar.md">العربية</a> · <a href="README.es.md">Español</a> · <a href="README.pt-BR.md">Português</a> · <a href="README.fr.md">Français</a> · <a href="README.de.md">Deutsch</a> · <b>हिन्दी</b> · <a href="README.tr.md">Türkçe</a>
</p>

> 🤖 यह अनुवाद एक AI ने तैयार किया है। अगर हिन्दी आपकी भाषा है, तो इसे बेहतर बनाने में मदद करें — यह प्रोजेक्ट ठीक इसी तरह की चीज़ सुधारने के लिए है।

OpenAccent दुनिया की बोलियों का एक ओपन-सोर्स शब्दकोश है — देश के हिसाब से व्यवस्थित, समुदाय द्वारा बनाया गया और मूल वक्ताओं द्वारा जाँचा गया। यह इस बात की निजी याद भी रखता है कि *आप* कैसे बोलते हैं। दोनों [MCP](https://modelcontextprotocol.io) के ज़रिए Claude जैसे AI असिस्टेंट तक पहुँचते हैं।

> **स्थिति: शुरुआती विकास।** MCP सर्वर लोकल रूप से चलता है, और पहली 14 बोलियाँ खुले स्रोतों से भरी जा रही हैं। अभी इंस्टॉल करने लायक कोई रिलीज़ नहीं है।

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
| 🔍 **जवाब की जाँच** | गलत बोली के शब्द, दुर्लभ शब्द, उच्चारण की तरह लिखे गए शब्द, और पहले सुधारे गए शब्द चिह्नित करता है। |

## पहली लहर: 14 बोलियाँ

<table>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/us.svg" width="44" alt="United States"><br><b>अमेरिकी</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/gb.svg" width="44" alt="United Kingdom"><br><b>ब्रिटिश</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/in.svg" width="44" alt="India"><br><b>भारतीय अंग्रेज़ी</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/mx.svg" width="44" alt="Mexico"><br><b>मैक्सिकन स्पैनिश</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/es.svg" width="44" alt="Spain"><br><b>स्पेन की स्पैनिश</b></td></tr>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/br.svg" width="44" alt="Brazil"><br><b>ब्राज़ीलियन पुर्तगाली</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/fr.svg" width="44" alt="France"><br><b>फ़्रांस की फ़्रेंच</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/de.svg" width="44" alt="Germany"><br><b>जर्मनी की जर्मन</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/tr.svg" width="44" alt="Turkey"><br><b>तुर्की</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/in.svg" width="44" alt="India"><br><b>हिन्दी</b></td></tr>
  <tr><td align="center" width="20%"><img src="../../docs/assets/flags/eg.svg" width="44" alt="Egypt"><br><b>मिस्री</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/sa.svg" width="44" alt="Saudi Arabia"><br><b>सऊदी</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/sy.svg" width="44" alt="Syria"><br><b>सीरियाई</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/lb.svg" width="44" alt="Lebanon"><br><b>लेबनानी अरबी</b></td><td align="center" width="20%"><img src="../../docs/assets/flags/ma.svg" width="44" alt="Morocco"><br><b>मोरक्को की दारिजा</b></td></tr>
</table>

शब्द [विक्षनरी](https://en.wiktionary.org) (CC BY-SA 4.0) से आते हैं, क्षेत्र के अनुसार छाँटे और आम इस्तेमाल के हिसाब से क्रमबद्ध। हर आयात किया गया शब्द तब तक **ड्राफ़्ट** रहता है जब तक कोई मूल वक्ता उसकी समीक्षा न करे।

## योगदान दें

कोडिंग की ज़रूरत नहीं।

- **इनमें से कोई बोली बोलते हैं?** हमें सबसे ज़्यादा **समीक्षकों** की ज़रूरत है। एक issue खोलें और बताएँ कि आप कौन सी बोली बोलते हैं।
- **कोई शब्द या बोली जोड़नी है?** आसान फ़ॉर्म जल्द आ रहे हैं। अभी के लिए [`data/README.md`](../../data/README.md) देखें।
- **इस अनुवाद को बेहतर बना सकते हैं?** ज़रूर बनाइए!

## लाइसेंस

- **कोड:** [MIT](../../LICENSE)
- **शब्दकोश डेटा** (`data/`): [CC BY-SA 4.0](../../data/LICENSE), विकिपीडिया वाला ही लाइसेंस। डेटा हमेशा खुला रहेगा।
