// Admin Panel JavaScript

// Auto-refresh stats every 30 seconds
if (window.location.pathname === "/") {
  setInterval(async () => {
    try {
      const res = await fetch("/api/stats");
      const data = await res.json();

      if (data.success) {
        // Update stats if they changed
        console.log("Stats updated:", data.data);
      }
    } catch (error) {
      console.error("Stats update error:", error);
    }
  }, 30000);
}

// Close modal on outside click
window.onclick = function (event) {
  const modals = document.getElementsByClassName("modal");
  for (let modal of modals) {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  }
};

// Confirm before leaving page if form is dirty
let formIsDirty = false;

document.addEventListener("DOMContentLoaded", () => {
  const forms = document.querySelectorAll("form");

  forms.forEach((form) => {
    const inputs = form.querySelectorAll("input, textarea, select");

    inputs.forEach((input) => {
      input.addEventListener("change", () => {
        formIsDirty = true;
      });
    });
  });
});

window.addEventListener("beforeunload", (e) => {
  if (formIsDirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});

// Toast notifications
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === "success" ? "#10B981" : "#EF4444"};
        color: white;
        border-radius: 5px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        z-index: 99999;
        animation: slideIn 0.3s ease;
    `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "slideOut 0.3s ease";
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

// Add animations
const style = document.createElement("style");
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
