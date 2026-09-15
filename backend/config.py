import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(dotenv_path=BASE_DIR / ".env")

# Email Settings
GMAIL_SENDER = os.getenv("GMAIL_SENDER", "")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")
EMERGENCY_RECIPIENT_EMAIL = os.getenv("EMERGENCY_RECIPIENT_EMAIL", "")

# Helpline Numbers
EMERGENCY_HELPLINE = os.getenv("EMERGENCY_HELPLINE", "112")
SDMA_HELPLINE = os.getenv("SDMA_HELPLINE", "1070")

# Twilio SMS Settings
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "")
EMERGENCY_PHONE_RECIPIENT = os.getenv("EMERGENCY_PHONE_RECIPIENT", "")