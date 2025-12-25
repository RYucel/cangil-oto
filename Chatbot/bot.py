import requests
from flask import Flask, request, jsonify

app = Flask(__name__)

# --- ⚙️ AYARLAR ---
# Kapso Dashboard -> API Keys kısmından aldığınız anahtar
KAPSO_API_KEY = "4e1f0933d8a57a30d8559b3a271a207635639d9f356874bad32e3559d967f7e5" 

# Loglarınızda görünen Sandbox ID'niz [cite: 184]
PHONE_NUMBER_ID = "597907523413541" 

# Kapso API adresi [cite: 52, 183]
BASE_URL = "https://api.kapso.ai/meta/whatsapp"

def mesaj_gonder(numara, metin):
    """WhatsApp üzerinden mesaj gönderir."""
    url = f"{BASE_URL}/{PHONE_NUMBER_ID}/messages"
    headers = {
        "X-API-Key": KAPSO_API_KEY, # Kapso yetkilendirmesi için gerekli [cite: 52, 197]
        "Content-Type": "application/json"
    }
    payload = {
        "to": numara,
        "type": "text",
        "text": {"body": metin}
    }
    
    print(f"\n🚀 GÖNDERİM DENEMESİ: {numara} -> {metin}")
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"Kapso Yanıtı ({response.status_code}): {response.text}")
        return response.json()
    except Exception as e:
        print(f"❌ Hata: {e}")
        return None

@app.route('/webhook', methods=['POST'])
def webhook():
    """Gelen mesajları yakalayan uç nokta."""
    data = request.json
    
    # Kapso'dan gelen verinin içindeki 'message' anahtarını kontrol ediyoruz [cite: 162]
    if 'message' in data:
        msg = data['message']
        musteri_numarasi = msg.get("from") # Gönderen numarası [cite: 161]
        
        # Mesaj içeriğini alıp temizliyoruz [cite: 161]
        gelen_metin = msg.get("text", {}).get("body", "").lower().strip()
        
        print(f"📩 Mesaj Geldi: '{gelen_metin}' (Müşteri: {musteri_numarasi})")

        # --- 🤖 BOT MANTIĞI ---
        if any(kelime in gelen_metin for kelime in ["merhaba", "selam"]):
            cevap = (
                "Merhaba! Cangıl Oto Galeri'ye hoş geldiniz. 🚗\n\n"
                "Size nasıl yardımcı olabilirim?\n"
                "1️⃣ Araç Listesi\n"
                "2️⃣ Konum ve İletişim"
            )
            mesaj_gonder(musteri_numarasi, cevap)
            
        elif "1" in gelen_metin or "araç" in gelen_metin:
            cevap = "Şu an stoklarımızda SUV ve Sedan modellerimiz mevcut. 🏎️ Hangi tiple ilgileniyorsunuz?"
            mesaj_gonder(musteri_numarasi, cevap)

    return jsonify({"status": "success"}), 200 # 200 OK dönmek zorunludur [cite: 267]

if __name__ == '__main__':
    # debug=True sayesinde kod değiştikçe sunucu kendini yeniler
    app.run(port=5000, debug=True)