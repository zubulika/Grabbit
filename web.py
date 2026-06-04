import subprocess
import os

def main():
    if os.name == 'nt':
        os.system('color')
    
    print("\n\033[94m[Grabbit]\033[0m Starting Website Dev Server...")
    try:
        subprocess.run("npm run dev:website", shell=True)
    except KeyboardInterrupt:
        pass

if __name__ == "__main__":
    main()
