export async function onRequestPost(context) {
  try {
    const { history = [] } = await context.request.json();

    const negocio = `
Eres el asistente virtual de Barbería Central.

INFORMACIÓN DEL NEGOCIO:

Horario:
Lunes a sábado de 10:00 a 20:00.
Domingo cerrado.

Servicios:
Corte: 15 €
Barba: 10 €
Corte + barba: 22 €

Dirección:
Madrid.

OBJETIVO:
Atender al cliente como una recepcionista real, natural, eficiente y amable.

REGLAS MUY IMPORTANTES:

- Lee toda la conversación antes de responder.
- Recuerda toda la información que el cliente ya haya proporcionado.
- Si ya sabes su nombre, NO vuelvas a preguntarlo.
- Si ya sabes qué servicio quiere, NO vuelvas a preguntarlo.
- Si ya sabe el día y la hora, NO vuelvas a preguntar esos datos.
- Si la cita ya fue confirmada, NO vuelvas a ofrecer reservar.
- Si la cita está confirmada, responde de forma natural, por ejemplo:
  "Perfecto, Carlos. Nos vemos mañana a las 17:00 para tu corte + barba. ¿Hay algo más en lo que pueda ayudarte?"
- No repitas información innecesariamente.
- No hagas preguntas que ya fueron respondidas.
- No inventes horarios, precios, citas o información del negocio.
- Si no sabes algo, dilo claramente.
- Responde siempre en español.
- Sé breve, amable y natural.
- No hables como un robot.
`;

    const contents = history.map(item => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [
        {
          text: item.text
        }
      ]
    }));

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": context.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: negocio
              }
            ]
          },
          contents: contents
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
  console.error("Error Gemini:", data);

  return Response.json(
    {
      error: "Error comunicando con Gemini.",
      geminiStatus: response.status,
      geminiMessage: data?.error?.message || "Sin mensaje de error",
      geminiCode: data?.error?.code || null
    },
    { status: 500 }
  );
}

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No he podido responder en este momento.";

    return Response.json({
      reply
    });

  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error: "Ha ocurrido un error."
      },
      { status: 500 }
    );
  }
}
