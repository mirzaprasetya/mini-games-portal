import http.server
import socketserver
import urllib.request
import urllib.error

PORT = 8082

class ProxyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/api/'):
            parts = self.path.split('/')
            
            url = ""
            if len(parts) >= 4 and parts[1] == 'api':
                endpoint_type = parts[2] # 'game' or 'top'
                game_id = parts[3]
                
                if endpoint_type == 'game' and len(parts) >= 5:
                    word = parts[4]
                    url = f"https://api.contexto.me/machado/en/game/{game_id}/{word}"
                elif endpoint_type == 'top':
                    url = f"https://api.contexto.me/machado/en/top/{game_id}"
                
            if url:
                try:
                    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                    with urllib.request.urlopen(req) as response:
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
                    self.end_headers()
                    self.wfile.write(str(e).encode('utf-8'))
            return
            
        return super().do_GET()

with socketserver.TCPServer(("", PORT), ProxyHTTPRequestHandler) as httpd:
    print(f"Serving at port {PORT}")
    httpd.serve_forever()
