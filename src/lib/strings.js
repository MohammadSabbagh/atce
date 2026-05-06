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
  filterDateFrom:        'من تاريخ',
  filterDateTo:          'إلى تاريخ',
  filterSearch:          'بحث',
  filterSearchPlaceholder: 'رقم الطلب أو العنوان...',

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

  // ── Action labels (referenced by poStatusConfig.js & moStatusConfig.js) ───
  // Single source of truth for status-transition button text across PO/MO/HR.
  pmConfirm:     'تأكيد',
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
  back:               '→ رجوع',
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

  // ── Currency ─────────────────────────────
  poCurrency:         'العملة',
  currencyUSD:        'دولار أمريكي',
  currencyLS:         'ليرة سورية',
  currencySymbolUSD:  'USD',
  currencySymbolLS:   'ل.س',

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
  saving:        'جارٍ الحفظ…',
  confirm:       'تأكيد',
  close:         'إغلاق',
  viewAll:       'عرض الكل',
  requiredField: 'هذا الحقل مطلوب',
  required:      '*',
  edit:          'تعديل',
  errorGeneric:  'حدث خطأ، يرجى المحاولة مجدداً',

  // ── Assets — general ─────────────────────
  assetsTitle:             'الأصول',
  assetsAddNew:            '+ أصل جديد',
  assetsSearchPlaceholder: 'بحث...',
  assetsEmpty:             'لا توجد أصول',
  assetActive:             'نشط',
  assetInactive:           'غير نشط',
  assetTypeCar:            'مركبة',
  assetTypeOther:          'عام',
  assetTypeCarWithIcon:    '🚗 سيارة',
  assetTypeOtherWithIcon:  '🔧 عام',
  assetAssignedTo:         'مسؤول عنه',
  assetInfoSection:        'التفاصيل',
  assetSerialNumber:       'الرقم التسلسلي',
  assetSourcePO:           'أمر الشراء',
  assetPlateNumber:        'رقم اللوحة',
  assetModel:              'الموديل',
  assetNotes:              'ملاحظات',
  assetAddImage:           'إضافة صورة',
  assetChangeImage:        'تغيير الصورة',

  // ── Asset form ───────────────────────────
  assetCreateTitle:         'أصل جديد',
  assetEditTitle:           'تعديل الأصل',
  assetType:                'النوع',
  assetName:                'الاسم',
  assetNamePlaceholder:     'اسم الأصل',
  assetDepartment:          'القسم',
  assetDeptPlaceholder:     'اختر القسم',
  assetPlatePlaceholder:    'مثال: ب أ 1234',
  assetModelPlaceholder:    'مثال: تويوتا كامري 2022',
  assetSerialPlaceholder:   'الرقم التسلسلي',
  assetAssignedPlaceholder: 'اسم المسؤول',
  assetNotesPlaceholder:    'أي ملاحظات إضافية...',
  assetActiveLabel:         'نشط',
  assetSaveChanges:         'حفظ التعديلات',
  assetCreate:              'إنشاء الأصل',

  // ── Asset form validation ────────────────
  assetErrorName: 'يرجى إدخال اسم الأصل',
  assetErrorDept: 'يرجى اختيار القسم',

  // ── MO List ──────────────────────────────
  moListTitle: 'أوامر الصيانة',
  moAddNew:    '+ أمر جديد',
  moEmpty:     'لا توجد أوامر صيانة',

  // ── MO Create wizard ─────────────────────
  moCreateTitle: 'أمر صيانة جديد',
  moStep1Label:  'الخطوة 1 — التفاصيل',
  moStep2Label:  'الخطوة 2 — التكلفة والوسوم',
  moStep3Label:  'الخطوة 3 — المرفقات',
  moStep4Label:  'الخطوة 4 — المراجعة',

  moTitle:                       'العنوان',
  moTitlePlaceholder:            'عنوان أمر الصيانة',
  moDescription:                 'الوصف',
  moDescPlaceholder:             'وصف المشكلة أو العمل المطلوب',
  moAsset:                       'الأصل',
  moSelectAsset:                 'اختر أصلاً',
  moChangeAsset:                 'تغيير',
  moServiceProvider:             'مزود الخدمة',
  moServiceProviderPlaceholder:  'اسم الشركة أو الفني',
  moHandler:                     'المسؤول',
  moHandlerPlaceholder:          'اسم المسؤول عن التنفيذ',
  requiresCEO:                   'يستلزم موافقة الرئيس',

  moCurrency:            'العملة',
  moItemDescription:     'وصف العمل / القطعة',
  moItemDescPlaceholder: 'مثال: تغيير زيت المحرك',
  moItemPrice:           'التكلفة',
  moTags:                'الوسوم',
  moTagPlaceholder:      'وسم جديد',
  moAddTag:              'إضافة',

  moAddAttachment:      'إضافة مرفق',
  moAttachmentOptional: 'المرفقات اختيارية',
  moAttachments:        'المرفقات',
  moAttachmentCount:    'ملفات',

  moSubmit: 'إنشاء أمر الصيانة',
  moPrev:   'السابق',
  moNext:   'التالي',

  // ── MO validation errors ─────────────────
  moErrorTitle:     'يرجى إدخال عنوان أمر الصيانة',
  moErrorAsset:     'يرجى اختيار الأصل',
  moErrorDept:      'يرجى اختيار القسم',
  moErrorItemDesc:  'يرجى إدخال وصف العمل',
  moErrorItemPrice: 'يرجى إدخال تكلفة صحيحة',

  // ── Team — general ───────────────────────
  teamTitle:               'فريق العمل',
  teamAddNew:              '+ عضو جديد',
  teamSearchPlaceholder:   'بحث بالاسم أو المسمى...',
  teamEmpty:               'لا يوجد أعضاء',
  teamMemberActive:        'نشط',
  teamMemberInactive:      'غير نشط',
  teamMemberFullName:      'الاسم الكامل',
  teamMemberTitle:         'المسمى الوظيفي',
  teamMemberDepartment:    'القسم',

  // ── Team form ────────────────────────────
  teamCreateTitle:         'عضو فريق جديد',
  teamEditTitle:           'تعديل بيانات العضو',
  teamNamePlaceholder:     'مثال: أحمد فرحات',
  teamTitlePlaceholder:    'مثال: محاسب أول',
  teamDeptPlaceholder:     'اختر القسم',
  teamActiveLabel:         'نشط',
  teamSaveChanges:         'حفظ التعديلات',
  teamCreate:              'إنشاء العضو',

  // ── Team validation ──────────────────────
  teamErrorName:  'يرجى إدخال الاسم',
  teamErrorTitle: 'يرجى إدخال المسمى الوظيفي',
  teamErrorDept:  'يرجى اختيار القسم',

  // assets type
  assetTypeCar: 'مركبة',
  assetTypeOther: 'عام',
  // dahsboard
  quickActionTeamLabel:      'الفريق',
  quickActionTeamSubtitle:   'إدارة الأعضاء والأدوار',
  quickActionAssetsLabel:    'الأصول',
  quickActionAssetsSubtitle: 'تصفح وإدارة الأصول',

  //PO edit 
  editPO: 'تعديل طلب الشراء',
  saveDraft: 'حفظ التعديلات',
  attachExisting: 'المرفقات الحالية',
  attachHintEdit: 'إضافة مرفقات جديدة (PDF أو صورة، حد أقصى 10 ميغابايت)',

  moEditTitle: 'تعديل أمر الصيانة',
  moSaveEdit: 'حفظ التعديلات',

  openUserMenu:  'قائمة المستخدم',
  userMenuLabel: 'قائمة المستخدم',
  signOut:       'تسجيل الخروج',
  signingOut:    'جارٍ الخروج...',
  rolePurchaseManager: 'مدير المشتريات',
  roleSecretary:       'سكرتيرة',
  roleCeo:             'المدير التنفيذي',
  roleFinance:         'المالية',
  roleHr:              'الموارد البشرية',
  
}

// ── Greeting by time of day ──────────────────
export function getGreeting() {
  const hour = new Date().getHours()
  if (hour >= 5  && hour < 12) return 'صباح الخير'
  if (hour >= 12 && hour < 17) return 'مساء الخير'
  if (hour >= 17 && hour < 21) return 'مساء النور'
  return 'مرحباً'
}