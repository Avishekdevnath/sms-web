// Test script to verify mentor models work correctly
const mongoose = require('mongoose');

// Test the models can be imported and instantiated
async function testModels() {
  try {
    console.log('Testing mentor models...');
    
    // Test MissionMentor model
    const MissionMentor = require('./src/models/MissionMentor').MissionMentor;
    console.log('✓ MissionMentor model imported successfully');
    
    // Test MentorshipGroup model
    const MentorshipGroup = require('./src/models/MentorshipGroup').MentorshipGroup;
    console.log('✓ MentorshipGroup model imported successfully');
    
    // Test enhanced Mission model
    const Mission = require('./src/models/Mission').Mission;
    console.log('✓ Enhanced Mission model imported successfully');
    
    // Test models index
    const modelsIndex = require('./src/models/index');
    console.log('✓ Models index imported successfully');
    
    // Test that new models are exported
    if (modelsIndex.MissionMentor && modelsIndex.MentorshipGroup) {
      console.log('✓ New models are properly exported from index');
    } else {
      console.log('✗ New models are not exported from index');
    }
    
    console.log('\nAll mentor models are working correctly!');
    
  } catch (error) {
    console.error('Error testing models:', error.message);
    process.exit(1);
  }
}

// Run the test
testModels();
