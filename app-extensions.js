// إضافات وظائف التطبيق - الاستيراد والتصدير والتكامل

// تمديد فئة GradesApp بوظائف جديدة
Object.assign(GradesApp.prototype, {

    // ============= وظائف الاستيراد =============

    async setupImportExport() {
        // زر استيراد الطلاب
        document.getElementById('importStudentsBtn')?.addEventListener('click', () => {
            document.getElementById('importFileInput').click();
        });

        // معالجة ملف الاستيراد
        document.getElementById('importFileInput')?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                await this.importStudents(file);
                e.target.value = ''; // إعادة تعيين input
            }
        });

        // زر تحميل القالب
        document.getElementById('downloadTemplateBtn')?.addEventListener('click', () => {
            importExportManager.downloadStudentsTemplate();
        });

        // زر تصدير الطلاب
        document.getElementById('exportStudentsBtn')?.addEventListener('click', () => {
            this.exportType = 'students';
            this.openExportModal();
        });

        // زر تصدير الدرجات
        document.getElementById('exportGradesBtn')?.addEventListener('click', () => {
            const classId = document.getElementById('gradesFilterClass').value;
            const assessmentId = document.getElementById('gradesFilterAssessment').value;

            if (!classId || !assessmentId) {
                alert('يرجى اختيار الصف وأداة التقويم أولاً');
                return;
            }

            this.exportType = 'grades';
            this.exportData = { classId: parseInt(classId), assessmentId: parseInt(assessmentId) };
            this.openExportModal();
        });

        // زر إرسال للبوابة
        document.getElementById('exportToPortalBtn')?.addEventListener('click', () => {
            this.exportToPortal();
        });

        // زر إعدادات البوابة
        document.getElementById('openPortalSettingsBtn')?.addEventListener('click', () => {
            this.openPortalSettingsModal();
        });

        // إغلاق نافذة التصدير
        document.getElementById('closeExportModal')?.addEventListener('click', () => {
            this.closeExportModal();
        });

        // إغلاق نافذة إعدادات البوابة
        document.getElementById('closePortalSettingsModal')?.addEventListener('click', () => {
            this.closePortalSettingsModal();
        });

        document.getElementById('cancelPortalSettings')?.addEventListener('click', () => {
            this.closePortalSettingsModal();
        });

        // حفظ إعدادات البوابة
        document.getElementById('portalSettingsForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePortalSettings();
        });

        // إغلاق نافذة تقدم الاستيراد
        document.getElementById('closeImportProgress')?.addEventListener('click', () => {
            this.closeImportProgressModal();
        });
    },

    async importStudents(file) {
        // فتح نافذة التقدم
        const modal = document.getElementById('importProgressModal');
        modal.classList.add('active');

        const progressBar = document.getElementById('importProgressBar');
        const progressText = document.getElementById('importProgressText');
        const resultsDiv = document.getElementById('importResults');
        const closeBtn = document.getElementById('closeImportProgress');

        progressBar.style.width = '30%';
        progressText.textContent = 'جاري قراءة ملف Excel...';
        resultsDiv.style.display = 'none';
        closeBtn.style.display = 'none';

        try {
            // قراءة الملف
            const result = await importExportManager.importStudentsFromExcel(file);

            progressBar.style.width = '60%';
            progressText.textContent = 'جاري حفظ الطلاب في قاعدة البيانات...';

            // حفظ الطلاب
            let successCount = 0;
            let failCount = 0;
            const importErrors = [...result.errors];

            for (const studentData of result.students) {
                try {
                    await db.addStudent(studentData);
                    successCount++;
                } catch (error) {
                    failCount++;
                    importErrors.push({
                        row: 'غير معروف',
                        error: `خطأ في حفظ ${studentData.name}: ${error.message}`
                    });
                }
            }

            progressBar.style.width = '100%';
            progressText.textContent = 'اكتمل الاستيراد!';

            // عرض النتائج
            resultsDiv.style.display = 'block';
            resultsDiv.innerHTML = `
                <h4>نتائج الاستيراد</h4>
                <div style="margin: 1rem 0;">
                    <div style="margin-bottom: 0.5rem;">
                        <i class="fas fa-check-circle" style="color: var(--success-color);"></i>
                        تم استيراد <span class="success-count">${successCount}</span> طالب/طالبة بنجاح
                    </div>
                    ${failCount > 0 ? `
                        <div>
                            <i class="fas fa-exclamation-circle" style="color: var(--danger-color);"></i>
                            فشل استيراد <span class="error-count">${failCount}</span> سجل
                        </div>
                    ` : ''}
                </div>
                ${importErrors.length > 0 ? `
                    <div class="import-error-list">
                        <h5>الأخطاء:</h5>
                        ${importErrors.map(err => `
                            <div class="import-error-item">
                                <strong>الصف ${err.row}:</strong> ${err.error}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            `;

            closeBtn.style.display = 'inline-flex';

            // تحديث قائمة الطلاب
            if (this.currentPage === 'students') {
                await this.loadStudents();
            }
            await this.loadDashboard();

        } catch (error) {
            progressBar.style.width = '100%';
            progressBar.style.background = 'var(--danger-color)';
            progressText.textContent = 'حدث خطأ!';

            resultsDiv.style.display = 'block';
            resultsDiv.innerHTML = `
                <div style="color: var(--danger-color);">
                    <i class="fas fa-exclamation-triangle fa-2x"></i>
                    <p>${error}</p>
                </div>
            `;

            closeBtn.style.display = 'inline-flex';
        }
    },

    closeImportProgressModal() {
        document.getElementById('importProgressModal').classList.remove('active');
    },

    // ============= وظائف التصدير =============

    openExportModal() {
        document.getElementById('exportModal').classList.add('active');
    },

    closeExportModal() {
        document.getElementById('exportModal').classList.remove('active');
    },

    async exportData(format) {
        this.closeExportModal();

        try {
            switch (format) {
                case 'json':
                    await importExportManager.exportToJSON(this.exportType, this.exportData);
                    break;
                case 'csv':
                    await importExportManager.exportToCSV(this.exportType, this.exportData);
                    break;
                case 'xml':
                    await importExportManager.exportToXML(this.exportType, this.exportData);
                    break;
                case 'excel':
                    await importExportManager.exportToExcel(this.exportType, this.exportData);
                    break;
            }

            alert('تم التصدير بنجاح!');
        } catch (error) {
            console.error('خطأ في التصدير:', error);
            alert('حدث خطأ أثناء التصدير: ' + error.message);
        }
    },

    // ============= التكامل مع البوابة التعليمية =============

    openPortalSettingsModal() {
        const modal = document.getElementById('portalSettingsModal');

        // تحميل الإعدادات المحفوظة
        const savedSettings = this.loadPortalSettings();
        if (savedSettings) {
            document.getElementById('portalSchoolId').value = savedSettings.schoolId || '';
            document.getElementById('portalTeacherId').value = savedSettings.teacherId || '';
            document.getElementById('portalApiUrl').value = savedSettings.apiUrl || '';
            document.getElementById('portalApiToken').value = savedSettings.apiToken || '';
        }

        modal.classList.add('active');
    },

    closePortalSettingsModal() {
        document.getElementById('portalSettingsModal').classList.remove('active');
        document.getElementById('portalSettingsForm').reset();
    },

    savePortalSettings() {
        const settings = {
            schoolId: document.getElementById('portalSchoolId').value,
            teacherId: document.getElementById('portalTeacherId').value,
            apiUrl: document.getElementById('portalApiUrl').value,
            apiToken: document.getElementById('portalApiToken').value
        };

        localStorage.setItem('portalSettings', JSON.stringify(settings));
        alert('تم حفظ إعدادات البوابة بنجاح');
        this.closePortalSettingsModal();
    },

    loadPortalSettings() {
        const saved = localStorage.getItem('portalSettings');
        return saved ? JSON.parse(saved) : null;
    },

    async exportToPortal() {
        const classId = document.getElementById('gradesFilterClass').value;
        const assessmentId = document.getElementById('gradesFilterAssessment').value;

        if (!classId || !assessmentId) {
            alert('يرجى اختيار الصف وأداة التقويم أولاً');
            return;
        }

        const portalConfig = this.loadPortalSettings();
        if (!portalConfig || !portalConfig.schoolId || !portalConfig.teacherId) {
            alert('يرجى ضبط إعدادات البوابة أولاً من صفحة الإعدادات');
            return;
        }

        if (!confirm('هل أنت متأكد من إرسال البيانات إلى البوابة التعليمية؟')) {
            return;
        }

        try {
            const result = await importExportManager.exportToPortal({
                classId: parseInt(classId),
                assessmentId: parseInt(assessmentId),
                portalConfig: portalConfig
            });

            if (result.success) {
                alert(result.message);
            }
        } catch (error) {
            console.error('خطأ في إرسال البيانات:', error);
            alert('حدث خطأ: ' + error.message);
        }
    },

    // ============= دعم الصفوف المتعددة في أدوات التقويم =============

    async loadClassesForAssessment() {
        const classes = await db.getAll('classes');
        const container = document.getElementById('assessmentClasses');

        if (classes.length === 0) {
            container.innerHTML = '<p class="empty-state">لا توجد صفوف مضافة. يرجى إضافة صف أولاً.</p>';
            return;
        }

        container.innerHTML = classes.map(cls => `
            <div class="class-checkbox-item">
                <input type="checkbox"
                       id="class-${cls.id}"
                       name="assessmentClasses"
                       value="${cls.id}">
                <label for="class-${cls.id}" class="class-checkbox-label">
                    <div>${cls.name}</div>
                    <div class="class-checkbox-info">${cls.grade} - ${cls.subject}</div>
                </label>
            </div>
        `).join('');
    },

    getSelectedClasses() {
        const checkboxes = document.querySelectorAll('input[name="assessmentClasses"]:checked');
        return Array.from(checkboxes).map(cb => parseInt(cb.value));
    },

    async saveAssessmentWithMultipleClasses() {
        const assessmentId = document.getElementById('assessmentId').value;
        const selectedClasses = this.getSelectedClasses();

        if (selectedClasses.length === 0) {
            alert('يرجى اختيار صف واحد على الأقل');
            return false;
        }

        const assessmentData = {
            name: document.getElementById('assessmentName').value,
            type: document.getElementById('assessmentType').value,
            maxGrade: parseFloat(document.getElementById('assessmentMaxGrade').value),
            weight: parseFloat(document.getElementById('assessmentWeight').value),
            date: document.getElementById('assessmentDate').value
        };

        try {
            // إذا كان تعديل، نحذف القديم ونضيف الجديد
            if (assessmentId) {
                await db.deleteAssessment(parseInt(assessmentId));
            }

            // إضافة نسخة من الأداة لكل صف
            for (const classId of selectedClasses) {
                const data = {
                    ...assessmentData,
                    classId: classId
                };
                await db.addAssessment(data);
            }

            alert(`تم ${assessmentId ? 'تحديث' : 'إضافة'} أداة التقويم بنجاح لـ ${selectedClasses.length} صف`);
            return true;

        } catch (error) {
            console.error('خطأ في حفظ أداة التقويم:', error);
            alert('حدث خطأ أثناء حفظ أداة التقويم');
            return false;
        }
    }
});

// تحديث دالة فتح نافذة أداة التقويم
const originalOpenAssessmentModal = GradesApp.prototype.openAssessmentModal;
GradesApp.prototype.openAssessmentModal = async function(assessmentId = null) {
    // تحميل الصفوف أولاً
    await this.loadClassesForAssessment();

    this.editingAssessmentId = assessmentId;
    const modal = document.getElementById('assessmentModal');
    const title = document.getElementById('assessmentModalTitle');
    const form = document.getElementById('assessmentForm');

    if (assessmentId) {
        title.textContent = 'تعديل أداة التقويم';
        await this.loadAssessmentDataForEdit(assessmentId);
    } else {
        title.textContent = 'إضافة أداة تقويم';
        form.reset();
        document.getElementById('assessmentId').value = '';
        // إلغاء تحديد جميع الصفوف
        document.querySelectorAll('input[name="assessmentClasses"]').forEach(cb => {
            cb.checked = false;
        });
    }

    modal.classList.add('active');
};

// تحديث دالة حفظ أداة التقويم
const originalSaveAssessment = GradesApp.prototype.saveAssessment;
GradesApp.prototype.saveAssessment = async function() {
    const success = await this.saveAssessmentWithMultipleClasses();

    if (success) {
        this.closeAssessmentModal();
        await this.loadAssessments();
        await this.loadDashboard();
    }
};

// تحديث دالة تحميل بيانات التعديل
GradesApp.prototype.loadAssessmentDataForEdit = async function(assessmentId) {
    const assessment = await db.get('assessments', assessmentId);
    if (assessment) {
        document.getElementById('assessmentId').value = assessment.id;
        document.getElementById('assessmentName').value = assessment.name;
        document.getElementById('assessmentType').value = assessment.type;
        document.getElementById('assessmentMaxGrade').value = assessment.maxGrade;
        document.getElementById('assessmentWeight').value = assessment.weight;
        document.getElementById('assessmentDate').value = assessment.date;

        // تحديد الصف المرتبط
        const checkbox = document.getElementById(`class-${assessment.classId}`);
        if (checkbox) {
            checkbox.checked = true;
        }
    }
};
