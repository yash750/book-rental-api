// generate-tests.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const SOURCE_DIRS = ['controllers', 'routes', 'models'];
const PROMPT_FILE = '.codex-prompt.txt';
const TESTS_ROOT = path.join('tests', 'generated');
const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = 'gpt-4'; // or 'gpt-4o'

if (!API_KEY) {
  console.error('❌ OPENAI_API_KEY is not set.');
  process.exit(1);
}
if (!fs.existsSync(PROMPT_FILE)) {
  console.error(`❌ Missing ${PROMPT_FILE}`);
  process.exit(1);
}

const SYSTEM_PROMPT = fs.readFileSync(PROMPT_FILE, 'utf8');

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

async function generateTestCode(sourcePath, relPath) {
  const code = fs.readFileSync(sourcePath, 'utf8');

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Analyze this file and generate complete Jest test cases per your QA strategy:\n\n${code}` }
      ],
      temperature: 0.2
    },
    {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const testCode = response.data.choices[0].message.content;

  const testPath = path.join(TESTS_ROOT, relPath.replace('.js', '.test.js'));
  const testDir = path.dirname(testPath);
  fs.mkdirSync(testDir, { recursive: true });

  if (fs.existsSync(testPath)) {
    console.log(`⚠️ Skipping (already exists): ${testPath}`);
    return;
  }

  fs.writeFileSync(testPath, testCode);
  console.log(`✅ Test generated: ${testPath}`);
}

(async () => {
  for (const dir of SOURCE_DIRS) {
    if (!fs.existsSync(dir)) continue;
    const files = getAllJsFiles(dir);
    for (const { fullPath, relativePath } of files) {
      try {
        await generateTestCode(fullPath, path.join(dir, relativePath));
      } catch (err) {
        console.error(`❌ Failed for ${relativePath}:`, err.response?.data || err.message);
      }
    }
  }
})();
