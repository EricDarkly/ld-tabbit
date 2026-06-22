import { aiClient } from "../ld.js";
import { LangChainProvider } from "@launchdarkly/server-sdk-ai-langchain";
import { mapAiConfigTools } from "./toolsHelper.js";
import { AIMessage, createAgent, HumanMessage } from "langchain";
import { ChatOpenAI } from "@langchain/openai";

const defaultLdContext = { kind: "user", key: "claim-parser" };

function extractJsonFromAiResponse(raw) {
  const text = String(raw).trim();
  if (!text) {
    return text;
  }

  const fence =
    /^```(?:json)?\s*\r?\n?([\s\S]*?)\r?\n?```/im.exec(text) ??
    /```(?:json)?\s*\r?\n?([\s\S]*?)\r?\n?```/im.exec(text);
  if (fence) {
    return fence[1].trim();
  }

  const start = text.indexOf("{");
  if (start === -1) {
    return text;
  }

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (c === "\\") {
        escape = true;
      } else if (c === '"') {
        inString = false;
      }
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === "{") {
      depth++;
    } else if (c === "}") {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return text.slice(start);
}

function numOrZero(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function computeSharedOverheadAmount(lineItems, receiptTotals, hasClaimRows) {
  if (!hasClaimRows || !receiptTotals) {
    return 0;
  }

  const linesSum = lineItems.reduce((s, li) => s + numOrZero(li.line_total), 0);
  if (linesSum <= 0) {
    return 0;
  }

  const tax = numOrZero(receiptTotals.tax_total);
  const tip = numOrZero(receiptTotals.tip_total);
  const subtotalRaw = receiptTotals.subtotal;
  const sub =
    subtotalRaw != null && subtotalRaw !== ""
      ? numOrZero(subtotalRaw)
      : linesSum;
  const unitemized = Math.max(0, sub - linesSum);
  const sharedPool = tax + tip + unitemized;

  const nRaw = Number(receiptTotals.split_party_size);
  const partySize =
    Number.isFinite(nRaw) && nRaw >= 1
      ? Math.min(Math.max(Math.round(nRaw), 1), 100)
      : 1;
  const perDiner = sharedPool / partySize;
  return perDiner > 0 ? round2(perDiner) : 0;
}

export function buildReceiptClaimRows(
  rawAllocations,
  lineItems,
  receiptTotals,
) {
  const byId = new Map(lineItems.map((li) => [li.id, li]));
  const qtyByLine = new Map();

  for (const a of rawAllocations) {
    const id = Number(a.lineItemId);
    const li = byId.get(id);
    if (!li) {
      continue;
    }
    let q = Number(a.quantityClaimed);
    if (!Number.isFinite(q) || q <= 0) {
      continue;
    }
    const lineQty = Number(li.quantity);
    if (!Number.isFinite(lineQty) || lineQty <= 0) {
      continue;
    }
    q = Math.min(q, lineQty);
    const prev = qtyByLine.get(id) ?? 0;
    qtyByLine.set(id, Math.min(prev + q, lineQty));
  }

  const rows = [];
  for (const [id, q] of qtyByLine) {
    const li = byId.get(id);
    if (!li) {
      continue;
    }
    const unit = Number(li.unit_price);
    const lineTotal = Number(li.line_total);
    if (!Number.isFinite(unit) || !Number.isFinite(lineTotal)) {
      continue;
    }
    let allocated = Math.round(q * unit * 100) / 100;
    allocated = Math.min(allocated, lineTotal);
    rows.push({
      receipt_line_item_id: id,
      quantity_claimed: q,
      allocated_amount: allocated,
    });
  }
  const sharedOverheadAmount = computeSharedOverheadAmount(
    lineItems,
    receiptTotals,
    rows.length > 0,
  );
  return { claimRows: rows, sharedOverheadAmount };
}

async function invokeClaimAgent(agent, plainText) {
  const response = await agent.invoke({
    messages: [
      new HumanMessage({
        content: plainText,
      }),
    ],
  });

  const lastAi = response.messages
    .filter((m) => AIMessage.isInstance(m))
    .at(-1);
  if (!lastAi) {
    throw new Error("Claim agent returned no assistant message.");
  }

  return lastAi;
}

// Replace LangChainProvider.createLangChainModel with a Databricks-backed ChatOpenAI instance
function createDatabricksModel(agentConfig) {
  return new ChatOpenAI({
    model: "databricks-dbrx-instruct",
    temperature: agentConfig.model?.temperature ?? 0,
    openAIApiKey: process.env.DATABRICKS_TOKEN,        // your Databricks PAT
    configuration: {
      baseURL: `${process.env.DATABRICKS_HOST}/serving-endpoints`,
    },
    // pass through any other model params from agentConfig
    ...agentConfig.model?.params,
  });
}


export async function parsePlainTextToReceiptClaims(
  plainText,
  lineItems,
  receiptTotals,
) {
  if (!plainText.trim()) {
    return { allocations: [], claimRows: [], sharedOverheadAmount: 0 };
  }
  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    return { allocations: [], claimRows: [], sharedOverheadAmount: 0 };
  }

  // LaunchDarkly
  const fallbackAgentConfig = { enabled: false };
  const agentConfig = await aiClient.agentConfig(
    "claim-parser",
    defaultLdContext,
    fallbackAgentConfig,
    { line_items: JSON.stringify(lineItems) },
  );

  // LaunchDarkly - create tracker
  const tracker = agentConfig.createTracker();

  if (!agentConfig.enabled || !tracker) {
    throw new Error("Claim parser AI config is disabled or missing a tracker.");
  }

  // LaunchDarkly - create model
  const model = await LangChainProvider.createLangChainModel(agentConfig);

  // LangChain - create agent
  const agent = createAgent({
    model,
    tools: mapAiConfigTools(agentConfig),
    systemPrompt: agentConfig.instructions,
    // Custom schema from the AI Config object
    responseFormat: agentConfig.model.custom.schema,
  });

  // LaunchDarkly - track metrics
  const aiMessage = await tracker.trackMetricsOf(
    LangChainProvider.getAIMetricsFromResponse,
    () => invokeClaimAgent(agent, plainText),
  );

  const data = JSON.parse(extractJsonFromAiResponse(aiMessage.text));

  const allocations = Array.isArray(data.allocations)
    ? data.allocations.map((a) => ({
        lineItemId: Number(a.lineItemId),
        quantityClaimed: Number(a.quantityClaimed),
        notes: typeof a.notes === "string" ? a.notes : "",
      }))
    : [];

  const { claimRows, sharedOverheadAmount } = buildReceiptClaimRows(
    allocations,
    lineItems,
    receiptTotals,
  );
  return { allocations, claimRows, sharedOverheadAmount };
}
