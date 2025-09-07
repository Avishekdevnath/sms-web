// Test script for V2 mission creation (Phitron CSE Fundamental)
const testMissionCreation = async () => {
  const baseUrl = 'http://localhost:3000';
  
  // Test data for Phitron CSE Fundamental mission
  const cseFundamentalMission = {
    title: "CSE Fundamental - Phitron",
    description: "Computer Science & Engineering fundamentals covering programming basics, algorithms, and problem-solving",
    batchId: "507f1f77bcf86cd799439011", // Example ObjectId
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    maxStudents: 100,
    requirements: [
      "Basic computer literacy",
      "High school mathematics",
      "Logical thinking skills"
    ],
    rewards: [
      "Programming fundamentals",
      "Problem-solving skills",
      "Algorithmic thinking",
      "Career foundation in CS"
    ],
    status: "draft",
    courses: [
      {
        courseOfferingId: "507f1f77bcf86cd799439012",
        weight: 30,
        requiredAssignments: [],
        minProgress: 70
      },
      {
        courseOfferingId: "507f1f77bcf86cd799439013",
        weight: 40,
        requiredAssignments: [],
        minProgress: 70
      },
      {
        courseOfferingId: "507f1f77bcf86cd799439014",
        weight: 30,
        requiredAssignments: [],
        minProgress: 70
      }
    ]
  };

  // Test data for mission with custom code
  const customCodeMission = {
    code: "MISSION-CSE-FUND", // Custom code for Phitron
    title: "CSE Fundamental - Advanced Track",
    description: "Advanced Computer Science fundamentals for Phitron students",
    batchId: "507f1f77bcf86cd799439011",
    startDate: "2024-02-01",
    endDate: "2024-11-30",
    maxStudents: 50,
    requirements: [
      "Completed basic CSE course",
      "Strong programming skills",
      "Advanced mathematics"
    ],
    rewards: [
      "Advanced CS concepts",
      "Industry-ready skills",
      "Project portfolio",
      "Mentorship opportunities"
    ],
    status: "draft",
    courses: [
      {
        courseOfferingId: "507f1f77bcf86cd799439015",
        weight: 50,
        requiredAssignments: [],
        minProgress: 80
      },
      {
        courseOfferingId: "507f1f77bcf86cd799439016",
        weight: 50,
        requiredAssignments: [],
        minProgress: 80
      }
    ]
  };

  try {
    console.log('🚀 Testing V2 Mission Creation for Phitron...');
    
    // Test 1: Auto-generated code mission
    console.log('\n🧪 Test 1: CSE Fundamental with Auto-Generated Code...');
    
    const autoCodeResponse = await fetch(`${baseUrl}/api/v2/missions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add your auth token here
        'Cookie': 'your-auth-cookie-here'
      },
      body: JSON.stringify(cseFundamentalMission)
    });
    
    console.log('Auto Code Response Status:', autoCodeResponse.status);
    const autoCodeResult = await autoCodeResponse.text();
    console.log('Auto Code Response:', autoCodeResult);
    
    // Test 2: Custom code mission
    console.log('\n🧪 Test 2: CSE Fundamental with Custom Code...');
    
    const customCodeResponse = await fetch(`${baseUrl}/api/v2/missions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add your auth token here
        'Cookie': 'your-auth-cookie-here'
      },
      body: JSON.stringify(customCodeMission)
    });
    
    console.log('Custom Code Response Status:', customCodeResponse.status);
    const customCodeResult = await customCodeResponse.text();
    console.log('Custom Code Response:', customCodeResult);
    
    // Test 3: List all missions
    console.log('\n🧪 Test 3: List All V2 Missions...');
    
    const listResponse = await fetch(`${baseUrl}/api/v2/missions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add your auth token here
        'Cookie': 'your-auth-cookie-here'
      }
    });
    
    console.log('List Response Status:', listResponse.status);
    const listResult = await listResponse.text();
    console.log('List Response:', listResult);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
console.log('🎯 Starting Phitron CSE Fundamental Mission Tests...');
console.log('📚 Testing V2 Mission System with CSE Fundamental Course...');
testMissionCreation();
