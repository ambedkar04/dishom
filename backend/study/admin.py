from django.contrib import admin
from django.utils.html import format_html
from django import forms
from django.urls import path
from django.http import JsonResponse
from .models import Study


class StudyAdminForm(forms.ModelForm):
    """Custom form for Study admin with dependent dropdowns."""
    class Meta:
        model = Study
        fields = '__all__'
        widgets = {
            'course_category': forms.Select(attrs={'id': 'id_course_category'}),
            'batch': forms.Select(attrs={'id': 'id_batch'}),
            'subject': forms.Select(attrs={'id': 'id_subject'}),
            'chapter': forms.Select(attrs={'id': 'id_chapter'}),
            'teacher': forms.Select(attrs={'id': 'id_teacher'}),
        }


@admin.register(Study)
class StudyAdmin(admin.ModelAdmin):
    form = StudyAdminForm
    list_display = (
        'title', 'batch_display', 'course_category_display',
        'subject_display', 'chapter_display', 'teacher_display',
        'created_at'
    )
    readonly_fields = ('created_at', 'updated_at')

    class Media:
        js = ('study/js/study_admin.js',)  # use your app-level static path

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('get-batches/', self.admin_site.admin_view(self.get_batches)),
            path('get-chapters/', self.admin_site.admin_view(self.get_chapters)),
            path('get-teachers/', self.admin_site.admin_view(self.get_teachers)),
        ]
        return custom_urls + urls

    # ---------- AJAX API Views ----------
    def get_batches(self, request):
        course_category_id = request.GET.get('course_category')
        if course_category_id:
            from batch.models import Batch
            batches = Batch.objects.filter(course_category_id=course_category_id).values('id', 'name')
            return JsonResponse(list(batches), safe=False)
        return JsonResponse([], safe=False)

    def get_chapters(self, request):
        subject_id = request.GET.get('subject')
        if subject_id:
            from batch.models import Chapter
            chapters = Chapter.objects.filter(subject_id=subject_id).values('id', 'title')
            return JsonResponse(list(chapters), safe=False)
        return JsonResponse([], safe=False)

    def get_teachers(self, request):
        subject_id = request.GET.get('subject')
        if subject_id:
            from accounts.models import CustomUser
            teachers = CustomUser.objects.filter(subjects__id=subject_id).values('id', 'first_name', 'last_name')
            data = [
                {'id': t['id'], 'name': f"{t['first_name']} {t['last_name']}".strip()}
                for t in teachers
            ]
            return JsonResponse(data, safe=False)
        return JsonResponse([], safe=False)

    # ---------- Display Methods ----------
    def batch_display(self, obj):
        if obj.batch:
            return format_html('<a href="/admin/batch/batch/{}/change/">{}</a>', obj.batch.id, obj.batch.name)
        return '-'

    def course_category_display(self, obj):
        return obj.course_category.name if obj.course_category else '-'

    def subject_display(self, obj):
        if obj.subject:
            return format_html('<a href="/admin/batch/subject/{}/change/">{}</a>', obj.subject.id, obj.subject.name)
        return '-'

    def chapter_display(self, obj):
        if obj.chapter:
            return format_html('<a href="/admin/batch/chapter/{}/change/">{}</a>', obj.chapter.id, obj.chapter.title)
        return '-'

    def teacher_display(self, obj):
        if obj.teacher:
            return format_html('<a href="/admin/accounts/customuser/{}/change/">{}</a>',
                               obj.teacher.id,
                               obj.teacher.get_full_name() or obj.teacher.mobile_number)
        return '-'
