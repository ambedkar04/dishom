from django.db import models
from django.core.exceptions import ValidationError


class LiveSession(models.Model):
    PLATFORM_VIDEOSDK = 'videosdk'
    PLATFORM_YOUTUBE = 'youtube'
    PLATFORM_CHOICES = (
        (PLATFORM_VIDEOSDK, 'VideoSDK'),
        (PLATFORM_YOUTUBE, 'YouTube'),
    )
    title = models.CharField('Title', max_length=200)
    # Choose batch relations
    course_category = models.ForeignKey(
        'batch.CourseCategory',
        on_delete=models.CASCADE,
        related_name='live_sessions',
        verbose_name='Course',
        null=True,
        blank=True,
        help_text='Select course to filter batches'
    )
    batch = models.ForeignKey(
        'batch.Batch',
        on_delete=models.CASCADE,
        related_name='live_sessions',
        verbose_name='Batch',
        null=True,
        blank=True,
    )
    subject = models.ForeignKey(
        'batch.Subject',
        on_delete=models.CASCADE,
        related_name='live_sessions',
        verbose_name='Subject',
        null=True,
        blank=True,
    )
    chapter = models.ForeignKey(
        'batch.Chapter',
        on_delete=models.CASCADE,
        related_name='live_sessions',
        verbose_name='Chapter',
        null=True,
        blank=True,
    )
    teacher = models.ForeignKey(
        'accounts.CustomUser',
        verbose_name='Teacher',
        limit_choices_to={'role': 'Teacher'},
        on_delete=models.CASCADE,
        related_name='live_sessions'
    )
    # Live class platform & configs
    live_platform = models.CharField('Platform', max_length=20, choices=PLATFORM_CHOICES, default=PLATFORM_VIDEOSDK)
    # VideoSDK
    videosdk_meeting_id = models.CharField('VideoSDK Meeting ID', max_length=64, blank=True, null=True)
    videosdk_token = models.CharField('VideoSDK Token', max_length=256, blank=True, null=True,
                                      help_text='Server-generated auth token (do not paste secret here).')
    # YouTube
    youtube_video_url = models.URLField('YouTube Video URL', blank=True, null=True,
                                        help_text='For scheduled live or existing video URL')
    youtube_stream_key = models.CharField('YouTube Stream Key', max_length=128, blank=True, null=True,
                                          help_text='RTMP Stream Key (keep confidential)')
    start_time = models.DateTimeField('Start Time')
    duration_minutes = models.PositiveIntegerField('Duration (minutes)', default=60)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_time']
        verbose_name = 'Live Session'
        verbose_name_plural = 'Live Sessions'

    def __str__(self):
        return f"{self.title} ({self.start_time.strftime('%Y-%m-%d %H:%M')})"

    def clean(self):
        errors = {}
        # Require fields based on selected platform
        if self.live_platform == self.PLATFORM_VIDEOSDK:
            if not self.videosdk_meeting_id:
                errors['videosdk_meeting_id'] = 'Meeting ID is required for VideoSDK.'
        elif self.live_platform == self.PLATFORM_YOUTUBE:
            if not (self.youtube_video_url or self.youtube_stream_key):
                errors['youtube_video_url'] = 'Provide either a YouTube video URL or a stream key.'
        if errors:
            raise ValidationError(errors)
