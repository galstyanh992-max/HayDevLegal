// Lightweight app-localization for the Galstyan & Partners shell + dashboard.
//
// Scope note (honest): the deep working views (search results, case workspace
// tabs) predate this layer and keep their Armenian strings; the SHELL, DASHBOARD
// and NEW pages are fully trilingual. Migrating every legacy string is tracked
// as incremental work — switching locale never loses query/case/draft context
// because the locale lives in a provider + localStorage, not in the URL.

export const LOCALES = ["hy", "ru", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "hy";

const hy = {
  brand: {
    name: "Galstyan & Partners",
    motto: "LEX · AEQUITAS · HUMANITAS",
    quote: "«Justice is not a privilege, it is a right.»",
    confidential: "Confidential · For Professional Use Only",
  },
  nav: {
    home: "Գլխավոր",
    cases: "Իմ գործերը",
    legislation: "Օրենսդրություն",
    precedents: "Դատական պրակտիկա",
    documents: "Փաստաթղթեր",
    assistant: "ԱԲ օգնական",
    analytics: "Վերլուծություն",
    calendar: "Օրացույց",
    collaboration: "Համագործակցություն",
    settings: "Կարգավորումներ",
    search: "Որոնում",
  },
  topbar: {
    searchPlaceholder: "Որոնել գործ, փաստաթուղթ…",
    notifications: "Ծանուցումներ",
    profile: "Պրոֆիլ",
    collapseSidebar: "Սեղմել մենյուն",
    expandSidebar: "Բացել մենյուն",
    openMenu: "Մենյու",
  },
  home: {
    searchPlaceholder: "Օրենք գտնել, նախադեպ, օրենսգիրք, իրավասություն…",
    searchAction: "Որոնել",
    chips: {
      legislation: "Օրենսդրություն",
      cassation: "Վճռաբեկ դատարան",
      echr: "ՄԻԵԴ որոշումներ",
      constitutional: "Սահմանադրական դատարան",
      more: "այլ…",
    },
    cards: {
      myCases: "Իմ գործերը",
      myCasesSub: "Բացել աշխատանքային գործերը",
      documents: "Փաստաթղթեր",
      documentsSub: "Վերբեռնել / դիտել",
      precedents: "Դատական պրակտիկա",
      precedentsSub: "Գտնել / պահպանել",
      legislation: "Օրենսդրություն",
      legislationSub: "Որոնել օրենսգրքերում",
      assistant: "ԱԲ օգնական",
      assistantSub: "Իրավական վերլուծություն",
      analytics: "Վերլուծություն",
      analyticsSub: "Գործերի վիճակագրություն",
    },
    kpi: {
      title: "Ցուցանիշներ",
      period: "Ընթացիկ",
      activeCases: "Ակտիվ գործեր",
      documents: "Փաստաթղթեր",
      savedPrecedents: "Պահպանված նախադեպեր",
      upcomingHearings: "Սպասվող նիստեր (7 օր)",
      unavailable: "Հասանելի չէ",
      retry: "Կրկնել",
      empty: "Դատարկ է",
      casesUnit: "ակտիվ գործ",
      documentsUnit: "փաստաթուղթ",
      precedentsUnit: "նախադեպ",
      hearingsUnit: "դատական նիստ",
    },
    recent: {
      title: "Վերջին գործերը",
      empty: "Վերջին գործեր չկան",
    },
    today: {
      title: "Այսօր",
      newEvent: "Նոր իրադարձություն",
      empty: "Այսօր իրադարձություններ չկան",
      hearing: "Դատական նիստ",
      meeting: "Հանդիպում",
      deadline: "Ժամկետ",
      task: "Առաջադրանք",
    },
  },
  common: {
    loading: "Բեռնվում է…",
    open: "Բացել",
    upload: "Վերբեռնել",
    comingSoon: "Բաժինը միացվում է",
    collaborationOffline: "Համագործակցությունը կազմաձևված չէ",
    owner: "Սեփականատեր",
    settingsLanguage: "Լեզու",
    settingsEffects: "Էֆեկտներ",
    settingsAi: "ԱԲ պրովայդերներ",
  },
};

type Dict = typeof hy;

const ru: Dict = {
  brand: {
    name: "Galstyan & Partners",
    motto: "LEX · AEQUITAS · HUMANITAS",
    quote: "«Justice is not a privilege, it is a right.»",
    confidential: "Confidential · For Professional Use Only",
  },
  nav: {
    home: "Главная",
    cases: "Мои дела",
    legislation: "Законодательство",
    precedents: "Судебная практика",
    documents: "Документы",
    assistant: "AI-помощник",
    analytics: "Аналитика",
    calendar: "Календарь",
    collaboration: "Сотрудничество",
    settings: "Настройки",
    search: "Поиск",
  },
  topbar: {
    searchPlaceholder: "Найти дело, документ…",
    notifications: "Уведомления",
    profile: "Профиль",
    collapseSidebar: "Свернуть меню",
    expandSidebar: "Развернуть меню",
    openMenu: "Меню",
  },
  home: {
    searchPlaceholder: "Найти закон, прецедент, кодекс, юрисдикцию…",
    searchAction: "Искать",
    chips: {
      legislation: "Законодательство",
      cassation: "Кассационный суд",
      echr: "Решения ЕСПЧ",
      constitutional: "Конституционный суд",
      more: "ещё…",
    },
    cards: {
      myCases: "Мои дела",
      myCasesSub: "Открыть рабочие дела",
      documents: "Документы",
      documentsSub: "Загрузить / просмотреть",
      precedents: "Судебная практика",
      precedentsSub: "Найти / сохранить",
      legislation: "Законодательство",
      legislationSub: "Поиск по кодексам",
      assistant: "AI-помощник",
      assistantSub: "Правовой анализ",
      analytics: "Аналитика",
      analyticsSub: "Статистика дел",
    },
    kpi: {
      title: "Показатели",
      period: "Текущие",
      activeCases: "Активные дела",
      documents: "Документы",
      savedPrecedents: "Сохранённая практика",
      upcomingHearings: "Ближайшие заседания (7 дней)",
      unavailable: "Недоступно",
      retry: "Повторить",
      empty: "Пусто",
      casesUnit: "активных дел",
      documentsUnit: "документов",
      precedentsUnit: "прецедентов",
      hearingsUnit: "заседаний",
    },
    recent: {
      title: "Недавние дела",
      empty: "Недавних дел нет",
    },
    today: {
      title: "Сегодня",
      newEvent: "Новое событие",
      empty: "На сегодня событий нет",
      hearing: "Заседание",
      meeting: "Встреча",
      deadline: "Срок",
      task: "Задача",
    },
  },
  common: {
    loading: "Загрузка…",
    open: "Открыть",
    upload: "Загрузить",
    comingSoon: "Раздел подключается",
    collaborationOffline: "Совместная работа не настроена",
    owner: "Владелец",
    settingsLanguage: "Язык",
    settingsEffects: "Эффекты",
    settingsAi: "AI-провайдеры",
  },
};

const en: Dict = {
  brand: {
    name: "Galstyan & Partners",
    motto: "LEX · AEQUITAS · HUMANITAS",
    quote: "«Justice is not a privilege, it is a right.»",
    confidential: "Confidential · For Professional Use Only",
  },
  nav: {
    home: "Home",
    cases: "My Cases",
    legislation: "Legislation",
    precedents: "Case Law",
    documents: "Documents",
    assistant: "AI Assistant",
    analytics: "Analytics",
    calendar: "Calendar",
    collaboration: "Collaboration",
    settings: "Settings",
    search: "Search",
  },
  topbar: {
    searchPlaceholder: "Find a case, document…",
    notifications: "Notifications",
    profile: "Profile",
    collapseSidebar: "Collapse menu",
    expandSidebar: "Expand menu",
    openMenu: "Menu",
  },
  home: {
    searchPlaceholder: "Find law, precedent, code, jurisdiction…",
    searchAction: "Search",
    chips: {
      legislation: "Legislation",
      cassation: "Court of Cassation",
      echr: "ECtHR decisions",
      constitutional: "Constitutional Court",
      more: "more…",
    },
    cards: {
      myCases: "My Cases",
      myCasesSub: "Open working cases",
      documents: "Documents",
      documentsSub: "Upload / browse",
      precedents: "Case Law",
      precedentsSub: "Find / save",
      legislation: "Legislation",
      legislationSub: "Search the codes",
      assistant: "AI Assistant",
      assistantSub: "Legal analysis",
      analytics: "Analytics",
      analyticsSub: "Case statistics",
    },
    kpi: {
      title: "Indicators",
      period: "Current",
      activeCases: "Active cases",
      documents: "Documents",
      savedPrecedents: "Saved precedents",
      upcomingHearings: "Upcoming hearings (7 days)",
      unavailable: "Unavailable",
      retry: "Retry",
      empty: "Empty",
      casesUnit: "active cases",
      documentsUnit: "documents",
      precedentsUnit: "precedents",
      hearingsUnit: "hearings",
    },
    recent: {
      title: "Recent cases",
      empty: "No recent cases",
    },
    today: {
      title: "Today",
      newEvent: "New event",
      empty: "Nothing scheduled today",
      hearing: "Hearing",
      meeting: "Meeting",
      deadline: "Deadline",
      task: "Task",
    },
  },
  common: {
    loading: "Loading…",
    open: "Open",
    upload: "Upload",
    comingSoon: "Section being connected",
    collaborationOffline: "Collaboration not configured",
    owner: "Owner",
    settingsLanguage: "Language",
    settingsEffects: "Effects",
    settingsAi: "AI providers",
  },
};

export const DICTIONARIES: Record<Locale, Dict> = { hy, ru, en };

export function getDictionary(locale: Locale): Dict {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
}

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

export type Dictionary = Dict;
