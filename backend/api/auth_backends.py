from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from .utils import generate_verification_token, send_verification_email

User = get_user_model()

class EmailVerificationBackend(ModelBackend):
    """Prevents unverified users from logging in and sends them a verification email."""

    def authenticate(self, request, username=None, password=None, **kwargs):
        """Override Django's default authentication to check email verification."""
        try:
            user = User.objects.get(email=username)
        except User.DoesNotExist:
            return None

        # Block login if email is unverified
        if not user.is_active:
            uid, token = generate_verification_token(user)
            send_verification_email(user, uid, token)  # Resend email
            return None  # Prevent login

        # Allow login if password is correct
        if user.check_password(password):
            return user

        return None
