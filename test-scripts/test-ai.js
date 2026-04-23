require('dotenv').config();
const { analyzeComplaint } = require('../server/services/aiEngine');

async function runDiagnostics() {
  console.log('\n🧠 CivicX AI Engine — Diagnostics\n');
  console.log('─'.repeat(50));

  const testCases = [
    {
      title: 'Massive pothole on MG Road',
      description: 'There is a huge pothole near the MG Road intersection that has caused two accidents this week. Very dangerous for motorcyclists.'
    },
    {
      title: 'Garbage dump near school',
      description: 'Someone has been dumping garbage next to the government school. The smell is terrible and children are getting sick.'
    },
    {
      title: 'Streetlight not working',
      description: 'The streetlight on 5th Cross Road has been off for 3 weeks. It is very dark at night and unsafe for women.'
    }
  ];

  for (const test of testCases) {
    console.log(`\n📋 Test: "${test.title}"`);
    console.log(`   Input: "${test.description.substring(0, 60)}..."`);

    try {
      const result = await analyzeComplaint(test.title, test.description);
      console.log(`   ✅ Category: ${result.category}`);
      console.log(`   ✅ Priority: ${result.priority}`);
      console.log(`   ✅ Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`   ✅ Urgency Score: ${result.urgency_score}/10`);
      console.log(`   ✅ Resolution: ${result.suggested_resolution}`);
      console.log(`   ✅ Source: ${result.source}`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n' + '─'.repeat(50));
  console.log('🏛️  Diagnostics complete.\n');
}

runDiagnostics();
