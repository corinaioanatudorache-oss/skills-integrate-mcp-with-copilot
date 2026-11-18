document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const signupContainer = document.getElementById("signup-container");
  const messageDiv = document.getElementById("message");
  const loginButton = document.getElementById("teacher-login-button");
  const logoutButton = document.getElementById("teacher-logout-button");
  const teacherStatus = document.getElementById("teacher-status");
  const loginDialog = document.getElementById("login-dialog");
  const loginForm = document.getElementById("login-form");
  const authMessage = document.getElementById("auth-message");
  let isTeacher = false;

  function showMessage(element, message, type) {
    element.textContent = message;
    element.className = type;
    element.classList.remove("hidden");
  }

  function updateTeacherControls() {
    signupContainer.classList.toggle("hidden", !isTeacher);
    loginButton.classList.toggle("hidden", isTeacher);
    logoutButton.classList.toggle("hidden", !isTeacher);
    teacherStatus.classList.toggle("hidden", !isTeacher);
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      if (!response.ok) {
        throw new Error("Could not load activities");
      }
      const activities = await response.json();

      activitiesList.replaceChildren();
      activitySelect.replaceChildren(activitySelect.options[0].cloneNode(true));

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const heading = document.createElement("h4");
        heading.textContent = name;
        activityCard.appendChild(heading);

        const description = document.createElement("p");
        description.textContent = details.description;
        activityCard.appendChild(description);

        const schedule = document.createElement("p");
        schedule.innerHTML = "<strong>Schedule:</strong> ";
        schedule.append(document.createTextNode(details.schedule));
        activityCard.appendChild(schedule);

        const availability = document.createElement("p");
        availability.innerHTML = "<strong>Availability:</strong> ";
        availability.append(
          document.createTextNode(
            `${details.max_participants - details.participants.length} spots left`
          )
        );
        activityCard.appendChild(availability);

        const participantsContainer = document.createElement("div");
        participantsContainer.className = "participants-container";
        if (details.participants.length > 0) {
          const participantsHeading = document.createElement("h5");
          participantsHeading.textContent = "Participants:";
          participantsContainer.appendChild(participantsHeading);

          const participantsList = document.createElement("ul");
          participantsList.className = "participants-list";
          details.participants.forEach((email) => {
            const participant = document.createElement("li");
            const participantEmail = document.createElement("span");
            participantEmail.className = "participant-email";
            participantEmail.textContent = email;
            participant.appendChild(participantEmail);

            if (isTeacher) {
              const unregisterButton = document.createElement("button");
              unregisterButton.className = "delete-btn";
              unregisterButton.type = "button";
              unregisterButton.textContent = "Unregister";
              unregisterButton.setAttribute(
                "aria-label",
                `Unregister ${email} from ${name}`
              );
              unregisterButton.dataset.activity = name;
              unregisterButton.dataset.email = email;
              unregisterButton.addEventListener("click", handleUnregister);
              participant.appendChild(unregisterButton);
            }
            participantsList.appendChild(participant);
          });
          participantsContainer.appendChild(participantsList);
        } else {
          const emptyMessage = document.createElement("p");
          emptyMessage.textContent = "No participants yet";
          participantsContainer.appendChild(emptyMessage);
        }
        activityCard.appendChild(participantsContainer);
        activitiesList.appendChild(activityCard);

        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.textContent =
        "Failed to load activities. Please try again later.";
      console.error("Error fetching activities:", error);
    }
  }

  async function refreshTeacherSession() {
    try {
      const response = await fetch("/auth/session");
      isTeacher = response.ok;
      updateTeacherControls();
    } catch (error) {
      console.error("Error checking teacher session:", error);
    }
  }

  async function handleUnregister(event) {
    const button = event.currentTarget;
    const activity = button.dataset.activity;
    const email = button.dataset.email;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (response.ok) {
        showMessage(messageDiv, result.message, "success");
        await fetchActivities();
      } else {
        showMessage(messageDiv, result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage(
        messageDiv,
        "Failed to unregister. Please try again.",
        "error"
      );
      console.error("Error unregistering:", error);
    }
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = activitySelect.value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );
      const result = await response.json();

      if (response.ok) {
        showMessage(messageDiv, result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(messageDiv, result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage(
        messageDiv,
        "Failed to sign up. Please try again.",
        "error"
      );
      console.error("Error signing up:", error);
    }
  });

  loginButton.addEventListener("click", () => {
    authMessage.classList.add("hidden");
    loginForm.reset();
    loginDialog.showModal();
  });

  document
    .getElementById("cancel-login-button")
    .addEventListener("click", () => loginDialog.close());

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const credentials = {
      username: document.getElementById("username").value,
      password: document.getElementById("password").value,
    };

    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const result = await response.json();

      if (!response.ok) {
        showMessage(authMessage, result.detail || "Login failed", "error");
        return;
      }

      isTeacher = true;
      updateTeacherControls();
      loginDialog.close();
      await fetchActivities();
    } catch (error) {
      showMessage(
        authMessage,
        "Failed to log in. Please try again.",
        "error"
      );
      console.error("Error logging in:", error);
    }
  });

  logoutButton.addEventListener("click", async () => {
    try {
      const response = await fetch("/auth/logout", { method: "POST" });
      if (!response.ok) {
        throw new Error("Logout failed");
      }
      isTeacher = false;
      updateTeacherControls();
      messageDiv.classList.add("hidden");
      await fetchActivities();
    } catch (error) {
      console.error("Error logging out:", error);
      showMessage(
        messageDiv,
        "Failed to log out. Please try again.",
        "error"
      );
    }
  });

  async function initialize() {
    await refreshTeacherSession();
    await fetchActivities();
  }

  initialize();
});
