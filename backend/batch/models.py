from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.utils.html import mark_safe
from PIL import Image
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile
import sys


class CourseCategory(models.Model):
    """Course Category model - represents different course categories."""
    name = models.CharField('Category Name', max_length=100, unique=True)
    code = models.CharField('Category Code', max_length=50, unique=True, help_text='Unique code like BCECE, DCECE, etc.')
    description = models.TextField('Description', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Course Category'
        verbose_name_plural = 'Course Categories'

    def __str__(self):
        return self.name


class Subject(models.Model):
    """Subject model - represents a teachable subject."""
    name = models.CharField('Subject Name', max_length=100, unique=True)
    sme = models.ForeignKey(
        'accounts.CustomUser',
        verbose_name='SME',
        related_name='sme_subjects',
        limit_choices_to={'role': 'Teacher'},
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text='Select the SME (primary subject matter expert)'
    )
    teachers = models.ManyToManyField(
        'accounts.CustomUser',
        verbose_name='Teachers',
        related_name='teaches_subjects',
        limit_choices_to={'role': 'Teacher'},
        blank=False,
        help_text='Select teachers who teach this subject'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Subject'
        verbose_name_plural = 'Subjects'

    def __str__(self):
        return self.name

    def get_chapters_display(self):
        """Return chapters as a list of strings with serials like '01. Chapter name'."""
        chapters = getattr(self, 'chapters', None)
        if chapters is None:
            # Related name 'chapters' may not exist yet if migrations haven't been run
            return []
        out = []
        for ch in self.chapters.all().order_by('order'):
            serial = f"{(ch.order or 0):02}"
            out.append(f"{serial}. {ch.title}")
        return out


class Chapter(models.Model):
    """Chapter model linked to a Subject with an ordered serial number.

    The `order` field is auto-assigned if not provided: first chapter gets 1, next 2, etc.
    The `__str__` prints the zero-padded serial and title, e.g. '01 - Introduction'.
    """
    subject = models.ForeignKey(Subject, related_name='chapters', on_delete=models.CASCADE)
    title = models.CharField('Chapter Title', max_length=200)
    order = models.PositiveIntegerField('Serial', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'id']
        verbose_name = 'Chapter'
        verbose_name_plural = 'Chapters'
        unique_together = (('subject', 'order'),)

    def save(self, *args, **kwargs):
        # Auto-assign order if not set
        if not self.order:
            qs = Chapter.objects.filter(subject=self.subject).order_by('-order')
            try:
                last = qs.first()
                self.order = (last.order or 0) + 1 if last else 1
            except Exception:
                self.order = 1
        super().save(*args, **kwargs)

    @property
    def serial(self):
        return f"{(self.order or 0):02}"

    def __str__(self):
        return f"{self.serial} - {self.title}"

class Batch(models.Model):
    """
    Batch model - represents a teaching batch with duration, pricing, and assigned teacher.
    
    Validates:
    - Thumbnail dimensions (approx 300x700)
    - End date must be after start date
    - Offer price must be less than regular price
    - Only teachers can be assigned as batch teachers
    """
    name = models.CharField('Batch Name', max_length=100)
    course_category = models.ForeignKey(
        CourseCategory,
        on_delete=models.CASCADE,
        related_name='batches',
        verbose_name='Course Category',
        help_text='Select a course category for this batch'
    )
    teachers = models.ManyToManyField(
        'accounts.CustomUser',
        verbose_name='Teachers',
        limit_choices_to={'role': 'Teacher'},
        related_name='teaching_batches',
        help_text='Select 1-10 teachers for this batch'
    )
    subjects = models.ManyToManyField(
        Subject,
        verbose_name='Subjects',
        related_name='batches',
        help_text='Select 1-10 subjects for this batch'
    )
    thumbnail = models.ImageField(
        'Batch Thumbnail',
        upload_to='batches/',
        help_text='Image should be approximately 300x700 pixels'
    )
    price = models.DecimalField(
        'Regular Price',
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    offer_price = models.DecimalField(
        'Offer Price',
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text='Optional discounted price'
    )
    start_date = models.DateField('Start Date')
    end_date = models.DateField('End Date')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Batch'
        verbose_name_plural = 'Batches'

    def __str__(self):
        teacher_names = ", ".join(t.get_full_name() for t in self.teachers.all()[:3])
        subject_names = ", ".join(s.name for s in self.subjects.all()[:3])
        if self.teachers.count() > 3:
            teacher_names += " & others"
        if self.subjects.count() > 3:
            subject_names += " & others"
        # Include course category in display if available
        if self.course_category:
            return f"{self.name} [{self.course_category.name}] ({teacher_names} - {subject_names})"
        return f"{self.name} ({teacher_names} - {subject_names})"

    def clean(self):
        """Validate model constraints."""
        errors = {}

        # Validate dates
        if self.start_date and self.end_date and self.end_date <= self.start_date:
            errors['end_date'] = 'End date must be after start date'

        # Validate offer price
        if self.offer_price and self.price and self.offer_price >= self.price:
            errors['offer_price'] = 'Offer price must be less than regular price'

        # Validate teacher count (1-10)
        if hasattr(self, 'pk') and self.pk:  # Only check for existing instances
            teacher_count = self.teachers.count()
            if teacher_count < 1:
                errors['teachers'] = 'At least one teacher is required'
            elif teacher_count > 10:
                errors['teachers'] = 'Maximum 10 teachers allowed'

            # Validate subject count (1-10)
            subject_count = self.subjects.count()
            if subject_count < 1:
                errors['subjects'] = 'At least one subject is required'
            elif subject_count > 10:
                errors['subjects'] = 'Maximum 10 subjects allowed'

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        """Override save to validate and process thumbnail image."""
        if self.thumbnail:
            img = Image.open(self.thumbnail)
            
            # Convert to RGB if needed (for PNG/RGBA)
            if img.mode != 'RGB':
                img = img.convert('RGB')

            # Check aspect ratio (allowing some flexibility)
            width, height = img.size
            expected_ratio = 700/300  # approximately 2.33
            actual_ratio = width/height
            tolerance = 0.2  # 20% tolerance

            if not (expected_ratio * (1-tolerance) <= actual_ratio <= expected_ratio * (1+tolerance)):
                # Resize to correct dimensions
                new_size = (700, 300)
                img = img.resize(new_size, Image.Resampling.LANCZOS)

                # Save back to memory
                output = BytesIO()
                img.save(output, format='JPEG', quality=90)
                output.seek(0)
                
                # Update thumbnail field
                self.thumbnail = InMemoryUploadedFile(
                    output,
                    'ImageField',
                    f"{self.thumbnail.name.split('.')[0]}.jpg",
                    'image/jpeg',
                    sys.getsizeof(output),
                    None
                )

        super().save(*args, **kwargs)

    def get_discount_percentage(self):
        """Calculate discount percentage if offer price exists."""
        if self.offer_price and self.price:
            discount = ((self.price - self.offer_price) / self.price) * 100
            return round(discount, 1)
        return 0

    def thumbnail_preview(self):
        """Generate HTML for thumbnail preview in admin."""
        if self.thumbnail:
            # Add border and small padding so image stands out in admin forms
            return mark_safe(
                f'<img src="{self.thumbnail.url}" style="max-width:200px;border:1px solid #ddd;padding:4px;border-radius:4px;"/>'
            )
        return "No thumbnail"
    thumbnail_preview.short_description = 'Preview'
