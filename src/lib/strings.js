// ═══════════════════════════════════════════════════════
// STRINGS ADDITIONS — merge these into your existing src/lib/strings.js
// Add to the S object and add formatCurrency if not already present
// ═══════════════════════════════════════════════════════

// ── New keys to add to S = { ... } ──────────────────────

// LiveIndicator
// live:         'مباشر',
// lastUpdated:  'آخر تحديث',

// DashboardStatCards
// statCeoPending:     'بانتظار موافقة الرئيس',
// statFinancePending: 'بانتظار الإصدار',
// statRejected:       'مرفوضة',
// statAwaitingValue:  'إجمالي القيمة المعلقة',

// SpendingChart
// spendingByDept: 'الإنفاق حسب القسم',
// noSpendingData: 'لا توجد بيانات إنفاق بعد',

// ── formatCurrency helper — add as named export ──────────

// export function formatCurrency(amount) {
//   if (amount == null) return '—'
//   return new Intl.NumberFormat('en-US', {
//     style:    'currency',
//     currency: 'USD',
//     maximumFractionDigits: 0,
//   }).format(amount)
// }

// ═══════════════════════════════════════════════════════
// FULL strings.js for reference — replace your existing file with this
// ═══════════════════════════════════════════════════════

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
  statCeoPending:     'بانتظار موافقة الرئيس',
  statFinancePending: 'بانتظار الإصدار',
  statRejected:       'مرفوضة',
  statAwaitingValue:  'إجمالي القيمة المعلقة',
  spendingByDept:     'الإنفاق حسب القسم',
  noSpendingData:     'لا توجد بيانات إنفاق بعد',

  // ── PO Status labels ─────────────────────
  statusPending:      'قيد الانتظار',
  statusApproved:     'معتمد — بانتظار الإصدار',
  statusReleased:     'صدر',
  statusRejected:     'مرفوض',
  statusResubmitted:  'أُعيد تقديمه',
  statusCancelled:    'ملغى',

  // ── PO List ──────────────────────────────
  poList:        'طلبات الشراء',
  filterAll:     'الكل',
  filterPending: 'قيد الانتظار',
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
  approve:       'اعتماد',
  reject:        'رفض',
  release:       'إصدار',
  resubmit:      'إعادة التقديم',
  cancel:        'إلغاء',
  confirmAction: 'تأكيد الإجراء',
  rejectionNote: 'سبب الرفض (مطلوب)',
  resubmitNote:  'ملاحظة إعادة التقديم (مطلوبة)',

  // ── Create PO ────────────────────────────
  createPO:      'إنشاء طلب شراء',
  stepDetails:   'التفاصيل',
  stepItems:     'البنود',
  stepAttach:    'المرفقات',
  stepReview:    'المراجعة',
  next:          'التالي',
  back:          'السابق',
  submit:        'إرسال الطلب',

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