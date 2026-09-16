"""
Him-Rakshak - SMS Alert Engine (Twilio)
------------------------------------------
Sends a real SMS when a location's risk level is High or Critical.

Setup required (see README/setup steps):
  1. Twilio account (free trial) - get Account SID, Auth Token, Phone Number
  2. VERIFY the recipient's phone number in Twilio Console (trial accounts
     can only send SMS to verified numbers)
  3. Add to database/.env:
       TWILIO_ACCOUNT_SID=...
       TWILIO_AUTH_TOKEN=...
       TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from twilio.rest import Client

# Load credentials from database/.env (same file used for DATABASE_URL)
ENV_PATH = Path(__file__).resolve().parent.parent / "database" / ".env"
load_dotenv(dotenv_path=ENV_PATH)

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")


def send_sms_alert(to_phone_number: str, location_name: str, risk_level: str,
                    confidence: float = None):
    """
    Sends a real SMS alert via Twilio.

    `to_phone_number` must be in E.164 format, e.g. "+919876543210"
    and MUST be a Twilio-verified number if using a trial account.

    Returns (success: bool, message: str)
    """
    if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER]):
        return False, "Twilio credentials not configured in database/.env"

    confidence_text = f" ({int(confidence*100)}% confidence)" if confidence else ""
    message_body = (
        f"HIM-RAKSHAK ALERT: {risk_level.upper()} landslide risk detected "
        f"near {location_name}{confidence_text}. Please take precautionary "
        f"measures and avoid travel through vulnerable slopes/roads."
    )

    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            body=message_body,
            from_=TWILIO_PHONE_NUMBER,
            to=to_phone_number,
        )
        return True, f"SMS sent successfully (SID: {message.sid})"
    except Exception as e:
        return False, f"SMS failed: {e}"


def should_trigger_alert(risk_level: str) -> bool:
    """Only High/Critical risk levels trigger an SMS alert."""
    return risk_level.lower() in ["high", "critical"]


if __name__ == "__main__":
    print("Testing SMS alert...\n")
    print("⚠️ Replace 'YOUR_VERIFIED_NUMBER' below with your actual verified number first!\n")

    test_number = "+91XXXXXXXXXX"  # <-- put your verified number here to test

    success, msg = send_sms_alert(
        to_phone_number=test_number,
        location_name="Shillong, Meghalaya",
        risk_level="Critical",
        confidence=0.85
    )
    print(f"Success: {success}")
    print(f"Message: {msg}")