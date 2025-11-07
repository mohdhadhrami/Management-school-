// نظام المتابعة اليومية - الحضور والغياب والسلوكيات

// إضافة دوال خاصة للمتابعة اليومية إلى GradesDB
Object.assign(GradesDB.prototype, {

    // ============= نظام الحضور والغياب =============

    // تسجيل حضور/غياب/تأخير طالب
    async recordAttendance(studentId, classId, date, status, notes = '') {
        try {
            // البحث عن سجل موجود
            const existing = await this.getAttendanceByStudentDate(studentId, date);

            const attendanceData = {
                studentId,
                classId,
                date,
                status, // حاضر، غائب، تأخير
                notes,
                recordedAt: new Date().toISOString()
            };

            if (existing) {
                attendanceData.id = existing.id;
                await this.update('attendance', attendanceData);
            } else {
                await this.add('attendance', attendanceData);
            }

            await this.addActivity('attendance', `تم تسجيل ${status} للطالب`, { studentId, date });

            return true;
        } catch (error) {
            console.error('خطأ في تسجيل الحضور:', error);
            throw error;
        }
    },

    // الحصول على حضور طالب في تاريخ معين
    async getAttendanceByStudentDate(studentId, date) {
        const transaction = this.db.transaction(['attendance'], 'readonly');
        const store = transaction.objectStore('attendance');
        const index = store.index('studentDate');

        return new Promise((resolve, reject) => {
            const request = index.get([studentId, date]);

            request.onsuccess = () => {
                resolve(request.result || null);
            };

            request.onerror = () => {
                reject('خطأ في الحصول على سجل الحضور');
            };
        });
    },

    // الحصول على حضور صف في تاريخ معين
    async getClassAttendanceByDate(classId, date) {
        const allAttendance = await this.getAll('attendance');
        return allAttendance.filter(a => a.classId === classId && a.date === date);
    },

    // الحصول على سجل حضور طالب لفترة معينة
    async getStudentAttendanceHistory(studentId, startDate, endDate) {
        const allAttendance = await this.getByIndex('attendance', 'studentId', studentId);
        return allAttendance.filter(a => {
            const date = new Date(a.date);
            return date >= new Date(startDate) && date <= new Date(endDate);
        });
    },

    // حساب إحصائيات الحضور لطالب
    async getStudentAttendanceStats(studentId, startDate = null, endDate = null) {
        let attendance = await this.getByIndex('attendance', 'studentId', studentId);

        if (startDate && endDate) {
            attendance = attendance.filter(a => {
                const date = new Date(a.date);
                return date >= new Date(startDate) && date <= new Date(endDate);
            });
        }

        const stats = {
            total: attendance.length,
            present: attendance.filter(a => a.status === 'حاضر').length,
            absent: attendance.filter(a => a.status === 'غائب').length,
            late: attendance.filter(a => a.status === 'تأخير').length
        };

        stats.presentPercentage = stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0;
        stats.absentPercentage = stats.total > 0 ? ((stats.absent / stats.total) * 100).toFixed(1) : 0;
        stats.latePercentage = stats.total > 0 ? ((stats.late / stats.total) * 100).toFixed(1) : 0;

        return stats;
    },

    // حساب إحصائيات الحضور لصف
    async getClassAttendanceStats(classId, date) {
        const attendance = await this.getClassAttendanceByDate(classId, date);
        const students = await this.getStudentsByClass(classId);

        return {
            total: students.length,
            recorded: attendance.length,
            present: attendance.filter(a => a.status === 'حاضر').length,
            absent: attendance.filter(a => a.status === 'غائب').length,
            late: attendance.filter(a => a.status === 'تأخير').length,
            notRecorded: students.length - attendance.length
        };
    },

    // ============= نظام السلوكيات =============

    // تسجيل سلوك طالب
    async recordBehavior(behaviorData) {
        const data = {
            ...behaviorData,
            timestamp: new Date().toISOString()
        };

        const behaviorId = await this.add('behaviors', data);
        await this.addActivity('behavior', `تم تسجيل سلوك: ${behaviorData.type}`, {
            studentId: behaviorData.studentId,
            behaviorType: behaviorData.type
        });

        return behaviorId;
    },

    // تحديث سلوك
    async updateBehavior(behaviorData) {
        const updatedData = {
            ...behaviorData,
            updatedAt: new Date().toISOString()
        };
        await this.update('behaviors', updatedData);
    },

    // حذف سلوك
    async deleteBehavior(behaviorId) {
        await this.delete('behaviors', behaviorId);
        await this.addActivity('behavior', 'تم حذف سجل سلوك', { behaviorId });
    },

    // الحصول على سلوكيات طالب
    async getStudentBehaviors(studentId, startDate = null, endDate = null) {
        let behaviors = await this.getByIndex('behaviors', 'studentId', studentId);

        if (startDate && endDate) {
            behaviors = behaviors.filter(b => {
                const date = new Date(b.date);
                return date >= new Date(startDate) && date <= new Date(endDate);
            });
        }

        return behaviors.sort((a, b) => new Date(b.date) - new Date(a.date));
    },

    // الحصول على سلوكيات صف
    async getClassBehaviors(classId, date = null) {
        let behaviors = await this.getByIndex('behaviors', 'classId', classId);

        if (date) {
            behaviors = behaviors.filter(b => b.date === date);
        }

        return behaviors.sort((a, b) => new Date(b.date) - new Date(a.date));
    },

    // حساب إحصائيات السلوكيات لطالب
    async getStudentBehaviorStats(studentId, startDate = null, endDate = null) {
        const behaviors = await this.getStudentBehaviors(studentId, startDate, endDate);

        const stats = {
            total: behaviors.length,
            positive: behaviors.filter(b => b.severity === 'إيجابي').length,
            minor: behaviors.filter(b => b.severity === 'بسيط').length,
            moderate: behaviors.filter(b => b.severity === 'متوسط').length,
            severe: behaviors.filter(b => b.severity === 'خطير').length,
            byType: {}
        };

        // تجميع حسب النوع
        behaviors.forEach(b => {
            stats.byType[b.type] = (stats.byType[b.type] || 0) + 1;
        });

        return stats;
    },

    // ============= نظام إشعارات الواتساب =============

    // تسجيل إشعار واتساب
    async logWhatsAppNotification(studentId, message, phone, status = 'pending') {
        const notification = {
            studentId,
            message,
            phone,
            status, // pending, sent, failed
            timestamp: new Date().toISOString(),
            error: null
        };

        return await this.add('whatsappNotifications', notification);
    },

    // تحديث حالة الإشعار
    async updateNotificationStatus(notificationId, status, error = null) {
        const notification = await this.get('whatsappNotifications', notificationId);
        if (notification) {
            notification.status = status;
            notification.error = error;
            notification.updatedAt = new Date().toISOString();
            await this.update('whatsappNotifications', notification);
        }
    },

    // الحصول على إشعارات طالب
    async getStudentNotifications(studentId) {
        return await this.getByIndex('whatsappNotifications', 'studentId', studentId);
    },

    // الحصول على الإشعارات المعلقة
    async getPendingNotifications() {
        const all = await this.getAll('whatsappNotifications');
        return all.filter(n => n.status === 'pending');
    },

    // حساب إحصائيات الإشعارات
    async getNotificationStats() {
        const all = await this.getAll('whatsappNotifications');

        return {
            total: all.length,
            sent: all.filter(n => n.status === 'sent').length,
            failed: all.filter(n => n.status === 'failed').length,
            pending: all.filter(n => n.status === 'pending').length
        };
    },

    // ============= تقارير المتابعة اليومية =============

    // تقرير شامل لطالب
    async getStudentDailyReport(studentId, startDate, endDate) {
        const student = await this.get('students', studentId);
        const attendanceStats = await this.getStudentAttendanceStats(studentId, startDate, endDate);
        const behaviorStats = await this.getStudentBehaviorStats(studentId, startDate, endDate);
        const behaviors = await this.getStudentBehaviors(studentId, startDate, endDate);
        const attendance = await this.getStudentAttendanceHistory(studentId, startDate, endDate);

        return {
            student,
            attendanceStats,
            behaviorStats,
            behaviors: behaviors.slice(0, 10), // آخر 10 سلوكيات
            attendance: attendance.slice(0, 30), // آخر 30 يوم
            period: { startDate, endDate }
        };
    },

    // تقرير يومي لصف
    async getClassDailyReport(classId, date) {
        const classData = await this.get('classes', classId);
        const students = await this.getStudentsByClass(classId);
        const attendanceStats = await this.getClassAttendanceStats(classId, date);
        const attendance = await this.getClassAttendanceByDate(classId, date);
        const behaviors = await this.getClassBehaviors(classId, date);

        return {
            class: classData,
            date,
            attendanceStats,
            attendance,
            behaviors,
            totalStudents: students.length
        };
    },

    // الطلاب الغائبين اليوم
    async getTodayAbsentStudents(classId = null) {
        const today = new Date().toISOString().split('T')[0];
        const allAttendance = await this.getAll('attendance');

        let absentToday = allAttendance.filter(a =>
            a.date === today && a.status === 'غائب'
        );

        if (classId) {
            absentToday = absentToday.filter(a => a.classId === classId);
        }

        // إضافة معلومات الطالب
        const studentsWithInfo = await Promise.all(
            absentToday.map(async (attendance) => {
                const student = await this.get('students', attendance.studentId);
                return { ...attendance, student };
            })
        );

        return studentsWithInfo;
    },

    // الطلاب المتأخرين اليوم
    async getTodayLateStudents(classId = null) {
        const today = new Date().toISOString().split('T')[0];
        const allAttendance = await this.getAll('attendance');

        let lateToday = allAttendance.filter(a =>
            a.date === today && a.status === 'تأخير'
        );

        if (classId) {
            lateToday = lateToday.filter(a => a.classId === classId);
        }

        const studentsWithInfo = await Promise.all(
            lateToday.map(async (attendance) => {
                const student = await this.get('students', attendance.studentId);
                return { ...attendance, student };
            })
        );

        return studentsWithInfo;
    }
});

// نظام إرسال رسائل الواتساب
class WhatsAppManager {
    constructor() {
        this.apiUrl = null;
        this.apiKey = null;
        this.loadSettings();
    }

    // تحميل إعدادات API
    loadSettings() {
        const settings = localStorage.getItem('whatsappSettings');
        if (settings) {
            const parsed = JSON.parse(settings);
            this.apiUrl = parsed.apiUrl;
            this.apiKey = parsed.apiKey;
        }
    }

    // حفظ إعدادات API
    saveSettings(apiUrl, apiKey) {
        localStorage.setItem('whatsappSettings', JSON.stringify({ apiUrl, apiKey }));
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
    }

    // إرسال رسالة واتساب
    async sendMessage(phone, message) {
        // إذا لم يكن API متاحاً، نفتح واتساب ويب
        if (!this.apiUrl || !this.apiKey) {
            return this.openWhatsAppWeb(phone, message);
        }

        // إرسال عبر API
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    phone: this.formatPhone(phone),
                    message: message
                })
            });

            if (!response.ok) {
                throw new Error(`فشل الإرسال: ${response.status}`);
            }

            return {
                success: true,
                method: 'api'
            };

        } catch (error) {
            console.error('خطأ في إرسال رسالة واتساب:', error);
            // في حالة الفشل، نفتح واتساب ويب
            return this.openWhatsAppWeb(phone, message);
        }
    }

    // فتح واتساب ويب
    openWhatsAppWeb(phone, message) {
        const formattedPhone = this.formatPhone(phone);
        const encodedMessage = encodeURIComponent(message);
        const url = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;

        window.open(url, '_blank');

        return {
            success: true,
            method: 'web'
        };
    }

    // تنسيق رقم الهاتف
    formatPhone(phone) {
        // إزالة جميع الرموز غير الأرقام
        let cleaned = phone.replace(/\D/g, '');

        // إضافة رمز الدولة إذا لم يكن موجوداً
        if (!cleaned.startsWith('966') && cleaned.startsWith('05')) {
            cleaned = '966' + cleaned.substring(1);
        } else if (!cleaned.startsWith('966') && !cleaned.startsWith('5')) {
            cleaned = '966' + cleaned;
        }

        return cleaned;
    }

    // إرسال إشعار حضور
    async sendAttendanceNotification(student, status, date) {
        const message = this.buildAttendanceMessage(student.name, status, date);
        const phone = student.guardianPhone || student.phone;

        if (!phone) {
            throw new Error('لا يوجد رقم جوال لولي الأمر');
        }

        // تسجيل الإشعار
        const notificationId = await db.logWhatsAppNotification(
            student.id,
            message,
            phone,
            'pending'
        );

        try {
            const result = await this.sendMessage(phone, message);

            await db.updateNotificationStatus(notificationId, 'sent');

            return {
                success: true,
                notificationId,
                ...result
            };

        } catch (error) {
            await db.updateNotificationStatus(notificationId, 'failed', error.message);
            throw error;
        }
    }

    // إرسال إشعار سلوك
    async sendBehaviorNotification(student, behavior) {
        const message = this.buildBehaviorMessage(student.name, behavior);
        const phone = student.guardianPhone || student.phone;

        if (!phone) {
            throw new Error('لا يوجد رقم جوال لولي الأمر');
        }

        const notificationId = await db.logWhatsAppNotification(
            student.id,
            message,
            phone,
            'pending'
        );

        try {
            const result = await this.sendMessage(phone, message);
            await db.updateNotificationStatus(notificationId, 'sent');

            return {
                success: true,
                notificationId,
                ...result
            };

        } catch (error) {
            await db.updateNotificationStatus(notificationId, 'failed', error.message);
            throw error;
        }
    }

    // بناء رسالة الحضور
    buildAttendanceMessage(studentName, status, date) {
        const dateFormatted = new Date(date).toLocaleDateString('ar-SA', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        let statusText = '';
        switch(status) {
            case 'غائب':
                statusText = 'غائب';
                break;
            case 'تأخير':
                statusText = 'متأخر';
                break;
            case 'حاضر':
                statusText = 'حاضر';
                break;
        }

        return `
السلام عليكم ورحمة الله وبركاته

عزيزي ولي الأمر،

نود إعلامكم بأن الطالب/ـة: *${studentName}*
الحالة: *${statusText}*
التاريخ: ${dateFormatted}

للاستفسار يرجى التواصل مع إدارة المدرسة.

مع تحيات نظام المتابعة الإلكتروني
        `.trim();
    }

    // بناء رسالة السلوك
    buildBehaviorMessage(studentName, behavior) {
        const dateFormatted = new Date(behavior.date).toLocaleDateString('ar-SA');

        let severityIcon = '';
        switch(behavior.severity) {
            case 'إيجابي':
                severityIcon = '✅';
                break;
            case 'بسيط':
                severityIcon = '⚠️';
                break;
            case 'متوسط':
                severityIcon = '🔶';
                break;
            case 'خطير':
                severityIcon = '🔴';
                break;
        }

        return `
السلام عليكم ورحمة الله وبركاته

عزيزي ولي الأمر،

نود إعلامكم بملاحظة على الطالب/ـة: *${studentName}*

${severityIcon} نوع الملاحظة: *${behavior.type}*
المستوى: ${behavior.severity}
التاريخ: ${dateFormatted}

${behavior.notes ? `التفاصيل: ${behavior.notes}` : ''}

${behavior.action ? `الإجراء المتخذ: ${behavior.action}` : ''}

نأمل التعاون لتحسين سلوك الطالب/ـة.

مع تحيات نظام المتابعة الإلكتروني
        `.trim();
    }
}

// إنشاء نسخة من مدير الواتساب
const whatsAppManager = new WhatsAppManager();
