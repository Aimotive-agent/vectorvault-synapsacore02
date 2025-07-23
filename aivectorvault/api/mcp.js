// MCP API for VectorVault
// This file provides MCP (Model Context Protocol) endpoints for AI agents to access VectorVault knowledge bases

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

// Create Express router
const router = express.Router();

// Enable CORS for all routes
router.use(cors());

// Path to data directory (where knowledge base files are stored)
const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log(`Created data directory at ${DATA_DIR}`);
}

/**
 * GET /api/mcp/tools - List all knowledge bases as tools
 * This endpoint returns all knowledge bases as tools that AI agents can use
 */
router.get('/tools', (req, res) => {
  try {
    // Read all files in the data directory with .jsonl or .csv extension
    const files = fs.readdirSync(DATA_DIR)
      .filter(f => /\.(jsonl|csv)$/i.test(f))
      .map(f => {
        const name = path.basename(f, path.extname(f));
        return {
          name,
          description: `VectorVault dataset: ${name}`,
          inputSchema: {
            type: "object",
            properties: {
              limit: { type: "integer", default: 50 },
              offset: { type: "integer", default: 0 },
              filter: { type: "string", default: "" }
            }
          }
        };
      });

    // Return the list of tools
    res.json({ tools: files });
  } catch (error) {
    console.error('Error listing tools:', error);
    res.status(500).json({ error: 'Failed to list tools' });
  }
});

/**
 * POST /api/mcp/call - Call a specific tool (access a knowledge base)
 * This endpoint allows AI agents to query a specific knowledge base
 */
router.post('/call', express.json(), (req, res) => {
  try {
    const { name, arguments: args = {} } = req.body;
    
    // Check if the requested file exists
    const file = path.join(DATA_DIR, `${name}.jsonl`);
    const csv = path.join(DATA_DIR, `${name}.csv`);
    
    const realPath = fs.existsSync(file) ? file
                   : fs.existsSync(csv) ? csv
                   : null;
    
    if (!realPath) {
      return res.status(404).json({ error: "Tool not found" });
    }
    
    // Parse arguments
    const limit = Math.min(+args.limit || 50, 1000);
    const offset = Math.max(+args.offset || 0, 0);
    const filter = (args.filter || '').toLowerCase();
    
    // Stream the response
    let count = 0, skipped = 0;
    res.set('Content-Type', 'application/json');
    res.write('{"content":[{"type":"text","text":"[');
    
    const isCSV = realPath.endsWith('.csv');
    
    // Use appropriate parser based on file type
    const reader = isCSV
      ? require('csv-parser')(fs.createReadStream(realPath))
      : require('readline').createInterface({ input: fs.createReadStream(realPath) });
    
    // Process each row
    reader.on('data', row => {
      if (skipped++ < offset) return;
      if (count >= limit) return;
      
      const obj = isCSV ? row : JSON.parse(row);
      
      // Apply filter if provided
      if (filter && !JSON.stringify(obj).toLowerCase().includes(filter)) return;
      
      // Write the object to the response
      if (count++) res.write(',');
      res.write(JSON.stringify(obj));
    });
    
    // Finish the response
    reader.on('end', () => {
      res.write(']"}]}');
      res.end();
    });
    
    // Handle errors
    reader.on('error', (error) => {
      console.error('Error reading file:', error);
      res.status(500).json({ error: 'Failed to read file' });
    });
  } catch (error) {
    console.error('Error calling tool:', error);
    res.status(500).json({ error: 'Failed to call tool' });
  }
});

/**
 * GET /api/mcp/webhook/all - Read all data from all knowledge bases
 * This endpoint returns all data from all knowledge bases in a single response
 */
router.get('/webhook/all', (req, res) => {
  try {
    // Read all files in the data directory with .jsonl or .csv extension
    const files = fs.readdirSync(DATA_DIR)
      .filter(f => /\.(jsonl|csv)$/i.test(f));
    
    // Initialize results object
    const results = {};
    
    // Process each file
    for (const file of files) {
      const name = path.basename(file, path.extname(file));
      const filePath = path.join(DATA_DIR, file);
      const isCSV = file.endsWith('.csv');
      
      try {
        // Read file contents
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Parse content based on file type
        if (isCSV) {
          // For CSV files, we'll need to parse them manually
          // This is a simplified approach - for production, use a proper CSV parser
          const lines = content.split('\n').filter(line => line.trim());
          const headers = lines[0].split(',');
          
          results[name] = lines.slice(1).map(line => {
            const values = line.split(',');
            const obj = {};
            headers.forEach((header, i) => {
              obj[header.trim()] = values[i] ? values[i].trim() : '';
            });
            return obj;
          });
        } else {
          // For JSONL files
          results[name] = content
            .split('\n')
            .filter(line => line.trim())
            .map(line => JSON.parse(line));
        }
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
        results[name] = { error: `Failed to process file: ${error.message}` };
      }
    }
    
    // Return all data
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: results
    });
  } catch (error) {
    console.error('Error in webhook/all:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to read all data',
      message: error.message 
    });
  }
});

module.exports = router;
