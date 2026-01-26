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
                        content: "You are a financial auditor. Extract the Merchant, Total, and Date. Furthermore, analyze the item list to categorize the spending sentiment as 'Survival', 'Investment', or 'Regret'. Output JSON only. Format: { merchant: string, total: number, date: string, items: string[], sentiment: 'Survival' | 'Investment' | 'Regret' }"
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
