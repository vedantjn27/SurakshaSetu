import json
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

DICTIONARY = {
    "kn": {
        "ok": "ಸರಿ",
        "Internal server error. Check logs.": "ಆಂತರಿಕ ಸರ್ವರ್ ದೋಷ. ಲಾಗ್ಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
        "merge": "ವಿಲೀನಗೊಳಿಸಿ",
        "split": "ವಿಭಜಿಸಿ",
        "assigned": "ನಿಯೋಜಿಸಲಾಗಿದೆ",
        "rejected": "ತಿರಸ್ಕರಿಸಲಾಗಿದೆ",
        "escalated": "ಉಲ್ಬಣಗೊಂಡಿದೆ",
        "active_ubid": "ಸಕ್ರಿಯ_ಯುಬಿಐಡಿ",
        "Active": "ಸಕ್ರಿಯ",
        "Dormant": "ನಿಷ್ಕ್ರಿಯ",
        "Closed": "ಮುಚ್ಚಲಾಗಿದೆ",
        "Not Found": "ಕಂಡುಬಂದಿಲ್ಲ",
        "Unauthorized": "ಅನಧಿಕೃತ",
        "Not authenticated": "ದೃಢೀಕರಿಸಲಾಗಿಲ್ಲ",
        "Validation Error": "ಮೌಲ್ಯೀಕರಣ ದೋಷ",
        "Review item not found or already resolved": "ಪರಿಶೀಲನಾ ಐಟಂ ಕಂಡುಬಂದಿಲ್ಲ ಅಥವಾ ಈಗಾಗಲೇ ಪರಿಹರಿಸಲಾಗಿದೆ",
        "Source records not found": "ಮೂಲ ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ",
        "Orphan event not found": "ಅನಾಥ ಈವೆಂಟ್ ಕಂಡುಬಂದಿಲ್ಲ",
        "Item not found": "ಐಟಂ ಕಂಡುಬಂದಿಲ್ಲ",
    },
    "hi": {
        "ok": "ठीक है",
        "Internal server error. Check logs.": "आंतरिक सर्वर त्रुटि। लॉग की जाँच करें।",
        "merge": "विलय",
        "split": "विभाजित करें",
        "assigned": "सौंपा गया",
        "rejected": "अस्वीकार कर दिया",
        "escalated": "बढ़ाया गया",
        "active_ubid": "सक्रिय_यूबीआईडी",
        "Active": "सक्रिय",
        "Dormant": "सुप्त",
        "Closed": "बंद",
        "Not Found": "नहीं मिला",
        "Unauthorized": "अनधिकृत",
        "Not authenticated": "प्रमाणीकृत नहीं",
        "Validation Error": "सत्यापन त्रुटि",
        "Review item not found or already resolved": "समीक्षा आइटम नहीं मिला या पहले ही हल हो गया है",
        "Source records not found": "स्रोत रिकॉर्ड नहीं मिले",
        "Orphan event not found": "अनाथ ईवेंट नहीं मिला",
        "Item not found": "आइटम नहीं मिला",
    }
}

class I18nMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        lang = request.headers.get("Accept-Language", "en")
        
        target_lang = None
        if lang.startswith("hi"):
            target_lang = "hi"
        elif lang.startswith("kn"):
            target_lang = "kn"
            
        if not target_lang:
            return response
            
        content_type = response.headers.get("content-type", "")
        if "application/json" in content_type:
            # Consume the response body
            body = b""
            async for chunk in response.body_iterator:
                body += chunk
                
            try:
                data = json.loads(body)
                translated_data = self.translate_json(data, DICTIONARY[target_lang])
                new_body = json.dumps(translated_data).encode("utf-8")
                
                headers = dict(response.headers)
                # Remove content-length as it will change
                headers.pop("content-length", None)
                
                return Response(
                    content=new_body,
                    status_code=response.status_code,
                    headers=headers,
                    media_type="application/json"
                )
            except Exception:
                # If json parsing/translating fails, return the original (re-wrapped)
                headers = dict(response.headers)
                headers.pop("content-length", None)
                return Response(
                    content=body,
                    status_code=response.status_code,
                    headers=headers,
                    media_type=content_type
                )
                
        return response
        
    def translate_json(self, data, dictionary):
        if isinstance(data, dict):
            return {k: self.translate_json(v, dictionary) for k, v in data.items()}
        elif isinstance(data, list):
            return [self.translate_json(v, dictionary) for v in data]
        elif isinstance(data, str):
            # Try to translate exact match
            if data in dictionary:
                return dictionary[data]
            return data
        else:
            return data
