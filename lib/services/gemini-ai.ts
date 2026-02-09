"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export interface ReorderRecommendation {
    recommendations: {
        critical: ProductRecommendation[]
        recommended: ProductRecommendation[]
        optional: ProductRecommendation[]
    }
    budgetAllocation: {
        supplierId: string
        supplierName: string
        allocatedBudget: number
        priority: "high" | "medium" | "low"
    }[]
    insights: string[]
    riskAlerts: string[]
    totalEstimatedCost: number
}

export interface ProductRecommendation {
    productId: string
    productName: string
    currentStock: number
    recommendedQuantity: number
    estimatedCost: number
    urgency: "critical" | "high" | "medium" | "low"
    reasoning: string
    daysUntilStockout: number
    supplierId: string
    supplierName: string
}

export async function getAIReorderRecommendations(data: {
    salesHistory: any[]
    inventory: any[]
    suppliers: any[]
    financials: any
    products: any[]
}): Promise<{ success: boolean; data?: ReorderRecommendation; error?: string }> {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are an expert inventory management AI assistant. Analyze the following data and provide intelligent reorder recommendations.

SALES HISTORY (Last 30/60 days):
${JSON.stringify(data.salesHistory, null, 2)}

CURRENT INVENTORY:
${JSON.stringify(data.inventory, null, 2)}

SUPPLIER INFORMATION:
${JSON.stringify(data.suppliers, null, 2)}

FINANCIAL DATA:
${JSON.stringify(data.financials, null, 2)}

PRODUCT DATABASE:
${JSON.stringify(data.products, null, 2)}

Your task:
1. Identify CRITICAL products (will stock out in <7 days based on sales velocity)
2. Suggest RECOMMENDED products to reorder this week (optimal for inventory levels)
3. Provide OPTIONAL products (can wait but good to consider)
4. Allocate the available budget across suppliers based on:
   - Product urgency
   - Profit margins
   - Supplier reliability
5. Calculate optimal order quantities based on:
   - Daily sales velocity
   - Lead time
   - Current stock
   - Cash flow constraints
6. Identify risks (slow-moving inventory, declining trends)
7. Provide actionable insights

IMPORTANT: Return ONLY valid JSON in this exact structure (no markdown, no explanations outside JSON):
{
  "recommendations": {
    "critical": [
      {
        "productId": "string",
        "productName": "string",
        "currentStock": number,
        "recommendedQuantity": number,
        "estimatedCost": number,
        "urgency": "critical",
        "reasoning": "string",
        "daysUntilStockout": number,
        "supplierId": "string",
        "supplierName": "string"
      }
    ],
    "recommended": [],
    "optional": []
  },
  "budgetAllocation": [
    {
      "supplierId": "string",
      "supplierName": "string",
      "allocatedBudget": number,
      "priority": "high"
    }
  ],
  "insights": ["string"],
  "riskAlerts": ["string"],
  "totalEstimatedCost": number
}`

        const result = await model.generateContent(prompt)
        const response = result.response
        const text = response.text()

        // Extract JSON from response (handle markdown code blocks)
        let jsonText = text.trim()
        if (jsonText.startsWith("```json")) {
            jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "")
        } else if (jsonText.startsWith("```")) {
            jsonText = jsonText.replace(/```\n?/g, "")
        }

        const parsed = JSON.parse(jsonText) as ReorderRecommendation

        return { success: true, data: parsed }
    } catch (error) {
        console.error("Gemini AI Error:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get AI recommendations",
        }
    }
}

export async function generateWeeklyReorderReport(data: {
    salesHistory: any[]
    inventory: any[]
    suppliers: any[]
    financials: any
    products: any[]
    weekStartDate: string
    weekEndDate: string
}): Promise<{ success: boolean; report?: string; error?: string }> {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are an expert inventory analyst. Generate a comprehensive weekly reorder report.

REPORT PERIOD: ${data.weekStartDate} to ${data.weekEndDate}

SALES DATA:
${JSON.stringify(data.salesHistory, null, 2)}

INVENTORY:
${JSON.stringify(data.inventory, null, 2)}

SUPPLIERS:
${JSON.stringify(data.suppliers, null, 2)}

FINANCIALS:
${JSON.stringify(data.financials, null, 2)}

PRODUCTS:
${JSON.stringify(data.products, null, 2)}

Create a detailed weekly report with:
1. Executive Summary (key metrics, budget available)
2. Critical Actions (urgent reorders required)
3. Strategic Recommendations (next 2-4 weeks)
4. Performance Insights (fast/slow movers, trends)
5. Supplier Breakdown (recommended POs per supplier)
6. Risk Alerts (declining sales, aging inventory)

Format as professional markdown with clear sections, bullet points, and tables where appropriate.`

        const result = await model.generateContent(prompt)
        const response = result.response
        const report = response.text()

        return { success: true, report }
    } catch (error) {
        console.error("Gemini AI Report Error:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to generate report",
        }
    }
}
