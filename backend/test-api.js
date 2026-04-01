async function test(message, data) {
  try {
    const res = await fetch('http://localhost:3001/chat', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, financialData: data })
    });
    const result = await res.json();
    console.log(`[${result.agent}]: ${result.response}`);
    console.log(`Fallback triggered: ${result.fallback ? 'YES' : 'NO'}`);
  } catch (err) {
    console.error(err);
  }
}

async function runAll() {
  console.log('Testing Advisor Agent...');
  await test("Should I save money this week?", {});
  
  console.log('Testing Risk Agent...');
  await test("Can I afford to buy a new car?", { income: 80000, spent: 45000, remaining: 35000 });
  
  console.log('Testing Future Agent...');
  await test("Predict my financial future based on these", { income: 80000, spent: 45000, remaining: 35000 });
}

runAll();
