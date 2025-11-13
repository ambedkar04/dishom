from django.contrib import admin
from django import forms
from django.contrib.admin.widgets import AdminSplitDateTime
from .models import LiveSession


class LiveSessionAdminForm(forms.ModelForm):
    class Meta:
        model = LiveSession
        fields = '__all__'
        widgets = {
            'start_time': AdminSplitDateTime(),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Show only batch name for the Batch FK choices
        batch_field = self.fields.get('batch')
        if batch_field is not None:
            batch_field.label_from_instance = lambda obj: obj.name


@admin.register(LiveSession)
class LiveSessionAdmin(admin.ModelAdmin):
    form = LiveSessionAdminForm
    list_display = ('title', 'teacher', 'start_time', 'duration_minutes', 'created_at')
    search_fields = ('title', 'teacher__first_name', 'teacher__last_name')
    list_filter = ('teacher', 'start_time')
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        ('Details', {
            'classes': ('tab',),
            'fields': ('title', 'start_time', 'duration_minutes')
        }),
        ('Choose batch', {
            'classes': ('tab',),
            'fields': ('course_category', 'batch', 'subject', 'chapter', 'teacher')
        }),
        ('Take Live Class', {
            'classes': ('tab',),
            'fields': (
                'live_platform',
                'videosdk_meeting_id', 'videosdk_token',
                'youtube_video_url', 'youtube_stream_key',
            ),
            'description': 'Select platform and provide required configuration. For VideoSDK use server-generated tokens.'
        }),
        ('Timestamps', {
            'classes': ('tab',),
            'fields': ('created_at', 'updated_at')
        }),
    )

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        # Light dynamic filtering similar to Study admin
        if db_field.name == 'batch':
            course_category_id = request.GET.get('course_category')
            if course_category_id:
                kwargs['queryset'] = db_field.remote_field.model.objects.filter(course_category_id=course_category_id)
        elif db_field.name == 'chapter':
            subject_id = request.GET.get('subject')
            if subject_id:
                kwargs['queryset'] = db_field.remote_field.model.objects.filter(subject_id=subject_id)
        elif db_field.name == 'teacher':
            # Filter teachers by subject name if provided
            subject_id = request.GET.get('subject')
            try:
                from batch.models import Subject
                from accounts.models import CustomUser
            except Exception:
                Subject = None
                CustomUser = db_field.remote_field.model
            if subject_id and Subject is not None:
                subject = Subject.objects.filter(pk=subject_id).first()
                if subject:
                    kwargs['queryset'] = CustomUser.objects.filter(role='Teacher', subjects__icontains=subject.name)
                else:
                    kwargs['queryset'] = CustomUser.objects.filter(role='Teacher')
            else:
                kwargs['queryset'] = db_field.remote_field.model.objects.filter(role='Teacher')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    class Media:
        css = {
            'all': ('live_class/css/admin.css',)
        }
