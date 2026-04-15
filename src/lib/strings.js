export const S = {
  // ── Auth ─────────────────────────────────
  appName:       'نظام إدارة المشتريات',
  signIn:        'تسجيل الدخول',
  signOut:       'تسجيل الخروج',
  email:         'البريد الإلكتروني',
  password:      'كلمة المرور',
  signingIn:     'جارٍ تسجيل الدخول...',

  // ── Navigation ───────────────────────────
  navDashboard:  'الرئيسية',
  navPOList:     'طلبات الشراء',
  navCreatePO:   'إنشاء طلب',

  // ── Dashboard ────────────────────────────
  live:               'مباشر',
  lastUpdated:        'آخر تحديث',
  statPmDrafts:       'مسودات بانتظار التأكيد',
  statCeoPending:     'بانتظار موافقة الرئيس',
  statFinancePending: 'بانتظار الإصدار',
  statRejected:       'مرفوضة',
  statAwaitingValue:  'إجمالي القيمة المعلقة',
  spendingByDept:     'الإنفاق حسب القسم',
  noSpendingData:     'لا توجد بيانات إنفاق بعد',

  // ── PO Status labels ─────────────────────
  statusDraft:        'مسودة',
  statusPending:      'معلق',
  statusApproved:     'معتمد',
  statusReleased:     'صادر',
  statusRejected:     'مرفوض',
  statusCancelled:    'ملغى',

  // ── PO List ──────────────────────────────
  poList:        'طلبات الشراء',
  filterAll:     'الكل',
  filterDraft:    'مسودة',
  filterPending:  'قيد الانتظار',
  filterApproved:'معتمد',
  filterReleased:'صدر',
  filterRejected:'مرفوض',
  filterCancelled:'ملغى',
  filterCeoPending:'يتطلب موافقة',
  viewDetails:   'عرض التفاصيل',
  noResults:     'لا توجد نتائج',
  filters:        'تصفية',
  filterDateFrom: 'من تاريخ',
  filterDateTo:   'إلى تاريخ',

  // ── PO Detail ────────────────────────────
  poDetails:     'تفاصيل الطلب',
  lineItems:     'بنود الطلب',
  total:         'الإجمالي',
  department:    'القسم',
  tags:          'الوسوم',
  attachments:   'المرفقات',
  auditLog:      'سجل العمليات',
  notes:         'الملاحظات',
  addNote:       'إضافة ملاحظة',
  submitNote:    'إرسال',

  // ── PO Actions ───────────────────────────
  pmConfirm:     'تأكيد وإحالة',
  approve:       'اعتماد',
  reject:        'رفض',
  release:       'إصدار',
  cancel:        'إلغاء',
  confirmAction: 'تأكيد الإجراء',
  rejectionNote: 'سبب الرفض (مطلوب)',

  // ── Create PO — Wizard shell ─────────────
  createPO:           'إنشاء طلب شراء',
  stepDetails:        'التفاصيل',
  stepItems:          'البنود',
  stepAttach:         'المرفقات',
  stepReview:         'المراجعة',
  next:               'التالي',
  back:               'السابق',
  submit:             'إرسال الطلب',
  submitting:         'جارٍ الإرسال...',
  continue:           'متابعة',

  // ── Create PO — Step 1: Details ──────────
  poTitle:            'العنوان',
  poTitlePlaceholder: 'مثال: مستلزمات مكتبية الربع الأول',
  poDescription:      'الوصف',
  poDescPlaceholder:  'تفاصيل اختيارية حول طلب الشراء هذا',
  poDate:             'التاريخ',
  poDepartment:       'القسم',
  poDeptPlaceholder:  'اختر القسم',
  poTags:             'الوسوم',
  poTagsPlaceholder:  'أضف وسوماً...',
  requiresCeo:        'يتطلب موافقة الرئيس التنفيذي',
  requiresCeoHint:    'يُحوَّل هذا الطلب إلى قائمة اعتماد الرئيس التنفيذي',

  // ── Create PO — Step 2: Line Items ───────
  itemDescription:    'وصف البند',
  itemPrice:          'السعر',
  addItem:            '+ إضافة بند',
  itemPlaceholder:    'وصف البند',

  // ── Create PO — Step 3: Attachments ──────
  attachHint:         'أرفق المستندات الداعمة (PDF أو صور، الحد الأقصى {max} ميغابايت لكل ملف). هذه الخطوة اختيارية.',
  attachDropzone:     'اضغط للاستعراض أو اسحب الملفات هنا',
  attachFormats:      'PDF، PNG، JPG · الحد الأقصى {max} ميغابايت',
  attachSizeError:    'يتجاوز حجم الملف {name} الحد المسموح به ({max} ميغابايت)',

  // ── Create PO — Step 4: Review ───────────
  reviewDetails:      'التفاصيل',
  reviewTitle:        'العنوان',
  reviewDescription:  'الوصف',
  reviewDate:         'التاريخ',
  reviewDepartment:   'القسم',
  reviewSubmittedBy:  'مُقدَّم من',
  reviewStatus:       'الحالة',
  reviewCeoApproval:  'موافقة الرئيس التنفيذي',
  reviewCeoRequired:  'مطلوبة',
  reviewTags:         'الوسوم',
  reviewLineItems:    'بنود الطلب',
  reviewTotal:        'الإجمالي',
  reviewAttachments:  'المرفقات',
  reviewAttachCount:  'المرفقات ({count})',

  // ── Submit Success ────────────────────────
  successTitle:       'تم إرسال الطلب',
  successSubtitle:    'تم تقديم طلب الشراء بنجاح وهو قيد المراجعة.',
  successBackBtn:     'العودة إلى الطلبات',

  // ── General ──────────────────────────────
  loading:       'جارٍ التحميل...',
  error:         'حدث خطأ',
  retry:         'إعادة المحاولة',
  save:          'حفظ',
  cancel_action: 'إلغاء',
  confirm:       'تأكيد',
  close:         'إغلاق',
  viewAll:       'عرض الكل',
  requiredField: 'هذا الحقل مطلوب',
  required:      '*',
}

// ── Greeting by time of day ──────────────────
export function getGreeting() {
  const hour = new Date().getHours()
  if (hour >= 5  && hour < 12) return 'صباح الخير'
  if (hour >= 12 && hour < 17) return 'مساء الخير'
  if (hour >= 17 && hour < 21) return 'مساء النور'
  return 'مرحباً'
}

// ── Currency formatter ───────────────────────
export function formatCurrency(amount) {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style:                 'currency',
    currency:              'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}