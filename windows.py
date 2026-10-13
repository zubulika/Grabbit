import subprocess
import os
from pathlib import Path

def main():
    if os.name == 'nt':
        os.system('color')
    
    # Ensure logs directory exists at project root
    logs_dir = Path(__file__).parent / 'logs'
    logs_dir.mkdir(parents=True, exist_ok=True)

    print("\n\033[95m[Grabbit]\033[0m Starting Desktop App Dev Server...")
    print(f"\033[90m[Grabbit]\033[0m Backend session logs directory: {logs_dir}")
    try:
        subprocess.run("npm run dev:app", shell=True)
    except KeyboardInterrupt:
        pass

if __name__ == "__main__":
    main()
