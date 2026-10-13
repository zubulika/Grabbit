"""Grabbit Android Development Supervisor & Auto-Reload Watcher.

Runs builds, launches the Android emulator, and automatically reloads
the live app whenever you or AI edit any Kotlin/Compose file.
"""

import os
import subprocess
import sys
import time

JAVA_HOME = r"E:\Build Tools\Android Studio SDK\jbr"
ANDROID_HOME = r"D:\SDK"
ADB_PATH = os.path.join(ANDROID_HOME, "platform-tools", "adb.exe")
EMULATOR_PATH = os.path.join(ANDROID_HOME, "emulator", "emulator.exe")
ANDROID_DIR = os.path.join(os.path.dirname(__file__), "apps", "android")
SRC_DIR = os.path.join(ANDROID_DIR, "app", "src", "main")
AVD_NAME = "Pixel_9_Pro_XL"
PACKAGE_NAME = "com.grabbit.app"
PREFERRED_PORT = "5556"

os.environ["JAVA_HOME"] = JAVA_HOME
os.environ["ANDROID_HOME"] = ANDROID_HOME
os.environ["PATH"] = f"{JAVA_HOME}\\bin;{ANDROID_HOME}\\platform-tools;{ANDROID_HOME}\\emulator;{os.environ.get('PATH', '')}"

def get_responsive_devices():
    """Finds all attached ADB devices that can actually execute shell commands."""
    responsive = []
    try:
        output = subprocess.check_output([ADB_PATH, "devices"], text=True, stderr=subprocess.DEVNULL)
        lines = [line.split()[0] for line in output.strip().split("\n")[1:] if line.strip() and "offline" not in line and "device" in line]
        for dev_id in lines:
            try:
                res = subprocess.run([ADB_PATH, "-s", dev_id, "shell", "echo", "ready"], 
                                     stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, timeout=2)
                if res.returncode == 0 and "ready" in res.stdout:
                    responsive.append(dev_id)
            except Exception:
                continue
    except Exception:
        pass
    return responsive

def is_boot_completed(dev_id):
    try:
        res = subprocess.run([ADB_PATH, "-s", dev_id, "shell", "getprop", "sys.boot_completed"],
                             stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, timeout=2)
        return res.stdout.strip() == "1"
    except Exception:
        return False

def ensure_emulator_running():
    devices = get_responsive_devices()
    for dev in devices:
        if is_boot_completed(dev):
            print(f"✅ Active Android device online: {dev}")
            return dev

    print(f"🚀 Launching Android Emulator ({AVD_NAME}) on port {PREFERRED_PORT}...")
    subprocess.Popen([
        EMULATOR_PATH,
        "-avd", AVD_NAME,
        "-port", PREFERRED_PORT,
        "-netdelay", "none",
        "-netspeed", "full"
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    target_dev = f"emulator-{PREFERRED_PORT}"
    print(f"⏳ Waiting for {target_dev} to finish booting...")

    timeout = 90
    elapsed = 0
    while elapsed < timeout:
        devices = get_responsive_devices()
        if target_dev in devices and is_boot_completed(target_dev):
            print(f"✨ Emulator {target_dev} is ready!")
            time.sleep(1)
            return target_dev
        time.sleep(3)
        elapsed += 3
        print(f"   Booting... ({elapsed}s)")

    devices = get_responsive_devices()
    if devices:
        return devices[0]
    return target_dev

def build_and_install(dev_id, silent=False):
    if not silent:
        print("📦 Compiling Grabbit Kotlin APK...")
    gradlew_bat = os.path.join(ANDROID_DIR, "gradlew.bat")
    result = subprocess.run([gradlew_bat, "assembleDebug"], cwd=ANDROID_DIR, 
                            stdout=subprocess.DEVNULL if silent else None,
                            stderr=subprocess.DEVNULL if silent else None)
    if result.returncode != 0:
        print("❌ Build encountered a compilation error. Check syntax.")
        return False

    apk_path = os.path.join(ANDROID_DIR, "app", "build", "outputs", "apk", "debug", "app-debug.apk")
    if not os.path.exists(apk_path):
        print(f"❌ APK not found at {apk_path}")
        return False

    if not silent:
        print(f"📲 Installing APK on {dev_id}...")
    install_res = subprocess.run([ADB_PATH, "-s", dev_id, "install", "-r", apk_path],
                                 stdout=subprocess.DEVNULL if silent else None,
                                 stderr=subprocess.DEVNULL if silent else None)
    
    if install_res.returncode == 0:
        subprocess.run([ADB_PATH, "-s", dev_id, "shell", "am", "start", "-n", f"{PACKAGE_NAME}/.MainActivity"],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if not silent:
            print("🎉 Grabbit is live on screen!")
        return True
    else:
        # Fallback install
        subprocess.run([ADB_PATH, "-s", dev_id, "push", apk_path, "/data/local/tmp/app-debug.apk"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        subprocess.run([ADB_PATH, "-s", dev_id, "shell", "pm", "install", "-r", "/data/local/tmp/app-debug.apk"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        subprocess.run([ADB_PATH, "-s", dev_id, "shell", "am", "start", "-n", f"{PACKAGE_NAME}/.MainActivity"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return True

def get_source_timestamps():
    """Maps file paths to modification timestamps for auto-reload detection."""
    timestamps = {}
    for root, _, files in os.walk(SRC_DIR):
        for f in files:
            if f.endswith((".kt", ".xml", ".kts", ".properties")):
                path = os.path.join(root, f)
                try:
                    timestamps[path] = os.path.getmtime(path)
                except OSError:
                    pass
    return timestamps

def watch_and_reload(dev_id):
    print("\n👀 Auto-Watcher active: watching Kotlin/Compose files for changes...")
    print("💡 Any code edit will automatically recompile and update the emulator!\n")
    
    last_snapshot = get_source_timestamps()
    try:
        while True:
            time.sleep(1.0)
            current_snapshot = get_source_timestamps()
            changed_files = []
            
            for path, mtime in current_snapshot.items():
                if path not in last_snapshot or mtime > last_snapshot[path]:
                    changed_files.append(os.path.basename(path))

            if changed_files:
                print(f"🔄 Detected change in: {', '.join(changed_files)} — Updating app...")
                last_snapshot = current_snapshot
                t0 = time.time()
                success = build_and_install(dev_id, silent=True)
                if success:
                    print(f"✨ Updated in {round(time.time() - t0, 1)}s!")
    except KeyboardInterrupt:
        print("\n👋 Auto-watcher stopped.")

if __name__ == "__main__":
    active_device = ensure_emulator_running()
    initial_success = build_and_install(active_device)
    if initial_success:
        watch_and_reload(active_device)
