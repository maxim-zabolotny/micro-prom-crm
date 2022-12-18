function convert (data) {
    return data
        .filter(item => item.selected === 'TRUE')
        .map(item => ({
            id: item.id,
            parentId: String(item.parentId),
            name: item.name,
            promName: item.promName,
            markup: parseFloat(item.markup.replace(',', '.'))
        }))
  }