document.addEventListener("DOMContentLoaded", () => {
  const FEEDBACK_STORAGE_KEY = "feedbackList";
  const FEEDBACK_ID_COUNTER_KEY = "feedbackIdCounter";
  const form = document.getElementById("feedbackForm");
  const submitButton = document.getElementById("submitButton");
  const loadingIndicator = document.getElementById("loadingIndicator");
  const statusMessage = document.getElementById("statusMessage");
  const feedbackStatus = document.getElementById("feedbackStatus");
  const feedbackList = document.getElementById("feedbackList");
  const messageField = document.getElementById("message");
  const messageCounter = document.getElementById("messageCounter");
  let submittedFeedback = loadFeedbackFromStorage();

  const fields = {
    fullName: document.getElementById("fullName"),
    email: document.getElementById("email"),
    category: document.getElementById("category"),
    message: messageField,
  };

  const errorNodes = {
    fullName: document.getElementById("fullNameError"),
    email: document.getElementById("emailError"),
    category: document.getElementById("categoryError"),
    rating: document.getElementById("ratingError"),
    message: document.getElementById("messageError"),
  };

  const ratingInputs = Array.from(document.querySelectorAll('input[name="rating"]'));

  function setStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message visible ${type}`;
  }

  function clearStatus() {
    statusMessage.textContent = "";
    statusMessage.className = "status-message";
  }

  function setFeedbackStatus(message, type) {
    feedbackStatus.textContent = message;
    feedbackStatus.className = `status-message visible secondary ${type}`.trim();
  }

  function clearFeedbackStatus() {
    feedbackStatus.textContent = "";
    feedbackStatus.className = "status-message secondary";
  }

  function setFieldError(fieldName, message) {
    errorNodes[fieldName].textContent = message;
    if (fields[fieldName]) {
      fields[fieldName].classList.toggle("invalid", Boolean(message));
    }
    if (fieldName === "rating") {
      ratingInputs.forEach((input) => {
        input.classList.toggle("invalid", Boolean(message));
      });
    }
  }

  function clearFieldError(fieldName) {
    setFieldError(fieldName, "");
  }

  function updateMessageCounter() {
    messageCounter.textContent = `${messageField.value.length} / 500`;
  }

  function getSelectedRating() {
    const selected = ratingInputs.find((input) => input.checked);
    return selected ? selected.value : "";
  }

  function validateFullName() {
    const value = fields.fullName.value.trim();
    if (value.length < 3 || value.length > 50) {
      return "Full name must be between 3 and 50 characters.";
    }
    return "";
  }

  function validateEmail() {
    const value = fields.email.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) {
      return "Enter a valid email address.";
    }
    return "";
  }

  function validateCategory() {
    if (!fields.category.value) {
      return "Please choose a category.";
    }
    return "";
  }

  function validateRating() {
    if (!getSelectedRating()) {
      return "Please choose a rating from 1 to 5.";
    }
    return "";
  }

  function validateMessage() {
    const value = fields.message.value.trim();
    if (value.length < 10) {
      return "Message must be at least 10 characters.";
    }
    if (value.length > 500) {
      return "Message cannot exceed 500 characters.";
    }
    return "";
  }

  function validateField(fieldName) {
    let message = "";

    switch (fieldName) {
      case "fullName":
        message = validateFullName();
        break;
      case "email":
        message = validateEmail();
        break;
      case "category":
        message = validateCategory();
        break;
      case "rating":
        message = validateRating();
        break;
      case "message":
        message = validateMessage();
        break;
      default:
        break;
    }

    setFieldError(fieldName, message);
    return !message;
  }

  function validateForm() {
    const isValid = ["fullName", "email", "category", "rating", "message"].every((fieldName) =>
      validateField(fieldName)
    );

    return isValid;
  }

  function getFormData() {
    return {
      name: fields.fullName.value.trim(),
      email: fields.email.value.trim(),
      category: fields.category.value,
      rating: getSelectedRating(),
      message: fields.message.value.trim(),
    };
  }

  function setSubmitting(isSubmitting) {
    submitButton.disabled = isSubmitting;
    loadingIndicator.hidden = !isSubmitting;
    if (isSubmitting) {
      setStatus("Sending your feedback...", "loading");
    }
  }

  function resetErrors() {
    Object.keys(errorNodes).forEach((fieldName) => clearFieldError(fieldName));
  }

  function loadFeedbackFromStorage() {
    try {
      const storedValue = localStorage.getItem(FEEDBACK_STORAGE_KEY);

      if (!storedValue) {
        return [];
      }

      const parsedValue = JSON.parse(storedValue);

      if (!Array.isArray(parsedValue)) {
        return [];
      }

      let shouldResave = false;
      const normalizedFeedback = parsedValue.slice(0, 5).map((entry) => {
        if (!entry || typeof entry !== "object") {
          shouldResave = true;
          return entry;
        }

        if (entry.localId == null) {
          shouldResave = true;
        }

        return {
          ...entry,
          apiId: entry.apiId ?? entry.id,
          localId: entry.localId ?? generateLocalFeedbackId(),
        };
      });

      if (shouldResave) {
        localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(normalizedFeedback));
      }

      return normalizedFeedback;
    } catch (error) {
      localStorage.removeItem(FEEDBACK_STORAGE_KEY);
      return [];
    }
  }

  function generateLocalFeedbackId() {
    return `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  function saveFeedbackToStorage() {
    try {
      localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(submittedFeedback));
    } catch (error) {
      setStatus("Your feedback was saved in the page, but the browser could not persist it.", "error");
    }
  }

  function renderFeedbackList() {
    const entries = submittedFeedback.slice(0, 5);

    if (entries.length === 0) {
      feedbackList.innerHTML = `
        <li class="empty-state">
          No feedback submitted yet — be the first!
        </li>
      `;
      clearFeedbackStatus();
      return;
    }

    feedbackList.innerHTML = entries
      .map((entry, index) => {
        return `
          <li data-feedback-id="${escapeHtml(String(entry.localId ?? entry.id))}">
            <span class="meta">Feedback #${index + 1}</span>
            <h3>${escapeHtml(entry.name)}</h3>
            <p><strong>Category:</strong> ${escapeHtml(entry.category)}</p>
            <p><strong>Rating:</strong> ${escapeHtml(String(entry.rating))} / 5</p>
            <p>${escapeHtml(entry.message)}</p>
          </li>
        `;
      })
      .join("");
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    clearStatus();
    resetErrors();

    if (!validateForm()) {
      setStatus("Please fix the highlighted fields and try again.", "error");
      return;
    }

    const payload = getFormData();
    setSubmitting(true);

    try {
      const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok || response.status !== 201) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const result = await response.json();
      submittedFeedback.unshift({
        id: result.id,
        apiId: result.id,
        localId: generateLocalFeedbackId(),
        name: payload.name,
        category: payload.category,
        rating: payload.rating,
        message: payload.message,
      });
      submittedFeedback = submittedFeedback.slice(0, 5);
      saveFeedbackToStorage();
      renderFeedbackList();
      setStatus(`Thanks, ${payload.name}! Saved with ID ${result.id}.`, "success");
      form.reset();
      updateMessageCounter();
      resetErrors();
    } catch (error) {
      setStatus("We could not save your feedback right now. Please check your connection and try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  fields.fullName.addEventListener("blur", () => validateField("fullName"));
  fields.email.addEventListener("blur", () => validateField("email"));
  fields.category.addEventListener("change", () => validateField("category"));
  fields.message.addEventListener("input", () => {
    updateMessageCounter();
    validateField("message");
  });

  ratingInputs.forEach((input) => {
    input.addEventListener("change", () => validateField("rating"));
  });

  form.addEventListener("submit", handleSubmit);

  updateMessageCounter();
  renderFeedbackList();
});
