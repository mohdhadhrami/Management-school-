// إدارة قاعدة البيانات IndexedDB
class GradesDB {
    constructor() {
        this.dbName = 'GradesManagementDB';
        this.version = 4; // تحديث الإصدار لدعم العبارات الوصفية
        this.db = null;
    }

    // فتح قاعدة البيانات
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                reject('خطأ في فتح قاعدة البيانات');
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('تم فتح قاعدة البيانات بنجاح');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // إنشاء جدول الصفوف
                if (!db.objectStoreNames.contains('classes')) {
                    const classesStore = db.createObjectStore('classes', { keyPath: 'id', autoIncrement: true });
                    classesStore.createIndex('name', 'name', { unique: false });
                    classesStore.createIndex('grade', 'grade', { unique: false });
                    classesStore.createIndex('subject', 'subject', { unique: false });
                }

                // إنشاء جدول الطلاب
                if (!db.objectStoreNames.contains('students')) {
                    const studentsStore = db.createObjectStore('students', { keyPath: 'id', autoIncrement: true });
                    studentsStore.createIndex('studentNumber', 'studentNumber', { unique: true });
                    studentsStore.createIndex('name', 'name', { unique: false });
                    studentsStore.createIndex('classId', 'classId', { unique: false });
                }

                // إنشاء جدول أدوات التقويم
                if (!db.objectStoreNames.contains('assessments')) {
                    const assessmentsStore = db.createObjectStore('assessments', { keyPath: 'id', autoIncrement: true });
                    assessmentsStore.createIndex('name', 'name', { unique: false });
                    assessmentsStore.createIndex('type', 'type', { unique: false });
                    assessmentsStore.createIndex('classId', 'classId', { unique: false });
                }

                // إنشاء جدول الدرجات
                if (!db.objectStoreNames.contains('grades')) {
                    const gradesStore = db.createObjectStore('grades', { keyPath: 'id', autoIncrement: true });
                    gradesStore.createIndex('studentId', 'studentId', { unique: false });
                    gradesStore.createIndex('assessmentId', 'assessmentId', { unique: false });
                    gradesStore.createIndex('studentAssessment', ['studentId', 'assessmentId'], { unique: true });
                }

                // إنشاء جدول الأنشطة
                if (!db.objectStoreNames.contains('activities')) {
                    const activitiesStore = db.createObjectStore('activities', { keyPath: 'id', autoIncrement: true });
                    activitiesStore.createIndex('timestamp', 'timestamp', { unique: false });
                    activitiesStore.createIndex('type', 'type', { unique: false });
                }

                // إنشاء جدول الحضور والغياب
                if (!db.objectStoreNames.contains('attendance')) {
                    const attendanceStore = db.createObjectStore('attendance', { keyPath: 'id', autoIncrement: true });
                    attendanceStore.createIndex('studentId', 'studentId', { unique: false });
                    attendanceStore.createIndex('classId', 'classId', { unique: false });
                    attendanceStore.createIndex('date', 'date', { unique: false });
                    attendanceStore.createIndex('studentDate', ['studentId', 'date'], { unique: true });
                }

                // إنشاء جدول السلوكيات
                if (!db.objectStoreNames.contains('behaviors')) {
                    const behaviorsStore = db.createObjectStore('behaviors', { keyPath: 'id', autoIncrement: true });
                    behaviorsStore.createIndex('studentId', 'studentId', { unique: false });
                    behaviorsStore.createIndex('classId', 'classId', { unique: false });
                    behaviorsStore.createIndex('date', 'date', { unique: false });
                    behaviorsStore.createIndex('type', 'type', { unique: false });
                    behaviorsStore.createIndex('severity', 'severity', { unique: false });
                }

                // إنشاء جدول إشعارات الواتساب
                if (!db.objectStoreNames.contains('whatsappNotifications')) {
                    const notificationsStore = db.createObjectStore('whatsappNotifications', { keyPath: 'id', autoIncrement: true });
                    notificationsStore.createIndex('studentId', 'studentId', { unique: false });
                    notificationsStore.createIndex('timestamp', 'timestamp', { unique: false });
                    notificationsStore.createIndex('status', 'status', { unique: false });
                }

                // إنشاء جدول المعايير (للعبارات الوصفية)
                if (!db.objectStoreNames.contains('criteria')) {
                    const criteriaStore = db.createObjectStore('criteria', { keyPath: 'id', autoIncrement: true });
                    criteriaStore.createIndex('name', 'name', { unique: false });
                    criteriaStore.createIndex('order', 'order', { unique: false });
                }

                // إنشاء جدول بنود المعايير
                if (!db.objectStoreNames.contains('criteriaItems')) {
                    const itemsStore = db.createObjectStore('criteriaItems', { keyPath: 'id', autoIncrement: true });
                    itemsStore.createIndex('criteriaId', 'criteriaId', { unique: false });
                    itemsStore.createIndex('order', 'order', { unique: false });
                }

                // إنشاء جدول التقييمات الوصفية
                if (!db.objectStoreNames.contains('descriptiveEvaluations')) {
                    const evaluationsStore = db.createObjectStore('descriptiveEvaluations', { keyPath: 'id', autoIncrement: true });
                    evaluationsStore.createIndex('studentId', 'studentId', { unique: false });
                    evaluationsStore.createIndex('classId', 'classId', { unique: false });
                    evaluationsStore.createIndex('criteriaId', 'criteriaId', { unique: false });
                    evaluationsStore.createIndex('date', 'date', { unique: false });
                    evaluationsStore.createIndex('studentCriteria', ['studentId', 'criteriaId', 'date'], { unique: false });
                }

                console.log('تم إنشاء هيكل قاعدة البيانات');
            };
        });
    }

    // إضافة عنصر إلى جدول
    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(`خطأ في إضافة البيانات إلى ${storeName}`);
            };
        });
    }

    // تحديث عنصر
    async update(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(`خطأ في تحديث البيانات في ${storeName}`);
            };
        });
    }

    // حذف عنصر
    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject(`خطأ في حذف البيانات من ${storeName}`);
            };
        });
    }

    // الحصول على عنصر بواسطة ID
    async get(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(`خطأ في الحصول على البيانات من ${storeName}`);
            };
        });
    }

    // الحصول على جميع العناصر من جدول
    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(`خطأ في الحصول على جميع البيانات من ${storeName}`);
            };
        });
    }

    // البحث باستخدام فهرس
    async getByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(`خطأ في البحث في ${storeName} باستخدام ${indexName}`);
            };
        });
    }

    // الحصول على عدد العناصر
    async count(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.count();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(`خطأ في حساب عدد العناصر في ${storeName}`);
            };
        });
    }

    // مسح جدول بالكامل
    async clear(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject(`خطأ في مسح ${storeName}`);
            };
        });
    }

    // إضافة نشاط
    async addActivity(type, description, details = {}) {
        const activity = {
            type,
            description,
            details,
            timestamp: new Date().toISOString()
        };
        return await this.add('activities', activity);
    }

    // الحصول على الأنشطة الأخيرة
    async getRecentActivities(limit = 10) {
        const activities = await this.getAll('activities');
        return activities
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    // إضافة صف
    async addClass(classData) {
        const classId = await this.add('classes', {
            ...classData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        await this.addActivity('class', `تمت إضافة صف جديد: ${classData.name}`, { classId });
        return classId;
    }

    // تحديث صف
    async updateClass(classData) {
        const updatedData = {
            ...classData,
            updatedAt: new Date().toISOString()
        };
        await this.update('classes', updatedData);
        await this.addActivity('class', `تم تحديث الصف: ${classData.name}`, { classId: classData.id });
    }

    // حذف صف
    async deleteClass(classId) {
        const classData = await this.get('classes', classId);

        // حذف جميع الطلاب المرتبطين
        const students = await this.getByIndex('students', 'classId', classId);
        for (const student of students) {
            await this.deleteStudent(student.id);
        }

        // حذف جميع أدوات التقويم المرتبطة
        const assessments = await this.getByIndex('assessments', 'classId', classId);
        for (const assessment of assessments) {
            await this.deleteAssessment(assessment.id);
        }

        await this.delete('classes', classId);
        await this.addActivity('class', `تم حذف الصف: ${classData.name}`, { classId });
    }

    // إضافة طالب
    async addStudent(studentData) {
        const studentId = await this.add('students', {
            ...studentData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        await this.addActivity('student', `تمت إضافة طالب جديد: ${studentData.name}`, { studentId });
        return studentId;
    }

    // تحديث طالب
    async updateStudent(studentData) {
        const updatedData = {
            ...studentData,
            updatedAt: new Date().toISOString()
        };
        await this.update('students', updatedData);
        await this.addActivity('student', `تم تحديث بيانات الطالب: ${studentData.name}`, { studentId: studentData.id });
    }

    // حذف طالب
    async deleteStudent(studentId) {
        const studentData = await this.get('students', studentId);

        // حذف جميع الدرجات المرتبطة
        const grades = await this.getByIndex('grades', 'studentId', studentId);
        for (const grade of grades) {
            await this.delete('grades', grade.id);
        }

        await this.delete('students', studentId);
        await this.addActivity('student', `تم حذف الطالب: ${studentData.name}`, { studentId });
    }

    // الحصول على طلاب صف معين
    async getStudentsByClass(classId) {
        return await this.getByIndex('students', 'classId', classId);
    }

    // إضافة أداة تقويم
    async addAssessment(assessmentData) {
        const assessmentId = await this.add('assessments', {
            ...assessmentData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        await this.addActivity('assessment', `تمت إضافة أداة تقويم جديدة: ${assessmentData.name}`, { assessmentId });
        return assessmentId;
    }

    // تحديث أداة تقويم
    async updateAssessment(assessmentData) {
        const updatedData = {
            ...assessmentData,
            updatedAt: new Date().toISOString()
        };
        await this.update('assessments', updatedData);
        await this.addActivity('assessment', `تم تحديث أداة التقويم: ${assessmentData.name}`, { assessmentId: assessmentData.id });
    }

    // حذف أداة تقويم
    async deleteAssessment(assessmentId) {
        const assessmentData = await this.get('assessments', assessmentId);

        // حذف جميع الدرجات المرتبطة
        const grades = await this.getByIndex('grades', 'assessmentId', assessmentId);
        for (const grade of grades) {
            await this.delete('grades', grade.id);
        }

        await this.delete('assessments', assessmentId);
        await this.addActivity('assessment', `تم حذف أداة التقويم: ${assessmentData.name}`, { assessmentId });
    }

    // الحصول على أدوات تقويم صف معين
    async getAssessmentsByClass(classId) {
        return await this.getByIndex('assessments', 'classId', classId);
    }

    // إضافة أو تحديث درجة
    async setGrade(studentId, assessmentId, grade, notes = '') {
        try {
            // البحث عن درجة موجودة
            const transaction = this.db.transaction(['grades'], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index('studentAssessment');
            const request = index.get([studentId, assessmentId]);

            return new Promise((resolve, reject) => {
                request.onsuccess = async () => {
                    const existingGrade = request.result;

                    const gradeData = {
                        studentId,
                        assessmentId,
                        grade,
                        notes,
                        updatedAt: new Date().toISOString()
                    };

                    if (existingGrade) {
                        gradeData.id = existingGrade.id;
                        gradeData.createdAt = existingGrade.createdAt;
                        await this.update('grades', gradeData);
                    } else {
                        gradeData.createdAt = new Date().toISOString();
                        await this.add('grades', gradeData);
                    }

                    await this.addActivity('grade', 'تم تحديث درجة طالب', { studentId, assessmentId, grade });
                    resolve();
                };

                request.onerror = () => {
                    reject('خطأ في حفظ الدرجة');
                };
            });
        } catch (error) {
            console.error('خطأ في setGrade:', error);
            throw error;
        }
    }

    // الحصول على درجة طالب في أداة تقويم معينة
    async getGrade(studentId, assessmentId) {
        const transaction = this.db.transaction(['grades'], 'readonly');
        const store = transaction.objectStore('grades');
        const index = store.index('studentAssessment');

        return new Promise((resolve, reject) => {
            const request = index.get([studentId, assessmentId]);

            request.onsuccess = () => {
                resolve(request.result || null);
            };

            request.onerror = () => {
                reject('خطأ في الحصول على الدرجة');
            };
        });
    }

    // الحصول على جميع درجات طالب
    async getStudentGrades(studentId) {
        return await this.getByIndex('grades', 'studentId', studentId);
    }

    // الحصول على جميع درجات أداة تقويم
    async getAssessmentGrades(assessmentId) {
        return await this.getByIndex('grades', 'assessmentId', assessmentId);
    }

    // حساب معدل الطالب
    async calculateStudentAverage(studentId) {
        const grades = await this.getStudentGrades(studentId);
        if (grades.length === 0) return 0;

        let totalWeightedGrade = 0;
        let totalWeight = 0;

        for (const gradeData of grades) {
            const assessment = await this.get('assessments', gradeData.assessmentId);
            if (assessment) {
                const percentage = (gradeData.grade / assessment.maxGrade) * 100;
                totalWeightedGrade += percentage * (assessment.weight / 100);
                totalWeight += assessment.weight;
            }
        }

        return totalWeight > 0 ? (totalWeightedGrade / totalWeight) * 100 : 0;
    }

    // تصدير البيانات
    async exportData() {
        const data = {
            classes: await this.getAll('classes'),
            students: await this.getAll('students'),
            assessments: await this.getAll('assessments'),
            grades: await this.getAll('grades'),
            activities: await this.getAll('activities'),
            exportDate: new Date().toISOString()
        };
        return JSON.stringify(data);
    }

    // استيراد البيانات
    async importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);

            // مسح البيانات الحالية
            await this.clear('classes');
            await this.clear('students');
            await this.clear('assessments');
            await this.clear('grades');
            await this.clear('activities');

            // استيراد البيانات الجديدة
            for (const item of data.classes) {
                await this.add('classes', item);
            }
            for (const item of data.students) {
                await this.add('students', item);
            }
            for (const item of data.assessments) {
                await this.add('assessments', item);
            }
            for (const item of data.grades) {
                await this.add('grades', item);
            }
            for (const item of data.activities) {
                await this.add('activities', item);
            }

            await this.addActivity('system', 'تم استيراد البيانات بنجاح');
            return true;
        } catch (error) {
            console.error('خطأ في استيراد البيانات:', error);
            return false;
        }
    }

    // مسح جميع البيانات
    async clearAllData() {
        await this.clear('classes');
        await this.clear('students');
        await this.clear('assessments');
        await this.clear('grades');
        await this.clear('activities');
        await this.addActivity('system', 'تم مسح جميع البيانات');
    }
}

// إنشاء نسخة واحدة من قاعدة البيانات
const db = new GradesDB();
