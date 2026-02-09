export const DEFAULT_CATEGORIES = [
  "Groceries", 
  "Eating Out", 
  "Transportation", 
  "Shopping", 
  "Leisure & Events", 
  "Health & Beauty", 
  "Miscellaneous", 
  "Investments", 
  "Emergency Fund"
];

export const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export const COLORS = {
  primary: '#2563eb', // blue-600
  success: '#10b981', // emerald-500
  danger: '#f43f5e',  // rose-500
  warning: '#f59e0b', // amber-500
  slate: '#64748b'    // slate-500
};

export const TRANSLATIONS = {
  en: {
      available: "Available", monthlyFlow: "Monthly Flow", totalIn: "Total In", fixedBills: "Fixed Bills",
      dailyExpenses: "Daily Expenses", emergencyFund: "Emergency Fund", investments: "Investments",
      freeCash: "Free Cash", spending: "Spending", logExpense: "Log Expense", history: "History",
      plan: "Plan", settings: "Settings", home: "Home", savings: "Savings", budget: "Budget",
      recurring: "Recurring", selectCategory: "Select Category", enterAmount: "Enter Amount",
      record: "Record Transaction", currency: "Currency", language: "Language", country: "Country",
      dangerZone: "Danger Zone", wipeData: "Wipe All Data", guide: "User Guide", openGuide: "Open App Guide",
      income: "Income", expense: "Expense", earned: "Earned", spentVs: "Spent vs Last Month",
      portfolio: "Portfolio Value", allocation: "Allocation", goals: "Goals & Funds", recurringInc: "Recurring Income",
      recurringBill: "Recurring Bills", leftToSpend: "Left to Spend", spent: "Spent"
  },
  es: {
      available: "Disponible", monthlyFlow: "Flujo Mensual", totalIn: "Total Entrante", fixedBills: "Gastos Fijos",
      dailyExpenses: "Gastos Diarios", emergencyFund: "Fondo Emergencia", investments: "Inversiones",
      freeCash: "Dinero Libre", spending: "Gastos", logExpense: "Registrar", history: "Historial",
      plan: "Planificar", settings: "Ajustes", home: "Inicio", savings: "Ahorros", budget: "Presupuesto",
      recurring: "Recurrente", selectCategory: "Seleccionar Categoría", enterAmount: "Ingresar Monto",
      record: "Registrar", currency: "Moneda", language: "Idioma", country: "País",
      dangerZone: "Zona Peligro", wipeData: "Borrar Datos", guide: "Guía Usuario", openGuide: "Abrir Guía",
      income: "Ingresos", expense: "Gastos", earned: "Ganado", spentVs: "Gasto vs Mes Ant.",
      portfolio: "Valor Portafolio", allocation: "Asignación", goals: "Metas y Fondos", recurringInc: "Ingreso Recurrente",
      recurringBill: "Cobros Recurrentes", leftToSpend: "Restante", spent: "Gastado"
  },
  fr: {
      available: "Disponible", monthlyFlow: "Flux Mensuel", totalIn: "Total Entrée", fixedBills: "Charges Fixes",
      dailyExpenses: "Dépenses", emergencyFund: "Fonds Urgence", investments: "Investissements",
      freeCash: "Argent Libre", spending: "Dépenses", logExpense: "Ajouter", history: "Historique",
      plan: "Planifier", settings: "Paramètres", home: "Accueil", savings: "Épargne", budget: "Budget",
      recurring: "Récurrent", selectCategory: "Choisir Catégorie", enterAmount: "Entrer Montant",
      record: "Enregistrer", currency: "Devise", language: "Langue", country: "Pays",
      dangerZone: "Zone Danger", wipeData: "Effacer Tout", guide: "Guide Utilisateur", openGuide: "Ouvrir Guide",
      income: "Revenu", expense: "Dépense", earned: "Gagné", spentVs: "Dépensé vs Dernier",
      portfolio: "Valeur Portfolio", allocation: "Allocation", goals: "Objectifs", recurringInc: "Revenu Récurrent",
      recurringBill: "Factures Récurrentes", leftToSpend: "Reste", spent: "Dépensé"
  },
  de: {
      available: "Verfügbar", monthlyFlow: "Monatsfluss", totalIn: "Gesamteinnahmen", fixedBills: "Fixkosten",
      dailyExpenses: "Tägliche Ausgaben", emergencyFund: "Notfallfonds", investments: "Investitionen",
      freeCash: "Freies Geld", spending: "Ausgaben", logExpense: "Eintragen", history: "Verlauf",
      plan: "Planen", settings: "Einst.", home: "Start", savings: "Sparen", budget: "Budget",
      recurring: "Wiederkehrend", selectCategory: "Kategorie wählen", enterAmount: "Betrag",
      record: "Speichern", currency: "Währung", language: "Sprache", country: "Land",
      dangerZone: "Gefahrenzone", wipeData: "Daten löschen", guide: "Benutzerhandbuch", openGuide: "Guide öffnen",
      income: "Einkommen", expense: "Ausgabe", earned: "Verdient", spentVs: "Ausg. vs Vormonat",
      portfolio: "Portfoliowert", allocation: "Verteilung", goals: "Ziele & Fonds", recurringInc: "Wiederk. Einkommen",
      recurringBill: "Wiederk. Rech.", leftToSpend: "Verbleibend", spent: "Ausg."
  },
  zh: {
      available: "可用", monthlyFlow: "月度流量", totalIn: "总收入", fixedBills: "固定账单",
      dailyExpenses: "日常开支", emergencyFund: "应急基金", investments: "投资",
      freeCash: "闲置资金", spending: "支出", logExpense: "记录支出", history: "历史",
      plan: "计划", settings: "设置", home: "主页", savings: "储蓄", budget: "预算",
      recurring: "经常性", selectCategory: "选择类别", enterAmount: "输入金额",
      record: "记录交易", currency: "货币", language: "语言", country: "国家",
      dangerZone: "危险区", wipeData: "清除所有数据", guide: "用户指南", openGuide: "打开指南",
      income: "收入", expense: "支出", earned: "收入", spentVs: "支出对比上月",
      portfolio: "投资组合价值", allocation: "分配", goals: "目标与基金", recurringInc: "经常性收入",
      recurringBill: "经常性账单", leftToSpend: "剩余", spent: "已用"
  }
};

export const CURRENCIES = [
  { code: "", label: "No Currency" },
  { code: "£", label: "British Pound (£)" },
  { code: "$", label: "US Dollar ($)" },
  { code: "€", label: "Euro (€)" },
  { code: "¥", label: "Japanese Yen (¥)" },
  { code: "₦", label: "Nigerian Naira (₦)" },
  { code: "R", label: "South African Rand (R)" },
  { code: "KSh", label: "Kenyan Shilling (KSh)" },
  { code: "GH₵", label: "Ghanaian Cedi (GH₵)" },
  { code: "₹", label: "Indian Rupee (₹)" },
  { code: "CN¥", label: "Chinese Yuan (CN¥)" },
  { code: "₩", label: "South Korean Won (₩)" },
  { code: "₽", label: "Russian Ruble (₽)" },
  { code: "A$", label: "Australian Dollar (A$)" },
  { code: "C$", label: "Canadian Dollar (C$)" },
  { code: "CHF", label: "Swiss Franc (CHF)" },
];

export const COUNTRIES = [
  "United Kingdom", "United States", "Nigeria", "South Africa", "Kenya", "Ghana", "Egypt", 
  "China", "India", "Japan", "South Korea", "Germany", "France", "Spain", "Italy", "Netherlands",
  "Canada", "Australia", "Brazil", "Mexico", "Argentina"
];

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español (Spanish)" },
  { code: "fr", label: "Français (French)" },
  { code: "de", label: "Deutsch (German)" },
  { code: "zh", label: "中文 (Chinese)" }
];