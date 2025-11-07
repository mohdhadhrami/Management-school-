// نظام الاستيراد والتصدير المتقدم

class ImportExportManager {
    constructor() {
        this.supportedFormats = ['json', 'csv', 'xml', 'excel'];
    }

    // ============= استيراد الطلاب من Excel =============

    async importStudentsFromExcel(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });

                    // قراءة أول ورقة في الملف
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const students = XLSX.utils.sheet_to_json(firstSheet);

                    // معالجة البيانات
                    const processedStudents = [];
                    const errors = [];

                    for (let i = 0; i < students.length; i++) {
                        const row = students[i];

                        try {
                            const studentData = this.mapExcelRowToStudent(row);

                            // التحقق من البيانات المطلوبة
                            if (!studentData.studentNumber || !studentData.name) {
                                errors.push({
                                    row: i + 2, // +2 لأن الصف الأول هو العناوين والترقيم يبدأ من 1
                                    error: 'رقم الطالب والاسم مطلوبان'
                                });
                                continue;
                            }

                            processedStudents.push(studentData);
                        } catch (error) {
                            errors.push({
                                row: i + 2,
                                error: error.message
                            });
                        }
                    }

                    resolve({ students: processedStudents, errors });

                } catch (error) {
                    reject('خطأ في قراءة ملف Excel: ' + error.message);
                }
            };

            reader.onerror = () => reject('خطأ في قراءة الملف');
            reader.readAsArrayBuffer(file);
        });
    }

    // تحويل صف Excel إلى بيانات طالب
    mapExcelRowToStudent(row) {
        // دعم أسماء أعمدة مختلفة باللغة العربية والإنجليزية
        const getValue = (possibleKeys) => {
            for (const key of possibleKeys) {
                if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
                    return row[key];
                }
            }
            return null;
        };

        return {
            studentNumber: getValue(['الرقم المدرسي', 'رقم الطالب', 'الرقم', 'رقم', 'Student Number', 'Number', 'ID']),
            name: getValue(['الاسم', 'اسم الطالب', 'Name', 'Student Name']),
            nationality: getValue(['الجنسية', 'Nationality']) || 'عماني',
            residentialArea: getValue(['المنطقة السكنية', 'المنطقة', 'Residential Area', 'Area']),
            guardianPhone: getValue(['الهاتف النقال', 'الهاتف', 'رقم الجوال', 'الجوال', 'Phone', 'Mobile'])
        };
    }

    // تنسيق التاريخ
    formatDate(dateValue) {
        if (!dateValue) return null;

        // إذا كان التاريخ من Excel (رقم)
        if (typeof dateValue === 'number') {
            const date = XLSX.SSF.parse_date_code(dateValue);
            return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
        }

        // إذا كان نص
        if (typeof dateValue === 'string') {
            // محاولة تحويل التاريخ من صيغ مختلفة
            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
        }

        return dateValue;
    }

    // تنزيل قالب Excel للطلاب
    downloadStudentsTemplate() {
        const headers = [
            'م',
            'الاسم',
            'الرقم المدرسي',
            'الجنسية',
            'المنطقة السكنية',
            'الهاتف النقال'
        ];

        const sampleData = [
            [
                '1',
                'عزان بن محمد بن احمد بن مطر الحضرمي',
                '411615650999',
                'عماني',
                'فرق',
                '99887897'
            ],
            [
                '2',
                'سالم بن خالد بن سعيد الرواحي',
                '411615651000',
                'عماني',
                'الرستاق',
                '99123456'
            ],
            [
                '3',
                'أحمد بن علي بن محمد البلوشي',
                '411615651001',
                'عماني',
                'صحار',
                '99234567'
            ]
        ];

        const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'الطلاب');

        // تنسيق الأعمدة
        ws['!cols'] = [
            { wch: 5 },   // م
            { wch: 40 },  // الاسم
            { wch: 15 },  // الرقم المدرسي
            { wch: 12 },  // الجنسية
            { wch: 18 },  // المنطقة السكنية
            { wch: 15 }   // الهاتف النقال
        ];

        XLSX.writeFile(wb, 'قالب_الطلاب.xlsx');
    }

    // ============= التصدير إلى JSON =============

    async exportToJSON(type, data = null) {
        let exportData = {};

        switch (type) {
            case 'all':
                exportData = {
                    classes: await db.getAll('classes'),
                    students: await db.getAll('students'),
                    assessments: await db.getAll('assessments'),
                    grades: await db.getAll('grades'),
                    exportDate: new Date().toISOString(),
                    version: '1.0'
                };
                break;
            case 'students':
                exportData = await db.getAll('students');
                break;
            case 'grades':
                exportData = await this.prepareGradesExport(data);
                break;
        }

        const jsonString = JSON.stringify(exportData, null, 2);
        this.downloadFile(jsonString, `export_${type}_${Date.now()}.json`, 'application/json');
    }

    // ============= التصدير إلى CSV =============

    async exportToCSV(type, data = null) {
        let csvContent = '';

        switch (type) {
            case 'students':
                csvContent = await this.studentsToCSV();
                break;
            case 'grades':
                csvContent = await this.gradesToCSV(data);
                break;
        }

        this.downloadFile(csvContent, `export_${type}_${Date.now()}.csv`, 'text/csv;charset=utf-8;');
    }

    async studentsToCSV() {
        const students = await db.getAll('students');
        const headers = [
            'م', 'الاسم', 'الرقم المدرسي', 'الجنسية', 'المنطقة السكنية', 'الهاتف النقال', 'الصف'
        ];

        let csv = '\uFEFF' + headers.join(',') + '\n'; // BOM for UTF-8

        let index = 1;
        for (const student of students) {
            const classData = await db.get('classes', student.classId);
            const row = [
                index++,
                student.name,
                student.studentNumber,
                student.nationality || 'عماني',
                student.residentialArea || '',
                student.guardianPhone || '',
                classData ? classData.name : ''
            ];
            csv += row.map(field => `"${field}"`).join(',') + '\n';
        }

        return csv;
    }

    async gradesToCSV(data) {
        const { classId, assessmentId } = data;
        const students = await db.getStudentsByClass(classId);
        const assessment = await db.get('assessments', assessmentId);
        const classData = await db.get('classes', classId);

        const headers = ['رقم الطالب', 'الاسم', 'الدرجة', 'النسبة المئوية', 'ملاحظات'];
        let csv = '\uFEFF' + headers.join(',') + '\n';

        for (const student of students) {
            const grade = await db.getGrade(student.id, assessmentId);
            const gradeValue = grade ? grade.grade : '';
            const percentage = grade ? ((grade.grade / assessment.maxGrade) * 100).toFixed(2) : '';
            const notes = grade ? grade.notes : '';

            const row = [
                student.studentNumber,
                student.name,
                gradeValue,
                percentage,
                notes
            ];
            csv += row.map(field => `"${field}"`).join(',') + '\n';
        }

        return csv;
    }

    // ============= التصدير إلى XML =============

    async exportToXML(type, data = null) {
        let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';

        switch (type) {
            case 'students':
                xmlContent += await this.studentsToXML();
                break;
            case 'grades':
                xmlContent += await this.gradesToXML(data);
                break;
            case 'all':
                xmlContent += await this.allDataToXML();
                break;
        }

        this.downloadFile(xmlContent, `export_${type}_${Date.now()}.xml`, 'application/xml');
    }

    async studentsToXML() {
        const students = await db.getAll('students');
        let xml = '<students>\n';

        let index = 1;
        for (const student of students) {
            const classData = await db.get('classes', student.classId);
            xml += '  <student>\n';
            xml += `    <number>${index++}</number>\n`;
            xml += `    <name>${this.escapeXML(student.name)}</name>\n`;
            xml += `    <studentNumber>${this.escapeXML(student.studentNumber)}</studentNumber>\n`;
            xml += `    <nationality>${this.escapeXML(student.nationality || 'عماني')}</nationality>\n`;
            xml += `    <residentialArea>${this.escapeXML(student.residentialArea || '')}</residentialArea>\n`;
            xml += `    <guardianPhone>${this.escapeXML(student.guardianPhone || '')}</guardianPhone>\n`;
            xml += `    <class>${this.escapeXML(classData ? classData.name : '')}</class>\n`;
            xml += '  </student>\n';
        }

        xml += '</students>';
        return xml;
    }

    async gradesToXML(data) {
        const { classId, assessmentId } = data;
        const students = await db.getStudentsByClass(classId);
        const assessment = await db.get('assessments', assessmentId);
        const classData = await db.get('classes', classId);

        let xml = '<grades>\n';
        xml += `  <class>${this.escapeXML(classData.name)}</class>\n`;
        xml += `  <assessment>${this.escapeXML(assessment.name)}</assessment>\n`;
        xml += '  <students>\n';

        for (const student of students) {
            const grade = await db.getGrade(student.id, assessmentId);
            xml += '    <student>\n';
            xml += `      <studentNumber>${this.escapeXML(student.studentNumber)}</studentNumber>\n`;
            xml += `      <name>${this.escapeXML(student.name)}</name>\n`;
            xml += `      <grade>${grade ? grade.grade : ''}</grade>\n`;
            xml += `      <percentage>${grade ? ((grade.grade / assessment.maxGrade) * 100).toFixed(2) : ''}</percentage>\n`;
            xml += `      <notes>${this.escapeXML(grade ? grade.notes : '')}</notes>\n`;
            xml += '    </student>\n';
        }

        xml += '  </students>\n';
        xml += '</grades>';
        return xml;
    }

    async allDataToXML() {
        let xml = '<gradesSystem>\n';

        // الصفوف
        const classes = await db.getAll('classes');
        xml += '  <classes>\n';
        for (const cls of classes) {
            xml += '    <class>\n';
            xml += `      <id>${cls.id}</id>\n`;
            xml += `      <name>${this.escapeXML(cls.name)}</name>\n`;
            xml += `      <grade>${this.escapeXML(cls.grade)}</grade>\n`;
            xml += `      <subject>${this.escapeXML(cls.subject)}</subject>\n`;
            xml += '    </class>\n';
        }
        xml += '  </classes>\n';

        // الطلاب
        xml += await this.studentsToXML();

        xml += '</gradesSystem>';
        return xml;
    }

    escapeXML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    // ============= التصدير إلى Excel =============

    async exportToExcel(type, data = null) {
        const wb = XLSX.utils.book_new();

        switch (type) {
            case 'students':
                await this.addStudentsSheet(wb);
                break;
            case 'grades':
                await this.addGradesSheet(wb, data);
                break;
            case 'all':
                await this.addAllDataSheets(wb);
                break;
        }

        XLSX.writeFile(wb, `export_${type}_${Date.now()}.xlsx`);
    }

    async addStudentsSheet(wb) {
        const students = await db.getAll('students');
        const data = [
            ['م', 'الاسم', 'الرقم المدرسي', 'الجنسية', 'المنطقة السكنية', 'الهاتف النقال', 'الصف']
        ];

        let index = 1;
        for (const student of students) {
            const classData = await db.get('classes', student.classId);
            data.push([
                index++,
                student.name,
                student.studentNumber,
                student.nationality || 'عماني',
                student.residentialArea || '',
                student.guardianPhone || '',
                classData ? classData.name : ''
            ]);
        }

        const ws = XLSX.utils.aoa_to_sheet(data);
        ws['!cols'] = [
            { wch: 5 },   // م
            { wch: 40 },  // الاسم
            { wch: 15 },  // الرقم المدرسي
            { wch: 12 },  // الجنسية
            { wch: 18 },  // المنطقة السكنية
            { wch: 15 },  // الهاتف النقال
            { wch: 20 }   // الصف
        ];
        XLSX.utils.book_append_sheet(wb, ws, 'الطلاب');
    }

    async addGradesSheet(wb, data) {
        const { classId, assessmentId } = data;
        const students = await db.getStudentsByClass(classId);
        const assessment = await db.get('assessments', assessmentId);
        const classData = await db.get('classes', classId);

        const sheetData = [
            ['الصف:', classData.name],
            ['أداة التقويم:', assessment.name],
            ['الدرجة العظمى:', assessment.maxGrade],
            ['التاريخ:', new Date().toLocaleDateString('ar-SA')],
            [],
            ['رقم الطالب', 'الاسم', 'الدرجة', 'النسبة المئوية', 'الحالة', 'ملاحظات']
        ];

        for (const student of students) {
            const grade = await db.getGrade(student.id, assessmentId);
            const gradeValue = grade ? grade.grade : '';
            const percentage = grade ? ((grade.grade / assessment.maxGrade) * 100).toFixed(2) : '';
            const status = grade ? (percentage >= 50 ? 'ناجح' : 'راسب') : 'لم يتم الإدخال';

            sheetData.push([
                student.studentNumber,
                student.name,
                gradeValue,
                percentage,
                status,
                grade ? grade.notes : ''
            ]);
        }

        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        ws['!cols'] = [
            { wch: 12 }, { wch: 25 }, { wch: 10 }, { wch: 15 }, { wch: 12 }, { wch: 30 }
        ];

        // تنسيق العناوين
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell = ws[XLSX.utils.encode_cell({ r: 5, c: C })];
            if (cell) {
                cell.s = {
                    font: { bold: true },
                    fill: { fgColor: { rgb: "4472C4" } },
                    alignment: { horizontal: "center" }
                };
            }
        }

        XLSX.utils.book_append_sheet(wb, ws, 'الدرجات');
    }

    async addAllDataSheets(wb) {
        // ورقة الصفوف
        const classes = await db.getAll('classes');
        const classesData = [['اسم الصف', 'المرحلة', 'المادة', 'العام الدراسي', 'الفصل الدراسي']];
        classes.forEach(cls => {
            classesData.push([cls.name, cls.grade, cls.subject, cls.year, cls.semester]);
        });
        const wsClasses = XLSX.utils.aoa_to_sheet(classesData);
        XLSX.utils.book_append_sheet(wb, wsClasses, 'الصفوف');

        // ورقة الطلاب
        await this.addStudentsSheet(wb);

        // ورقة أدوات التقويم
        const assessments = await db.getAll('assessments');
        const assessmentsData = [['اسم الأداة', 'النوع', 'الدرجة العظمى', 'الوزن', 'التاريخ']];
        for (const assessment of assessments) {
            const classData = await db.get('classes', assessment.classId);
            assessmentsData.push([
                assessment.name,
                assessment.type,
                assessment.maxGrade,
                assessment.weight + '%',
                assessment.date
            ]);
        }
        const wsAssessments = XLSX.utils.aoa_to_sheet(assessmentsData);
        XLSX.utils.book_append_sheet(wb, wsAssessments, 'أدوات التقويم');
    }

    // ============= التكامل مع البوابة التعليمية =============

    async exportToPortal(data) {
        const { classId, assessmentId, portalConfig } = data;

        // تجهيز البيانات
        const students = await db.getStudentsByClass(classId);
        const assessment = await db.get('assessments', assessmentId);
        const classData = await db.get('classes', classId);

        const portalData = {
            metadata: {
                schoolId: portalConfig.schoolId,
                classId: classData.portalClassId || classData.id,
                className: classData.name,
                assessmentId: assessment.portalId || assessment.id,
                assessmentName: assessment.name,
                assessmentType: assessment.type,
                maxGrade: assessment.maxGrade,
                weight: assessment.weight,
                date: assessment.date,
                exportDate: new Date().toISOString(),
                exportedBy: portalConfig.teacherId || 'system'
            },
            students: []
        };

        // إضافة بيانات الطلاب
        for (const student of students) {
            const grade = await db.getGrade(student.id, assessmentId);

            portalData.students.push({
                studentId: student.portalId || student.studentNumber,
                nationalId: student.nationalId,
                name: student.name,
                grade: grade ? grade.grade : null,
                percentage: grade ? ((grade.grade / assessment.maxGrade) * 100).toFixed(2) : null,
                status: grade ? (((grade.grade / assessment.maxGrade) * 100) >= 50 ? 'pass' : 'fail') : 'pending',
                notes: grade ? grade.notes : '',
                submittedDate: grade ? grade.updatedAt : null
            });
        }

        // إذا كان هناك API URL، قم بإرسال البيانات
        if (portalConfig.apiUrl) {
            try {
                const response = await this.sendToPortalAPI(portalConfig, portalData);
                return {
                    success: true,
                    message: 'تم إرسال البيانات إلى البوابة بنجاح',
                    response: response
                };
            } catch (error) {
                throw new Error('فشل إرسال البيانات إلى البوابة: ' + error.message);
            }
        } else {
            // إذا لم يكن هناك API، قم بتنزيل البيانات كملف JSON
            this.downloadFile(
                JSON.stringify(portalData, null, 2),
                `portal_export_${classId}_${assessmentId}_${Date.now()}.json`,
                'application/json'
            );

            return {
                success: true,
                message: 'تم تجهيز البيانات للبوابة بنجاح',
                data: portalData
            };
        }
    }

    async sendToPortalAPI(config, data) {
        const response = await fetch(config.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiToken}`,
                'X-School-ID': config.schoolId,
                ...config.customHeaders
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }

    // ============= وظائف مساعدة =============

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    async prepareGradesExport(data) {
        const { classId, assessmentId } = data;
        const students = await db.getStudentsByClass(classId);
        const assessment = await db.get('assessments', assessmentId);
        const classData = await db.get('classes', classId);

        const exportData = {
            class: classData,
            assessment: assessment,
            students: []
        };

        for (const student of students) {
            const grade = await db.getGrade(student.id, assessmentId);
            exportData.students.push({
                ...student,
                grade: grade ? grade.grade : null,
                percentage: grade ? ((grade.grade / assessment.maxGrade) * 100).toFixed(2) : null,
                notes: grade ? grade.notes : ''
            });
        }

        return exportData;
    }
}

// إنشاء نسخة واحدة من مدير الاستيراد والتصدير
const importExportManager = new ImportExportManager();
