from django.db import models
from django.utils.timezone import now
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
import calendar


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)
    
class University(models.Model):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name

class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('KenSAP', 'KenSAP Student'),
        ('Undergrad', 'Undergraduate'),
        ('Alumni', 'Alumni'),
        ('CareerMember', 'Career Member'),
    ]

    user_id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='KenSAP')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    # Role-Specific Fields
    highschool = models.CharField(max_length=255, blank=True, null=True)
    kensap_year = models.IntegerField(blank=True, null=True)
    gpa = models.DecimalField(max_digits=3, decimal_places=2, blank=True, null=True)
    university = models.CharField(max_length=255, blank=True, null=True)
    major = models.CharField(max_length=255, blank=True, null=True)
    minor = models.CharField(max_length=255, blank=True, null=True)
    graduation_month = models.IntegerField(blank=True, null=True)  # Store month (1-12)
    graduation_year = models.IntegerField(blank=True, null=True)
    company = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=255, blank=True, null=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'role']

    @property
    def id(self):
        return self.user_id

    def update_role(self):
        """Ensure role updates based on graduation status."""
        current_year = now().year
        current_month = now().month

        if self.role == "KenSAP" and self.university:
            self.transition_to("Undergrad")
        elif self.role == "Undergrad":
            if self.graduation_year and self.graduation_month:
                # Check if graduation date has passed
                if (self.graduation_year < current_year) or \
                   (self.graduation_year == current_year and self.graduation_month <= current_month):
                    self.transition_to("Alumni")

    def transition_to(self, new_role):
        """Helper method to transition roles."""
        if self.role != new_role:  # Avoid unnecessary transitions
            RoleTransition.objects.create(user=self, old_role=self.role, new_role=new_role)
            self.role = new_role
            self.save()

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.role})"

class RoleTransition(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    old_role = models.CharField(max_length=20, choices=User.ROLE_CHOICES)
    new_role = models.CharField(max_length=20, choices=User.ROLE_CHOICES)
    transition_date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name}: {self.old_role} → {self.new_role}"


# === PARTNERS ===
class Partner(models.Model):
    STATUS_CHOICES = [
        ("contacted", "Contacted"),
        ("not_contacted", "Not Contacted"),
        ("closed", "Closed"),
        ("follow_up", "Follow-Up"),
        ("alan_to_follow", "Alan to Follow Up"),
    ]

    CATEGORY_CHOICES = [
        ("pre_university", "Pre-University Internships"),
        ("summer_internships", "Summer Internships"),
        ("full_time", "Full-Time Job Placements"),
        ("fundraising", "Fundraising Dinner"),
        ("exploratory", "Exploratory"),
    ]

    LEAD_TYPE_CHOICES = [
        ("cold", "Cold"),
        ("warm", "Warm"),
        ("hot", "Hot"),
    ]

    partner_id = models.AutoField(primary_key=True)
    partner_name = models.CharField(max_length=255)
    relationship_owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, blank=True, null=True)
    lead_type = models.CharField(max_length=50, choices=LEAD_TYPE_CHOICES, blank=True, null=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="not_contacted")
    last_outreach_date = models.DateField(blank=True, null=True)
    contact_person = models.CharField(max_length=255, blank=True, null=True)
    position = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    city = models.CharField(max_length=255, blank=True, null=True)
    country = models.CharField(max_length=255, blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    linkedin = models.URLField(blank=True, null=True)
    connection = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.partner_name


# === PARTNER INTERACTIONS ===
class PartnerInteraction(models.Model):
    interaction_id = models.AutoField(primary_key=True)
    partner = models.ForeignKey(Partner, on_delete=models.CASCADE)
    career_member = models.ForeignKey(User, on_delete=models.CASCADE)
    interaction_date = models.DateField()
    interaction_type = models.CharField(max_length=255)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Interaction with {self.partner.partner_name} on {self.interaction_date}"


# === JOB & INTERNSHIPS ===
class JobInternship(models.Model):
    TYPE_CHOICES = [
        ("Internship", "Internship"),
        ("Job", "Job"),
    ]

    internship_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    description = models.TextField()
    company = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    job_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default="Internship")
    deadline = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        """Check if the internship deadline has passed."""
        return self.deadline < now().date()

    def __str__(self):
        return f"{self.title} - {self.company}"


# === TRACKING ASSIGNMENTS (REPLACES M2M FIELD) ===
class JobInternshipAssignedTo(models.Model):
    """Tracks which users are assigned to internships."""
    jobinternship = models.ForeignKey(JobInternship, on_delete=models.CASCADE)
    user = models.ForeignKey("User", on_delete=models.CASCADE)

    class Meta:
        unique_together = ("jobinternship", "user")  # Prevent duplicate assignments

    def __str__(self):
        return f"{self.user.first_name} assigned to {self.jobinternship.title}"


# === TRACKING STUDENT APPLICATIONS ===
class InternshipApplication(models.Model):
    STATUS_CHOICES = [
        ("Applied", "Applied"),
        ("Under Review", "Under Review"),
        ("Interview", "Interview"),
        ("Accepted", "Accepted"),
        ("Rejected", "Rejected"),
    ]

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="applications")
    internship = models.ForeignKey(JobInternship, on_delete=models.CASCADE, related_name="applications")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Applied")
    applied_on = models.DateTimeField(auto_now_add=True)
    resume_link = models.URLField(blank=True, null=True)
    resume_file = models.FileField(upload_to="resumes/", blank=True, null=True)
    cover_letter = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ("student", "internship")  # Prevent duplicate applications

    def __str__(self):
        return f"{self.student.first_name} - {self.internship.title} ({self.status})"

# === EVENTS CALENDAR ===
class EventCalendar(models.Model):
    event_id = models.AutoField(primary_key=True)
    event_date = models.DateField()
    event_title = models.CharField(max_length=255)
    event_description = models.TextField()
    career_member = models.ForeignKey(User, on_delete=models.CASCADE)
    join_link = models.URLField(blank=True, null=True)

    def __str__(self):
        return self.event_title


# === MEETINGS ===
class Meeting(models.Model):
    meeting_id = models.AutoField(primary_key=True)
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="meetings")
    career_member = models.ForeignKey(User, on_delete=models.CASCADE, related_name="career_meetings")
    meeting_date = models.DateTimeField()
    meeting_notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Meeting on {self.meeting_date} with {self.student.first_name}"


# === E-LEARNING MODULES & PROGRESS ===
class ELearningModule(models.Model):
    module_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    description = models.TextField()

    def __str__(self):
        return self.title


class ELearningContent(models.Model):
    content_id = models.AutoField(primary_key=True)
    module = models.ForeignKey(ELearningModule, on_delete=models.CASCADE)
    description = models.TextField()
    content_link = models.URLField()
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Content for {self.module.title}"


class ProgressTable(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    module = models.ForeignKey(ELearningModule, on_delete=models.CASCADE)
    percentage = models.FloatField(default=0)
    completion_status = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.student.first_name} - {self.module.title}"


