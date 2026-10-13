import subprocess
import os

def main():
    if os.name == 'nt':
        os.system('color')
    
    # Increase Node HTTP header size limit to 128KB to prevent HTTP 431 on localhost cookie accumulation
    existing_opts = os.environ.get("NODE_OPTIONS", "")
    if "--max-http-header-size" not in existing_opts:
        os.environ["NODE_OPTIONS"] = (existing_opts + " --max-http-header-size=131072").strip()

    print("\n\033[94m[Grabbit]\033[0m Starting Website Dev Server (HTTP Header Limit: 128KB)...")
    try:
        subprocess.run("npm run dev:website", shell=True)
    except KeyboardInterrupt:
        pass

if __name__ == "__main__":
    main()
