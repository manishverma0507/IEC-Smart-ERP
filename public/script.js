/**

My IEC - Smart ERP - Login page scripts

Handles: role selection, login form (API), mobile menu, password toggle
*/

(function () {

/* ===============================
API BASE URL (AUTO DETECT)
=============================== */
const API_BASE = window.location.origin + '/api';

/* ===============================
ROLE SELECTION
=============================== */
let selectedRole = "student";

const roleRadios = document.querySelectorAll('input[name="role"]');

roleRadios.forEach((radio) => {
radio.addEventListener("change", function () {
selectedRole = this.value;
console.log("Role selected:", selectedRole);
});
});

const checkedRole = document.querySelector('input[name="role"]');
if (checkedRole) selectedRole = checkedRole.value;

/* ===============================
MOBILE MENU
=============================== */
const hamburger = document.getElementById("hamburger");
const mobileMenu = document.getElementById("mobileMenu");

if (hamburger && mobileMenu) {
hamburger.addEventListener("click", function () {
const expanded = this.getAttribute("aria-expanded") === "true";
this.setAttribute("aria-expanded", String(!expanded));
mobileMenu.setAttribute("aria-hidden", String(expanded));
});

mobileMenu.querySelectorAll("a").forEach((a) => {
  a.addEventListener("click", () => {
    hamburger.setAttribute("aria-expanded", "false");
    mobileMenu.setAttribute("aria-hidden", "true");
  });
});

}

/* ===============================
PASSWORD SHOW / HIDE
=============================== */
const pwToggle = document.getElementById("pwToggle");
const passwordInput = document.getElementById("password");

if (pwToggle && passwordInput) {
pwToggle.addEventListener("click", function () {
const isPassword = passwordInput.type === "password";
passwordInput.type = isPassword ? "text" : "password";
this.textContent = isPassword ? "Hide" : "Show";
this.setAttribute(
"aria-label",
isPassword ? "Hide password" : "Show password"
);
});
}

/* ===============================
LOGIN FORM
=============================== */
const loginForm = document.getElementById("loginForm");
const formMessage = document.getElementById("formMessage");

if (loginForm) {
loginForm.addEventListener("submit", async function (e) {
e.preventDefault();

  formMessage.textContent = "";
  formMessage.classList.remove("error", "success");

  const usernameEl = document.getElementById("username");
  const passwordEl = document.getElementById("password");

  const email = usernameEl ? usernameEl.value.trim() : "";
  const password = passwordEl ? passwordEl.value : "";

  if (!email || !password) {
    formMessage.textContent = "Please enter email and password.";
    formMessage.classList.add("error");
    return;
  }

  try {
    const res = await fetch(API_BASE + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        password: password,
        role: selectedRole,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      formMessage.textContent = data.message || "Login failed.";
      formMessage.classList.add("error");
      return;
    }

    localStorage.setItem("token", data.data.token);
    localStorage.setItem("user", JSON.stringify(data.data.user));

    formMessage.textContent = "Login successful. Redirecting...";
    formMessage.classList.add("success");

    setTimeout(() => {
      window.location.href = data.data.dashboardUrl;
    }, 800);

  } catch (err) {
    console.error(err);
    formMessage.textContent =
      "Network error. Please check if the server is running.";
    formMessage.classList.add("error");
  }
});

}

})();