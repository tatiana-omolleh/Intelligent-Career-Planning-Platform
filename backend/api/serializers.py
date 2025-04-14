import logging
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.hashers import make_password
from .models import JobInternshipAssignedTo, Partner, PartnerInteraction, User, University, JobInternship, InternshipApplication
from django.utils.timezone import now
from .utils import generate_verification_token, send_verification_email
from django.core.mail import send_mail, EmailMultiAlternatives
from django.urls import reverse
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags


logger = logging.getLogger(__name__)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # Validate user credentials
        data = super().validate(attrs)

        # Log user status for debugging
        logger.info(f"User {self.user.email} is_active={self.user.is_active}")

        # Check if user is unverified (inactive)
        if not self.user.is_active:
            uid, token = generate_verification_token(self.user)
            send_verification_email(self.user, uid, token)
            raise Exception("Please verify your email before logging in.")

        return data

class RegisterUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'password', 'phone', 'role']

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])  # Hash password
        user = User.objects.create(**validated_data)
        user.is_active = False  # Make user inactive until email verification
        user.save()

        # Generate verification token
        uid, token = generate_verification_token(user)

        # Use frontend URL for the verification link
        verification_url = f"{settings.FRONTEND_URL}/verify-email/{uid}/{token}/"

        # ✅ Render HTML email template
        subject = "Verify Your Email – KenSAP Careers"
        html_message = render_to_string("emails/verify_email.html", {"user": user, "verification_url": verification_url})
        plain_message = strip_tags(html_message)  # Create a plain text fallback

        # ✅ Send email with both HTML and plain text
        email = EmailMultiAlternatives(subject, plain_message, settings.EMAIL_HOST_USER, [user.email])
        email.attach_alternative(html_message, "text/html")
        email.send()

        return user

class ProfileUpdateSerializer(serializers.ModelSerializer):
    graduation_month = serializers.IntegerField(required=False, min_value=1, max_value=12)
    graduation_year = serializers.IntegerField(required=False)
    university = serializers.CharField(required=False, allow_blank=True)  # Ensure university is a text field

    class Meta:
        model = User
        fields = [
            "highschool", "kensap_year", "gpa", "university", "major", "minor",
            "graduation_month", "graduation_year", "company", "city"
        ]
 
    def validate(self, data):
        """Ensure role-based validation rules."""
        user = self.instance

        if user.role == "KenSAP":
            # forbidden_fields = ["gpa", "company"]
            # for field in forbidden_fields:
            #     if field in data and data[field]:
            #         raise serializers.ValidationError(f"KenSAP students cannot update {field}.")
            if not data.get("highschool") or not data.get("kensap_year"):
                raise serializers.ValidationError("KenSAP students must provide a highschool and Kensap year.")

        if user.role == "Undergrad":
            # if "gpa" not in data or not data["gpa"]:
            #     raise serializers.ValidationError("Undergraduates must have a GPA.")
            if "university" not in data or not data["university"]:  # Correctly check for a university name
                raise serializers.ValidationError("Undergraduates must provide a university name.")
            # if "graduation_year" not in data or not data["graduation_year"]:
            #     raise serializers.ValidationError("Undergraduates must provide a graduation year.")
            # if "graduation_month" not in data or not data["graduation_month"]:
            #     raise serializers.ValidationError("Undergraduates must provide a graduation month.")

        if user.role == "Alumni":
            if "company" not in data or not data["company"]:
                raise serializers.ValidationError("Alumni must have a company field.")

        return data

    def update(self, instance, validated_data):
    # Ensures university is updated as a simple text field and not overwritten as null.
  
     if "university" in validated_data:
        university_value = validated_data["university"]
        if university_value is not None:  # Ensure we don't accidentally set it to null
            instance.university = university_value

     instance = super().update(instance, validated_data)
     instance.update_role()  # Ensure role transition is checked
     return instance

class JobInternshipSerializer(serializers.ModelSerializer):
    is_expired = serializers.ReadOnlyField()  # Read-only field to check expiry

    class Meta:
        model = JobInternship
        fields = "__all__"

class InternshipApplicationSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source="student.first_name")
    internship_title = serializers.ReadOnlyField(source="internship.title")

    class Meta:
        model = InternshipApplication
        fields = ["id", "student_name", "internship_title", "status", "applied_on", "resume_link", "resume_file", "cover_letter", "internship"]
        read_only_fields = ["status", "student_name", "applied_on"]  # Student cannot modify these fields


class AssignInternshipSerializer(serializers.ModelSerializer):
    assigned_student = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.exclude(role="CareerMember"),  # Only Undergrad students
        required=False,  # Allow unassigned internships
        allow_null=True,
        write_only=True
    )

    class Meta:
        model = JobInternship
        fields = ["title", "description", "company", "location", "deadline", "assigned_student"]

    def create(self, validated_data):
        assigned_student = validated_data.pop("assigned_student", None)  # ✅ Extract assigned student if provided
        internship = JobInternship.objects.create(**validated_data)

        # ✅ Assign student if provided
        if assigned_student:
            JobInternshipAssignedTo.objects.create(user=assigned_student, jobinternship=internship)

        return internship
    
class PartnerSerializer(serializers.ModelSerializer):
    relationship_owner = serializers.ReadOnlyField(source="relationship_owner.id")

    class Meta:
        model = Partner
        fields = "__all__"  # Include all fields

    def update(self, instance, validated_data):
        """Allows updating category, lead_type, and status."""
        for field in ["category", "lead_type", "status"]:
            if field in validated_data:
                setattr(instance, field, validated_data[field])

        instance.save()
        return instance

class PartnerInteractionSerializer(serializers.ModelSerializer):
    career_member_name = serializers.ReadOnlyField(source="career_member.first_name")  # ✅ Show career member's name

    class Meta:
        model = PartnerInteraction
        fields = ["interaction_id", "partner", "career_member", "career_member_name", "interaction_type", "notes", "interaction_date"]
        read_only_fields = ["career_member"]  # ✅ Prevents frontend from needing to send this

    def create(self, validated_data):
        """Ensure the logged-in user is assigned as the career_member."""
        request = self.context["request"]  # ✅ Get the request context

        validated_data["career_member"] = request.user  # ✅ Assign the logged-in user
        return super().create(validated_data)


