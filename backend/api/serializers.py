from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import JobInternshipAssignedTo, User, University, JobInternship, InternshipApplication

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'

class RegisterUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'password', 'phone', 'role']

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])  # Hash password
        return User.objects.create(**validated_data)

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

