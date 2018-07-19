/* testing purposes only */
function testingHelper(request) {
  if (request == "GNL") {
    getNamespaceList().then(d => {
      let span = document.getElementById("namespace-span");
      let listItems = "";
      for (let name in d.data.namespaces) {
        listItems += "<li> " + d.data.namespaces[name] + " </li>";
      }
      if (listItems !== "") {
        span.innerHTML = "Namespace list: <br><ul>" + listItems + "</ul>";
      } else {
        span.innerHTML = "Namespace list: <br><ul>None</ul>";
      }
    });
  }
  if (request == "GNOL") {
    let namespace = document.getElementById("namespace").value;
    if (namespace == "") return;
    getNamespaceObjectList(namespace).then(d => {
      let span = document.getElementById("objectlist-span");
      let listItems = "";
      for (let name in d.data.entries) {
        listItems += "<li> " + d.data.entries[name] + " </li>";
      }
      if (listItems !== "") {
        span.innerHTML =
          "Objects in namespace list" +
          namespace +
          ": <br><ul>" +
          listItems +
          "</ul>";
      } else {
        span.innerHTML =
          "Objects in namespace list " + namespace + ": <br><ul>None</ul>";
      }
    });
  }
  if (request == "MNO") {
    let obj = JSON.parse(document.getElementById("json").value);
    let namespace = document.getElementById("namespace").value;
    makeNamespaceObject(namespace, obj).then(d => {
      let span = (document.getElementById("made").innerText =
        "made, the name is: " + d.data.url.split("/")[3]);
    });
  }
  if (request == "GNO") {
    let namespace = document.getElementById("namespace").value;
    let objName = document.getElementById("name").value;
    getNamespaceObject(namespace, objName).then(d => {
      let span = (document.getElementById("got").innerText = JSON.stringify(d));
    });
  }
  if (request == "UNO") {
    let namespace = document.getElementById("namespace").value;
    let obj = JSON.parse(document.getElementById("json").value);
    let objName = document.getElementById("name").value;
    updateNamespaceObject(namespace, objName, obj).then(() => {
      let span = document.getElementById("updated");
      span.style.display = "block";
      setTimeout(() => {
        span.style.diplay = "none";
      }, 10000);
    });
  }
}

/* testing purposes only */
function remove(name) {
  document.getElementById(name).remove();
}










/* for normal use */
function getNamespaceList() {
  let req = new Request("/store/");
  return fetch(req, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then(response => response.json())
    .catch(err => console.error("Fetch Error =\n", err));
}

function getNamespaceObjectList(namespace) {
  let req = new Request("/store/" + namespace + "/");
  return fetch(req, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then(response => response.json())
    .catch(err => console.error("Fetch Error =\n", err));
}

function makeNamespaceObject(namespace, obj) {
  let req = new Request("/store/" + namespace + "/");
  return fetch(req, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(obj)
  })
    .then(response => response.json())
    .catch(err => console.error("Fetch Error =\n", err));
}

function getNamespaceObject(namespace, objName) {
  let req = new Request("/store/" + namespace + "/" + objName);
  return fetch(req, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then(response => response.json())
    .catch(err => console.error("Fetch Error =\n", err));
}

function updateNamespaceObject(namespace, objName, obj) {
  let req = new Request("/store/" + namespace + "/" + objName);
  return fetch(req, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(obj)
  })
    .then(response => response.json())
    .catch(err => console.error("Fetch Error =\n", err));
}
