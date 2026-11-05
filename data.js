/* Каталог мастерской «Зерно».
   Цены указаны в рублях. Для зерна варианты — 250 г и 1 кг,
   для дрип-пакетов — наборы по 10 и 25 штук. */

const PRODUCTS = [
  {
    id: 'ethiopia-yirgacheffe',
    name: 'Эфиопия Иргачеффе',
    short: 'ЭФИОПИЯ',
    category: 'filter',
    origin: 'Эфиопия, Гедео',
    process: 'Мытая обработка',
    altitude: '1900–2100 м',
    roast: 'light',
    notes: ['жасмин', 'бергамот', 'лимонная цедра'],
    description: 'Чистая и звонкая чашка с цветочным ароматом и сочной цитрусовой кислотностью. Раскрывается в пуровере и аэропрессе, особенно хороша чуть остывшей.',
    popularity: 98,
    badge: 'Хит',
    colors: { bag: '#e9c46a', accent: '#b5651d', label: '#fff8ec', ink: '#3b2a1e' },
    variants: [
      { id: '250', label: '250 г', price: 890 },
      { id: '1000', label: '1 кг', price: 3190 }
    ]
  },
  {
    id: 'kenya-nyeri',
    name: 'Кения Ньери АА',
    short: 'КЕНИЯ',
    category: 'filter',
    origin: 'Кения, Ньери',
    process: 'Мытая обработка',
    altitude: '1700–1900 м',
    roast: 'light',
    notes: ['чёрная смородина', 'грейпфрут', 'вяленый томат'],
    description: 'Яркий, насыщенный кофе с ягодной сладостью и долгим винным послевкусием. Для тех, кто любит выразительную кислотность.',
    popularity: 81,
    badge: 'Микролот',
    colors: { bag: '#9b2c3a', accent: '#f2c6a0', label: '#fdf1e6', ink: '#3a1d22' },
    variants: [
      { id: '250', label: '250 г', price: 990 },
      { id: '1000', label: '1 кг', price: 3590 }
    ]
  },
  {
    id: 'colombia-huila',
    name: 'Колумбия Уила',
    short: 'КОЛУМБИЯ',
    category: 'espresso',
    origin: 'Колумбия, Уила',
    process: 'Мытая обработка',
    altitude: '1600–1800 м',
    roast: 'medium',
    notes: ['карамель', 'красное яблоко', 'какао'],
    description: 'Сбалансированный кофе на каждый день: мягкая сладость, приятная фруктовость и плотное тело. Одинаково хорош в эспрессо и в капучино.',
    popularity: 95,
    badge: '',
    colors: { bag: '#2f6f5e', accent: '#f0d9a8', label: '#fbf4e8', ink: '#1f3a32' },
    variants: [
      { id: '250', label: '250 г', price: 790 },
      { id: '1000', label: '1 кг', price: 2790 }
    ]
  },
  {
    id: 'brazil-cerrado',
    name: 'Бразилия Серрадо',
    short: 'БРАЗИЛИЯ',
    category: 'espresso',
    origin: 'Бразилия, Минас-Жерайс',
    process: 'Натуральная обработка',
    altitude: '1100–1250 м',
    roast: 'medium',
    notes: ['молочный шоколад', 'фундук', 'арахисовая паста'],
    description: 'Уютный, понятный и очень сладкий кофе без резкой кислотности. Идеальная основа для напитков с молоком и для гейзерной кофеварки.',
    popularity: 92,
    badge: '',
    colors: { bag: '#c98b4f', accent: '#3d2618', label: '#fff6ea', ink: '#3d2618' },
    variants: [
      { id: '250', label: '250 г', price: 690 },
      { id: '1000', label: '1 кг', price: 2390 }
    ]
  },
  {
    id: 'guatemala-antigua',
    name: 'Гватемала Антигуа',
    short: 'ГВАТЕМАЛА',
    category: 'espresso',
    origin: 'Гватемала, Антигуа',
    process: 'Мытая обработка',
    altitude: '1500–1700 м',
    roast: 'medium',
    notes: ['тёмный шоколад', 'корица', 'апельсин'],
    description: 'Пряный и бархатистый кофе с лёгкой цитрусовой ноткой. В эспрессо даёт густую пенку и долгое шоколадное послевкусие.',
    popularity: 74,
    badge: '',
    colors: { bag: '#4a5d8a', accent: '#f3c98b', label: '#f9f3ea', ink: '#26304a' },
    variants: [
      { id: '250', label: '250 г', price: 820 },
      { id: '1000', label: '1 кг', price: 2950 }
    ]
  },
  {
    id: 'rwanda-nyamasheke',
    name: 'Руанда Ньямашеке',
    short: 'РУАНДА',
    category: 'filter',
    origin: 'Руанда, Ньямашеке',
    process: 'Натуральная обработка',
    altitude: '1800–2000 м',
    roast: 'light',
    notes: ['малина', 'гибискус', 'тростниковый сахар'],
    description: 'Сочный и десертный лот с ягодным ароматом. Небольшая партия: обжариваем только по вторникам, пока не закончится.',
    popularity: 69,
    badge: 'Новинка',
    colors: { bag: '#d77a8a', accent: '#5a1f2b', label: '#fff4f0', ink: '#4a1c27' },
    variants: [
      { id: '250', label: '250 г', price: 950 },
      { id: '1000', label: '1 кг', price: 3450 }
    ]
  },
  {
    id: 'costa-rica-tarrazu',
    name: 'Коста-Рика Тарразу',
    short: 'КОСТА-РИКА',
    category: 'filter',
    origin: 'Коста-Рика, Тарразу',
    process: 'Хани-обработка',
    altitude: '1600–1900 м',
    roast: 'medium',
    notes: ['абрикос', 'липовый мёд', 'миндаль'],
    description: 'Мягкий и обволакивающий кофе с медовой сладостью. Хорошо прощает ошибки при заваривании — отличный выбор для первого знакомства с фильтром.',
    popularity: 77,
    badge: '',
    colors: { bag: '#e08e45', accent: '#fff1d6', label: '#fff8ee', ink: '#4a2a12' },
    variants: [
      { id: '250', label: '250 г', price: 920 },
      { id: '1000', label: '1 кг', price: 3290 }
    ]
  },
  {
    id: 'sumatra-lintong',
    name: 'Суматра Линтонг',
    short: 'СУМАТРА',
    category: 'espresso',
    origin: 'Индонезия, Суматра',
    process: 'Влажная очистка',
    altitude: '1300–1500 м',
    roast: 'dark',
    notes: ['кедр', 'тёмный шоколад', 'табак'],
    description: 'Плотный, землистый и низкокислотный кофе с древесными оттенками. Для любителей насыщенной чашки и крепкого эспрессо.',
    popularity: 63,
    badge: '',
    colors: { bag: '#3f4a3a', accent: '#d9b77e', label: '#f4efe4', ink: '#232a20' },
    variants: [
      { id: '250', label: '250 г', price: 760 },
      { id: '1000', label: '1 кг', price: 2690 }
    ]
  },
  {
    id: 'blend-morning',
    name: 'Смесь «Утро»',
    short: 'УТРО',
    category: 'espresso',
    origin: 'Бразилия · Колумбия',
    process: 'Эспрессо-смесь',
    altitude: '1100–1800 м',
    roast: 'medium',
    notes: ['шоколад', 'карамель', 'грецкий орех'],
    description: 'Наша домашняя смесь для эспрессо и молочных напитков. Стабильный вкус от партии к партии и сладость, которая не теряется в молоке.',
    popularity: 100,
    badge: 'Хит',
    colors: { bag: '#f1e3c8', accent: '#b8642e', label: '#ffffff', ink: '#3a2618' },
    variants: [
      { id: '250', label: '250 г', price: 720 },
      { id: '1000', label: '1 кг', price: 2490 }
    ]
  },
  {
    id: 'blend-night',
    name: 'Смесь «Тёмная ночь»',
    short: 'НОЧЬ',
    category: 'espresso',
    origin: 'Бразилия · Индия',
    process: 'Эспрессо-смесь',
    altitude: '900–1300 м',
    roast: 'dark',
    notes: ['горький шоколад', 'жжёный сахар', 'специи'],
    description: 'Классическая тёмная обжарка с плотным телом и минимальной кислотностью. Для турки, гейзера и тех, кто любит «кофе как в Италии».',
    popularity: 85,
    badge: '',
    colors: { bag: '#2a2320', accent: '#d39b5a', label: '#efe4d3', ink: '#2a2320' },
    variants: [
      { id: '250', label: '250 г', price: 690 },
      { id: '1000', label: '1 кг', price: 2390 }
    ]
  },
  {
    id: 'drip-ethiopia',
    name: 'Дрип-пакеты «Эфиопия»',
    short: 'ЭФИОПИЯ',
    category: 'drip',
    origin: 'Эфиопия, Гуджи',
    process: 'Натуральная обработка',
    altitude: '2000–2200 м',
    roast: 'light',
    notes: ['черника', 'молочный улун', 'персик'],
    description: 'Свежий фильтр-кофе без кофемолки и воронки: вскройте пакет, повесьте на чашку и пролейте 180 мл горячей воды. Каждый пакет — 12 г кофе.',
    popularity: 88,
    badge: 'Новинка',
    colors: { bag: '#8fb3a3', accent: '#24463a', label: '#fbf7ef', ink: '#1f3a30' },
    variants: [
      { id: '10', label: '10 шт', price: 650 },
      { id: '25', label: '25 шт', price: 1490 }
    ]
  },
  {
    id: 'drip-assorted',
    name: 'Дрип-набор «Ассорти»',
    short: 'АССОРТИ',
    category: 'drip',
    origin: 'Колумбия · Кения · Бразилия',
    process: 'Набор из трёх сортов',
    altitude: '1100–1900 м',
    roast: 'medium',
    notes: ['карамель', 'ягоды', 'орехи'],
    description: 'Три сорта в одной коробке — удобно взять в поездку, в офис или подарить. Сравните, как по-разному звучит кофе из разных стран.',
    popularity: 79,
    badge: '',
    colors: { bag: '#c4a7d6', accent: '#3e2a4f', label: '#fcf8f2', ink: '#33233f' },
    variants: [
      { id: '10', label: '10 шт', price: 690 },
      { id: '25', label: '25 шт', price: 1590 }
    ]
  }
];

const ROASTS = {
  light: { label: 'Светлая', level: 1 },
  medium: { label: 'Средняя', level: 2 },
  dark: { label: 'Тёмная', level: 3 }
};

const CATEGORIES = {
  espresso: 'Для эспрессо',
  filter: 'Для фильтра',
  drip: 'Дрип-пакеты'
};
