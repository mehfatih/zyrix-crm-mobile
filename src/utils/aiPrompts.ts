/**
 * Culturally-aware AI prompt helpers. The Arabic suggestions are
 * written in MSA with GCC-friendly phrasing; English and Turkish
 * strings mirror the same intent without direct translation so the
 * "voice" still feels native.
 */

import type { SupportedChatLanguage } from '../types/ai';

export const getWelcomePrompt = (
  userName: string | undefined,
  language: SupportedChatLanguage,
  role: string | null | undefined
): string => {
  const name = userName?.trim() || '';
  switch (language) {
    case 'ar':
      return name
        ? `مرحبًا ${name}! أنا مساعدك المالي الذكي. اسألني عن التدفق النقدي، العملاء المتأخرين، أو توقعات هذا الربع.`
        : 'مرحبًا! أنا مساعدك المالي الذكي. كيف يمكنني مساعدتك اليوم؟';
    case 'tr':
      return name
        ? `Merhaba ${name}! Ben AI CFO'nuzum. Nakit akışı, geciken ödemeler veya çeyrek tahminleri hakkında sorabilirsin.`
        : "Merhaba! AI CFO'nuzum. Bugün nasıl yardımcı olabilirim?";
    case 'en':
    default:
      return name
        ? `Hi ${name}, I'm your AI CFO${role ? ` (${role})` : ''}. Ask me about cash flow, late-paying customers, or quarter forecasts.`
        : "Hi! I'm your AI CFO. How can I help today?";
  }
};

export const getCFOSuggestions = (
  language: SupportedChatLanguage
): string[] => {
  switch (language) {
    case 'ar':
      return [
        'كيف هو وضعي المالي هذا الشهر؟',
        'من العملاء المتأخرين في الدفع؟',
        'هل هناك مخاطر مالية؟',
      ];
    case 'tr':
      return [
        'Bu ayki finansal durumum nasıl?',
        'Geciken ödemeler kimlerden?',
        'Finansal riskler var mı?',
      ];
    case 'en':
    default:
      return [
        'How is my financial health this month?',
        'Who are my late-paying customers?',
        'Are there any financial risks?',
      ];
  }
};

export const getArchitectSuggestions = (
  language: SupportedChatLanguage
): string[] => {
  switch (language) {
    case 'ar':
      return [
        'أدير عيادة بها 5 أطباء.',
        'أبيع مستحضرات تجميل أونلاين في السعودية والإمارات.',
        'أملك مكتبًا عقاريًا بـ 20 مندوبًا.',
      ];
    case 'tr':
      return [
        '5 doktorlu bir klinik işletiyorum.',
        'Suudi Arabistan ve BAE’de kozmetik satıyorum.',
        '20 danışmanlı bir emlak ofisim var.',
      ];
    case 'en':
    default:
      return [
        'I run a clinic with 5 doctors.',
        'I sell cosmetics online in Saudi and UAE.',
        'I own a real estate agency with 20 agents.',
      ];
  }
};

export const getBuilderSuggestions = (
  language: SupportedChatLanguage
): string[] => {
  switch (language) {
    case 'ar':
      return [
        'سلسلة ترحيب للعملاء الجدد.',
        'قالب تقرير مبيعات شهري.',
        'تذكير واتساب للعربات المتروكة.',
      ];
    case 'tr':
      return [
        'Yeni müşteriler için karşılama e-posta serisi.',
        'Aylık satış rapor şablonu.',
        'Terk edilmiş sepet için WhatsApp hatırlatıcısı.',
      ];
    case 'en':
    default:
      return [
        'A welcome email sequence for new customers.',
        'A monthly sales report template.',
        'A WhatsApp abandoned cart reminder.',
      ];
  }
};

export const getReportsSuggestions = (
  language: SupportedChatLanguage
): string[] => {
  switch (language) {
    case 'ar':
      return [
        'أفضل 10 عملاء من حيث الإيرادات لهذا الربع.',
        'أي المنتجات تباع بشكل أفضل في الرياض؟',
        'قارن مبيعات هذا الشهر بالشهر الماضي.',
      ];
    case 'tr':
      return [
        'Bu çeyreğin en yüksek gelirli 10 müşterisi.',
        'Riyad’da en çok satan ürünler hangileri?',
        'Bu ayki satışları geçen ayla karşılaştır.',
      ];
    case 'en':
    default:
      return [
        'Top 10 customers by revenue this quarter.',
        'Which products sell best in Riyadh?',
        'Compare sales this month vs last month.',
      ];
  }
};
