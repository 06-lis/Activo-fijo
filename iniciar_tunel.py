import subprocess
import re
import sys
import os

print("=" * 60)
print("  INICIANDO TUNEL CLOUDFLARE AUTOMATIZADO - ACTIVO FIJO UAGRM")
print("=" * 60)

cloudflared_bin = os.path.join(os.path.dirname(__file__), "cloudflared.exe")
if not os.path.exists(cloudflared_bin):
    print("Error: No se encontro cloudflared.exe en " + cloudflared_bin)
    sys.exit(1)

cmd = [cloudflared_bin, "tunnel", "--protocol", "http2", "--url", "http://localhost:3000"]
proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding="utf-8", errors="replace")

url_found = False
url_pattern = re.compile(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com")

for line in proc.stdout:
    sys.stdout.write(line)
    sys.stdout.flush()
    if not url_found:
        match = url_pattern.search(line)
        if match:
            tunnel_url = match.group(0)
            url_found = True
            print("\n" + "=" * 60)
            print(f"  DIRECCION QR DETECTADA: {tunnel_url}")
            print("  Actualizando configuracion de QR automaticamente...")
            print("=" * 60 + "\n")
            
            # Guardar en tunnel_url.txt
            with open(os.path.join(os.path.dirname(__file__), "tunnel_url.txt"), "w", encoding="utf-8") as f:
                f.write(tunnel_url)
                
            # Actualizar qrConfig.ts en ambos frontends
            for frontend_dir in ["activo-fijo-frontend", "activo-fijo-frontend-main"]:
                cfg_path = os.path.join(os.path.dirname(__file__), frontend_dir, "src", "utils", "qrConfig.ts")
                if os.path.exists(cfg_path):
                    try:
                        with open(cfg_path, "r", encoding="utf-8") as f:
                            content = f.read()
                        new_content = re.sub(
                            r"export const PUBLIC_TUNNEL_URL = '[^']*';",
                            f"export const PUBLIC_TUNNEL_URL = '{tunnel_url}';",
                            content
                        )
                        with open(cfg_path, "w", encoding="utf-8") as f:
                            f.write(new_content)
                        print(f"  [OK] Actualizado {frontend_dir}/src/utils/qrConfig.ts")
                    except Exception as e:
                        print(f"  [Error] {e}")
