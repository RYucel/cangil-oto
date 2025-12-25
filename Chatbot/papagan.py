import requests
from flask import Flask, request, jsonify

app = Flask(__name__)

# --- ⚙️ AYARLAR ---
KAPSO_API_KEY = "4e1f0933d8a57a30d8559b3a271a207635639d9f356874bad32e3559d967f7e5" 
PHONE_NUMBER_ID = "597907523413541" 
BASE_URL = "https://api.kapso.ai/meta/whatsapp"

def cevap_gonder(numara, metin):
    url = f"{BASE_URL}/{PHONE_NUMBER_ID}/messages"
    headers = {
        "X-API-Key": KAPSO_API_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "to": numara,
        "type": "text",
        "text": {"body": metin}
    }
    # İstek gönderiliyor
    response = requests.post(url, json=payload, headers=headers)
    
    # Kapso'dan gelen cevabı buraya yazdıralım
    print(f"--- Kapso API Yanıtı ---")
    print(f"Durum Kodu: {response.status_code}")
    print(f"Yanıt İçeriği: {response.text}")
    
    return response.json()

@app.route('/webhook', methods=['POST'])
def webhook():
    data = request.json
    
    # Gelen veriden mesajı ve numarayı ayıklıyoruz
    if 'message' in data:
        msg = data['message']
        musteri_numarasi = msg.get("from")
        # Müşteri ne yazdıysa onu 'gelen_metin' değişkenine alıyoruz
        gelen_metin = msg.get("text", {}).get("body", "")
        
        print(f"🦜 Papağan duydu: {gelen_metin}")
        
        # Duyduğunu aynen geri gönderiyor!
        cevap_gonder(musteri_numarasi, gelen_metin)

    return jsonify({"status": "success"}), 200

if __name__ == '__main__':
    app.run(port=5000, debug=True)