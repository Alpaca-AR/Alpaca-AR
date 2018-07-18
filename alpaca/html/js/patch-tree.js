function patch(target, serialized) {
  let root = serialized.tree;
  let pattern = document.createElement(root.type);
  for (let attr in root.attributes) {
    pattern.setAttribute(attr, root.attributes[attr]);
  }
  addChildElements(root.children, pattern);
  morphdom(target, pattern);
}

function addChildElements(subtree, element) {
  let children = [];
  for (let el in subtree) {
    let child = document.createElement(subtree[el].type);
    for (let attr in subtree[el].attributes) {
      child.setAttribute(attr, subtree[el].attributes[attr]);
    }
    children.push(child);
    addChildElements(subtree[el].children, child);
  }
  for (let el in children) {
    element.append(children[el]);
  }
}
