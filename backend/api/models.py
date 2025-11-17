# api/models.py
from django.db import models
from django.utils.timezone import now, timedelta
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.exceptions import ValidationError
from django.conf import settings


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.is_active = False  # Must verify email
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        user = self.create_user(email, password, **extra_fields)
        user.is_active = True  # Superusers are always active
        user.save(using=self._db)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('Graduand', 'Graduand'),
        ('Admin', 'Admin'),
    ]

    user_id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Graduand')
    is_active = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=255, blank=True, null=True)
    email_verification_sent_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'role']

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.role})"

    def is_verification_token_expired(self):
        if not self.email_verification_sent_at:
            return True
        return now() > self.email_verification_sent_at + timedelta(days=7)


class Assessment(models.Model):
    FIELD_CHOICES = [
        ('Architecture', 'Architecture'),
        ('Art', 'Art'),
        ('Biology', 'Biology'),
        ('Business', 'Business'),
        ('Chemistry', 'Chemistry'),
        ('Computer Science', 'Computer Science'),
        ('Education', 'Education'),
        ('Engineering', 'Engineering'),
        ('Finance', 'Finance'),
        ('Law', 'Law'),
        ('Marketing', 'Marketing'),
        ('Medicine', 'Medicine'),
        ('Music', 'Music'),
        ('Physics', 'Physics'),
        ('Psychology', 'Psychology'),
        ('Other', 'Other'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='assessment')
    field = models.CharField(max_length=50, choices=FIELD_CHOICES)
    other_field = models.CharField(max_length=100, blank=True, null=True, help_text="If you selected 'Other', please specify.")
    
    gpa = models.FloatField()
    extracurricular_activities = models.IntegerField(default=0)
    internships = models.IntegerField(default=0)
    projects = models.IntegerField(default=0)
    leadership_positions = models.IntegerField(default=0)
    research_experience = models.IntegerField(default=0)
    coding_skills = models.IntegerField(default=0)
    communication_skills = models.IntegerField(default=0)
    problem_solving_skills = models.IntegerField(default=0)
    teamwork_skills = models.IntegerField(default=0)
    analytical_skills = models.IntegerField(default=0)
    presentation_skills = models.IntegerField(default=0)
    networking_skills = models.IntegerField(default=0)
    industry_certifications = models.IntegerField(default=0)
    recommended_career = models.CharField(max_length=255, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        if self.field == 'Other' and self.other_field:
            return f"{self.user.first_name} {self.user.last_name} - {self.other_field} Assessment"
        return f"{self.user.first_name} {self.user.last_name} - {self.field} Assessment"

    class Meta:
        ordering = ['-created_at']



class Job(models.Model):
    WORK_TYPE_CHOICES = [
        ('Full-time', 'Full-time'),
        ('Part-time', 'Part-time'),
        ('Contract', 'Contract'),
        ('Internship', 'Internship'),
        ('Remote', 'Remote'),
        ('Hybrid', 'Hybrid'),
    ]

    job_id = models.CharField(max_length=100, unique=True)
    title = models.CharField(max_length=255)
    company_name = models.CharField(max_length=255)
    description = models.TextField()
    skills_desc = models.TextField(blank=True, null=True)
    work_type = models.CharField(max_length=50, choices=WORK_TYPE_CHOICES)
    location = models.CharField(max_length=255)
    med_salary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    normalized_salary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    min_salary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    max_salary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    salary_currency = models.CharField(max_length=10, default='USD')
    salary_period = models.CharField(max_length=20, default='yearly')
    experience_level = models.CharField(max_length=50, blank=True, null=True)
    education_level = models.CharField(max_length=50, blank=True, null=True)
    industry = models.CharField(max_length=100, blank=True, null=True)
    company_size = models.CharField(max_length=50, blank=True, null=True)
    job_posting_date = models.DateField(null=True, blank=True)
    application_deadline = models.DateField(null=True, blank=True)
    application_url = models.URLField(max_length=500, blank=True, null=True)
    benefits = models.TextField(blank=True, null=True)
    requirements = models.TextField(blank=True, null=True)
    responsibilities = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} at {self.company_name}"

    class Meta:
        ordering = ['-created_at']

class ChatConversation(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="chat_conversations")
    title = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    metadata = models.JSONField(blank=True, null=True)

    def __str__(self):
        if self.title:
            return f"{self.user.email} - {self.title}"
        return f"{self.user.email} - Conversation {self.pk}"


class ChatMessage(models.Model):
    SENDER_CHOICES = [
        ("user", "User"),
        ("ai", "AI"),
        ("system", "System"),
    ]

    conversation = models.ForeignKey(ChatConversation, on_delete=models.CASCADE, related_name="messages")
    sender = models.CharField(max_length=10, choices=SENDER_CHOICES)
    text = models.TextField()
    tokens = models.IntegerField(null=True, blank=True)
    metadata = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    feedback = models.SmallIntegerField(null=True, blank=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.conversation} - {self.sender} @ {self.created_at}"

class Experience(models.Model):
    EXPERIENCE_TYPES = [
        ("Extracurricular", "Extracurricular"),
        ("Internship", "Internship"),
        ("Project", "Project"),
        ("Leadership", "Leadership"),
        ("Research", "Research"),
        ("Industry", "Industry"),
    ]

    assessment = models.ForeignKey(
        "Assessment",
        on_delete=models.CASCADE,
        related_name="experiences"
    )
    type = models.CharField(max_length=50, choices=EXPERIENCE_TYPES)
    title = models.CharField(max_length=255)
    organization = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)

    def __str__(self):
        return f"{self.type}: {self.title} ({self.organization or 'N/A'})"

    def save(self, *args, **kwargs):
        """Automatically update numeric counts in Assessment"""
        super().save(*args, **kwargs)

        assessment = self.assessment
        assessment.extracurricular_activities = assessment.experiences.filter(type="Extracurricular").count()
        assessment.internships = assessment.experiences.filter(type="Internship").count()
        assessment.projects = assessment.experiences.filter(type="Project").count()
        assessment.leadership_positions = assessment.experiences.filter(type="Leadership").count()
        assessment.research_experience = assessment.experiences.filter(type="Research").count()
        assessment.save(update_fields=[
            "extracurricular_activities",
            "internships",
            "projects",
            "leadership_positions",
            "research_experience",
        ])


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    bio = models.TextField(blank=True)
    education = models.CharField(max_length=255, blank=True)
    institution = models.CharField(max_length=255, blank=True)
    skills = models.JSONField(default=list, blank=True)
    interests = models.JSONField(default=list, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email}'s Profile"

