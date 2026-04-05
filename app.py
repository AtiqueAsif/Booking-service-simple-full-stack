from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# JSON file path
DATA_FILE = os.path.join(os.path.dirname(__file__), 'bookings.json')

# Create file if not exists
if not os.path.exists(DATA_FILE):
    with open(DATA_FILE, 'w') as f:
        json.dump([], f)

def read_bookings():
    with open(DATA_FILE, 'r') as f:
        return json.load(f)

def write_bookings(bookings):
    with open(DATA_FILE, 'w') as f:
        json.dump(bookings, f, indent=2)

@app.route('/api/book', methods=['POST'])
def create_booking():
    try:
        data = request.json
        print("📥 Received:", data)
        
        new_booking = {
            'id': datetime.now().strftime('%Y%m%d%H%M%S'),
            'name': data.get('name'),
            'service': data.get('service'),
            'date': data.get('date'),
            'notes': data.get('notes', ''),
            'created_at': datetime.now().isoformat()
        }
        
        bookings = read_bookings()
        bookings.insert(0, new_booking)
        write_bookings(bookings)
        
        print("✅ Saved to JSON")
        return jsonify({'success': True, 'booking': new_booking}), 201
        
    except Exception as e:
        print("❌ Error:", e)
        return jsonify({'error': str(e)}), 500

@app.route('/api/bookings', methods=['GET'])
def get_bookings():
    return jsonify(read_bookings())

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    print("\n" + "="*50)
    print("🚀 BACKEND SERVER RUNNING")
    print(f"📁 JSON File: {DATA_FILE}")
    print("📍 http://localhost:5000")
    print("📌 POST /api/book")
    print("📌 GET /api/bookings")
    print("="*50 + "\n")
    app.run(debug=True, port=5000)