// تطبيق إدارة الدرجات
class GradesApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.editingClassId = null;
        this.editingStudentId = null;
        this.editingAssessmentId = null;
    }

    // تهيئة التطبيق
    async init() {
        try {
            // تهيئة قاعدة البيانات
            await db.init();
            console.log('تم تهيئة التطبيق بنجاح');

            // ربط الأحداث
            this.bindEvents();

            // تحميل لوحة التحكم
            await this.loadDashboard();

            // إظهار رسالة ترحيب
            console.log('مرحباً بك في نظام سجل الدرجات الإلكتروني');
        } catch (error) {
            console.error('خطأ في تهيئة التطبيق:', error);
            alert('حدث خطأ في تحميل التطبيق. يرجى تحديث الصفحة.');
        }
    }

    // ربط الأحداث
    bindEvents() {
        // التنقل في القائمة الجانبية
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.getAttribute('data-page');
                this.navigateTo(page);
            });
        });

        // زر القائمة للشاشات الصغيرة
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
        }

        // إغلاق القائمة عند النقر خارجها
        document.addEventListener('click', (e) => {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        });

        // نافذة إضافة صف
        document.getElementById('addClassBtn').addEventListener('click', () => {
            this.openClassModal();
        });

        document.getElementById('closeClassModal').addEventListener('click', () => {
            this.closeClassModal();
        });

        document.getElementById('cancelClassModal').addEventListener('click', () => {
            this.closeClassModal();
        });

        document.getElementById('classForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveClass();
        });

        // نافذة إضافة طالب
        document.getElementById('addStudentBtn').addEventListener('click', () => {
            this.openStudentModal();
        });

        document.getElementById('closeStudentModal').addEventListener('click', () => {
            this.closeStudentModal();
        });

        document.getElementById('cancelStudentModal').addEventListener('click', () => {
            this.closeStudentModal();
        });

        document.getElementById('studentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveStudent();
        });

        // نافذة إضافة أداة تقويم
        document.getElementById('addAssessmentBtn').addEventListener('click', () => {
            this.openAssessmentModal();
        });

        document.getElementById('closeAssessmentModal').addEventListener('click', () => {
            this.closeAssessmentModal();
        });

        document.getElementById('cancelAssessmentModal').addEventListener('click', () => {
            this.closeAssessmentModal();
        });

        document.getElementById('assessmentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveAssessment();
        });

        // فلاتر الطلاب
        document.getElementById('filterClass').addEventListener('change', () => {
            this.loadStudents();
        });

        document.getElementById('searchStudent').addEventListener('input', () => {
            this.loadStudents();
        });

        // فلاتر الدرجات
        document.getElementById('gradesFilterClass').addEventListener('change', async () => {
            await this.loadAssessmentsForGrades();
            this.loadGradesTable();
        });

        document.getElementById('gradesFilterAssessment').addEventListener('change', () => {
            this.loadGradesTable();
        });

        // أحداث الملاحظات السلوكية
        document.getElementById('addBehaviorNoteBtn').addEventListener('click', () => {
            this.openBehaviorNoteModal();
        });

        document.getElementById('closeBehaviorNoteModal').addEventListener('click', () => {
            this.closeBehaviorNoteModal();
        });

        document.getElementById('cancelBehaviorNoteModal').addEventListener('click', () => {
            this.closeBehaviorNoteModal();
        });

        document.getElementById('behaviorNoteForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveBehaviorNote();
        });

        // تحديث قائمة الطلاب عند تغيير الصف في نافذة الملاحظات
        document.getElementById('behaviorNoteClass').addEventListener('change', () => {
            this.loadStudentsForBehaviorNote();
        });

        // فلاتر الملاحظات السلوكية
        document.getElementById('behaviorFilterClass').addEventListener('change', () => {
            this.loadBehaviorFilterStudents();
            this.loadBehaviorNotes();
        });

        document.getElementById('behaviorFilterStudent').addEventListener('change', () => {
            this.loadBehaviorNotes();
        });

        document.getElementById('behaviorFilterType').addEventListener('change', () => {
            this.loadBehaviorNotes();
        });

        document.getElementById('behaviorFilterDate').addEventListener('change', () => {
            this.loadBehaviorNotes();
        });

        document.getElementById('clearBehaviorFiltersBtn').addEventListener('click', () => {
            this.clearBehaviorFilters();
        });

        // إغلاق النوافذ المنبثقة عند النقر خارجها
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }

    // التنقل بين الصفحات
    navigateTo(page) {
        // إخفاء جميع الصفحات
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });

        // إظهار الصفحة المطلوبة
        document.getElementById(`${page}-page`).classList.add('active');

        // تحديث القائمة الجانبية
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`).classList.add('active');

        // تحميل بيانات الصفحة
        this.currentPage = page;
        this.loadPageData(page);

        // إغلاق القائمة الجانبية على الشاشات الصغيرة
        document.getElementById('sidebar').classList.remove('active');
    }

    // تحميل بيانات الصفحة
    async loadPageData(page) {
        switch (page) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'classes':
                await this.loadClasses();
                break;
            case 'students':
                await this.loadStudents();
                await this.loadClassesForSelect();
                break;
            case 'assessments':
                await this.loadAssessments();
                break;
            case 'grades':
                await this.loadGradesPage();
                break;
            case 'behavior':
                await this.loadBehaviorPage();
                break;
            case 'reports':
                // سيتم تطويره لاحقاً
                break;
            case 'settings':
                // سيتم تطويره لاحقاً
                break;
        }
    }

    // تحميل لوحة التحكم
    async loadDashboard() {
        try {
            // تحميل الإحصائيات
            const totalClasses = await db.count('classes');
            const totalStudents = await db.count('students');
            const totalAssessments = await db.count('assessments');

            document.getElementById('totalClasses').textContent = totalClasses;
            document.getElementById('totalStudents').textContent = totalStudents;
            document.getElementById('totalAssessments').textContent = totalAssessments;

            // حساب نسبة الإكمال (مثال: نسبة الطلاب الذين لديهم درجات)
            const grades = await db.getAll('grades');
            const completionRate = totalStudents > 0 && totalAssessments > 0
                ? Math.round((grades.length / (totalStudents * totalAssessments)) * 100)
                : 0;
            document.getElementById('completionRate').textContent = `${completionRate}%`;

            // تحميل الأنشطة الأخيرة
            await this.loadRecentActivities();

            // تحميل الصفوف النشطة
            await this.loadActiveClasses();

        } catch (error) {
            console.error('خطأ في تحميل لوحة التحكم:', error);
        }
    }

    // تحميل الأنشطة الأخيرة
    async loadRecentActivities() {
        const activities = await db.getRecentActivities(5);
        const container = document.getElementById('recentActivities');

        if (activities.length === 0) {
            container.innerHTML = '<p class="empty-state">لا توجد أنشطة حتى الآن</p>';
            return;
        }

        container.innerHTML = activities.map(activity => {
            const date = new Date(activity.timestamp);
            const timeAgo = this.getTimeAgo(date);

            const iconMap = {
                'class': 'fa-chalkboard',
                'student': 'fa-user',
                'assessment': 'fa-clipboard-list',
                'grade': 'fa-star',
                'system': 'fa-cog'
            };

            return `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas ${iconMap[activity.type] || 'fa-circle'}"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">${activity.description}</div>
                        <div class="activity-time">${timeAgo}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // تحميل الصفوف النشطة
    async loadActiveClasses() {
        const classes = await db.getAll('classes');
        const container = document.getElementById('activeClasses');

        if (classes.length === 0) {
            container.innerHTML = '<p class="empty-state">لا توجد صفوف مضافة بعد</p>';
            return;
        }

        const classesWithStudents = await Promise.all(
            classes.slice(0, 5).map(async (classData) => {
                const students = await db.getStudentsByClass(classData.id);
                return { ...classData, studentCount: students.length };
            })
        );

        container.innerHTML = classesWithStudents.map(classData => `
            <div class="class-item">
                <div class="class-item-name">${classData.name}</div>
                <div class="class-item-info">
                    ${classData.subject} - ${classData.studentCount} طالب/طالبة
                </div>
            </div>
        `).join('');
    }

    // تحميل الصفوف
    async loadClasses() {
        const classes = await db.getAll('classes');
        const container = document.getElementById('classesGrid');

        if (classes.length === 0) {
            container.innerHTML = '<p class="empty-state">لا توجد صفوف مضافة. اضغط على "إضافة صف جديد" للبدء</p>';
            return;
        }

        const classesWithStudents = await Promise.all(
            classes.map(async (classData) => {
                const students = await db.getStudentsByClass(classData.id);
                return { ...classData, studentCount: students.length };
            })
        );

        container.innerHTML = classesWithStudents.map(classData => `
            <div class="class-card">
                <div class="class-card-header">
                    <div>
                        <h3 class="class-card-title">${classData.name}</h3>
                        <div class="class-card-subject">${classData.subject}</div>
                    </div>
                    <div class="class-card-actions">
                        <button class="icon-btn" onclick="app.editClass(${classData.id})" title="تعديل">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="icon-btn danger" onclick="app.deleteClass(${classData.id})" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="class-card-info">
                    <div class="info-row">
                        <i class="fas fa-layer-group"></i>
                        <span>${classData.grade}</span>
                    </div>
                    <div class="info-row">
                        <i class="fas fa-calendar"></i>
                        <span>${classData.year} - ${classData.semester}</span>
                    </div>
                    ${classData.description ? `
                        <div class="info-row">
                            <i class="fas fa-info-circle"></i>
                            <span>${classData.description}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="class-card-footer">
                    <span class="student-count">
                        <i class="fas fa-users"></i>
                        ${classData.studentCount} طالب/طالبة
                    </span>
                    <button class="btn btn-secondary btn-sm" onclick="app.viewClassDetails(${classData.id})">
                        <i class="fas fa-eye"></i> عرض
                    </button>
                </div>
            </div>
        `).join('');
    }

    // فتح نافذة الصف
    openClassModal(classId = null) {
        this.editingClassId = classId;
        const modal = document.getElementById('classModal');
        const title = document.getElementById('classModalTitle');
        const form = document.getElementById('classForm');

        if (classId) {
            title.textContent = 'تعديل الصف';
            this.loadClassData(classId);
        } else {
            title.textContent = 'إضافة صف جديد';
            form.reset();
            document.getElementById('classId').value = '';
        }

        modal.classList.add('active');
    }

    // تحميل بيانات صف للتعديل
    async loadClassData(classId) {
        const classData = await db.get('classes', classId);
        if (classData) {
            document.getElementById('classId').value = classData.id;
            document.getElementById('className').value = classData.name;
            document.getElementById('classGrade').value = classData.grade;
            document.getElementById('classSubject').value = classData.subject;
            document.getElementById('classYear').value = classData.year;
            document.getElementById('classSemester').value = classData.semester;
            document.getElementById('classDescription').value = classData.description || '';
        }
    }

    // إغلاق نافذة الصف
    closeClassModal() {
        document.getElementById('classModal').classList.remove('active');
        document.getElementById('classForm').reset();
        this.editingClassId = null;
    }

    // حفظ الصف
    async saveClass() {
        const classId = document.getElementById('classId').value;
        const classData = {
            name: document.getElementById('className').value,
            grade: document.getElementById('classGrade').value,
            subject: document.getElementById('classSubject').value,
            year: document.getElementById('classYear').value,
            semester: document.getElementById('classSemester').value,
            description: document.getElementById('classDescription').value
        };

        try {
            if (classId) {
                classData.id = parseInt(classId);
                await db.updateClass(classData);
                alert('تم تحديث الصف بنجاح');
            } else {
                await db.addClass(classData);
                alert('تمت إضافة الصف بنجاح');
            }

            this.closeClassModal();
            await this.loadClasses();
            await this.loadDashboard();
        } catch (error) {
            console.error('خطأ في حفظ الصف:', error);
            alert('حدث خطأ أثناء حفظ الصف');
        }
    }

    // تعديل صف
    editClass(classId) {
        this.openClassModal(classId);
    }

    // حذف صف
    async deleteClass(classId) {
        if (!confirm('هل أنت متأكد من حذف هذا الصف؟ سيتم حذف جميع الطلاب والدرجات المرتبطة به.')) {
            return;
        }

        try {
            await db.deleteClass(classId);
            alert('تم حذف الصف بنجاح');
            await this.loadClasses();
            await this.loadDashboard();
        } catch (error) {
            console.error('خطأ في حذف الصف:', error);
            alert('حدث خطأ أثناء حذف الصف');
        }
    }

    // عرض تفاصيل صف
    viewClassDetails(classId) {
        // يمكن إضافة صفحة تفاصيل منفصلة لاحقاً
        alert('سيتم تطوير صفحة التفاصيل قريباً');
    }

    // تحميل الطلاب
    async loadStudents() {
        const filterClassId = document.getElementById('filterClass').value;
        const searchTerm = document.getElementById('searchStudent').value.toLowerCase();

        let students = await db.getAll('students');

        // تطبيق الفلاتر
        if (filterClassId) {
            students = students.filter(s => s.classId == filterClassId);
        }

        if (searchTerm) {
            students = students.filter(s =>
                s.name.toLowerCase().includes(searchTerm) ||
                s.studentNumber.toLowerCase().includes(searchTerm)
            );
        }

        const tbody = document.querySelector('#studentsTable tbody');

        if (students.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">لا يوجد طلاب</td></tr>';
            return;
        }

        const studentsWithClass = await Promise.all(
            students.map(async (student) => {
                const classData = await db.get('classes', student.classId);
                return { ...student, className: classData ? classData.name : 'غير محدد' };
            })
        );

        tbody.innerHTML = studentsWithClass.map(student => `
            <tr>
                <td>${student.studentNumber}</td>
                <td>${student.name}</td>
                <td>${student.className}</td>
                <td>${student.birthDate}</td>
                <td>
                    <button class="icon-btn" onclick="app.editStudent(${student.id})" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="icon-btn danger" onclick="app.deleteStudent(${student.id})" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // تحميل الصفوف لقائمة الاختيار
    async loadClassesForSelect() {
        const classes = await db.getAll('classes');
        const selects = [
            document.getElementById('filterClass'),
            document.getElementById('studentClass')
        ];

        selects.forEach(select => {
            if (select) {
                const currentValue = select.value;
                const options = classes.map(c =>
                    `<option value="${c.id}">${c.name}</option>`
                ).join('');

                // الاحتفاظ بالخيار الأول
                const firstOption = select.options[0];
                select.innerHTML = firstOption.outerHTML + options;
                select.value = currentValue;
            }
        });
    }

    // فتح نافذة الطالب
    openStudentModal(studentId = null) {
        this.editingStudentId = studentId;
        const modal = document.getElementById('studentModal');
        const title = document.getElementById('studentModalTitle');
        const form = document.getElementById('studentForm');

        if (studentId) {
            title.textContent = 'تعديل بيانات الطالب';
            this.loadStudentData(studentId);
        } else {
            title.textContent = 'إضافة طالب جديد';
            form.reset();
            document.getElementById('studentId').value = '';
        }

        modal.classList.add('active');
    }

    // تحميل بيانات طالب للتعديل
    async loadStudentData(studentId) {
        const student = await db.get('students', studentId);
        if (student) {
            document.getElementById('studentId').value = student.id;
            document.getElementById('studentNumber').value = student.studentNumber;
            document.getElementById('studentName').value = student.name;
            document.getElementById('studentClass').value = student.classId;
            document.getElementById('studentBirthDate').value = student.birthDate;
            document.getElementById('studentGender').value = student.gender;
            document.getElementById('studentEmail').value = student.email || '';
            document.getElementById('studentPhone').value = student.phone || '';
        }
    }

    // إغلاق نافذة الطالب
    closeStudentModal() {
        document.getElementById('studentModal').classList.remove('active');
        document.getElementById('studentForm').reset();
        this.editingStudentId = null;
    }

    // حفظ الطالب
    async saveStudent() {
        const studentId = document.getElementById('studentId').value;
        const studentData = {
            studentNumber: document.getElementById('studentNumber').value,
            name: document.getElementById('studentName').value,
            classId: parseInt(document.getElementById('studentClass').value),
            birthDate: document.getElementById('studentBirthDate').value,
            gender: document.getElementById('studentGender').value,
            email: document.getElementById('studentEmail').value,
            phone: document.getElementById('studentPhone').value
        };

        try {
            if (studentId) {
                studentData.id = parseInt(studentId);
                await db.updateStudent(studentData);
                alert('تم تحديث بيانات الطالب بنجاح');
            } else {
                await db.addStudent(studentData);
                alert('تمت إضافة الطالب بنجاح');
            }

            this.closeStudentModal();
            await this.loadStudents();
            await this.loadDashboard();
        } catch (error) {
            console.error('خطأ في حفظ الطالب:', error);
            if (error.includes && error.includes('unique')) {
                alert('رقم الطالب موجود مسبقاً');
            } else {
                alert('حدث خطأ أثناء حفظ الطالب');
            }
        }
    }

    // تعديل طالب
    editStudent(studentId) {
        this.openStudentModal(studentId);
    }

    // حذف طالب
    async deleteStudent(studentId) {
        if (!confirm('هل أنت متأكد من حذف هذا الطالب؟ سيتم حذف جميع الدرجات المرتبطة به.')) {
            return;
        }

        try {
            await db.deleteStudent(studentId);
            alert('تم حذف الطالب بنجاح');
            await this.loadStudents();
            await this.loadDashboard();
        } catch (error) {
            console.error('خطأ في حذف الطالب:', error);
            alert('حدث خطأ أثناء حذف الطالب');
        }
    }

    // تحميل أدوات التقويم
    async loadAssessments() {
        const assessments = await db.getAll('assessments');
        const container = document.getElementById('assessmentsGrid');

        if (assessments.length === 0) {
            container.innerHTML = '<p class="empty-state">لا توجد أدوات تقويم مضافة</p>';
            return;
        }

        const assessmentsWithClass = await Promise.all(
            assessments.map(async (assessment) => {
                const classData = await db.get('classes', assessment.classId);
                return { ...assessment, className: classData ? classData.name : 'غير محدد' };
            })
        );

        container.innerHTML = assessmentsWithClass.map(assessment => `
            <div class="assessment-card">
                <span class="assessment-type type-${assessment.type.toLowerCase()}">${assessment.type}</span>
                <h3 style="margin: 0.5rem 0;">${assessment.name}</h3>
                <div class="info-row" style="margin: 0.5rem 0;">
                    <i class="fas fa-chalkboard"></i>
                    <span>${assessment.className}</span>
                </div>
                <div class="info-row" style="margin: 0.5rem 0;">
                    <i class="fas fa-star"></i>
                    <span>الدرجة العظمى: ${assessment.maxGrade}</span>
                </div>
                <div class="info-row" style="margin: 0.5rem 0;">
                    <i class="fas fa-percentage"></i>
                    <span>الوزن: ${assessment.weight}%</span>
                </div>
                <div class="info-row" style="margin: 0.5rem 0;">
                    <i class="fas fa-calendar"></i>
                    <span>${assessment.date}</span>
                </div>
                <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                    <button class="icon-btn" onclick="app.editAssessment(${assessment.id})" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="icon-btn danger" onclick="app.deleteAssessment(${assessment.id})" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // فتح نافذة أداة التقويم
    async openAssessmentModal(assessmentId = null) {
        // تحميل الصفوف أولاً
        const classes = await db.getAll('classes');
        const select = document.getElementById('assessmentClass');
        select.innerHTML = '<option value="">اختر الصف</option>' +
            classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

        this.editingAssessmentId = assessmentId;
        const modal = document.getElementById('assessmentModal');
        const title = document.getElementById('assessmentModalTitle');
        const form = document.getElementById('assessmentForm');

        if (assessmentId) {
            title.textContent = 'تعديل أداة التقويم';
            this.loadAssessmentData(assessmentId);
        } else {
            title.textContent = 'إضافة أداة تقويم';
            form.reset();
            document.getElementById('assessmentId').value = '';
        }

        modal.classList.add('active');
    }

    // تحميل بيانات أداة تقويم للتعديل
    async loadAssessmentData(assessmentId) {
        const assessment = await db.get('assessments', assessmentId);
        if (assessment) {
            document.getElementById('assessmentId').value = assessment.id;
            document.getElementById('assessmentName').value = assessment.name;
            document.getElementById('assessmentType').value = assessment.type;
            document.getElementById('assessmentClass').value = assessment.classId;
            document.getElementById('assessmentMaxGrade').value = assessment.maxGrade;
            document.getElementById('assessmentWeight').value = assessment.weight;
            document.getElementById('assessmentDate').value = assessment.date;
        }
    }

    // إغلاق نافذة أداة التقويم
    closeAssessmentModal() {
        document.getElementById('assessmentModal').classList.remove('active');
        document.getElementById('assessmentForm').reset();
        this.editingAssessmentId = null;
    }

    // حفظ أداة التقويم
    async saveAssessment() {
        const assessmentId = document.getElementById('assessmentId').value;
        const assessmentData = {
            name: document.getElementById('assessmentName').value,
            type: document.getElementById('assessmentType').value,
            classId: parseInt(document.getElementById('assessmentClass').value),
            maxGrade: parseFloat(document.getElementById('assessmentMaxGrade').value),
            weight: parseFloat(document.getElementById('assessmentWeight').value),
            date: document.getElementById('assessmentDate').value
        };

        try {
            if (assessmentId) {
                assessmentData.id = parseInt(assessmentId);
                await db.updateAssessment(assessmentData);
                alert('تم تحديث أداة التقويم بنجاح');
            } else {
                await db.addAssessment(assessmentData);
                alert('تمت إضافة أداة التقويم بنجاح');
            }

            this.closeAssessmentModal();
            await this.loadAssessments();
            await this.loadDashboard();
        } catch (error) {
            console.error('خطأ في حفظ أداة التقويم:', error);
            alert('حدث خطأ أثناء حفظ أداة التقويم');
        }
    }

    // تعديل أداة تقويم
    editAssessment(assessmentId) {
        this.openAssessmentModal(assessmentId);
    }

    // حذف أداة تقويم
    async deleteAssessment(assessmentId) {
        if (!confirm('هل أنت متأكد من حذف أداة التقويم؟ سيتم حذف جميع الدرجات المرتبطة بها.')) {
            return;
        }

        try {
            await db.deleteAssessment(assessmentId);
            alert('تم حذف أداة التقويم بنجاح');
            await this.loadAssessments();
            await this.loadDashboard();
        } catch (error) {
            console.error('خطأ في حذف أداة التقويم:', error);
            alert('حدث خطأ أثناء حذف أداة التقويم');
        }
    }

    // تحميل صفحة الدرجات
    async loadGradesPage() {
        await this.loadClassesForGrades();
    }

    // تحميل الصفوف لصفحة الدرجات
    async loadClassesForGrades() {
        const classes = await db.getAll('classes');
        const select = document.getElementById('gradesFilterClass');
        select.innerHTML = '<option value="">اختر صف</option>' +
            classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }

    // تحميل أدوات التقويم بناءً على الصف المختار
    async loadAssessmentsForGrades() {
        const classId = document.getElementById('gradesFilterClass').value;
        const select = document.getElementById('gradesFilterAssessment');

        if (!classId) {
            select.innerHTML = '<option value="">اختر أداة التقويم</option>';
            return;
        }

        const assessments = await db.getAssessmentsByClass(parseInt(classId));
        select.innerHTML = '<option value="">اختر أداة التقويم</option>' +
            assessments.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
    }

    // تحميل جدول الدرجات
    async loadGradesTable() {
        const classId = document.getElementById('gradesFilterClass').value;
        const assessmentId = document.getElementById('gradesFilterAssessment').value;
        const container = document.getElementById('gradesTableContainer');

        if (!classId || !assessmentId) {
            container.innerHTML = '<p class="empty-state">اختر صف وأداة تقويم لعرض الدرجات</p>';
            return;
        }

        const students = await db.getStudentsByClass(parseInt(classId));
        const assessment = await db.get('assessments', parseInt(assessmentId));

        if (students.length === 0) {
            container.innerHTML = '<p class="empty-state">لا يوجد طلاب في هذا الصف</p>';
            return;
        }

        const studentsWithGrades = await Promise.all(
            students.map(async (student) => {
                const grade = await db.getGrade(student.id, parseInt(assessmentId));
                return {
                    ...student,
                    grade: grade ? grade.grade : '',
                    notes: grade ? grade.notes : ''
                };
            })
        );

        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>رقم الطالب</th>
                        <th>الاسم</th>
                        <th>الدرجة (من ${assessment.maxGrade})</th>
                        <th>النسبة المئوية</th>
                        <th>ملاحظات</th>
                        <th>الإجراءات</th>
                    </tr>
                </thead>
                <tbody>
                    ${studentsWithGrades.map(student => {
                        const percentage = student.grade ? ((student.grade / assessment.maxGrade) * 100).toFixed(1) : '-';
                        return `
                            <tr>
                                <td>${student.studentNumber}</td>
                                <td>${student.name}</td>
                                <td>
                                    <input type="number"
                                           class="form-input"
                                           style="width: 100px;"
                                           value="${student.grade}"
                                           min="0"
                                           max="${assessment.maxGrade}"
                                           step="0.5"
                                           id="grade-${student.id}">
                                </td>
                                <td>${percentage}%</td>
                                <td>
                                    <input type="text"
                                           class="form-input"
                                           style="width: 150px;"
                                           value="${student.notes}"
                                           id="notes-${student.id}">
                                </td>
                                <td>
                                    <button class="btn btn-success btn-sm"
                                            onclick="app.saveGrade(${student.id}, ${assessmentId})">
                                        <i class="fas fa-save"></i> حفظ
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }

    // حفظ درجة
    async saveGrade(studentId, assessmentId) {
        const grade = document.getElementById(`grade-${studentId}`).value;
        const notes = document.getElementById(`notes-${studentId}`).value;

        if (!grade) {
            alert('يرجى إدخال الدرجة');
            return;
        }

        try {
            await db.setGrade(studentId, assessmentId, parseFloat(grade), notes);
            alert('تم حفظ الدرجة بنجاح');
            await this.loadDashboard();
        } catch (error) {
            console.error('خطأ في حفظ الدرجة:', error);
            alert('حدث خطأ أثناء حفظ الدرجة');
        }
    }

    // وظيفة مساعدة لحساب الوقت المنقضي
    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);

        let interval = seconds / 31536000;
        if (interval > 1) {
            return Math.floor(interval) + ' سنة';
        }
        interval = seconds / 2592000;
        if (interval > 1) {
            return Math.floor(interval) + ' شهر';
        }
        interval = seconds / 86400;
        if (interval > 1) {
            return Math.floor(interval) + ' يوم';
        }
        interval = seconds / 3600;
        if (interval > 1) {
            return Math.floor(interval) + ' ساعة';
        }
        interval = seconds / 60;
        if (interval > 1) {
            return Math.floor(interval) + ' دقيقة';
        }
        return 'الآن';
    }

    // ==================== دوال الملاحظات السلوكية ====================

    // تحميل صفحة الملاحظات السلوكية
    async loadBehaviorPage() {
        await this.loadClassesForBehaviorFilters();
        await this.loadBehaviorNotes();
    }

    // تحميل الصفوف في فلاتر الملاحظات
    async loadClassesForBehaviorFilters() {
        const classes = await db.getAll('classes');
        const classSelect = document.getElementById('behaviorFilterClass');
        const modalClassSelect = document.getElementById('behaviorNoteClass');

        classSelect.innerHTML = '<option value="">جميع الصفوف</option>';
        modalClassSelect.innerHTML = '<option value="">اختر الصف</option>';

        classes.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls.id;
            option.textContent = `${cls.name} - ${cls.subject}`;
            classSelect.appendChild(option);

            const modalOption = option.cloneNode(true);
            modalClassSelect.appendChild(modalOption);
        });
    }

    // تحميل الطلاب في فلتر الملاحظات بناءً على الصف المختار
    async loadBehaviorFilterStudents() {
        const classId = document.getElementById('behaviorFilterClass').value;
        const studentSelect = document.getElementById('behaviorFilterStudent');

        studentSelect.innerHTML = '<option value="">جميع الطلاب</option>';

        if (classId) {
            const students = await db.getStudentsByClass(parseInt(classId));
            students.forEach(student => {
                const option = document.createElement('option');
                option.value = student.id;
                option.textContent = `${student.name} (${student.studentNumber})`;
                studentSelect.appendChild(option);
            });
        }
    }

    // تحميل الطلاب في نافذة إضافة الملاحظة بناءً على الصف المختار
    async loadStudentsForBehaviorNote() {
        const classId = document.getElementById('behaviorNoteClass').value;
        const studentSelect = document.getElementById('behaviorNoteStudent');

        studentSelect.innerHTML = '<option value="">اختر الطالب</option>';

        if (classId) {
            const students = await db.getStudentsByClass(parseInt(classId));
            students.forEach(student => {
                const option = document.createElement('option');
                option.value = student.id;
                option.textContent = `${student.name} (${student.studentNumber})`;
                studentSelect.appendChild(option);
            });
        }
    }

    // فتح نافذة إضافة ملاحظة سلوكية
    openBehaviorNoteModal(noteId = null) {
        const modal = document.getElementById('behaviorNoteModal');
        const title = document.getElementById('behaviorNoteModalTitle');
        const form = document.getElementById('behaviorNoteForm');

        if (noteId) {
            title.textContent = 'تعديل ملاحظة سلوكية';
            this.loadBehaviorNoteData(noteId);
        } else {
            title.textContent = 'إضافة ملاحظة سلوكية';
            form.reset();
            document.getElementById('behaviorNoteId').value = '';
            // تعيين التاريخ والوقت الحالي
            const now = new Date();
            document.getElementById('behaviorNoteDate').value = now.toISOString().split('T')[0];
            document.getElementById('behaviorNoteTime').value = now.toTimeString().slice(0, 5);
        }

        modal.classList.add('active');
    }

    // تحميل بيانات ملاحظة للتعديل
    async loadBehaviorNoteData(noteId) {
        const note = await db.get('behaviorNotes', noteId);
        if (note) {
            document.getElementById('behaviorNoteId').value = note.id;
            document.getElementById('behaviorNoteClass').value = note.classId;
            await this.loadStudentsForBehaviorNote();
            document.getElementById('behaviorNoteStudent').value = note.studentId;
            document.getElementById('behaviorNoteType').value = note.noteType;
            document.getElementById('behaviorNoteDate').value = note.date;
            document.getElementById('behaviorNoteTime').value = note.time;
            document.getElementById('behaviorNoteDetails').value = note.details;
            document.getElementById('behaviorNoteAction').value = note.action || '';
        }
    }

    // إغلاق نافذة الملاحظات
    closeBehaviorNoteModal() {
        document.getElementById('behaviorNoteModal').classList.remove('active');
        document.getElementById('behaviorNoteForm').reset();
    }

    // حفظ ملاحظة سلوكية
    async saveBehaviorNote() {
        const noteId = document.getElementById('behaviorNoteId').value;
        const noteData = {
            classId: parseInt(document.getElementById('behaviorNoteClass').value),
            studentId: parseInt(document.getElementById('behaviorNoteStudent').value),
            noteType: document.getElementById('behaviorNoteType').value,
            date: document.getElementById('behaviorNoteDate').value,
            time: document.getElementById('behaviorNoteTime').value,
            details: document.getElementById('behaviorNoteDetails').value,
            action: document.getElementById('behaviorNoteAction').value
        };

        try {
            if (noteId) {
                noteData.id = parseInt(noteId);
                await db.updateBehaviorNote(noteData);
                alert('تم تحديث الملاحظة بنجاح');
            } else {
                await db.addBehaviorNote(noteData);
                alert('تمت إضافة الملاحظة بنجاح');
            }

            this.closeBehaviorNoteModal();
            await this.loadBehaviorNotes();
        } catch (error) {
            console.error('خطأ في حفظ الملاحظة:', error);
            alert('حدث خطأ أثناء حفظ الملاحظة');
        }
    }

    // تحميل وعرض الملاحظات السلوكية
    async loadBehaviorNotes() {
        try {
            let notes = await db.getAllBehaviorNotes();

            // تطبيق الفلاتر
            const filterClassId = document.getElementById('behaviorFilterClass').value;
            const filterStudentId = document.getElementById('behaviorFilterStudent').value;
            const filterType = document.getElementById('behaviorFilterType').value;
            const filterDate = document.getElementById('behaviorFilterDate').value;

            if (filterClassId) {
                notes = notes.filter(note => note.classId === parseInt(filterClassId));
            }

            if (filterStudentId) {
                notes = notes.filter(note => note.studentId === parseInt(filterStudentId));
            }

            if (filterType) {
                notes = notes.filter(note => note.noteType === filterType);
            }

            if (filterDate) {
                notes = notes.filter(note => note.date === filterDate);
            }

            // عرض الملاحظات
            await this.renderBehaviorNotes(notes);
        } catch (error) {
            console.error('خطأ في تحميل الملاحظات:', error);
        }
    }

    // عرض الملاحظات في الجدول
    async renderBehaviorNotes(notes) {
        const tbody = document.getElementById('behaviorNotesTableBody');

        if (notes.length === 0) {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="7">لا توجد ملاحظات سلوكية</td></tr>';
            return;
        }

        tbody.innerHTML = '';

        for (const note of notes) {
            const student = await db.get('students', note.studentId);
            const classData = await db.get('classes', note.classId);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${note.date}</td>
                <td>${note.time}</td>
                <td>${student ? student.name : 'غير معروف'}</td>
                <td>${classData ? classData.name : 'غير معروف'}</td>
                <td>${this.getBehaviorTypeLabel(note.noteType)}</td>
                <td><div style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${note.details}">${note.details}</div></td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="app.openBehaviorNoteModal(${note.id})" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="app.deleteBehaviorNote(${note.id})" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;

            tbody.appendChild(row);
        }
    }

    // الحصول على تسمية نوع الملاحظة
    getBehaviorTypeLabel(type) {
        const types = {
            'side_talk': 'الحديث الجانبي',
            'no_book': 'عدم إحضار الكتاب',
            'sleeping': 'النوم في الحصة',
            'no_attention': 'عدم الانتباه',
            'late': 'التأخر',
            'homework': 'عدم حل الواجب',
            'disruption': 'إثارة الفوضى',
            'positive': 'ملاحظة إيجابية',
            'other': 'أخرى'
        };

        return `<span class="behavior-badge ${type}">${types[type] || type}</span>`;
    }

    // حذف ملاحظة سلوكية
    async deleteBehaviorNote(noteId) {
        if (!confirm('هل أنت متأكد من حذف هذه الملاحظة؟')) {
            return;
        }

        try {
            await db.deleteBehaviorNote(noteId);
            alert('تم حذف الملاحظة بنجاح');
            await this.loadBehaviorNotes();
        } catch (error) {
            console.error('خطأ في حذف الملاحظة:', error);
            alert('حدث خطأ أثناء حذف الملاحظة');
        }
    }

    // مسح الفلاتر
    clearBehaviorFilters() {
        document.getElementById('behaviorFilterClass').value = '';
        document.getElementById('behaviorFilterStudent').value = '';
        document.getElementById('behaviorFilterType').value = '';
        document.getElementById('behaviorFilterDate').value = '';
        this.loadBehaviorNotes();
    }
}

// إنشاء نسخة من التطبيق وتهيئته عند تحميل الصفحة
const app = new GradesApp();

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
