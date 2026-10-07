import http.server
import socketserver
import urllib.request
import urllib.error
import urllib.parse
import ssl
import os
import json

PORT = int(os.environ.get("PORT", 8080))

SUPABASE_URL = "https://mgyjmjktejsfopppazsr.supabase.co"
SUPABASE_KEY = "sb_publishable_XsvfkanctSLes3nlppKFgA_AXwPgSpS"

def supabase_request(method, endpoint, payload=None):
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    data = None
    if payload:
        data = json.dumps(payload).encode('utf-8')
        
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"Supabase error: {e.read()}")
        return None

class ProxyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/pomodoro/sync':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            try:
                data = json.loads(body)
                username = data.get('username')
                password = data.get('password', '')
                user_data = data.get('data')
                
                if username and user_data is not None:
                    # Fetch existing user to check password
                    existing = supabase_request("GET", f"users?username=eq.{username}")
                    
                    if existing and len(existing) > 0:
                        if existing[0].get('password') != password:
                            self.send_response(401)
                            self.end_headers()
                            return
                        
                        # Update existing
                        supabase_request("PATCH", f"users?username=eq.{username}", {
                            "data": json.dumps(user_data),
                            "password": password
                        })
                    else:
                        # Insert new
                        supabase_request("POST", "users", {
                            "username": username,
                            "data": json.dumps(user_data),
                            "password": password
                        })
                    
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
                password = data.get('password', '')
                
                existing = supabase_request("GET", f"users?username=eq.{username}")
                
                response_data = {"exists": False, "success": True, "data": None}
                
                if existing and len(existing) > 0:
                    saved_password = existing[0].get('password')
                    if saved_password == password:
                        response_data = {"exists": True, "success": True, "data": json.loads(existing[0].get('data', '{}'))}
                    else:
                        response_data = {"exists": True, "success": False, "error": "Incorrect password!"}
                    
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
