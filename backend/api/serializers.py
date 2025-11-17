# api/serializers.py
from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from django.contrib.auth import authenticate
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import ChatConversation, ChatMessage, Profile, User, Assessment, Job
from .utils import generate_verification_token, send_verification_email
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'


class RegisterUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'password', 'phone', 'role']
        extra_kwargs = {
            'phone': {'required': False, 'allow_blank': True, 'allow_null': True},
            'role': {'required': False},
        }

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        validated_data.setdefault('role', User.ROLE_CHOICES[0][0])
        if not validated_data.get('phone'):
            validated_data['phone'] = None
        user = User.objects.create(**validated_data)
        user.is_active = False
        user.save()

        uid, token = generate_verification_token(user)
        verification_url = f"{settings.FRONTEND_URL}/verify-email/{uid}/{token}/"

        subject = "Verify Your Email – Kazìni"
        html_message = render_to_string("emails/verify_email.html", {"user": user, "verification_url": verification_url})
        plain_message = strip_tags(html_message)

        email = EmailMultiAlternatives(subject, plain_message, settings.EMAIL_HOST_USER, [user.email])
        email.attach_alternative(html_message, "text/html")
        email.send()

        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        user = authenticate(username=attrs["email"], password=attrs["password"])
        if user is None:
            raise serializers.ValidationError("Invalid email or password.")
        if not user.is_active:
            raise serializers.ValidationError("Please verify your email before logging in.")
        
        data = super().validate(attrs)

        has_assessment = Assessment.objects.filter(user=user).exists()
        
        # Add user data to the response
        data['user'] = {
            'id': user.user_id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'phone': user.phone,
            'has_assessment': has_assessment,
        }
        
        return data


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'phone']
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
            'email': {'required': False},
            'phone': {'required': False, 'allow_blank': True},
        }

    def validate_email(self, value):
        user = self.instance
        if value and User.objects.exclude(pk=user.pk).filter(email__iexact=value).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value


class AssessmentSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = Assessment
        fields = [
            'id', 'user', 'field', 'gpa', 'extracurricular_activities', 
            'internships', 'projects', 'leadership_positions', 'research_experience',
            'coding_skills', 'communication_skills', 'problem_solving_skills',
            'teamwork_skills', 'analytical_skills', 'presentation_skills',
            'networking_skills', 'industry_certifications', 'recommended_career',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'recommended_career']

    def validate_gpa(self, value):
        if value < 0.0 or value > 4.0:
            raise serializers.ValidationError("GPA must be between 0.0 and 4.0")
        return value

    def validate(self, data):
        # Validate that skill scores are between 0 and 10
        skill_fields = [
            'extracurricular_activities', 'internships', 'projects', 'leadership_positions',
            'research_experience', 'coding_skills', 'communication_skills',
            'problem_solving_skills', 'teamwork_skills', 'analytical_skills',
            'presentation_skills', 'networking_skills', 'industry_certifications'
        ]
        
        for field in skill_fields:
            if field in data and (data[field] < 0 or data[field] > 10):
                raise serializers.ValidationError(f"{field.replace('_', ' ').title()} must be between 0 and 10")
        
        return data


class AssessmentCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assessment
        fields = [
            'field', 'gpa', 'extracurricular_activities', 'internships', 'projects',
            'leadership_positions', 'research_experience', 'coding_skills',
            'communication_skills', 'problem_solving_skills', 'teamwork_skills',
            'analytical_skills', 'presentation_skills', 'networking_skills',
            'industry_certifications'
        ]

    def validate_gpa(self, value):
        if value < 0.0 or value > 4.0:
            raise serializers.ValidationError("GPA must be between 0.0 and 4.0")
        return value

    def validate(self, data):
        # Validate that skill scores are between 0 and 10
        skill_fields = [
            'extracurricular_activities', 'internships', 'projects', 'leadership_positions',
            'research_experience', 'coding_skills', 'communication_skills',
            'problem_solving_skills', 'teamwork_skills', 'analytical_skills',
            'presentation_skills', 'networking_skills', 'industry_certifications'
        ]
        
        for field in skill_fields:
            if field in data and (data[field] < 0 or data[field] > 10):
                raise serializers.ValidationError(f"{field.replace('_', ' ').title()} must be between 0 and 10")
        
        return data


class JobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = [
            'id', 'job_id', 'title', 'company_name', 'description', 'skills_desc',
            'work_type', 'location', 'med_salary', 'normalized_salary', 'min_salary',
            'max_salary', 'salary_currency', 'salary_period', 'experience_level',
            'education_level', 'industry', 'company_size', 'job_posting_date',
            'application_deadline', 'benefits', 'requirements', 'responsibilities',
            'is_active', 'created_at', 'updated_at', 'application_url'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class JobListSerializer(serializers.ModelSerializer):
    """Simplified serializer for job listings"""
    class Meta:
        model = Job
        fields = [
            'id', 'job_id', 'title', 'company_name', 'work_type', 'location',
            'med_salary', 'min_salary', 'max_salary', 'salary_currency',
            'experience_level', 'industry', 'job_posting_date', 'is_active'
        ]

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'sender', 'text', 'tokens', 'metadata', 'created_at', 'feedback']

class ChatConversationSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()
    messages_count = serializers.IntegerField(source='messages.count', read_only=True)

    class Meta:
        model = ChatConversation
        fields = ['id', 'title', 'created_at', 'last_activity', 'messages_count', 'last_message', 'metadata']

    def get_last_message(self, obj):
        msg = obj.messages.order_by('-created_at').first()
        if not msg:
            return None
        return {
            "sender": msg.sender,
            "text": (msg.text[:200] + '...') if len(msg.text) > 200 else msg.text,
            "created_at": msg.created_at,
        }

from .models import Experience

class ExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Experience
        fields = [
            "id",
            "type",
            "title",
            "organization",
            "description",
            "start_date",
            "end_date",
        ]

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ["bio", "education", "institution", "skills", "interests"]

