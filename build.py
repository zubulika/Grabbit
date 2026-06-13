import tkinter as tk
from tkinter import ttk, messagebox
import json
import os
import subprocess
import threading
import queue

# Config paths
WORKSPACE_DIR = os.path.dirname(os.path.abspath(__file__))
PACKAGE_JSON_PATH = os.path.join(WORKSPACE_DIR, "apps", "windows", "package.json")

class BuildApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Grabbit Builder")
        self.root.geometry("750x550")
        self.root.configure(bg="#0f0f0f")
        
        # Grid weights to make it responsive
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(1, weight=1)

        self.log_queue = queue.Queue()
        self.build_thread = None
        self.is_building = False

        self.setup_styles()
        self.create_widgets()
        self.load_current_version()
        
        # Start queue poller
        self.root.after(100, self.poll_log_queue)

    def setup_styles(self):
        # Configure styles for a modern look
        self.style = ttk.Style()
        self.style.theme_use('clam')
        
        # Color palette
        self.bg_color = "#0f0f0f"
        self.card_color = "#181818"
        self.text_color = "#ffffff"
        self.accent_color = "#ff0000"
        self.border_color = "#2a2a2a"

        self.style.configure('.', background=self.bg_color, foreground=self.text_color)
        
        # Entry styling
        self.style.configure('TEntry', 
                             fieldbackground="#212121", 
                             foreground=self.text_color, 
                             insertcolor=self.text_color,
                             bordercolor=self.border_color,
                             lightcolor=self.border_color,
                             darkcolor=self.border_color)
        
        # Label styling
        self.style.configure('Title.TLabel', font=("Segoe UI", 16, "bold"), background=self.bg_color, foreground=self.text_color)
        self.style.configure('Subtitle.TLabel', font=("Segoe UI", 9), background=self.bg_color, foreground="#aaaaaa")
        self.style.configure('Normal.TLabel', font=("Segoe UI", 10), background=self.card_color, foreground=self.text_color)
        
        # Frame styling
        self.style.configure('Card.TFrame', background=self.card_color, relief="flat")

    def create_widgets(self):
        # Header banner
        header_frame = tk.Frame(self.root, bg=self.bg_color, pady=15, padx=20)
        header_frame.grid(row=0, column=0, sticky="ew")
        header_frame.columnconfigure(0, weight=1)

        title_lbl = ttk.Label(header_frame, text="Grabbit Release Builder", style="Title.TLabel")
        title_lbl.grid(row=0, column=0, sticky="w")
        
        subtitle_lbl = ttk.Label(header_frame, text="Powered by Grabbit", style="Subtitle.TLabel")
        subtitle_lbl.grid(row=1, column=0, sticky="w", pady=(2, 0))

        # Config Panel (Card)
        config_frame = ttk.Frame(self.root, style="Card.TFrame", padding=15)
        config_frame.grid(row=1, column=0, padx=20, pady=(0, 10), sticky="nsew")
        config_frame.columnconfigure(0, weight=1)
        config_frame.columnconfigure(1, weight=1)
        config_frame.rowconfigure(2, weight=1)

        # Version field
        ver_lbl = ttk.Label(config_frame, text="Application Version:", style="Normal.TLabel")
        ver_lbl.grid(row=0, column=0, sticky="w", padx=(0, 10), pady=10)

        # Container for the three spinboxes
        ver_container = tk.Frame(config_frame, bg=self.card_color)
        ver_container.grid(row=0, column=1, sticky="w", pady=10)

        self.major_var = tk.IntVar(value=1)
        self.minor_var = tk.IntVar(value=0)
        self.patch_var = tk.IntVar(value=0)

        spin_opts = {
            "from_": 0,
            "to": 999,
            "bg": "#212121",
            "fg": self.text_color,
            "buttonbackground": "#2a2a2a",
            "bd": 0,
            "highlightbackground": self.border_color,
            "highlightcolor": self.accent_color,
            "highlightthickness": 1,
            "font": ("Segoe UI", 10, "bold"),
            "width": 6,
            "justify": "center",
            "insertbackground": self.text_color
        }

        self.major_spin = tk.Spinbox(ver_container, textvariable=self.major_var, **spin_opts)
        self.major_spin.grid(row=0, column=0, padx=2)

        dot1 = ttk.Label(ver_container, text=".", font=("Segoe UI", 14, "bold"), background=self.card_color)
        dot1.grid(row=0, column=1, padx=2)

        self.minor_spin = tk.Spinbox(ver_container, textvariable=self.minor_var, **spin_opts)
        self.minor_spin.grid(row=0, column=2, padx=2)

        dot2 = ttk.Label(ver_container, text=".", font=("Segoe UI", 14, "bold"), background=self.card_color)
        dot2.grid(row=0, column=3, padx=2)

        self.patch_spin = tk.Spinbox(ver_container, textvariable=self.patch_var, **spin_opts)
        self.patch_spin.grid(row=0, column=4, padx=2)

        # Start Build Button (styled manually for dark theme red hover)
        self.build_btn = tk.Button(config_frame, text="Start Build Process", bg=self.accent_color, fg=self.text_color,
                                   activebackground="#cc0000", activeforeground=self.text_color,
                                   font=("Segoe UI", 10, "bold"), bd=0, relief="flat", cursor="hand2",
                                   command=self.start_build, height=2)
        self.build_btn.grid(row=1, column=0, sticky="ew", pady=(5, 15), padx=(0, 5))

        # Copy Error Logs Button
        self.copy_btn = tk.Button(config_frame, text="Copy Error Logs", bg="#2a2a2a", fg=self.text_color,
                                  activebackground="#3a3a3a", activeforeground=self.text_color,
                                  font=("Segoe UI", 10, "bold"), bd=0, relief="flat", cursor="hand2",
                                  command=self.copy_error_logs, height=2)
        self.copy_btn.grid(row=1, column=1, sticky="ew", pady=(5, 15), padx=(5, 0))

        # Log Output Label
        log_lbl = ttk.Label(config_frame, text="Build Output Logs:", style="Normal.TLabel")
        log_lbl.grid(row=2, column=0, columnspan=2, sticky="w", pady=(0, 5))

        # Log Scrolled Textbox (manually styled)
        log_container = tk.Frame(config_frame, bg=self.bg_color, bd=1, relief="flat", 
                                 highlightbackground=self.border_color, highlightthickness=1)
        log_container.grid(row=3, column=0, columnspan=2, sticky="nsew")
        log_container.columnconfigure(0, weight=1)
        log_container.rowconfigure(0, weight=1)

        self.log_txt = tk.Text(log_container, bg="#0b0b0b", fg="#00ff00", insertbackground="#00ff00",
                               selectbackground="#333333", selectforeground="#ffffff", font=("Consolas", 9),
                               bd=0, wrap="word")
        self.log_txt.grid(row=0, column=0, sticky="nsew")

        scrollbar = tk.Scrollbar(log_container, command=self.log_txt.yview, bg=self.bg_color, troughcolor="#0b0b0b", bd=0)
        scrollbar.grid(row=0, column=1, sticky="ns")
        self.log_txt.config(yscrollcommand=scrollbar.set)

    def load_current_version(self):
        try:
            with open(PACKAGE_JSON_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                version = data.get("version", "1.0.0")
                
                parts = version.split('.')
                major = 1
                minor = 0
                patch = 0
                if len(parts) >= 1:
                    try: major = int(parts[0])
                    except ValueError: pass
                if len(parts) >= 2:
                    try: minor = int(parts[1])
                    except ValueError: pass
                if len(parts) >= 3:
                    try: patch = int(parts[2])
                    except ValueError: pass
                
                self.major_var.set(major)
                self.minor_var.set(minor)
                self.patch_var.set(patch)
        except Exception as e:
            self.write_log(f"Error loading version from package.json: {e}\n")

    def update_package_version(self, new_version):
        try:
            with open(PACKAGE_JSON_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            data["version"] = new_version
            
            with open(PACKAGE_JSON_PATH, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            
            self.write_log(f"Updated package.json version to: {new_version}\n")
            return True
        except Exception as e:
            self.write_log(f"Error updating package.json version: {e}\n")
            return False

    def write_log(self, text):
        self.log_queue.put(text)

    def poll_log_queue(self):
        while not self.log_queue.empty():
            try:
                line = self.log_queue.get_nowait()
                self.log_txt.insert(tk.END, line)
                self.log_txt.see(tk.END)
            except queue.Empty:
                break
        self.root.after(100, self.poll_log_queue)

    def start_build(self):
        if self.is_building:
            return
        
        try:
            major = int(self.major_spin.get())
            minor = int(self.minor_spin.get())
            patch = int(self.patch_spin.get())
        except ValueError:
            messagebox.showerror("Error", "Version components must be integers.")
            return

        new_version = f"{major}.{minor}.{patch}"

        self.is_building = True
        self.build_btn.config(state="disabled", bg="#3a3a3a", text="Building...")
        self.major_spin.config(state="disabled")
        self.minor_spin.config(state="disabled")
        self.patch_spin.config(state="disabled")
        self.log_txt.delete("1.0", tk.END)

        # Update package.json version first
        if not self.update_package_version(new_version):
            self.reset_build_ui()
            messagebox.showerror("Error", "Failed to update package.json version.")
            return

        # Start build thread
        self.build_thread = threading.Thread(target=self.run_build_process)
        self.build_thread.daemon = True
        self.build_thread.start()

    def run_build_process(self):
        self.write_log("Starting build process...\n")
        self.write_log("-" * 60 + "\n")
        
        cmd = "npm run build:win -w apps/windows"
        self.write_log(f"Running command: {cmd}\n\n")

        try:
            # Run the build process and capture output line by line
            process = subprocess.Popen(
                cmd,
                shell=True,
                cwd=WORKSPACE_DIR,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1
            )

            for line in iter(process.stdout.readline, ''):
                self.write_log(line)
            
            process.stdout.close()
            return_code = process.wait()

            self.write_log("-" * 60 + "\n")
            if return_code == 0:
                self.write_log("Build completed successfully!\n")
                self.write_log("You can find the installer at: apps/windows/dist/GrabbitSetup.exe\n")
                self.root.after(0, lambda: messagebox.showinfo("Success", "Build completed successfully! Check the dist/ directory."))
            else:
                self.write_log(f"Build failed with exit code: {return_code}\n")
                self.root.after(0, lambda: messagebox.showerror("Failure", f"Build failed with exit code {return_code}."))

        except Exception as e:
            self.write_log(f"Exception during build: {e}\n")
            self.root.after(0, lambda: messagebox.showerror("Error", f"Build process crashed: {e}"))
        
        finally:
            self.root.after(0, self.reset_build_ui)

    def reset_build_ui(self):
        self.is_building = False
        self.build_btn.config(state="normal", bg=self.accent_color, text="Start Build Process")
        self.major_spin.config(state="normal")
        self.minor_spin.config(state="normal")
        self.patch_spin.config(state="normal")

    def copy_error_logs(self):
        logs = self.log_txt.get("1.0", tk.END)
        lines = logs.split("\n")
        error_keywords = ["error", "failed", "exception", "err", "warn", "warning", "invalid", "cannot", "fail", "validationerror"]
        error_lines = []
        for line in lines:
            if any(keyword in line.lower() for keyword in error_keywords):
                error_lines.append(line)
        
        text_to_copy = "\n".join(error_lines)
        if not text_to_copy.strip():
            text_to_copy = "No specific error keywords found in the build logs. Here is the full log instead:\n\n" + logs
        
        self.root.clipboard_clear()
        self.root.clipboard_append(text_to_copy)
        self.root.update()
        messagebox.showinfo("Copied", "Error logs have been copied to clipboard!")

if __name__ == "__main__":
    root = tk.Tk()
    app = BuildApp(root)
    root.mainloop()
