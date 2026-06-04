import subprocess
import os

def main():
    if os.name == 'nt':
        os.system('color')
    
    print("\n\033[95m[Grabbit]\033[0m Starting Desktop App Dev Server...")
    try:
        subprocess.run("npm run dev:app", shell=True)
    except KeyboardInterrupt:
        pass

if __name__ == "__main__":
    main()
