const fs = require('fs');
const figmaAdapter = require('./figma');
const dtcgAdapter = require('./dtcg');
const genericAdapter = require('./generic');

class AdapterRegistry {
  constructor() {
    this.adapters = [
      { name: 'figma', adapter: figmaAdapter },
      { name: 'dtcg', adapter: dtcgAdapter },
      { name: 'generic', adapter: genericAdapter } // Always last as fallback
    ];
  }

  extract(content, filename) {
    for (const { name, adapter } of this.adapters) {
      if (adapter.detect(content)) {
        console.log(`[AdapterRegistry] Detected format: ${name} for file: ${filename}`);
        return adapter.extract(content, filename);
      }
    }
    
    console.log(`[AdapterRegistry] No adapter found for ${filename}, returning empty.`);
    return {};
  }
}

module.exports = new AdapterRegistry();
