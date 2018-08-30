chrome.storage.local.clear(() => {
  let err = chrome.runtime.lastError;
  if (err) alert(err);
});

chrome.runtime.onConnect.addListener(port => {
  port.onMessage.addListener((request, sender) => {
    if (request.getStorage && request.key)
      getStorage(request.key).then(resp => port.postMessage(resp));

    if (request.setStorage && request.key)
      setStorage(request.setStorage, request.key);
  });
});

function getStorage(key) {
  return new Promise(resolve => {
    chrome.storage.local.get([key], result => {
      let query = result ? result : "null";
      resolve(query);
    });
  });
}

function setStorage(obj, key) {
  let query = {};
  query[key] = obj;
  chrome.storage.local.set(query, () => {
    if (chrome.runtime.lastError) console.error(chrome.runtime.lastError);
  });
}
