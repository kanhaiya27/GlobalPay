import axios from 'axios';

const API_URL = 'http://localhost:3000';

const headers = (token) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
});

async function runTests() {
  console.log('🧪 Starting API Tests...\n');
  
  let senderToken, senderUserId, receiverToken, receiverId;

  try {
    // Create fresh test users
    console.log('👤 Creating test users...\n');
    const senderEmail = `sender-${Date.now()}@test.com`;
    const receiverEmail = `receiver-${Date.now()}@test.com`;
    
    const senderSignup = await axios.post(
      `${API_URL}/auth/signup`,
      {
        email: senderEmail,
        password: 'TestPass123!',
        phone: `+1234567890${Math.floor(Math.random() * 100)}`
      }
    );
    senderToken = senderSignup.data.token;
    senderUserId = senderSignup.data.id;
    
    const receiverSignup = await axios.post(
      `${API_URL}/auth/signup`,
      {
        email: receiverEmail,
        password: 'TestPass123!',
        phone: `+0987654321${Math.floor(Math.random() * 100)}`
      }
    );
    receiverToken = receiverSignup.data.token;
    receiverId = receiverSignup.data.id;
    
    console.log(`✅ Created Sender: ${senderUserId}`);
    console.log(`✅ Created Receiver: ${receiverId}\n`);
    
    // Deposit funds to sender
    console.log('💳 Depositing funds to sender...\n');
    await axios.post(
      `${API_URL}/wallet/deposit`,
      {
        currency: 'USD',
        amount: 100
      },
      { headers: headers(senderToken) }
    );
    
    // Deposit funds to receiver
    await axios.post(
      `${API_URL}/wallet/deposit`,
      {
        currency: 'INR',
        amount: 5000
      },
      { headers: headers(receiverToken) }
    );
    console.log('✅ Deposits completed\n');
    // Test 1: Create Transaction
    console.log('📤 TEST 1: Create Transaction (USD→INR)');
    const txResponse = await axios.post(
      `${API_URL}/transactions/create`,
      {
        receiver_id: receiverId,
        amount_send: 50,
        from_currency: 'USD',
        to_currency: 'INR'
      },
      { headers: headers(senderToken) }
    );
    console.log('✅ Transaction Created:', txResponse.data.id);
    console.log('   Amount Sent:', txResponse.data.amount_sent, txResponse.data.from_currency);
    console.log('   Amount Received:', txResponse.data.amount_received, txResponse.data.to_currency);
    console.log('   Rate Used:', txResponse.data.exchange_rate_used);
    console.log('   Status:', txResponse.data.status, '\n');

    // Test 2: Get Transaction History
    console.log('📜 TEST 2: Get Transaction History');
    const historyResponse = await axios.get(
      `${API_URL}/transactions?limit=5&offset=0`,
      { headers: headers(senderToken) }
    );
    console.log('✅ Found', historyResponse.data.transactions.length, 'transactions');
    console.log('   Total:', historyResponse.data.total, '\n');

    // Test 3: Get Specific Transaction
    console.log('🔍 TEST 3: Get Transaction Details');
    const txId = txResponse.data.id;
    const detailResponse = await axios.get(
      `${API_URL}/transactions/${txId}`,
      { headers: headers(senderToken) }
    );
    console.log('✅ Retrieved Transaction:', detailResponse.data.id);
    console.log('   Status:', detailResponse.data.status, '\n');

    // Test 4: Check Balances After Transaction
    console.log('💰 TEST 4: Check Balances After Transaction');
    const senderBalance = await axios.get(
      `${API_URL}/wallet/USD`,
      { headers: headers(senderToken) }
    );
    console.log('✅ Sender USD Balance:', senderBalance.data.balance);

    const receiverINRBalance = await axios.get(
      `${API_URL}/wallet/INR`,
      { headers: headers(receiverToken) }
    );
    console.log('✅ Receiver INR Balance:', receiverINRBalance.data.balance, '\n');

    // Test 5: KYC Verification
    console.log('📋 TEST 5: KYC Verification');
    const kycResponse = await axios.post(
      `${API_URL}/kyc/verify`,
      {
        full_name: 'Test User',
        id_type: 'passport',
        id_number: 'AB123456'
      },
      { headers: headers(senderToken) }
    );
    console.log('✅ KYC Verified:', kycResponse.data.kyc_verified, '\n');

    // Test 6: Get All Wallets
    console.log('🏦 TEST 6: Get All Wallets');
    const walletsResponse = await axios.get(
      `${API_URL}/wallet`,
      { headers: headers(senderToken) }
    );
    console.log('✅ Wallets:');
    walletsResponse.data.wallets.forEach(w => {
      console.log(`   ${w.currency}: ${w.balance}`);
    });
    console.log();

    // Test 7: Test Error Handling - Invalid Currency
    console.log('❌ TEST 7: Error Handling - Invalid Currency');
    try {
      await axios.get(
        `${API_URL}/wallet/XXX`,
        { headers: headers(senderToken) }
      );
    } catch (error) {
      console.log('✅ Caught Expected Error:', error.response.data.code);
      console.log('   Message:', error.response.data.error, '\n');
    }

    // Test 8: Test Error Handling - Insufficient Funds
    console.log('❌ TEST 8: Error Handling - Insufficient Funds');
    try {
      await axios.post(
        `${API_URL}/transactions/create`,
        {
          receiver_id: receiverId,
          amount_send: 999999,
          from_currency: 'USD',
          to_currency: 'INR'
        },
        { headers: headers(senderToken) }
      );
    } catch (error) {
      console.log('✅ Caught Expected Error:', error.response.data.code);
      console.log('   Message:', error.response.data.error, '\n');
    }

    console.log('🎉 All Tests Completed Successfully!\n');

  } catch (error) {
    console.error('❌ Test Failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

runTests();
