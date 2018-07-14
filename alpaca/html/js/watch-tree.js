function watch(element, callback, config, delay) {
  config = config || { attributes: true, childList: true, subtree: true };
  delay = delay || 250;
  let observer = new MutationObserver(debounce(callback, delay));
  observer.observe(element, config);
}

function debounce(func, wait, immediate) {
  let timeout;
  return function() {
    let context = this,
      args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    }, wait);
    if (immediate && !timeout) func.apply(context, args);
  };
}
