"""
Email service for sending password reset emails and other notifications
"""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings
import os

logger = logging.getLogger(__name__)


class EmailService:
    """Email service for sending various types of emails"""
    
    def __init__(self):
        self.smtp_servers = [
            getattr(settings, 'SMTP_SERVER', 'smtppro.zoho.com'),
            'smtp.zoho.com',  # Fallback
            'smtppro.zoho.com'  # Alternative for custom domains
        ]
        self.smtp_port = getattr(settings, 'SMTP_PORT', 587)
        self.smtp_username = getattr(settings, 'SMTP_USERNAME', None)
        self.smtp_password = getattr(settings, 'SMTP_PASSWORD', None)
        self.from_email = getattr(settings, 'FROM_EMAIL', self.smtp_username)
        self.frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')

    def _try_smtp_connection(self, smtp_server: str) -> bool:
        """Try to connect and authenticate with a specific SMTP server"""
        try:
            logger.info(f"Trying SMTP server: {smtp_server}:{self.smtp_port}")
            with smtplib.SMTP(smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                logger.info(f"✅ Successfully authenticated with {smtp_server}")
                return True
        except smtplib.SMTPAuthenticationError as e:
            logger.warning(f"❌ Authentication failed for {smtp_server}: {e}")
            return False
        except Exception as e:
            logger.warning(f"❌ Connection failed for {smtp_server}: {e}")
            return False

    async def send_password_reset_email(self, to_email: str, reset_token: str) -> bool:
        """Send password reset email"""
        try:
            reset_url = f"{self.frontend_url}/reset-password?token={reset_token}"
            
            subject = "Reset Your Mindmarks Password"
            
            # HTML email template
            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Reset Your Password</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Password Reset Request</h1>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
                    <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
                    
                    <p style="font-size: 16px; margin-bottom: 20px;">
                        We received a request to reset your password for your Mindmarks account. 
                        If you didn't make this request, you can safely ignore this email.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_url}" 
                           style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
                            Reset Your Password
                        </a>
                    </div>
                    
                    <p style="font-size: 14px; color: #6c757d; margin-bottom: 10px;">
                        This link will expire in <strong>1 hour</strong> for security reasons.
                    </p>
                    
                    <p style="font-size: 14px; color: #6c757d; margin-bottom: 20px;">
                        If the button doesn't work, copy and paste this link into your browser:
                    </p>
                    
                    <div style="background: #e9ecef; padding: 10px; border-radius: 5px; word-break: break-all; font-family: monospace; font-size: 12px;">
                        {reset_url}
                    </div>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e9ecef;">
                    
                    <p style="font-size: 14px; color: #6c757d; margin: 0;">
                        Best regards,<br>
                        The Mindmarks Team
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #6c757d;">
                    <p>© 2024 Mindmarks. All rights reserved.</p>
                </div>
            </body>
            </html>
            """
            
            # Plain text fallback
            text_body = f"""
            Password Reset Request
            
            Hello,
            
            We received a request to reset your password for your Mindmarks account.
            If you didn't make this request, you can safely ignore this email.
            
            To reset your password, click the following link:
            {reset_url}
            
            This link will expire in 1 hour for security reasons.
            
            Best regards,
            The Mindmarks Team
            """
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.from_email
            msg['To'] = to_email
            
            # Add both plain text and HTML versions
            text_part = MIMEText(text_body, 'plain')
            html_part = MIMEText(html_body, 'html')
            
            msg.attach(text_part)
            msg.attach(html_part)
            
            # Send email
            if not self.smtp_username or not self.smtp_password:
                logger.warning(f"SMTP credentials not configured. Password reset email for {to_email} would be sent.")
                logger.info(f"Reset URL: {reset_url}")
                return True  # Return True in development mode
            
            # Development mode: Log reset URL if SMTP fails
            development_mode = os.getenv('DEVELOPMENT_MODE', 'false').lower() == 'true'
            
            # Try multiple SMTP servers
            for smtp_server in self.smtp_servers:
                try:
                    with smtplib.SMTP(smtp_server, self.smtp_port) as server:
                        server.starttls()
                        server.login(self.smtp_username, self.smtp_password)
                        server.send_message(msg)
                    
                    logger.info(f"Password reset email sent to {to_email} via {smtp_server}")
                    return True
                    
                except smtplib.SMTPAuthenticationError as e:
                    logger.warning(f"Authentication failed for {smtp_server}: {e}")
                    continue
                except Exception as e:
                    logger.warning(f"Failed to send via {smtp_server}: {e}")
                    continue
            
            # If all servers failed, check if we should use development mode
            if development_mode:
                logger.warning(f"SMTP failed, but development mode enabled. Logging reset URL instead.")
                logger.warning(f"🔗 PASSWORD RESET URL for {to_email}: {reset_url}")
                print(f"\n🔗 PASSWORD RESET URL for {to_email}:")
                print(f"   {reset_url}")
                print("   Copy this URL and open it in your browser to reset the password.\n")
                return True
            
            # If all servers failed
            logger.error(f"Failed to send email via all SMTP servers: {self.smtp_servers}")
            return False
            
        except Exception as e:
            logger.error(f"Failed to send password reset email to {to_email}: {str(e)}")
            return False


# Create singleton instance
email_service = EmailService() 