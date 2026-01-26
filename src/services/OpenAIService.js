import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
});

export const OpenAIService = {
    /**
     * Scans a receipt image using GPT-4o vision
     * @param {string} base64Image - Base64 encoded image string
     */
    async scanReceipt(base64Image) {
        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `You are a financial auditor. Analyze this receipt and extract:
1. Merchant name
2. Total amount (number only, no currency symbols)
3. Date in ISO format (YYYY-MM-DD), use today's date if not visible
4. Itemized list with name and price for each item
5. Spending sentiment: 'Survival' (essentials/necessities), 'Investment' (education/health/assets), or 'Regret' (impulse/unnecessary)
6. Category: Choose the BEST match from [food, transport, shopping, bills, entertainment, health, travel, income, transfer, other]

Category guidance:
- food: restaurants, groceries, cafes, delivery
- transport: gas, uber, parking, transit
- shopping: retail, amazon, clothing
- bills: utilities, subscriptions, phone
- entertainment: movies, games, streaming
- health: pharmacy, gym, medical
- travel: hotels, flights, vacation
- other: anything else

Output JSON only:
{
  "merchant": "string",
  "total": number,
  "date": "YYYY-MM-DD",
  "items": [{ "name": "string", "price": number }],
  "sentiment": "Survival|Investment|Regret",
  "category": "food|transport|shopping|bills|entertainment|health|travel|income|transfer|other"
}`
                    },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Please analyze this receipt." },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64Image}`,
                                },
                            },
                        ],
                    },
                ],
                response_format: { type: "json_object" },
            });

            return JSON.parse(response.choices[0].message.content);
        } catch (error) {
            console.error("Error scanning receipt:", error);
            throw error;
        }
    },

    /**
     * Chat interface for the Financial Auditor using GPT-4o-mini
     * @param {Array} messages - Chat history
     * @param {Array} transactions - User's transaction history for context
     */
    async chatWithAuditor(messages, transactions) {
        try {
            const systemPrompt = `You are the Horizon Chat Auditor. You have access to the user's transaction history below. 
      Use this data to answer their questions accurately. Be concise and professional.
      
      TRANSACTIONS:
      ${JSON.stringify(transactions)}
      
      If asked about totals, dates, or specific spending habits, refer to the data above.`;

            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    ...messages
                ],
            });

            return response.choices[0].message.content;
        } catch (error) {
            console.error("Error in chat auditor:", error);
            throw error;
        }
    }
};
