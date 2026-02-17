import { setActiveNav, setPageReady } from "/assets/lib.js";

const init = () => {
  setActiveNav();
  setPageReady();
  setupContactForm();
};

const setupContactForm = () => {
  const form = document.querySelector(".contact-form");
  if (!form) return;

  const status = form.querySelector(".contact-status");
  const submitButton = form.querySelector('button[type="submit"]');

  const setStatus = (message, { error = false } = {}) => {
    if (!status) return;
    status.hidden = false;
    status.textContent = message;
    status.classList.toggle("is-error", error);
    status.classList.toggle("is-success", !error);
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitButton) submitButton.disabled = true;
    if (status) {
      status.hidden = true;
      status.textContent = "";
      status.classList.remove("is-error", "is-success");
    }

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        form.reset();
        setStatus("Thanks — your message has been sent.");
      } else {
        let message = "Something went wrong. Please try again.";
        try {
          const data = await response.json();
          if (data?.errors?.length) {
            message = data.errors.map((item) => item.message).join(" ");
          }
        } catch (err) {
          message = "Something went wrong. Please try again.";
        }
        setStatus(message, { error: true });
      }
    } catch (err) {
      setStatus("Network error. Please try again.", { error: true });
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
};

init();
