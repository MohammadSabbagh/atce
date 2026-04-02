// ─── Arabic UI Strings ───────────────────────────────────────────────────────
// Single source of truth for all visible text in the app.
// All strings are in Arabic. No English fallbacks — Arabic only.

export const S = {

  // ── Greetings ──────────────────────────────────────
  greetingMorning:   'صباح الخير،',
  greetingAfternoon: 'مساء الخير،',
  greetingEvening:   'مساء النور،',

  // ── Role labels ────────────────────────────────────
  roles: {
    purchase_manager: 'مدير المشتريات',
    secretary:        'سكرتيرة',
    hr:               'الموارد البشرية',
    ceo:              'الرئيس التنفيذي',
    finance:          'المالية',
  },

  // ── Navigation labels ──────────────────────────────
  nav: {
    dashboard:    'الرئيسية',
    createPO:     'أمر شراء',
    orders:       'الطلبات',
    employees:    'الموظفون',
    myRequests:   'طلباتي',
    requests:     'الطلبات',
    allPOs:       'جميع الأوامر',
    orgChart:     'الهيكل التنظيمي',
    live:         'مباشر',
    allOrders:    'جميع الطلبات',
    hrApprovals:  'موافقات التوظيف',
  },

  // ── Dashboard ──────────────────────────────────────
  dashboard: {
    title:          'لوحة التحكم',
    recentOrders:   'الطلبات الأخيرة',
    viewAll:        'عرض الكل',
    noOrders:       'لا توجد أوامر شراء بعد',
    noOrdersHint:   'أنشئ أمر الشراء الأول من الأعلى',
    newPO:          'أمر شراء جديد',
    newPOHint:      'أدخل التفاصيل وأضف البنود وأرسل',
    poApprovals:    'موافقات أوامر الشراء',
    reviewAll:      'مراجعة الكل',
    byDepartment:   'حسب القسم',
    hireRequests:   'طلبات التوظيف',
    noFulfilledERs: 'لا توجد طلبات معلقة للموافقة',
    financeTitle:   'نظرة مالية عامة',
    financeSubtitle:'قراءة فقط · جميع الأقسام',
    updatedAt:      'آخر تحديث',
  },

  // ── Stat card labels ───────────────────────────────
  stats: {
    pending:       'قيد الانتظار',
    approved:      'معتمد',
    rejected:      'مرفوض',
    awaitingApproval: 'بانتظار الموافقة',
    pendingValue:  'القيمة المعلقة',
    totalOrders:   'إجمالي الطلبات',
    totalValue:    'إجمالي القيمة',
    allStatuses:   'جميع الحالات',
  },

  // ── Status labels ──────────────────────────────────
  status: {
    pending:   'معلق',
    approved:  'معتمد',
    rejected:  'مرفوض',
    fulfilled: 'مُنجز',
    open:      'مفتوح',
    released:  'مُصدر',
  },

  // ── PO fields ──────────────────────────────────────
  po: {
    title:          'عنوان الأمر',
    description:    'الوصف',
    date:           'التاريخ',
    department:     'القسم',
    tags:           'العلامات',
    total:          'الإجمالي',
    lineItems:      'البنود',
    attachments:    'المرفقات',
    requiresCEO:    'يتطلب موافقة الرئيس التنفيذي',
    createdBy:      'أنشأه',
    approvedBy:     'اعتمده',
    submit:         'إرسال الطلب',
    approve:        'اعتماد',
    reject:         'رفض',
    release:        'إصدار',
    approveRelease: 'اعتماد وإصدار',
  },

  // ── PO Create wizard ───────────────────────────────
  createPO: {
    stepDetails:     'التفاصيل',
    stepItems:       'البنود',
    stepAttachments: 'المرفقات',
    stepReview:      'المراجعة',
    next:            'التالي',
    back:            'رجوع',
    addItem:         'إضافة بند',
    itemDescription: 'وصف البند',
    itemPrice:       'السعر',
    uploadFile:      'رفع ملف',
    successTitle:    'تم إرسال الطلب',
    successHint:     'سيتم مراجعته من المختصين',
    viewOrder:       'عرض الأمر',
    newOrder:        'أمر جديد',
  },

  // ── Departments ────────────────────────────────────
  departments: {
    Operations: 'العمليات',
    Marketing:  'التسويق',
    Engineering: 'الهندسة',
    HR:         'الموارد البشرية',
    Sales:      'المبيعات',
    Legal:      'الشؤون القانونية',
    Finance:    'المالية',
  },

  // ── HR ─────────────────────────────────────────────
  hr: {
    employees:        'الموظفون',
    employeeList:     'قائمة الموظفين',
    createRequest:    'طلب توظيف جديد',
    fulfillRequests:  'إنجاز الطلبات',
    orgChart:         'الهيكل التنظيمي',
    approveHires:     'موافقات التوظيف',
    jobTitle:         'المسمى الوظيفي',
    salaryRange:      'نطاق الراتب',
    skills:           'المهارات المطلوبة',
    tasks:            'المهام والمسؤوليات',
    positions:        'عدد الشواغر',
    fulfill:          'إنجاز',
    headcount:        'عدد الموظفين',
    avgAge:           'متوسط العمر',
    payroll:          'الرواتب الشهرية',
    toRetirement:     'سنوات للتقاعد',
    yearsOld:         'سنة',
  },

  // ── Audit trail ────────────────────────────────────
  audit: {
    created:   'تم الإنشاء',
    submitted: 'تم الإرسال',
    approved:  'تم الاعتماد',
    rejected:  'تم الرفض',
    fulfilled: 'تم الإنجاز',
    released:  'تم الإصدار',
    by:        'بواسطة',
  },

  // ── Filters ────────────────────────────────────────
  filters: {
    all:        'الكل',
    allDepts:   'جميع الأقسام',
    status:     'الحالة',
    department: 'القسم',
  },

  // ── Actions / Misc ─────────────────────────────────
  actions: {
    review:    'مراجعة',
    viewDetails: 'عرض التفاصيل',
    save:      'حفظ',
    cancel:    'إلغاء',
    confirm:   'تأكيد',
    loading:   'جارٍ التحميل…',
    error:     'حدث خطأ',
    retry:     'إعادة المحاولة',
    logout:    'تسجيل الخروج',
  },

  // ── Auth ───────────────────────────────────────────
  auth: {
    email:       'البريد الإلكتروني',
    password:    'كلمة المرور',
    login:       'تسجيل الدخول',
    loginTitle:  'تسجيل الدخول',
    loginSubtitle: 'نظام إدارة المشتريات والموارد البشرية',
    loggingIn:   'جارٍ تسجيل الدخول…',
    invalidCreds: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
  },

  // ── Finance ────────────────────────────────────────
  finance: {
    live:        'مباشر',
    readOnly:    'قراءة فقط',
    allDepts:    'جميع الأقسام',
    ordersShown: 'طلب معروض',
    active:      'نشط',
    cleared:     '✓ معتمد',
    awaiting:    '⏳ بانتظار',
  },
}

// ── Helper: greeting based on time of day ─────────────────
export function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return S.greetingMorning
  if (h < 17) return S.greetingAfternoon
  return S.greetingEvening
}