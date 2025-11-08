// نظام العبارات الوصفية

class DescriptiveEvaluationsManager {
    constructor(app) {
        this.app = app;
        this.init();
    }

    async init() {
        await this.initializeDefaultCriteria();
        this.setupEventListeners();
    }

    // تهيئة المعايير الافتراضية
    async initializeDefaultCriteria() {
        const existingCriteria = await db.getAll('criteria');

        if (existingCriteria.length === 0) {
            // المعايير الافتراضية مع ترتيبها
            const defaultCriteria = [
                {
                    name: 'التحصيل الدراسي',
                    order: 1,
                    items: [
                        'متميز في التحصيل الدراسي',
                        'جيد جداً في التحصيل الدراسي',
                        'جيد في التحصيل الدراسي',
                        'متوسط التحصيل الدراسي',
                        'يحتاج إلى رعاية'
                    ]
                },
                {
                    name: 'السلوك',
                    order: 2,
                    items: [
                        'متميز سلوكياً بارك الله فيه',
                        'حسن السلوك ويحترم المعلم',
                        'حسن السلوك',
                        'أرجو متابعة الطالب سلوكياً',
                        'أتمنى نصحه لتعديل سلوكه'
                    ]
                },
                {
                    name: 'المشاركة الصفية',
                    order: 3,
                    items: [
                        'مشاركته فاعلة ومثرية للحصة',
                        'يشارك أحياناً في الحصة',
                        'يجتهد في الحصة',
                        'قليل المشاركة أرجو حثه',
                        'لا يشارك في الحصة'
                    ]
                },
                {
                    name: 'الانضباط',
                    order: 4,
                    items: [
                        'منضبط في الحصة',
                        'يهتم بالمادة',
                        'يقوم بتنفيذ الأنشطة',
                        'لا يقوم بتنفيذ الأنشطة',
                        'يحدث إزعاجاً أثناء الحصة'
                    ]
                },
                {
                    name: 'الملاحظات',
                    order: 5,
                    items: [
                        'أشكر الطالب وولي الأمر',
                        'أشكر ولي الأمر',
                        'لا يعطي للمادة اهتماماً',
                        'يتكلم أثناء الشرح',
                        'ينام في الحصة'
                    ]
                }
            ];

            // إضافة المعايير والبنود
            for (const criteria of defaultCriteria) {
                const criteriaId = await db.add('criteria', {
                    name: criteria.name,
                    order: criteria.order,
                    createdAt: new Date().toISOString()
                });

                for (let i = 0; i < criteria.items.length; i++) {
                    await db.add('criteriaItems', {
                        criteriaId: criteriaId,
                        text: criteria.items[i],
                        order: i + 1,
                        createdAt: new Date().toISOString()
                    });
                }
            }

            console.log('تم تهيئة المعايير الافتراضية');
        }
    }

    setupEventListeners() {
        // زر إدارة المعايير
        const manageCriteriaBtn = document.getElementById('manageCriteriaBtn');
        if (manageCriteriaBtn) {
            manageCriteriaBtn.addEventListener('click', () => this.openCriteriaManagement());
        }

        // زر تقييم طالب
        const evaluateStudentBtn = document.getElementById('evaluateStudentBtn');
        if (evaluateStudentBtn) {
            evaluateStudentBtn.addEventListener('click', () => this.openEvaluateStudent());
        }

        // زر عرض التقييمات
        const viewEvaluationsBtn = document.getElementById('viewEvaluationsBtn');
        if (viewEvaluationsBtn) {
            viewEvaluationsBtn.addEventListener('click', () => this.loadEvaluations());
        }

        // فلتر الصف للتقييمات
        const evalFilterClass = document.getElementById('evalFilterClass');
        if (evalFilterClass) {
            evalFilterClass.addEventListener('change', () => this.loadEvaluations());
        }

        // نموذج التقييم
        const evaluationForm = document.getElementById('evaluationForm');
        if (evaluationForm) {
            evaluationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveEvaluation();
            });
        }

        // إغلاق النوافذ
        const closeEvaluationModal = document.getElementById('closeEvaluationModal');
        if (closeEvaluationModal) {
            closeEvaluationModal.addEventListener('click', () => this.closeEvaluationModal());
        }

        const cancelEvaluationModal = document.getElementById('cancelEvaluationModal');
        if (cancelEvaluationModal) {
            cancelEvaluationModal.addEventListener('click', () => this.closeEvaluationModal());
        }
    }

    // فتح نافذة إدارة المعايير
    async openCriteriaManagement() {
        const modal = document.getElementById('criteriaManagementModal');
        if (!modal) return;

        await this.loadCriteriaList();
        modal.classList.add('active');
    }

    // تحميل قائمة المعايير
    async loadCriteriaList() {
        const criteria = await db.getAll('criteria');
        const container = document.getElementById('criteriaList');
        if (!container) return;

        if (criteria.length === 0) {
            container.innerHTML = '<p class="empty-state">لا توجد معايير</p>';
            return;
        }

        // ترتيب المعايير
        criteria.sort((a, b) => a.order - b.order);

        let html = '';
        for (const criterion of criteria) {
            const items = await this.getCriteriaItems(criterion.id);

            html += `
                <div class="criteria-card">
                    <div class="criteria-header">
                        <h4>${criterion.name}</h4>
                        <div class="criteria-actions">
                            <button class="icon-btn" onclick="descriptiveEval.editCriteria(${criterion.id})" title="تعديل">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="icon-btn danger" onclick="descriptiveEval.deleteCriteria(${criterion.id})" title="حذف">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="criteria-items">
                        ${items.map((item, index) => `
                            <div class="criteria-item">
                                <span class="item-number">${index + 1}</span>
                                <span class="item-text">${item.text}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    // الحصول على بنود معيار
    async getCriteriaItems(criteriaId) {
        const items = await db.getByIndex('criteriaItems', 'criteriaId', criteriaId);
        return items.sort((a, b) => a.order - b.order);
    }

    // فتح نافذة تقييم طالب
    async openEvaluateStudent() {
        const modal = document.getElementById('evaluationModal');
        if (!modal) return;

        // تحميل الصفوف
        await this.loadClassesForEvaluation();

        modal.classList.add('active');
    }

    // تحميل الصفوف لقائمة التقييم
    async loadClassesForEvaluation() {
        const classes = await db.getAll('classes');
        const select = document.getElementById('evalStudentClass');
        if (!select) return;

        select.innerHTML = '<option value="">اختر الصف</option>';
        classes.forEach(cls => {
            select.innerHTML += `<option value="${cls.id}">${cls.name}</option>`;
        });

        select.addEventListener('change', () => this.loadStudentsForEvaluation());
    }

    // تحميل الطلاب عند اختيار الصف
    async loadStudentsForEvaluation() {
        const classId = document.getElementById('evalStudentClass').value;
        const select = document.getElementById('evalStudentName');
        if (!select || !classId) return;

        const students = await db.getStudentsByClass(parseInt(classId));
        select.innerHTML = '<option value="">اختر الطالب</option>';
        students.forEach(student => {
            select.innerHTML += `<option value="${student.id}">${student.name}</option>`;
        });

        select.addEventListener('change', () => this.loadCriteriaForEvaluation());
    }

    // تحميل المعايير للتقييم
    async loadCriteriaForEvaluation() {
        const studentId = document.getElementById('evalStudentName').value;
        if (!studentId) return;

        const criteria = await db.getAll('criteria');
        criteria.sort((a, b) => a.order - b.order);

        const container = document.getElementById('evaluationCriteria');
        if (!container) return;

        let html = '';
        for (const criterion of criteria) {
            const items = await this.getCriteriaItems(criterion.id);

            html += `
                <div class="evaluation-criterion">
                    <h4 class="criterion-title">${criterion.name}</h4>
                    <div class="criterion-options">
                        ${items.map(item => `
                            <label class="criterion-option">
                                <input type="radio" name="criterion_${criterion.id}" value="${item.id}">
                                <span>${item.text}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    // حفظ التقييم
    async saveEvaluation() {
        const classId = parseInt(document.getElementById('evalStudentClass').value);
        const studentId = parseInt(document.getElementById('evalStudentName').value);
        const date = document.getElementById('evalDate').value;

        if (!classId || !studentId || !date) {
            alert('الرجاء ملء جميع الحقول المطلوبة');
            return;
        }

        const criteria = await db.getAll('criteria');
        const evaluations = [];

        for (const criterion of criteria) {
            const selectedInput = document.querySelector(`input[name="criterion_${criterion.id}"]:checked`);
            if (selectedInput) {
                const itemId = parseInt(selectedInput.value);
                const item = await db.get('criteriaItems', itemId);

                evaluations.push({
                    studentId: studentId,
                    classId: classId,
                    criteriaId: criterion.id,
                    itemId: itemId,
                    itemText: item.text,
                    date: date,
                    createdAt: new Date().toISOString()
                });
            }
        }

        if (evaluations.length === 0) {
            alert('الرجاء اختيار تقييم واحد على الأقل');
            return;
        }

        // حفظ جميع التقييمات
        for (const evaluation of evaluations) {
            await db.add('descriptiveEvaluations', evaluation);
        }

        alert('تم حفظ التقييم بنجاح');
        this.closeEvaluationModal();
        await this.loadEvaluations();
    }

    // إغلاق نافذة التقييم
    closeEvaluationModal() {
        const modal = document.getElementById('evaluationModal');
        if (modal) {
            modal.classList.remove('active');
            document.getElementById('evaluationForm').reset();
            document.getElementById('evaluationCriteria').innerHTML = '';
        }
    }

    // تحميل التقييمات
    async loadEvaluations() {
        const filterClassId = document.getElementById('evalFilterClass')?.value;

        let evaluations = await db.getAll('descriptiveEvaluations');

        if (filterClassId) {
            evaluations = evaluations.filter(e => e.classId == filterClassId);
        }

        const container = document.getElementById('evaluationsList');
        if (!container) return;

        if (evaluations.length === 0) {
            container.innerHTML = '<p class="empty-state">لا توجد تقييمات</p>';
            return;
        }

        // تجميع التقييمات حسب الطالب والتاريخ
        const grouped = {};
        for (const evaluation of evaluations) {
            const key = `${evaluation.studentId}_${evaluation.date}`;
            if (!grouped[key]) {
                grouped[key] = {
                    studentId: evaluation.studentId,
                    classId: evaluation.classId,
                    date: evaluation.date,
                    items: []
                };
            }
            grouped[key].items.push(evaluation);
        }

        let html = '';
        for (const key in grouped) {
            const group = grouped[key];
            const student = await db.get('students', group.studentId);
            const classData = await db.get('classes', group.classId);

            html += `
                <div class="evaluation-card">
                    <div class="evaluation-header">
                        <div>
                            <h4>${student ? student.name : 'غير معروف'}</h4>
                            <p class="evaluation-meta">${classData ? classData.name : ''} • ${new Date(group.date).toLocaleDateString('ar-SA')}</p>
                        </div>
                        <button class="icon-btn" onclick="descriptiveEval.viewEvaluationDetails(${group.studentId}, '${group.date}')" title="عرض">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                    <div class="evaluation-summary">
                        ${group.items.slice(0, 2).map(item => `
                            <span class="evaluation-badge">${item.itemText}</span>
                        `).join('')}
                        ${group.items.length > 2 ? `<span class="evaluation-count">+${group.items.length - 2}</span>` : ''}
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    // عرض تفاصيل التقييم
    async viewEvaluationDetails(studentId, date) {
        const evaluations = await db.getAll('descriptiveEvaluations');
        const studentEvals = evaluations.filter(e => e.studentId === studentId && e.date === date);

        if (studentEvals.length === 0) return;

        const student = await db.get('students', studentId);
        const classData = await db.get('classes', studentEvals[0].classId);

        let details = `<h3>تقييم: ${student ? student.name : 'غير معروف'}</h3>`;
        details += `<p><strong>الصف:</strong> ${classData ? classData.name : ''}</p>`;
        details += `<p><strong>التاريخ:</strong> ${new Date(date).toLocaleDateString('ar-SA')}</p>`;
        details += `<hr><div class="evaluation-details">`;

        for (const evaluation of studentEvals) {
            const criterion = await db.get('criteria', evaluation.criteriaId);
            details += `
                <div class="detail-item">
                    <strong>${criterion ? criterion.name : ''}:</strong>
                    <p>${evaluation.itemText}</p>
                </div>
            `;
        }

        details += `</div>`;

        // عرض في نافذة منبثقة أو modal
        alert(details.replace(/<[^>]*>/g, '\n'));
    }

    // حذف معيار
    async deleteCriteria(criteriaId) {
        if (!confirm('هل أنت متأكد من حذف هذا المعيار؟ سيتم حذف جميع البنود المرتبطة به.')) {
            return;
        }

        try {
            // حذف البنود أولاً
            const items = await this.getCriteriaItems(criteriaId);
            for (const item of items) {
                await db.delete('criteriaItems', item.id);
            }

            // حذف المعيار
            await db.delete('criteria', criteriaId);

            alert('تم حذف المعيار بنجاح');
            await this.loadCriteriaList();
        } catch (error) {
            console.error('خطأ في حذف المعيار:', error);
            alert('حدث خطأ أثناء حذف المعيار');
        }
    }
}

// إنشاء نسخة عامة
let descriptiveEval = null;
