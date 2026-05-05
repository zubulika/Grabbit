import subprocess
import sys
import os

def run_command(command, cwd=None):
    """Runs a shell command and keeps the process open."""
    print(f"\n\033[94m[Grabbit Launcher]\033[0m Executing: {command}")
    try:
        # Use shell=True for Windows to handle npm commands correctly
        process = subprocess.Popen(command, shell=True, cwd=cwd)
        process.wait()
    except KeyboardInterrupt:
        print("\n\033[93m[Grabbit Launcher]\033[0m Stopping process...")
        process.terminate()
    except Exception as e:
        print(f"\n\033[91m[Grabbit Launcher] Error:\033[0m {e}")

def main():
    # Set console color support for Windows
    if os.name == 'nt':
        os.system('color')

    print("""
\033[91m
 ██████╗ ██████╗  █████╗ ██████╗ ██████╗ ██╗████████╗
██╔════╝ ██╔══██╗██╔══██╗██╔══██╗██╔══██╗██║╚══██╔══╝
██║  ███╗██████╔╝███████║██████╔╝██████╔╝██║   ██║   
██║   ██║██╔══██╗██╔══██║██╔══██╗██╔══██╗██║   ██║   
╚██████╔╝██║  ██║██║  ██║██████╔╝██████╔╝██║   ██║   
 ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚═════╝ ╚═╝   ╚═╝   
\033[0m
\033[90m--------------------------------------------------\033[0m
    """)

    if len(sys.argv) > 1:
        choice = sys.argv[1].lower()
    else:
        print("\033[1mSelect a development server to start:\033[0m")
        print(" [1] \033[96mWebsite\033[0m (Next.js)")
        print(" [2] \033[95mDesktop App\033[0m (Electron)")
        print(" [q] Exit")
        
        choice = input("\n\033[1mChoice: \033[0m").strip().lower()

    if choice in ['1', 'website', 'w']:
        run_command("npm run dev:website")
    elif choice in ['2', 'app', 'a']:
        run_command("npm run dev:app")
    elif choice == 'q':
        sys.exit(0)
    else:
        print("\033[91mInvalid choice.\033[0m")

if __name__ == "__main__":
    main()
