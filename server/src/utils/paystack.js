const PAYSTACK_BASE_URL = "https://api.paystack.co";

async function paystackRequest(path, { method = "GET", body } = {}) {
  const res = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok || !data.status) {
    throw new Error(data.message || "Paystack request failed");
  }

  return data.data;
}

function initializeTransaction({ email, amount, reference, callback_url, metadata }) {
  return paystackRequest("/transaction/initialize", {
    method: "POST",
    body: { email, amount, reference, callback_url, metadata },
  });
}

function verifyTransaction(reference) {
  return paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`);
}

module.exports = { initializeTransaction, verifyTransaction };
