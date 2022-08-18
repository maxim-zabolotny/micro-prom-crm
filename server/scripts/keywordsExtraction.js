function keywords(text) {
  return text
    .split(' ')
    .reduce(
      (acc, el, index) => {
        if (el.length < 3) {
          const prevItemIndex = Math.min(0, index - 1);
          acc[prevItemIndex] = acc[prevItemIndex] + ' ' + el;

          return acc;
        }

        acc.push(el);
        return acc;
      },
      []
    );
}
