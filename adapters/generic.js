class GenericAdapter {
  detect(content) {
    return true; // Fallback
  }

  extract(content, filename) {
    const rawData = {};
    
    const detectTokenDepth = (obj, currentDepth = 0) => {
      if (!obj || typeof obj !== 'object') return -1;
      if (('value' in obj) || ('type' in obj && typeof obj.type === 'string' && !obj.children)) return currentDepth;
      for (const key of Object.keys(obj)) {
        if (key.startsWith('$')) continue;
        const depth = detectTokenDepth(obj[key], currentDepth + 1);
        if (depth !== -1) return depth;
      }
      return -1;
    };

    const depth = detectTokenDepth(content);
    const isMultiMode = depth >= 3; // Generic heuristic

    const flattenContent = (obj, pathParts = []) => {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
      
      if (obj.hasOwnProperty('value') && obj.hasOwnProperty('type')) {
        const isValueObject = obj.value && typeof obj.value === 'object' && !Array.isArray(obj.value) && obj.value !== null;
        const hasInnerTokens = isValueObject && Object.values(obj.value).some(v => v && typeof v === 'object' && (v.hasOwnProperty('value') || v.hasOwnProperty('type')));

        if (hasInnerTokens) {
          Object.keys(obj.value).forEach(key => {
            flattenContent(obj.value[key], [...pathParts, key]);
          });
          return;
        }
        
        const modeName = isMultiMode ? pathParts[0] : (filename.toLowerCase() === 'tokens' ? 'Global' : filename);
        const tokenPath = isMultiMode ? pathParts.slice(1) : pathParts;

        if (!rawData[modeName]) rawData[modeName] = {};

        let target = rawData[modeName];
        for (let i = 0; i < tokenPath.length - 1; i++) {
          const part = tokenPath[i];
          if (!target[part]) target[part] = {};
          target = target[part];
        }
        target[tokenPath[tokenPath.length - 1]] = { ...obj };
        return;
      }

      Object.keys(obj).forEach(key => {
        flattenContent(obj[key], [...pathParts, key]);
      });
    };

    flattenContent(content);
    return rawData;
  }
}

module.exports = new GenericAdapter();
