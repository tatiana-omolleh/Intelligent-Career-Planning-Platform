from django.conf import settings
from django.contrib.auth.tokens import PasswordResetTokenGenerator, default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.utils.timezone import now, timedelta
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

class ExpiringTokenGenerator(PasswordResetTokenGenerator):
    """Custom token generator that expires after 7 days or after first use"""

    def _make_hash_value(self, user, timestamp):
        return str(user.pk) + str(timestamp) + str(user.is_active)

    def check_token(self, user, token):
        """Check if token is valid, not expired, and hasn't been used"""
        if not super().check_token(user, token):
            return False  # Invalid token

        # Ensure token is within 7 days
        try:
            creation_time = int(token.split('-')[-1])  # Extract timestamp
            if now().timestamp() > creation_time + timedelta(days=7).total_seconds():
                return False  # Token expired
        except ValueError:
            return False  # Invalid token format

        return True  # Token is valid

expiring_token_generator = ExpiringTokenGenerator()


def generate_verification_token(user):
    """Generate and store a secure token for email verification"""
    if not user.email_verification_token or user.is_verification_token_expired():
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        
        # Save token & timestamp in the user model
        user.email_verification_token = token
        user.email_verification_sent_at = now()
        user.save(update_fields=["email_verification_token", "email_verification_sent_at"])
    else:
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = user.email_verification_token  # Reuse existing token

    return uid, token

def send_verification_email(user, uid, token):
    """Send a styled HTML verification email"""

    verification_url = f"{settings.FRONTEND_URL}/verify-email/{uid}/{token}/"  # ✅ Redirects to frontend

    subject = "Verify Your Email – KenSAP Careers"
    
    # ✅ Render HTML email template
    html_message = render_to_string("emails/verify_email.html", {"user": user, "verification_url": verification_url})
    plain_message = strip_tags(html_message)  # Convert HTML to plain text fallback

    email = EmailMultiAlternatives(subject, plain_message, settings.EMAIL_HOST_USER, [user.email])
    email.attach_alternative(html_message, "text/html")  # ✅ Attach HTML version
    email.send()

def generate_reset_token(user):
    """Generate a password reset token and UID."""
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    return uid, token

def verify_reset_token(uid, token, user_model):
    """Verify the reset token and return the user."""
    try:
        uid = force_str(urlsafe_base64_decode(uid))
        user = user_model.objects.get(pk=uid)

        if default_token_generator.check_token(user, token):
            return user
    except (user_model.DoesNotExist, ValueError, TypeError, OverflowError):
        return None

    return None
