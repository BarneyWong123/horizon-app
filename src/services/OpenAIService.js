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
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });

            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `You are a financial auditor that analyzes receipt images. 
Current Date: ${dateStr} (${dayName})

IMPORTANT: First determine if the image is actually a receipt or invoice with prices. If the image is NOT a receipt (e.g., a random photo, document, screenshot, or image without pricing information), respond with:
{
  "success": false,
  "error": "This image does not appear to be a receipt. Please upload a clear photo of a receipt or invoice with prices."
}

If the image IS a valid receipt, extract the following:
1. Merchant name: Be as accurate as possible.
2. Total amount: Extract the final total (number only, no currency symbols).
3. Date: Extract the date on the receipt in ISO format (YYYY-MM-DD). If "Yesterday", "Last Friday", etc. are mentioned or if the year is missing, calculate it relative to the Current Date provided. If no date is visible, use ${dateStr}.
4. Itemized list: Extract names and prices for identifiable items.
5. Spending sentiment: 'Survival' (essentials/necessities), 'Investment' (education/health/assets), or 'Regret' (impulse/unnecessary).
6. Category: Choose the BEST match from [food, transport, shopping, bills, entertainment, health, travel, income, transfer, other].

Category guidance:
- food: restaurants, groceries, cafes, delivery
- transport: gas, uber, parking, transit
- shopping: retail, amazon, clothing, electronics
- bills: utilities, subscriptions, phone, rent
- entertainment: movies, games, streaming, events
- health: pharmacy, gym, medical
- travel: hotels, flights, vacation
- other: anything else

For valid receipts, output JSON:
{
  "success": true,
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
    },

    /**
     * Get current exchange rates from OpenAI
     * Returns rates relative to USD as base currency
     */
    async getExchangeRates() {
        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `You are a financial data assistant. Provide current approximate exchange rates for major currencies relative to 1 USD. 
Be as accurate as possible based on your knowledge of current market rates.
Output JSON only with currency codes as keys and rates as values.
Include these currencies: USD, EUR, GBP, MYR, THB, SGD, JPY, CNY, AUD, INR, PHP, IDR, VND, KRW, HKD.
Example format: { "USD": 1, "EUR": 0.92, "GBP": 0.79, ... }`
                    },
                    {
                        role: "user",
                        content: "Provide current exchange rates for all listed currencies relative to 1 USD."
                    }
                ],
                response_format: { type: "json_object" },
            });

            return JSON.parse(response.choices[0].message.content);
        } catch (error) {
            console.error("Error fetching exchange rates:", error);
            // Return fallback rates if API fails
            return {
                USD: 1,
                EUR: 0.92,
                GBP: 0.79,
                MYR: 4.47,
                THB: 35.5,
                SGD: 1.34,
                JPY: 149.5,
                CNY: 7.24,
                AUD: 1.53,
                INR: 83.1,
                PHP: 56.2,
                IDR: 15850,
                VND: 24500,
                KRW: 1320,
                HKD: 7.82
            };
        }
    },

    /**
     * Transcribe audio using OpenAI Whisper
     * @param {File|Blob} audioFile - Audio file to transcribe
     * @returns {Promise<string>} - Transcribed text
     */
    async transcribeAudio(audioFile) {
        try {
            const response = await openai.audio.transcriptions.create({
                file: audioFile,
                model: "whisper-1",
            });
            return response.text;
        } catch (error) {
            console.error("Error transcribing audio:", error);
            throw error;
        }
    },

    /**
     * Parse a voice transcription into transaction data
     * @param {string} transcript - The transcribed text
     * @returns {Promise<Object>} - Parsed transaction object
     */
    async parseVoiceTransaction(transcript) {
        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `You are a financial assistant that parses voice memos about expenses into structured data.
Extract the following from the user's voice memo:
1. merchant: The store or vendor name
2. total: The amount spent (number only)
3. date: The date in ISO format (YYYY-MM-DD). If not mentioned, use today's date.
4. category: Choose from [food, transport, shopping, bills, entertainment, health, travel, income, transfer, other]
5. sentiment: 'Survival' (essentials), 'Investment' (education/health), or 'Regret' (impulse/unnecessary)

Output JSON only:
{
  "merchant": "string",
  "total": number,
  "date": "YYYY-MM-DD",
  "category": "food|transport|shopping|bills|entertainment|health|travel|income|transfer|other",
  "sentiment": "Survival|Investment|Regret"
}`
                    },
                    {
                        role: "user",
                        content: `Parse this voice memo about an expense: "${transcript}"`
                    }
                ],
                response_format: { type: "json_object" },
            });

            return JSON.parse(response.choices[0].message.content);
        } catch (error) {
            console.error("Error parsing voice transaction:", error);
            throw error;
        }
    }
};
