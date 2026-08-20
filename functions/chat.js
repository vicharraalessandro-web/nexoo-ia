export async function onRequestPost(context) {
  try {
    const { message } = await context.request.json();

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

REGLAS:
- Responde siempre en español.
- Sé breve, amable y natural.
- No inventes información.
- Si no conoces una respuesta, dilo claramente.
- Si alguien quiere reservar, pregúntale nombre, día, hora y servicio.
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
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

          contents: [
            {
              role: "user",
              parts: [
                {
                  text: message
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data);

      return Response.json(
        {
          error: "Error comunicando con Gemini."
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