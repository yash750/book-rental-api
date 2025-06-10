const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();
// Configurations
const SOURCE_DIRS = ['controllers', 'routes', 'models'];
const PROMPT_FILE = '.codex-prompt.txt';
const TESTS_ROOT = path.join('tests', 'generated');
const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = 'gpt-4'; // or 'gpt-4o'

// Ensure required configurations are set
if (!API_KEY) {
  console.error('❌ OPENAI_API_KEY is not set.');
  process.exit(1);
}

if (!fs.existsSync(PROMPT_FILE)) {
  console.error(`❌ Missing ${PROMPT_FILE}`);
  process.exit(1);
}

const SYSTEM_PROMPT = fs.readFileSync(PROMPT_FILE, 'utf8');

// Function to read the directory structure from README.md
const getDirectoryStructure = () => {
  const readmePath = path.join(__dirname, 'README.md');
  if (!fs.existsSync(readmePath)) {
    throw new Error('README.md not found');
  }

  const readmeContent = fs.readFileSync(readmePath, 'utf-8');

  // Regex to match directory structure like 'book-rental-api', 'controllers', 'models', etc.
  const directoryStructurePattern = /book-rental-api[\s\S]*?server\.js/g;
  const match = readmeContent.match(directoryStructurePattern);

  if (!match || match.length === 0) {
    throw new Error('Directory structure not found in README.md');
  }

  // Extract and return the directory structure
  const directoryStructure = match[0].trim();
  return directoryStructure;
};

// Function to get all JS files in specified directories
function getAllJsFiles(dir, baseDir = dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      results = results.concat(getAllJsFiles(filePath, baseDir));
    } else if (file.endsWith('.js') && !file.endsWith('.test.js')) {
      const relPath = path.relative(baseDir, filePath);
      results.push({ fullPath: filePath, relativePath: relPath });
    }
  });
  return results;
}

// Function to clean up the generated test code
function cleanTestCode(testCode) {
  // Remove triple backticks and extra markdown formatting
  testCode = testCode.replace(/```[a-zA-Z0-9]*\n?/g, '').replace(/```/g, '').trim();

  // Remove unnecessary empty lines or spaces
  testCode = testCode.replace(/\n{2,}/g, '\n').trim();

  return testCode;
}

// Function to generate test code using Codex
async function generateTestCode(sourcePath, relPath, directoryStructure) {
  const code = fs.readFileSync(sourcePath, 'utf8');

  // Create the full prompt by including directory structure
  const fullPrompt = SYSTEM_PROMPT.replace(
    'The project directory structure is as follows:',
    `The project directory structure is as follows:\n\n${directoryStructure}`
  );

  // Call Codex API to generate test cases for the provided source code
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: MODEL,
      messages: [
        { role: 'system', content: fullPrompt },
        { role: 'user', content: `Analyze this file and generate complete Jest test cases per your QA strategy:\n\n${code}` }
      ],
      temperature: 0.2,
    },
    {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  let testCode = response.data.choices[0].message.content;

  // Clean the test code (remove strings, comments, placeholders, and unnecessary parts)
  testCode = cleanTestCode(testCode);

  // Define test file path and ensure directory exists
  const testPath = path.join(TESTS_ROOT, relPath.replace('.js', '.test.js'));
  const testDir = path.dirname(testPath);
  fs.mkdirSync(testDir, { recursive: true });

  if (fs.existsSync(testPath)) {
    console.log(`⚠️ Skipping (already exists): ${testPath}`);
    return;
  }

  // Save the generated test code as a .test.js file
  fs.writeFileSync(testPath, testCode);
  console.log(`✅ Test generated: ${testPath}`);
}

// Main function to generate tests for all source files
(async () => {
  try {
    // Step 1: Get directory structure from README.md
    const directoryStructure = getDirectoryStructure();

    // Step 2: Loop through all source directories (controllers, models, routes)
    for (const dir of SOURCE_DIRS) {
      if (!fs.existsSync(dir)) continue;

      // Step 3: Get all JS files in the directory
      const files = getAllJsFiles(dir);
      for (const { fullPath, relativePath } of files) {
        try {
          // Step 4: Generate test code for each file
          await generateTestCode(fullPath, path.join(dir, relativePath), directoryStructure);
        } catch (err) {
          console.error(`❌ Failed for ${relativePath}:`, err.response?.data || err.message);
        }
      }
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
})();
