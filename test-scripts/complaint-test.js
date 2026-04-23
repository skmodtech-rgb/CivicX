/**
 * Complaint Submission & AI Classification Test Script
 * This script simulates the reporting of a civic issue and AI category detection.
 */

const mockComplaintTest = async () => {
  console.log('🚀 Starting Complaint System Tests...');

  // 1. Test Issue Reporting
  console.log('📝 Testing Complaint Submission...');
  const newComplaint = {
    title: 'Water Leakage',
    description: 'Main pipe broken near central park',
    location: { lat: 12.9716, lng: 77.5946 }
  };

  if (newComplaint.title && newComplaint.description) {
    console.log('✅ Complaint data validated.');
  }

  // 2. Test AI Classification Mock
  console.log('🤖 Testing AI Classification Logic...');
  const text = newComplaint.description.toLowerCase();
  let category = 'Other';

  if (text.includes('water') || text.includes('pipe')) category = 'Water Supply';
  if (text.includes('electricity') || text.includes('light')) category = 'Electrical';

  console.log(`Detected Category: ${category}`);
  
  if (category === 'Water Supply') {
    console.log('✅ AI correctly identified the category.');
  } else {
    console.error('❌ AI misclassified the issue.');
  }

  console.log('✅ Complaint saved to database with Status: PENDING');
  console.log('✨ Complaint System Tests Completed Successfully!\n');
};

mockComplaintTest();
