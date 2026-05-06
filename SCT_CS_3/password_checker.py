import tkinter as tk
import re
from tkinter import messagebox

def check_password_strength(password):
    length_error = len(password) < 8
    digit_error = re.search(r"\d", password) is None
    uppercase_error = re.search(r"[A-Z]", password) is None
    lowercase_error = re.search(r"[a-z]", password) is None
    symbol_error = re.search(r"[!@#$%^&*(),.?\":{}|<>]", password) is None

    errors = [length_error, digit_error, uppercase_error, lowercase_error, symbol_error]
    score = 5 - sum(errors)

    if score == 5:
        return "Very Strong"
    elif score == 4:
        return "Strong"
    elif score == 3:
        return "Moderate"
    elif score == 2:
        return "Weak"
    else:
        return "Very Weak"

def on_check():
    password = entry.get()
    strength = check_password_strength(password)
    result_label.config(text=f"Strength: {strength}")

def on_clear():
    entry.delete(0, tk.END)
    result_label.config(text="")

# GUI
root = tk.Tk()
root.title("Password Strength Checker")
root.geometry("400x200")
root.configure(bg="#f5f5dc")  

tk.Label(root, text="Enter Password:", bg="#f5f5dc", font=("Arial", 12)).pack(pady=10)
entry = tk.Entry(root, width=30, show="*")
entry.pack()

tk.Button(root, text="Check Strength", command=on_check).pack(pady=5)
tk.Button(root, text="Clear", command=on_clear).pack()

result_label = tk.Label(root, text="", bg="#f5f5dc", font=("Arial", 12, "bold"))
result_label.pack(pady=10)

root.mainloop()
