// version 2
const chat = document.getElementById("chat");
const input = document.getElementById("messageInput");
const button = document.getElementById("sendButton");

button.addEventListener("click", sendMessage);

input.addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    sendMessage();
  }
});

async function sendMessage() {
  const text = input.value.trim();

  if (!text) return;

  addMessage(text, "user");

  input.value = "";

  button.disabled = true;

  const thinking = addMessage("Pensando...", "bot");

  try {
    const response = await fetch("/chat", {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        message: text
      })
    });

    const data = await response.json();

    thinking.remove();

    if (!response.ok) {
      addMessage("Ha ocurrido un error. Inténtalo de nuevo.", "bot");
      return;
    }

    addMessage(data.reply, "bot");

  } catch (error) {
    thinking.remove();

    addMessage(
      "No he podido conectar con el asistente.",
      "bot"
    );
  }

  button.disabled = false;
  input.focus();
}

function addMessage(text, type) {
  const message = document.createElement("div");

  message.classList.add("message", type);

  message.textContent = text;

  chat.appendChild(message);

  chat.scrollTop = chat.scrollHeight;

  return message;
}
