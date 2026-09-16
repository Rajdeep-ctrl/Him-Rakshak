import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from config import (
    EMERGENCY_HELPLINE,
    EMERGENCY_RECIPIENT_EMAIL,
    GMAIL_APP_PASSWORD,
    GMAIL_SENDER,
    SDMA_HELPLINE,
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER,
    EMERGENCY_PHONE_RECIPIENT,
)

SMS_TEMPLATES = {
    "en": "[HIM-RAKSHAK] {severity} ALERT: Landslide hazard detected in {zone}, {district}. Evacuate immediately. Helpline: {helpline}",
    "hi": "[हिम-रक्षक] {severity} चेतावनी: {zone}, {district} में भूस्खलन का खतरा। सुरक्षित स्थान पर जाएं। हेल्पलाइन: {helpline}",
    "as": "[হিম-ৰক্ষক] {severity} সতৰ্কবাণী: {zone}, {district} অঞ্চলত ভূমিস্খলনৰ আশংকা। সুৰক্ষিত স্থানলৈ যাওক। হেল্পলাইন: {helpline}",
}


def send_single_sms(phone: str, body: str) -> dict:
    """Sends SMS via Twilio API if credentials exist; otherwise simulates."""
    target_phone = EMERGENCY_PHONE_RECIPIENT or phone

    # Ensure international '+' format
    if target_phone and not target_phone.startswith("+"):
        target_phone = f"+{target_phone}"

    if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER:
        try:
            from twilio.rest import Client
            client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
            message = client.messages.create(
                body=body,
                from_=TWILIO_PHONE_NUMBER,
                to=target_phone
            )
            print(f"📱 [TWILIO SMS SENT] To: {target_phone} | SID: {message.sid}")
            return {"status": "delivered", "sid": message.sid, "recipient": target_phone}
        except Exception as exc:
            print(f"⚠️ [TWILIO ERROR] {exc}. Falling back to simulation.")

    # Simulation fallback
    clean_digits = "".join(filter(str.isdigit, str(target_phone)))[-10:]
    print(f"📱 [SMS SIMULATION] To: +91{clean_digits} | Message: {body}")
    return {"status": "simulated", "recipient": f"+91{clean_digits}", "body": body}


def broadcast_regional_sms(contacts: list[dict], alert: dict) -> list[dict]:
    zone = alert.get("location") or alert.get("zone", "Vulnerable Hill Track")
    district = alert.get("district", "NER Sector")
    severity = str(alert.get("severity", "HIGH")).upper()

    results = []
    recipients = contacts if contacts else [{"phone": EMERGENCY_PHONE_RECIPIENT, "language_pref": "en"}]

    for contact in recipients:
        phone = contact.get("phone") or EMERGENCY_PHONE_RECIPIENT
        lang = contact.get("language_pref", "en")
        template = SMS_TEMPLATES.get(lang, SMS_TEMPLATES["en"])

        message = template.format(
            severity=severity,
            zone=zone,
            district=district,
            helpline=f"{EMERGENCY_HELPLINE} / {SDMA_HELPLINE}",
        )
        results.append(send_single_sms(phone, message))

    return results


def send_emergency_email(subject: str, message_body: str, recipient: str = None) -> dict:
    recipient = recipient or EMERGENCY_RECIPIENT_EMAIL

    if not GMAIL_SENDER or not GMAIL_APP_PASSWORD or not recipient:
        print("⚠️ [EMAIL NOTICE] Gmail credentials or recipient not configured.")
        return {"status": "skipped", "reason": "credentials_missing"}

    try:
        msg = MIMEMultipart()
        msg["From"] = f"Him-Rakshak Early Warning <{GMAIL_SENDER}>"
        msg["To"] = recipient
        msg["Subject"] = f"🚨 RED ALERT: {subject}"

        html_content = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; border-left: 6px solid #d9534f; background-color: #fff5f5;">
          <h2 style="color: #d9534f; margin: 0 0 12px 0;">Him-Rakshak Landslide Alert</h2>
          <p style="font-size: 15px; line-height: 1.5; color: #222;">{message_body}</p>
          <hr style="border: 0; border-top: 1px solid #ddd; margin: 16px 0;">
          <small style="color: #666;">Automated Emergency Dispatch System | Helplines: 112 / 1070</small>
        </div>
        """
        msg.attach(MIMEText(html_content, "html"))

        password = GMAIL_APP_PASSWORD.replace(" ", "")
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(GMAIL_SENDER, password)
            server.send_message(msg)

        print(f"✅ [EMAIL DELIVERED] Emergency notification sent to {recipient}")
        return {"status": "delivered", "recipient": recipient}
    except Exception as exc:
        print(f"❌ [EMAIL ERROR] Failed to send email: {exc}")
        return {"status": "failed", "error": str(exc)}