'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SparklesIcon, 
  EnvelopeIcon,
  ShoppingBagIcon,
  BriefcaseIcon,
  MapIcon,
  ArrowRightIcon,
  CheckIcon,
  LightBulbIcon,
  GiftIcon,
  MegaphoneIcon,
  CpuChipIcon,
  EyeIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import TypingInput from '@/components/TypingInput';
import { useLanguageStore } from '@/store/language';
import { useAppStore } from '@/store/app';
import OptigenceLogo from '@/components/OptigenceLogo';

// AI Intent Detection Demo Component
function AIIntentDemo() {
  const { t, currentLanguage } = useLanguageStore();
  const { openAssistant, addMessage } = useAppStore();
  const [userInput, setUserInput] = useState('');
  const [detectedIntent, setDetectedIntent] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const intentExamples = React.useMemo(() => {
    // Multi-language keywords for better detection
    const getEmailKeywords = () => {
      switch (currentLanguage) {
        case 'tr': return [
          "yaz", "email", "e-posta", "müşteri", "takip", "mektup", "yazmak", "gönder", 
          "posta", "gelen kutusu", "yanıtla", "konu", "iletişim", "mesaj", "şablon", 
          "imza", "acil", "ilet", "metin", "gövde", "giden kutusu", "ileti", "yanıt", "iletişim kur"
        ];
        case 'de': return [
          "schreiben", "email", "e-mail", "kunde", "nachfolge", "brief", "verfassen", "senden", 
          "post", "posteingang", "antworten", "betreff", "kontakt", "nachricht", "vorlage", 
          "signatur", "dringend", "weiterleiten", "text", "inhalt", "postausgang", "kommunikation", "korrespondenz", "reaktion"
        ];
        case 'fr': return [
          "écrire", "email", "e-mail", "client", "suivi", "lettre", "rédiger", "envoyer", 
          "courrier", "boîte de réception", "répondre", "sujet", "contact", "message", "modèle", 
          "signature", "urgent", "transférer", "texte", "corps", "boîte d'envoi", "communication", "correspondance", "réponse"
        ];
        case 'es': return [
          "escribir", "email", "correo", "cliente", "seguimiento", "carta", "redactar", "enviar", 
          "correo electrónico", "bandeja de entrada", "responder", "asunto", "contacto", "mensaje", "plantilla", 
          "firma", "urgente", "reenviar", "texto", "cuerpo", "bandeja de salida", "comunicación", "correspondencia", "respuesta"
        ];
        case 'az': return [
          "yaz", "email", "e-poçt", "müştəri", "izləmə", "məktub", "yazmaq", "göndər", 
          "poçt", "gələnlər qutusu", "cavab ver", "mövzu", "əlaqə", "mesaj", "şablon", 
          "imza", "təcili", "irəli göndər", "mətn", "bədən", "gedənlər qutusu", "ünsiyyət", "müxaribə", "reaksiya"
        ];
        case 'zh': return [
          "写", "电子邮件", "邮件", "客户", "跟进", "信", "撰写", "发送", 
          "信件", "收件箱", "回复", "主题", "联系人", "消息", "模板", 
          "签名", "紧急", "转发", "文本", "正文", "发件箱", "通信", "往来", "回应"
        ];
        case 'hi': return [
          "लिखो", "ईमेल", "ई-मेल", "ग्राहक", "अनुवर्ती", "पत्र", "प्रस्तुत", "भेजें", 
          "डाक", "इनबॉक्स", "जवाब दें", "विषय", "संपर्क", "संदेश", "टेम्पलेट", 
          "हस्ताक्षर", "आपातकालीन", "फॉरवर्ड", "पाठ", "शरीर", "आउटबॉक्स", "संचार", "पत्राचार", "प्रतिक्रिया"
        ];
        case 'ru': return [
          "написать", "email", "электронная почта", "клиент", "последующее", "письмо", "составить", "отправить", 
          "почта", "входящие", "ответить", "тема", "контакт", "сообщение", "шаблон", 
          "подпись", "срочно", "переслать", "текст", "тело", "исходящие", "связь", "переписка", "ответ"
        ];
        case 'ar': return [
          "اكتب", "بريد إلكتروني", "إيميل", "عميل", "متابعة", "رسالة", "صيغ", "أرسل", 
          "بريد", "الوارد", "رد", "الموضوع", "جهة الاتصال", "رسالة", "نموذج", 
          "توقيع", "عاجل", "إعادة توجيه", "نص", "جسم", "الصادر", "اتصال", "مراسلات", "استجابة"
        ];
        default: return [
          "write", "email", "e-mail", "client", "follow", "letter", "compose", "draft", "send", "mail", 
          "inbox", "reply", "subject", "contact", "message", "template", "signature", "urgent", "forward", 
          "text", "body", "outbox", "communication", "correspondence", "response"
        ];
      }
    };

    const getTravelKeywords = () => {
      switch (currentLanguage) {
        case 'tr': return [
          "plan", "seyahat", "tatil", "aile", "gün", "trip", "japonya", "planla", "git",
          "bilet", "keşfet", "rota", "yer", "harita", "rezervasyon", "otel", "uçuş", 
          "takvim", "seyahat planı", "macera", "yolculuk", "hazırlık", "rehber", "tur", "lokasyon"
        ];
        case 'de': return [
          "planen", "reise", "urlaub", "familie", "tag", "trip", "japan", "buchen", "gehen",
          "ticket", "entdecken", "route", "ort", "karte", "reservierung", "hotel", "flug", 
          "kalender", "reiseplan", "abenteuer", "reise", "vorbereitung", "reiseführer", "tour", "ort"
        ];
        case 'fr': return [
          "planifier", "voyage", "vacances", "famille", "jour", "trip", "japon", "réserver", "aller",
          "billet", "découvrir", "itinéraire", "lieu", "carte", "réservation", "hôtel", "vol", 
          "calendrier", "plan de voyage", "aventure", "voyage", "préparation", "guide", "tour", "emplacement"
        ];
        case 'es': return [
          "planificar", "viaje", "vacaciones", "familia", "día", "trip", "japón", "reservar", "ir",
          "boleto", "descubrir", "ruta", "lugar", "mapa", "reserva", "hotel", "vuelo", 
          "calendario", "plan de viaje", "aventura", "viaje", "preparación", "guía", "tour", "ubicación"
        ];
        case 'az': return [
          "planlaşdır", "səyahət", "məzuniyyət", "ailə", "gün", "trip", "yaponiya", "rezerv et", "get",
          "bilet", "kəşf et", "marşrut", "yer", "xəritə", "rezervasiya", "hotel", "uçuş", 
          "təqvim", "səyahət planı", "macəra", "səyahət", "hazırlıq", "bələdçi", "tur", "məkan"
        ];
        case 'zh': return [
          "计划", "旅行", "假期", "家庭", "天", "旅游", "日本", "预订", "去",
          "票", "探索", "路线", "地方", "地图", "预订", "酒店", "航班", 
          "日历", "旅行计划", "冒险", "旅行", "准备", "导游", "旅游", "位置"
        ];
        case 'hi': return [
          "योजना", "यात्रा", "छुट्टी", "परिवार", "दिन", "ट्रिप", "जापान", "बुकिंग", "जाना",
          "टिकट", "खोजना", "मार्ग", "स्थान", "नक्शा", "आरक्षण", "होटल", "उड़ान", 
          "कैलेंडर", "यात्रा योजना", "रोमांच", "यात्रा", "तैयारी", "गाइड", "टूर", "स्थान"
        ];
        case 'ru': return [
          "планировать", "путешествие", "отпуск", "семья", "день", "поездка", "япония", "забронировать", "поехать",
          "билет", "исследовать", "маршрут", "место", "карта", "бронирование", "отель", "рейс", 
          "календарь", "план путешествия", "приключение", "путешествие", "подготовка", "гид", "тур", "место"
        ];
        case 'ar': return [
          "خطط", "سفر", "إجازة", "عائلة", "يوم", "رحلة", "اليابان", "احجز", "اذهب",
          "تذكرة", "استكشف", "طريق", "مكان", "خريطة", "حجز", "فندق", "طيران", 
          "تقويم", "خطة سفر", "مغامرة", "رحلة", "تحضير", "دليل", "جولة", "موقع"
        ];
        default: return [
          "plan", "travel", "vacation", "family", "day", "trip", "japan", "book", "go",
          "ticket", "explore", "route", "place", "map", "reservation", "hotel", "flight", 
          "calendar", "travel plan", "adventure", "journey", "preparation", "guide", "tour", "location",
          "itinerary", "adventure", "route", "pack", "guide", "tour", "location"
        ];
      }
    };

    const getShoppingKeywords = () => {
      switch (currentLanguage) {
        case 'tr': return [
          "bul", "laptop", "oyun", "grafik", "kart", "fiyat", "satın", "al", "ara", "ürün",
          "sepet", "ödeme", "indirim", "teklif", "sipariş", "istek listesi", "karşılaştır", "ekle", 
          "kargo", "puan", "inceleme", "mağaza", "mevcut", "alışveriş", "çek"
        ];
        case 'de': return [
          "finden", "laptop", "gaming", "grafik", "karte", "preis", "kaufen", "bestellen", "suchen", "produkt",
          "warenkorb", "kasse", "angebot", "rabatt", "bestellung", "wunschliste", "vergleichen", "hinzufügen", 
          "lieferung", "bewertung", "rezension", "laden", "verfügbar", "einkaufen", "zahlung"
        ];
        case 'fr': return [
          "trouver", "ordinateur", "portable", "gaming", "graphique", "prix", "acheter", "commander", "rechercher", "produit",
          "panier", "paiement", "offre", "réduction", "commande", "liste de souhaits", "comparer", "ajouter", 
          "livraison", "note", "avis", "magasin", "disponible", "shopping", "checkout"
        ];
        case 'es': return [
          "encontrar", "laptop", "gaming", "gráfica", "tarjeta", "precio", "comprar", "buscar", "producto", "tienda",
          "carrito", "pagar", "oferta", "descuento", "pedido", "lista de deseos", "comparar", "agregar", 
          "envío", "valoración", "reseña", "disponible", "compras", "checkout"
        ];
        case 'az': return [
          "tap", "laptop", "oyun", "qrafik", "kart", "qiymət", "al", "satın", "axtar", "məhsul",
          "səbət", "ödəmə", "təklif", "endirim", "sifariş", "arzu siyahısı", "müqayisə", "əlavə et", 
          "çatdırılma", "qiymətləndirmə", "rəy", "mağaza", "mövcuddur", "alış", "kassa"
        ];
        case 'zh': return [
          "查找", "笔记本", "游戏", "显卡", "价格", "购买", "商店", "搜索", "产品", "购物车",
          "结账", "交易", "优惠", "折扣", "订单", "心愿单", "比较", "加入购物车", 
          "付款", "配送", "评分", "评论", "店铺", "有货"
        ];
        case 'hi': return [
          "खोजें", "लैपटॉप", "गेमिंग", "ग्राफिक्स", "कार्ड", "कीमत", "खरीदें", "दुकान", "खोज", "उत्पाद",
          "कार्ट", "चेकआउट", "सौदा", "ऑफर", "छूट", "ऑर्डर", "इच्छा सूची", "तुलना करें", 
          "जोड़ें", "डिलीवरी", "रेटिंग", "समीक्षा", "स्टोर", "उपलब्ध"
        ];
        case 'ru': return [
          "найти", "ноутбук", "игровой", "графика", "карта", "цена", "купить", "магазин", "поиск", "товар",
          "корзина", "оформление", "сделка", "предложение", "скидка", "заказ", "список желаний", "сравнить", 
          "добавить", "доставка", "оценка", "отзыв", "магазин", "в наличии"
        ];
        case 'ar': return [
          "ابحث", "لابتوب", "ألعاب", "بطاقة", "رسومات", "سعر", "شراء", "تسوق", "منتج", "بحث",
          "عربة", "الدفع", "صفقة", "عرض", "خصم", "طلب", "قائمة الرغبات", "مقارنة", 
          "أضف", "توصيل", "تقييم", "مراجعة", "متجر", "متوفر"
        ];
        default: return [
          "find", "laptop", "gaming", "graphics", "card", "price", "buy", "shop", "search", "product",
          "cart", "checkout", "deal", "offer", "discount", "order", "wishlist", "compare", "add to cart", 
          "pay", "delivery", "rating", "review", "store", "available"
        ];
      }
    };

    const getJobKeywords = () => {
      switch (currentLanguage) {
        case 'tr': return [
          "iş", "kariyer", "geliştirici", "senior", "bul", "cv", "çalış", "pozisyon", "istihdam", "işe al",
          "başvur", "mülakat", "özgeçmiş", "ekip", "şirket", "tam zamanlı", "yarı zamanlı", "işe alım",
          "fırsat", "rol", "deneyim", "beceriler", "yetenek", "staj", "boş pozisyon"
        ];
        case 'de': return [
          "job", "karriere", "entwickler", "senior", "finden", "cv", "arbeiten", "position", "beschäftigung", "einstellen",
          "bewerben", "vorstellungsgespräch", "lebenslauf", "team", "unternehmen", "vollzeit", "teilzeit", "rekrutieren",
          "chance", "rolle", "erfahrung", "fähigkeiten", "talent", "praktikum", "vakanz"
        ];
        case 'fr': return [
          "emploi", "carrière", "développeur", "senior", "trouver", "cv", "travailler", "poste", "emploi", "embaucher",
          "postuler", "entretien", "résumé", "équipe", "entreprise", "temps plein", "temps partiel", "recruter",
          "opportunité", "rôle", "expérience", "compétences", "talent", "stage", "vacance"
        ];
        case 'es': return [
          "trabajo", "carrera", "desarrollador", "senior", "encontrar", "cv", "trabajar", "puesto", "empleo", "contratar",
          "aplicar", "entrevista", "currículum", "equipo", "empresa", "tiempo completo", "medio tiempo", "reclutar",
          "oportunidad", "rol", "experiencia", "habilidades", "talento", "pasantía", "vacante"
        ];
        case 'az': return [
          "iş", "karyera", "developer", "senior", "tap", "cv", "işlə", "vəzifə", "məşğulluq", "işə götür",
          "müraciət et", "müsahibə", "tərcümeyi-hal", "komanda", "şirkət", "tam ştat", "yarım ştat", "rekrut",
          "imkan", "rol", "təcrübə", "bacarıqlar", "istedad", "təcrübə proqramı", "vakansiya"
        ];
        case 'zh': return [
          "工作", "职业", "开发者", "高级", "寻找", "简历", "上班", "职位", "就业", "招聘",
          "申请", "面试", "履历", "团队", "公司", "全职", "兼职", "招募",
          "机会", "角色", "经验", "技能", "人才", "实习", "空缺"
        ];
        case 'hi': return [
          "नौकरी", "करियर", "डेवलपर", "सीनियर", "खोजें", "सीवी", "काम", "पद", "रोजगार", "नियुक्ति",
          "आवेदन करें", "साक्षात्कार", "बायोडाटा", "टीम", "कंपनी", "पूर्णकालिक", "आंशिककालिक", "भर्ती",
          "अवसर", "भूमिका", "अनुभव", "कौशल", "प्रतिभा", "इंटर्नशिप", "रिक्ति"
        ];
        case 'ru': return [
          "работа", "карьера", "разработчик", "старший", "найти", "резюме", "работать", "должность", "трудоустройство", "нанять",
          "подать заявку", "собеседование", "автобиография", "команда", "компания", "полный рабочий день", "неполный рабочий день", "рекрутировать",
          "возможность", "роль", "опыт", "навыки", "талант", "стажировка", "вакансия"
        ];
        case 'ar': return [
          "وظيفة", "مهنة", "مطور", "كبير", "ابحث", "سيرة ذاتية", "عمل", "منصب", "توظيف", "تعيين",
          "قدم طلب", "مقابلة", "سيرة", "فريق", "شركة", "دوام كامل", "دوام جزئي", "تجنيد",
          "فرصة", "دور", "خبرة", "مهارات", "موهبة", "تدريب", "شاغر"
        ];
        default: return [
          "job", "career", "developer", "senior", "find", "cv", "work", "position", "employment", "hire",
          "apply", "interview", "resume", "team", "company", "full-time", "part-time", "recruit",
          "opportunity", "role", "experience", "skills", "talent", "internship", "vacancy"
        ];
      }
    };


    return [
      { 
        input: t('homepage.ai_demos.intent_detection.example1'), 
        intent: `📧 ${t('homepage.ai_demos.intent_detection.intents.email_generation')}`, 
        confidence: 94, 
        keywords: getEmailKeywords(),
        module: 'optimail'
      },
      { 
        input: t('homepage.ai_demos.intent_detection.example2'), 
        intent: `🛍️ ${t('homepage.ai_demos.intent_detection.intents.product_search')}`, 
        confidence: 91, 
        keywords: getShoppingKeywords(),
        module: 'optishop'
      },
      { 
        input: t('homepage.ai_demos.intent_detection.example3'), 
        intent: `✈️ ${t('homepage.ai_demos.intent_detection.intents.travel_planning')}`, 
        confidence: 96, 
        keywords: getTravelKeywords(),
        module: 'optitrip'
      },
      { 
        input: "Help me find a senior developer job", 
        intent: `💼 ${t('homepage.ai_demos.intent_detection.intents.job_search')}`, 
        confidence: 89, 
        keywords: getJobKeywords(),
        module: 'optihire'
      },
      { 
        input: "What's the weather like tomorrow?", 
        intent: `🌤️ ${t('homepage.ai_demos.intent_detection.intents.information_query')}`, 
        confidence: 87, 
        keywords: ["weather", "information", "tomorrow", "what", "how"],
        module: null
      },
      { 
        input: "Draft a proposal for our new project", 
        intent: `📄 ${t('homepage.ai_demos.intent_detection.intents.document_creation')}`, 
        confidence: 92, 
        keywords: ["draft", "proposal", "document", "create", "write"],
        module: null
      },
      { 
        input: "Book a restaurant for dinner tonight", 
        intent: `🍽️ ${t('homepage.ai_demos.intent_detection.intents.reservation_system')}`, 
        confidence: 90, 
        keywords: ["book", "restaurant", "reservation", "dinner", "table"],
        module: null
      },
    ];
  }, [t, currentLanguage]);

  useEffect(() => {
    if (userInput.trim()) {
      setIsAnalyzing(true);
      setAnalysis([]);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Simulated real-time analysis steps with translations
      const analysisSteps = [
        t('homepage.ai_demos.intent_detection.steps.parsing'),
        t('homepage.ai_demos.intent_detection.steps.analyzing'),
        t('homepage.ai_demos.intent_detection.steps.identifying'),
        t('homepage.ai_demos.intent_detection.steps.calculating'),
        t('homepage.ai_demos.intent_detection.steps.generating')
      ];

      // Show analysis steps
      analysisSteps.forEach((step, index) => {
        setTimeout(() => {
          setAnalysis(prev => [...prev, step]);
        }, index * 150);
      });

      timeoutRef.current = setTimeout(() => {
        // Enhanced intent matching with improved algorithm
        const inputWords = userInput.toLowerCase().split(' ');
        let bestMatch = { 
          intent: `🤖 ${t('homepage.ai_demos.intent_detection.intents.general_ai_assistant')}`, 
          confidence: 75, 
          keywords: [] as string[], 
          module: null as string | null 
        };

        for (const example of intentExamples) {
          // Check keyword matches with improved precision
          const keywordMatches = example.keywords.reduce((score, keyword) => {
            const keywordLower = keyword.toLowerCase();
            return inputWords.some(word => {
              const wordLower = word.toLowerCase();
              // Exact match gets full score
              if (wordLower === keywordLower) return true;
              // For longer keywords (4+ chars), allow partial matching
              if (keywordLower.length >= 4 && wordLower.length >= 4) {
                return wordLower.includes(keywordLower) || keywordLower.includes(wordLower);
              }
              // For shorter keywords, require exact or very close match
              if (keywordLower.length >= 3 && wordLower.length >= 3) {
                return wordLower === keywordLower || 
                       (wordLower.startsWith(keywordLower) && wordLower.length <= keywordLower.length + 2) ||
                       (keywordLower.startsWith(wordLower) && keywordLower.length <= wordLower.length + 2);
              }
              return false;
            }) ? score + 1 : score;
          }, 0);

          // Also check for direct text similarity with the example (improved precision)
          const exampleText = example.input.toLowerCase();
          const exampleWords = exampleText.split(/\s+/).filter(word => word.length > 2); // Filter out very short words
          const textMatches = inputWords.reduce((score, word) => {
            const wordLower = word.toLowerCase();
            if (wordLower.length <= 2) return score; // Skip very short words
            return exampleWords.some(exampleWord => {
              // Exact match gets full score
              if (wordLower === exampleWord) return true;
              // For longer words, allow partial matching
              if (wordLower.length >= 4 && exampleWord.length >= 4) {
                return wordLower.includes(exampleWord) || exampleWord.includes(wordLower);
              }
              return false;
            }) ? score + 1 : score;
          }, 0);

          const totalMatches = keywordMatches + textMatches;

          // Debug logging (only in development)
          if (process.env.NODE_ENV === 'development' && totalMatches > 0) {
            console.log(`Intent: ${example.intent}, Keyword matches: ${keywordMatches}, Text matches: ${textMatches}, Total: ${totalMatches}`);
            console.log(`Keywords checked:`, example.keywords);
            console.log(`Input words:`, inputWords);
            // Show which specific keywords matched
            const matchedKeywords = example.keywords.filter(keyword => {
              const keywordLower = keyword.toLowerCase();
              return inputWords.some(word => {
                const wordLower = word.toLowerCase();
                if (wordLower === keywordLower) return true;
                if (keywordLower.length >= 4 && wordLower.length >= 4) {
                  return wordLower.includes(keywordLower) || keywordLower.includes(wordLower);
                }
                if (keywordLower.length >= 3 && wordLower.length >= 3) {
                  return wordLower === keywordLower || 
                         (wordLower.startsWith(keywordLower) && wordLower.length <= keywordLower.length + 2) ||
                         (keywordLower.startsWith(wordLower) && keywordLower.length <= wordLower.length + 2);
                }
                return false;
              });
            });
            console.log(`Matched keywords:`, matchedKeywords);
          }

          if (totalMatches > 0) {
            // Calculate confidence based on matches and input length
            const baseConfidence = 70;
            const matchBonus = totalMatches * 8;
            const lengthPenalty = Math.max(0, (inputWords.length - 5) * 2); // Penalty for very long input
            const confidence = Math.min(95, baseConfidence + matchBonus - lengthPenalty + Math.random() * 5);
            
            if (confidence > bestMatch.confidence) {
              bestMatch = { 
                intent: example.intent, 
                confidence: Math.round(confidence), 
                keywords: example.keywords,
                module: example.module
              };
            }
          }
        }

        setDetectedIntent(bestMatch.intent);
        setConfidence(bestMatch.confidence);
        
        // Trigger notification and assistant if confidence is high enough AND module exists
        if (bestMatch.confidence >= 85 && bestMatch.module && bestMatch.intent !== `🤖 ${t('homepage.ai_demos.intent_detection.intents.general_ai_assistant')}`) {
          const intentText = bestMatch.intent.replace(/^[^\s]*\s*/, ''); // Remove emoji/icon at start more reliably
          
          // Debug logging
          if (process.env.NODE_ENV === 'development') {
            console.log(`High confidence intent detected: ${intentText}, Module: ${bestMatch.module}, Confidence: ${bestMatch.confidence}%`);
          }
          
          // Intent detection complete - no longer automatically trigger assistant popup
          // Users can see the detected intent and navigate to modules manually if desired
        }
        
        setIsAnalyzing(false);
      }, 800);
    } else {
      setDetectedIntent('');
      setConfidence(0);
      setIsAnalyzing(false);
      setAnalysis([]);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [userInput, intentExamples, t, currentLanguage, addMessage, openAssistant]);

  const tryExample = (example: string) => {
    setUserInput(example);
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 90) return "text-green-600 dark:text-green-400";
    if (conf >= 80) return "text-blue-600 dark:text-blue-400";
    if (conf >= 70) return "text-yellow-600 dark:text-yellow-400";
    return "text-orange-600 dark:text-orange-400";
  };

  const getConfidenceBg = (conf: number) => {
    if (conf >= 90) return "bg-green-100 dark:bg-green-900/30";
    if (conf >= 80) return "bg-blue-100 dark:bg-blue-900/30";
    if (conf >= 70) return "bg-yellow-100 dark:bg-yellow-900/30";
    return "bg-orange-100 dark:bg-orange-900/30";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
          <EyeIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{t('homepage.ai_demos.intent_detection.title')}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('homepage.ai_demos.intent_detection.subtitle')}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={t('homepage.ai_demos.intent_detection.placeholder')}
            className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-gray-800 transition-all duration-200"
          />
          {isAnalyzing && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"
              />
            </div>
          )}
        </div>

        <AnimatePresence>
          {isAnalyzing && analysis.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
            >
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('homepage.ai_demos.intent_detection.analysis_process')}</h4>
                {analysis.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400"
                  >
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>{step}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {detectedIntent && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`${getConfidenceBg(confidence)} border-2 border-dashed rounded-xl p-4`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-800 dark:text-gray-200">{t('homepage.ai_demos.intent_detection.detected_intent')}</span>
                <span className={`text-sm font-bold ${getConfidenceColor(confidence)} px-2 py-1 rounded-full bg-white/50 dark:bg-gray-800/50`}>
                  {confidence}% {t('homepage.ai_demos.intent_detection.confidence')}
                </span>
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white mb-3">{detectedIntent}</div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${confidence}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-3 rounded-full ${confidence >= 90 ? 'bg-green-500' : confidence >= 80 ? 'bg-blue-500' : confidence >= 70 ? 'bg-yellow-500' : 'bg-orange-500'}`}
                />
              </div>
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                {confidence >= 90 ? t('homepage.ai_demos.intent_detection.excellent_match') : 
                 confidence >= 80 ? t('homepage.ai_demos.intent_detection.very_good_match') : 
                 confidence >= 70 ? t('homepage.ai_demos.intent_detection.good_match') : 
                 t('homepage.ai_demos.intent_detection.moderate_match')}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">{t('homepage.ai_demos.intent_detection.try_examples')}</p>
          <div className="grid grid-cols-1 gap-2">
            {intentExamples.slice(0, 3).map((example, index) => (
              <button
                key={index}
                onClick={() => tryExample(example.input)}
                className="text-left text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-lg transition-colors"
              >
                &ldquo;{example.input}&rdquo;
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// AI Thought Process Visualizer Component
function AIThoughtProcess() {
  const { t, currentLanguage } = useLanguageStore();
  const [activeStep, setActiveStep] = useState(0);
  const [isThinking, setIsThinking] = useState(false);

  const thoughtSteps = [
    { icon: EyeIcon, title: t('homepage.ai_demos.thought_process.steps.analyzing'), description: t('homepage.ai_demos.thought_process.steps.analyzing_desc') },
    { icon: CpuChipIcon, title: t('homepage.ai_demos.thought_process.steps.processing'), description: t('homepage.ai_demos.thought_process.steps.processing_desc') },
    { icon: SparklesIcon, title: t('homepage.ai_demos.thought_process.steps.generating'), description: t('homepage.ai_demos.thought_process.steps.generating_desc') },
    { icon: BoltIcon, title: t('homepage.ai_demos.thought_process.steps.optimizing'), description: t('homepage.ai_demos.thought_process.steps.optimizing_desc') },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsThinking(true);
      setTimeout(() => {
        setActiveStep((prev) => (prev + 1) % thoughtSteps.length);
        setIsThinking(false);
      }, 1000);
    }, 3000);

    return () => clearInterval(interval);
  }, [thoughtSteps.length]);

  return (
    <motion.div
      key={currentLanguage} // Force re-render when language changes
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      viewport={{ once: true }}
      className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
          <CpuChipIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{t('homepage.ai_demos.thought_process.title')}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('homepage.ai_demos.thought_process.subtitle')}</p>
        </div>
      </div>

      <div className="space-y-4">
        {thoughtSteps.map((step, index) => (
          <motion.div
            key={index}
            className={`flex items-start space-x-3 p-3 rounded-lg transition-all duration-300 ${
              index === activeStep
                ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800'
                : 'bg-gray-50 dark:bg-gray-700/50'
            }`}
            animate={{
              scale: index === activeStep ? 1.02 : 1,
            }}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              index === activeStep 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
            }`}>
              {index === activeStep && isThinking ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <step.icon className="w-4 h-4" />
              )}
            </div>
            <div className="flex-1">
              <h4 className={`font-medium transition-colors ${
                index === activeStep 
                  ? 'text-purple-900 dark:text-purple-100' 
                  : 'text-gray-700 dark:text-gray-300'
              }`}>
                {step.title}
              </h4>
              <p className={`text-sm transition-colors ${
                index === activeStep 
                  ? 'text-purple-700 dark:text-purple-300' 
                  : 'text-gray-500 dark:text-gray-500'
              }`}>
                {step.description}
              </p>
            </div>
            {index === activeStep && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-2 h-2 bg-purple-500 rounded-full"
              />
            )}
          </motion.div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
        <div className="flex items-center space-x-2">
          <OptigenceLogo size="sm" animate={true} />
          <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
            {t('homepage.ai_demos.thought_process.footer')}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// Smart Prediction Demo Component
function SmartPredictionDemo() {
  const { t, currentLanguage } = useLanguageStore();
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const modulePredictions = React.useMemo(() => {
    const getTranslationArray = (moduleName: string): string[] => {
      try {
        // Try to get individual array items from language store
        const predictions: string[] = [];
        for (let i = 0; i < 4; i++) {
          const key = `homepage.ai_demos.smart_prediction.predictions.${moduleName}.${i}`;
          const item = t(key);
          if (item && item !== key) { // Check if translation exists
            predictions.push(item);
          }
        }
        
        if (predictions.length > 0) {
          return predictions;
        }
      } catch (error) {
        console.warn('Translation error for module:', moduleName, error);
      }
      
      // Fallback to English hardcoded values if translation fails
      const fallbacks: { [key: string]: string[] } = {
        'OptiMail': [
          "Generate follow-up email for client meeting",
          "Create newsletter for product launch", 
          "Draft apology email for delayed delivery",
          "Write thank you message to team"
        ],
        'OptiShop': [
          "Find wireless headphones under $100",
          "Compare iPhone 15 vs Samsung Galaxy",
          "Search for ergonomic office chair",
          "Find birthday gift for tech enthusiast"
        ],
        'OptiHire': [
          "Find remote React developer positions", 
          "Create resume for marketing manager role",
          "Prepare for software engineer interview",
          "Search for entry-level data analyst jobs"
        ],
        'OptiTrip': [
          "Plan 7-day itinerary for Tokyo",
          "Find budget hotels in Barcelona",
          "Book flights from NYC to London",
          "Discover hidden gems in Prague"
        ]
      };
      return fallbacks[moduleName] || [];
    };

    return {
      'OptiMail': getTranslationArray('OptiMail'),
      'OptiShop': getTranslationArray('OptiShop'),
      'OptiHire': getTranslationArray('OptiHire'),
      'OptiTrip': getTranslationArray('OptiTrip'),
    };
  }, [t]);

  useEffect(() => {
    if (hoveredModule && modulePredictions[hoveredModule as keyof typeof modulePredictions]) {
      setIsGenerating(true);
      setTimeout(() => {
        setPredictions(modulePredictions[hoveredModule as keyof typeof modulePredictions] || []);
        setIsGenerating(false);
      }, 600);
    } else {
      setPredictions([]);
      setIsGenerating(false);
    }
  }, [hoveredModule, modulePredictions]);

  return (
    <motion.div
      key={currentLanguage} // Force re-render when language changes
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      viewport={{ once: true }}
      className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
          <SparklesIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{t('homepage.ai_demos.smart_prediction.title')}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('homepage.ai_demos.smart_prediction.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Object.keys(modulePredictions).map((module) => (
          <motion.button
            key={module}
            onMouseEnter={() => setHoveredModule(module)}
            onMouseLeave={() => setHoveredModule(null)}
            className={`p-4 rounded-xl border-2 transition-all duration-300 ${
              hoveredModule === module
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 scale-105'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-center">
              <div className={`w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center ${
                hoveredModule === module 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                {module === 'OptiMail' && <EnvelopeIcon className="w-5 h-5" />}
                {module === 'OptiShop' && <ShoppingBagIcon className="w-5 h-5" />}
                {module === 'OptiHire' && <BriefcaseIcon className="w-5 h-5" />}
                {module === 'OptiTrip' && <MapIcon className="w-5 h-5" />}
              </div>
              <span className={`text-sm font-medium ${
                hoveredModule === module 
                  ? 'text-green-900 dark:text-green-100' 
                  : 'text-gray-700 dark:text-gray-300'
              }`}>
                {module}
              </span>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="min-h-[120px] bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
        <AnimatePresence mode="wait">
          {!hoveredModule ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400"
            >
              <div className="text-center">
                <SparklesIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t('homepage.ai_demos.smart_prediction.hover_prompt')}</p>
              </div>
            </motion.div>
          ) : isGenerating ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-full"
            >
              <div className="flex items-center space-x-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full"
                />
                <span className="text-green-600 dark:text-green-400 font-medium">
                  {t('homepage.ai_demos.smart_prediction.generating')}
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  {t('homepage.ai_demos.smart_prediction.ai_predicted')} {hoveredModule}:
                </span>
              </div>
              {Array.isArray(predictions) && predictions.map((prediction, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  <span>{prediction}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-green-900 dark:text-green-100">
              {t('homepage.ai_demos.smart_prediction.learning')}
            </span>
          </div>
          <div className="text-xs text-green-700 dark:text-green-300 font-mono">
            {t('homepage.ai_demos.smart_prediction.accuracy')}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const modules = [
  {
    name: 'OptiMail',
    descriptionKey: 'homepage.modules.optimail.description',
    icon: EnvelopeIcon,
    featureKeys: ['homepage.modules.optimail.feature1', 'homepage.modules.optimail.feature2', 'homepage.modules.optimail.feature3', 'homepage.modules.optimail.feature4'],
  },
  {
    name: 'OptiShop', 
    descriptionKey: 'homepage.modules.optishop.description',
    icon: ShoppingBagIcon,
    featureKeys: ['homepage.modules.optishop.feature1', 'homepage.modules.optishop.feature2', 'homepage.modules.optishop.feature3', 'homepage.modules.optishop.feature4'],
  },
  {
    name: 'OptiHire',
    descriptionKey: 'homepage.modules.optihire.description',
    icon: BriefcaseIcon,
    featureKeys: ['homepage.modules.optihire.feature1', 'homepage.modules.optihire.feature2', 'homepage.modules.optihire.feature3', 'homepage.modules.optihire.feature4'],
  },
  {
    name: 'OptiTrip',
    descriptionKey: 'homepage.modules.optitrip.description',
    icon: MapIcon,
    featureKeys: ['homepage.modules.optitrip.feature1', 'homepage.modules.optitrip.feature2', 'homepage.modules.optitrip.feature3', 'homepage.modules.optitrip.feature4'],
  },
];

export default function Home() {
  const { t, currentLanguage } = useLanguageStore();
  const router = useRouter();
  const [email, setEmail] = useState('');

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      // Redirect to dedicated waitlist page with pre-filled email
      const emailParam = encodeURIComponent(email.trim());
      router.push(`/waitlist?email=${emailParam}`);
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 lg:pt-20 pb-16 sm:pb-20 lg:pb-28 text-center">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute top-1/4 left-1/4 w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-primary-light/10 dark:bg-primary-dark/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          ></motion.div>
          <motion.div 
            className="absolute top-1/3 right-1/4 w-24 h-24 sm:w-36 sm:h-36 lg:w-48 lg:h-48 bg-secondary-light/10 dark:bg-secondary-dark/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.5,
            }}
          ></motion.div>
          <motion.div 
            className="absolute bottom-1/4 left-1/3 w-20 h-20 sm:w-32 sm:h-32 lg:w-40 lg:h-40 bg-accent-light/10 dark:bg-accent-dark/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.35, 0.65, 0.35],
            }}
            transition={{
              duration: 5.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 3,
            }}
          ></motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative max-w-6xl mx-auto"
        >
          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center space-x-2 bg-primary-light/10 dark:bg-primary-dark/10 backdrop-blur-sm border border-primary-light/20 dark:border-primary-dark/20 rounded-full px-4 py-2 mb-6 sm:mb-8"
          >
            <SparklesIcon className="w-4 h-4 text-primary-light dark:text-primary-dark" />
            <span className="text-sm font-medium text-primary-light dark:text-primary-dark">
              {t('homepage.hero.tagline')}
            </span>
          </motion.div>

          {/* Main Title */}
          <motion.h1 
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-foreground-light dark:text-foreground-dark mb-4 sm:mb-6 lg:mb-8"
            animate={{
              textShadow: [
                '0 0 20px rgba(59, 130, 246, 0.2)',
                '0 0 40px rgba(99, 102, 241, 0.4)',
                '0 0 20px rgba(59, 130, 246, 0.2)'
              ],
              scale: [1, 1.01, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-primary-dark dark:from-primary-dark dark:to-primary-light">
              Optigence
            </span>
          </motion.h1>
          
          {/* Subtitle */}
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground-light/80 dark:text-foreground-dark/80 mb-6 sm:mb-8 lg:mb-10 max-w-4xl mx-auto">
            {t('homepage.hero.title')}
          </h2>
          
          {/* Description */}
          <p className="text-base sm:text-lg lg:text-xl text-foreground-light/70 dark:text-foreground-dark/70 mb-8 sm:mb-10 lg:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
            {t('homepage.hero.subtitle')}
          </p>

          {/* Key Value Propositions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-3 sm:gap-4 lg:gap-6 mb-10 sm:mb-12 lg:mb-16"
          >
            {[
              { icon: LightBulbIcon, text: t('homepage.hero.value1') },
              { icon: SparklesIcon, text: t('homepage.hero.value2') },
              { icon: CheckIcon, text: t('homepage.hero.value3') },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                className="flex items-center space-x-2 bg-card-light/50 dark:bg-card-dark/50 backdrop-blur-sm border border-border-light/50 dark:border-border-dark/50 rounded-full px-3 sm:px-4 py-2 text-sm sm:text-base"
              >
                <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-light dark:text-primary-dark" />
                <span className="text-foreground-light/80 dark:text-foreground-dark/80 font-medium">
                  {item.text}
                </span>
              </motion.div>
            ))}
          </motion.div>

          {/* Waitlist Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="max-w-2xl mx-auto"
          >
            <div className="mb-6 text-center">
              <h3 className="text-lg sm:text-xl font-semibold text-foreground-light dark:text-foreground-dark mb-2">
                {t('waitlist.title')}
              </h3>
              <p className="text-sm sm:text-base text-foreground-light/70 dark:text-foreground-dark/70">
                {t('waitlist.subtitle')}
              </p>
            </div>

            <motion.form
              onSubmit={handleWaitlistSubmit}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-lg mx-auto"
              whileHover={{ scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="flex-1">
                <TypingInput
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder={t('waitlist.email_placeholder')}
                  typingText="hello@optigence.tech"
                  typingSpeed={120}
                  typingDelay={2500}
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 text-base border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-gray-800 transition-all duration-200"
                  required
                />
              </div>
              <motion.button
                type="submit"
                className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-primary-light to-primary-dark dark:from-primary-dark dark:to-primary-light text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary-light/25 dark:hover:shadow-primary-dark/25 transition-all duration-300 flex items-center justify-center space-x-2 text-base whitespace-nowrap"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>{t('waitlist.join_button')}</span>
                <ArrowRightIcon className="w-5 h-5" />
              </motion.button>
            </motion.form>

            {/* Additional Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 text-sm text-foreground-light/60 dark:text-foreground-dark/60"
            >
              <div className="flex items-center space-x-2">
                <CheckIcon className="w-4 h-4 text-green-500" />
                <span>{t('homepage.hero.no_spam')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckIcon className="w-4 h-4 text-green-500" />
                <span>{t('homepage.hero.early_access')}</span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Interactive AI Demo Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50/50 to-white/50 dark:from-gray-900/50 dark:to-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground-light dark:text-foreground-dark mb-4">
              {t('homepage.ai_demos.title')}
            </h2>
            <p className="text-lg text-foreground-light/70 dark:text-foreground-dark/70 max-w-2xl mx-auto">
              {t('homepage.ai_demos.subtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* AI Intent Detection Demo */}
            <AIIntentDemo key={`intent-${currentLanguage}`} />
            
            {/* AI Thought Process Visualizer */}
            <AIThoughtProcess key={`thought-${currentLanguage}`} />
          </div>

          {/* Smart Prediction Demo - Full Width */}
          <div className="mt-8">
            <SmartPredictionDemo key={currentLanguage} />
          </div>
        </div>
      </section>

      {/* Early Access Benefits Section */}
      <section className="py-20 px-4 sm:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-primary-light dark:text-primary-dark mb-6">
              {t('homepage.benefits.title')}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {[
              {
                icon: LightBulbIcon,
                titleKey: 'homepage.benefits.early_access.title',
                descriptionKey: 'homepage.benefits.early_access.description'
              },
              {
                icon: GiftIcon,
                titleKey: 'homepage.benefits.pro_features.title',
                descriptionKey: 'homepage.benefits.pro_features.description'
              },
              {
                icon: MegaphoneIcon,
                titleKey: 'homepage.benefits.feedback.title',
                descriptionKey: 'homepage.benefits.feedback.description'
              },
              {
                icon: SparklesIcon,
                titleKey: 'homepage.benefits.exclusive.title',
                descriptionKey: 'homepage.benefits.exclusive.description'
              }
            ].map((benefit, index) => (
              <motion.div
                key={benefit.titleKey}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-card-light dark:bg-card-dark p-6 rounded-xl border border-border-light dark:border-border-dark hover:border-primary-light/50 dark:hover:border-primary-dark/50 transition-all duration-300"
              >
                <div className="flex items-center justify-center mb-4">
                  <benefit.icon className="w-8 h-8 text-primary-light dark:text-primary-dark" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground-light dark:text-foreground-dark mb-3">
                  {t(benefit.titleKey)}
                </h3>
                <p className="text-foreground-light/70 dark:text-foreground-dark/70">
                  {t(benefit.descriptionKey)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section className="px-6 pb-24">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground-light dark:text-foreground-dark mb-4">
              {t('homepage.modules.title')}
            </h2>
            <p className="text-lg text-foreground-light/70 dark:text-foreground-dark/70 max-w-2xl mx-auto">
              {t('homepage.modules.subtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {modules.map((module, index) => {
              const Icon = module.icon;
              return (
                <motion.div
                  key={module.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                  className="bg-card-light dark:bg-card-dark p-8 rounded-2xl shadow-lg border border-border-light dark:border-border-dark hover:shadow-xl transition-all duration-300"
                >
                  <div className="w-16 h-16 rounded-xl bg-card-light dark:bg-card-dark border-2 border-border-light dark:border-border-dark flex items-center justify-center mb-6">
                    <Icon className="w-8 h-8 text-primary-light dark:text-primary-dark" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-foreground-light dark:text-foreground-dark mb-2">
                    {module.name}
                  </h3>
                  
                  <p className="text-foreground-light/70 dark:text-foreground-dark/70 mb-6">
                    {t(module.descriptionKey)}
                  </p>
                  
                  <div className="space-y-2">
                    {module.featureKeys.map((featureKey) => (
                      <div key={featureKey} className="flex items-center space-x-2">
                        <CheckIcon className="w-4 h-4 text-primary-light dark:text-primary-dark" />
                        <span className="text-sm text-foreground-light/70 dark:text-foreground-dark/70">
                          {t(featureKey)}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-border-light dark:border-border-dark">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-accent-light dark:bg-accent-dark/30 text-primary-light dark:text-primary-dark">
                      {t('homepage.modules.coming_soon')}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 pb-24 bg-accent-light/30 dark:bg-accent-dark/10">
        <div className="max-w-6xl mx-auto pt-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground-light dark:text-foreground-dark mb-4">
              {t('homepage.features.title')}
            </h2>
            <p className="text-lg text-foreground-light/70 dark:text-foreground-dark/70">
              {t('homepage.features.subtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                titleKey: 'homepage.features.minimal_input.title',
                descriptionKey: 'homepage.features.minimal_input.description',
              },
              {
                titleKey: 'homepage.features.multilingual.title',
                descriptionKey: 'homepage.features.multilingual.description',
              },
              {
                titleKey: 'homepage.features.proactive.title',
                descriptionKey: 'homepage.features.proactive.description',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.titleKey}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-light to-primary-dark dark:from-primary-dark dark:to-primary-light flex items-center justify-center mx-auto mb-4">
                  <SparklesIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground-light dark:text-foreground-dark mb-2">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-foreground-light/70 dark:text-foreground-dark/70">
                  {t(feature.descriptionKey)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
