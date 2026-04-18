class FigmaAdapter {
  detect(content) {
    return content && content.collections && Array.isArray(content.collections);
  }

  extract(content) {
    const rawData = {};

    content.collections.forEach(collection => {
      const collectionName = collection.name;
      collection.modes.forEach(mode => {
        const modeName = mode.name;
        if (!rawData[modeName]) rawData[modeName] = {};
        if (!rawData[modeName][collectionName]) rawData[modeName][collectionName] = {};

        mode.variables.forEach(variable => {
          const nameParts = variable.name.split('/');
          let current = rawData[modeName][collectionName];

          for (let i = 0; i < nameParts.length - 1; i++) {
            const part = nameParts[i];
            if (!current[part]) current[part] = {};
            current = current[part];
          }

          const lastName = nameParts[nameParts.length - 1];
          let value = variable.value;

          if (variable.isAlias && typeof value === 'object' && value !== null) {
            value = `{${value.collection}/${value.name}}`;
          }

          // Merge instead of overwrite to prevent token-folder collision (when a leaf is also a branch)
          current[lastName] = {
            ...(current[lastName] || {}),
            type: variable.type,
            value: value,
            description: variable.description
          };
        });
      });
    });

    return rawData;
  }
}

module.exports = new FigmaAdapter();
