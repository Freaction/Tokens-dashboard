class TreeBuilder {
  build(rawData) {
    const finalResult = {};

    const buildTreeForMode = (data) => {
      const tree = {};

      const traverse = (obj, currentPath, parentNode) => {
        if (!obj || typeof obj !== 'object') return;
        const isToken = obj && obj.hasOwnProperty('value') && obj.hasOwnProperty('type');

        if (isToken) {
          parentNode.tokens.push({ 
            type: obj.type, 
            value: obj.value,
            description: obj.description,
            path: currentPath 
          });
        }

        Object.keys(obj).sort().forEach(key => {
          if (key.startsWith('$') || key === 'type' || key === 'value' || key === 'description' || key === 'isAlias') return;
          const fullPath = currentPath ? `${currentPath}/${key}` : key;

          if (!parentNode.children[key]) {
            parentNode.children[key] = { name: key, path: fullPath, children: {}, tokens: [] };
          }
          traverse(obj[key], fullPath, parentNode.children[key]);
        });
      };

      const virtualRoot = { children: tree, tokens: [] };
      traverse(data, '', virtualRoot);

      return tree;
    };

    Object.keys(rawData).forEach(mode => {
      finalResult[mode] = buildTreeForMode(rawData[mode]);
    });

    return finalResult;
  }

  mergeData(target, source) {
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (source[key].hasOwnProperty('value') && source[key].hasOwnProperty('type')) {
          target[key] = { ...(target[key] || {}), ...source[key] };
        } else {
          if (!target[key]) target[key] = {};
          this.mergeData(target[key], source[key]);
        }
      } else {
        target[key] = source[key];
      }
    }
  }
}

module.exports = new TreeBuilder();
