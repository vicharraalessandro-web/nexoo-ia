export async function onRequestPost(context) {
  try {
    const { history = [], business = "barberia-central" } =
      await context.request.json();

    // 1. Buscar el negocio en Supabase
    const businessResponse = await fetch(
      `${context.env.SUPABASE_URL}/rest/v1/businesses?slug=eq.${encodeURIComponent(
        business
      )}&select=*`,
      {
        method: "GET",
        headers: {
          apikey: context.env.SUPABASE_SECRET_KEY,
          Authorization: `Bearer ${context.env.SUPABASE_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const businessData = await businessResponse.json();

    if (!businessResponse.ok) {
      console.error("Error Supabase:", businessData);

      return Response.json(
        {
          error: "No he podido cargar la información del negocio."
        },
        { status: 500 }
      );
    }

    if (!businessData.length) {
      return Response.json(
        {
          error: "Negocio no encontrado."
        },
        { status: 404 }
      );
    }

    const negocioDB = businessData[0];

    // 2. Crear las instrucciones dinámicamente
    const negocio = `
Eres el asistente virtual de ${negocioDB.name}.

INFORMACIÓN DEL NEGOCIO:

Nombre:
${negocioDB.name}

Dirección:
${negocioDB.address || "No especificada"}

Horario:
${negocioDB.opening_hours || "No especificado"}

Servicios:
${negocioDB.services || "No especificados"}

OBJETIVO:
Atender al cliente como una recepcionista real, natural, eficiente y amable.

REGLAS MUY IMPORTANTES:

- Lee toda la conversación antes de responder.
- Recuerda toda la información que el cliente ya haya proporcionado.
- Si ya sabes su nombre, NO vuelvas a preguntarlo.
- Si ya sabes qué servicio quiere, NO vuelvas a preguntarlo.
- Si ya sabes el día y la hora, NO vuelvas a preguntar esos datos.
- Si la cita ya fue confirmada, NO vuelvas a ofrecer reservar.
- Si la cita está confirmada, responde de forma natural.
- No repitas información innecesariamente.
- No hagas preguntas que ya fueron respondidas.
- No inventes horarios, precios, citas o información del negocio.
- Usa únicamente la información del negocio proporcionada arriba.
- Si no sabes algo, dilo claramente.
- Responde siempre en español.
- Sé breve, amable y natural.
- No hables como un robot.
`;

    // 3. Convertir el historial al formato de Gemini
    const contents = history.map(item => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [
        {
          text: item.text
        }
      ]
    }));

    // 4. Mandar la conversación a Gemini
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
      reply,
      business: {
        slug: negocioDB.slug,
        name: negocioDB.name
      }
    });

  } catch (error) {
    console.error("Error general:", error);

    return Response.json(
      {
        error: "Ha ocurrido un error."
      },
      { status: 500 }
    );
  }
}
