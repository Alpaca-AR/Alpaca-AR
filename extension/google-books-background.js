chrome.storage.local.clear(() => {
  let err = chrome.runtime.lastError;
  if (err) alert(err);
});

chrome.runtime.onConnect.addListener(port => {
  port.onMessage.addListener((request, sender) => {
    if (request.getStorage) getStorage().then(resp => port.postMessage(resp));
    if (request.setStorage) setStorage(request.setStorage);
  });
});

function getStorage() {
  return new Promise(resolve => {
    chrome.storage.local.get(["books"], result => {
      let books = result ? result : "null";
      resolve(books);
    });
  });
}

function setStorage(obj) {
  chrome.storage.local.set({ books: obj }, () => {
    if (chrome.runtime.lastError) console.error(chrome.runtime.lastError);
  });
}
