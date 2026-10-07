import http.server
import socketserver
import urllib.request
import urllib.error
import urllib.parse
import ssl
import os
import json
import sqlite3

PORT = int(os.environ.get("PORT", 8080))

# Initialize SQLite database for Pomodoro
def init_db():
    conn = sqlite3.connect('pomodoro.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (username TEXT PRIMARY KEY, data TEXT)''')
    conn.commit()
    conn.close()

init_db()

class ProxyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/pomodoro/sync':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            try:
                data = json.loads(body)
                username = data.get('username')
                user_data = data.get('data')
                
                if username and user_data is not None:
                    conn = sqlite3.connect('pomodoro.db')
                    c = conn.cursor()
                    c.execute("INSERT OR REPLACE INTO users (username, data) VALUES (?, ?)", (username, json.dumps(user_data)))
                    conn.commit()
                    conn.close()
                    
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "ok"}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(str(e).encode('utf-8'))
            return
            
        elif self.path == '/api/pomodoro/login':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            try:
                data = json.loads(body)
                username = data.get('username')
                
                conn = sqlite3.connect('pomodoro.db')
                c = conn.cursor()
                c.execute("SELECT data FROM users WHERE username = ?", (username,))
                row = c.fetchone()
                conn.close()
                
                response_data = {"exists": False, "data": None}
                if row:
                    response_data = {"exists": True, "data": json.loads(row[0])}
                    
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response_data).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.end_headers()
            return
            
        self.send_response(404)
        self.end_headers()

    def do_GET(self):
        if self.path.startswith('/api/'):
            parts = self.path.split('/')
            
            url = ""
            if len(parts) >= 4 and parts[1] == 'api':
                endpoint_type = parts[2] # 'game' or 'top'
                game_id = parts[3]
                
                if endpoint_type == 'game' and len(parts) >= 5:
                    word = parts[4]
                    # URL encode the word to handle spaces and special characters safely
                    word_encoded = urllib.parse.quote(word)
                    url = f"https://api.contexto.me/machado/en/game/{game_id}/{word_encoded}"
                elif endpoint_type == 'top':
                    url = f"https://api.contexto.me/machado/en/top/{game_id}"
                
            if url:
                try:
                    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                    
                    # Create an unverified SSL context just in case
                    ctx = ssl.create_default_context()
                    ctx.check_hostname = False
                    ctx.verify_mode = ssl.CERT_NONE

                    with urllib.request.urlopen(req, context=ctx) as response:
                        self.send_response(200)
                        self.send_header('Content-type', 'application/json')
                        self.send_header('Access-Control-Allow-Origin', '*')
                        self.end_headers()
                        self.wfile.write(response.read())
                except urllib.error.HTTPError as e:
                    self.send_response(e.code)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(e.read())
                except Exception as e:
                    self.send_response(500)
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(str(e).encode('utf-8'))
            return
            
        return super().do_GET()

with socketserver.TCPServer(("", PORT), ProxyHTTPRequestHandler) as httpd:
    print(f"Serving Game Portal and APIs at port {PORT}")
    httpd.serve_forever()
