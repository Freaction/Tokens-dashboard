class DtcgAdapter {
  detect(content) {
    if (!content || typeof content !== 'object') return false;
    
    // Heuristic: DTCG often has $type or $value scattered around, or top-level tokens containing $value.
    // Let's do a quick scan for keys starting with '$value' or '$type'
    let hasDtcgProps = false;
    const scan = (obj, depth = 0) => {
      if (depth > 5 || hasDtcgProps || !obj || typeof obj !== 'object') return;
      if (obj['$value'] !== undefined || obj['$type'] !== undefined) {
        hasDtcgProps = true;
        return;
      }
      Object.values(obj).forEach(v => scan(v, depth + 1));
    };
    scan(content);
    return hasDtcgProps;
  }

  extract(content, filename) {
    const rawData = { 'Global': {} }; // Default mode for DTCG is often global unless they use themes

    const processDtcgNode = (obj, pathParts = []) => {
      if (!obj || typeof obj !== 'object') return;

      if (obj['$value'] !== undefined) {
        const type = obj['$type'] || 'unknown'; // Optional because $type can be inherited from parent groups in DTCG

        let target = rawData['Global'];
        for (let i = 0; i < pathParts.length - 1; i++) {
          const part = pathParts[i];
          if (!target[part]) target[part] = {};
          target = target[part];
        }

        const lastName = pathParts[pathParts.length - 1];
        
        // Merge
        target[lastName] = {
          ...(target[lastName] || {}),
          type: type,
          value: obj['$value'],
          description: obj['$description']
        };
        return;
      }

      // It's a group, recurse
      Object.keys(obj).forEach(key => {
        if (!key.startsWith('$')) {
          processDtcgNode(obj[key], [...pathParts, key]);
        }
      });
    };

    processDtcgNode(content);
    return rawData;
  }
}

module.exports = new DtcgAdapter();
