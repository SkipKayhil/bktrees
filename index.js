d3.json('./data/archive.json').then(data => {
  const HIGHEST_BK = 2084;
  const $ = id => document.getElementById(id);

  function clearList() {
    const list = $("search-list");
    while (list.childElementCount) list.removeChild(list.lastChild);
  }

  function createListFor(search) {
    clearList();

    if (!search) return;

    const list = $("search-list");
    const isNum = !isNaN(search);

    Object.values(data).every(({ id, name }) => {
      const [left, paren] = isNum ? [id, name] : [name, id];
      const index = left.toLowerCase().indexOf(search.toLowerCase());
      if (index === -1 || (isNum && index !== 0)) return true;

      const text = `${left} (${paren})`.replace(
        left.slice(index, index + search.length),
        "<b>$&</b>"
      );

      list.insertAdjacentHTML("beforeend", `<li data-id="${id}">${text}</li>`);

      return list.children.length < 10;
    });
  }

  const update = (() => {
    const draw = setupDraw(withData(data));

    return function updateAndDraw(bk) {
      $('search-input').value = bk;
      clearList();

      draw(updateAndDraw, bk);
    };
  })();

  update(HIGHEST_BK);

  $('search').addEventListener('submit', e => {
    e.preventDefault();
    const searchValue = parseInt(e.target.bk.value);
    // TODO: show some kind of error when the search is invalid
    if (!Number.isInteger(searchValue)) return; // not a valid number
    if (searchValue > HIGHEST_BK) return; // not a valid BK
    if (!data[searchValue]) return; // not found in archive

    update(searchValue);
    e.target.bk.blur();
  });

  $('search-list').addEventListener('click', e =>
    update(e.target.dataset.id || e.target.parentNode.dataset.id)
  );

  $('search-input').addEventListener('focusin', e => createListFor(e.target.value));

  $('svg-wrapper').addEventListener('click', e => clearList());

  $('search-input').addEventListener('input', e => createListFor(e.target.value));
});

function withData(json) {
  return function getTreeFor(id) {
    const bigLine = [...bigLineGenerator(id)];
    const root = json[id].big === '' ? id : bigLine[bigLine.length - 1].id;
    return {
      treeData: [...littleTreeGenerator(root)],
      highlight: [...littleTreeGenerator(id)].concat(bigLine)
    };
  };

  function* littleTreeGenerator(id) {
    yield json[id];
    for (const child of json[id].children) {
      yield* littleTreeGenerator(child);
    }
  }

  function* bigLineGenerator(id) {
    while ((id = json[id].big) !== '') yield json[id];
  }
}

function setupDraw(getTreeFor) {
  console.log('once');

  const NODE_WIDTH = 150,
    NODE_HEIGHT = 50;

  const svg = d3.select('#svg-wrapper');
  const svgwidth = parseInt(svg.style('width'));
  const svgheight = parseInt(svg.style('height'));

  const g = svg.append('g').attr('id', 'g');

  const zoom = d3
    .zoom()
    .scaleExtent([0.5, 1])
    .translateExtent([[-100, svgheight / -2], [svgwidth - 100, svgheight / 2]])
    .on("zoom", (event) => g.attr("transform", event.transform));
  svg.call(zoom).call(zoom.translateTo, 100, svgheight / 2);

  const fadeOut = exit =>
    exit
      .transition()
      .duration(250)
      .style('opacity', 0)
      .remove();

  const fadeIn = enter =>
    enter
      .style('opacity', 0)
      .transition()
      .duration(300)
      .style('opacity', 1);

  const setClass = (nodes, line, id) =>
    nodes
      .classed('node', true)
      .classed('active', d => d.data.active)
      .classed('selected', d => d.id === id.toString())
      .classed('direct', d => line.findIndex(e => e.id === d.id) !== -1);

  const createLinks = d3
    .linkHorizontal()
    .x(d => d.y) // define how the x/y values should be gotten from source
    .y(d => d.x) // or target object ie. source/target = {x: x, y: y}
    .source(d => ({ x: d.source.x, y: d.source.y + NODE_WIDTH / 2 }))
    .target(d => ({ x: d.target.x, y: d.target.y - NODE_WIDTH / 2 }));

  const createNode = nodes => {
    nodes
      .append('rect')
      .attr('width', NODE_WIDTH)
      .attr('height', NODE_HEIGHT)
      .attr(
        'transform',
        d => `translate(-${NODE_WIDTH / 2}, -${NODE_HEIGHT / 2})`
      );

    nodes
      .append('text')
      .attr('dy', -3.5)
      .style('text-anchor', 'middle')
      .text(d => (d.id.startsWith('AM') ? d.id : 'BK ' + d.id));

    nodes
      .append('text')
      .attr('dy', 15)
      .style('text-anchor', 'middle')
      .text(d => d.data.name);
  };

  // Data
  const stratify = d3
    .stratify()
    .id(node => node.id)
    .parentId(node => node.big);

  const tree = d3.tree().nodeSize([NODE_HEIGHT + 10, NODE_WIDTH + 25]);

  return function draw(updateAndDraw, id) {
    const { treeData, highlight } = getTreeFor(id);

    // used to find min/max y nodes
    let minNodeY = 0;
    let maxNodeY = 0;
    let maxNodeX = -1;

    console.log('===DRAW CALLED===');

    const root = tree(stratify(treeData));

    g.selectAll('.link')
      .data(root.links(), d => d.source.id * 10000 + d.target.id)
      .join(
        enter =>
          enter
            .append('path')
            .attr('class', 'link')
            .attr('d', createLinks)
            .call(fadeIn),
        null,
        exit => exit.call(fadeOut)
      );

    g.selectAll('.node')
      .data(root.descendants(), d => d.id)
      .join(
        enter =>
          enter
            .append('g')
            .attr('transform', d => {
              maxNodeX = Math.max(d.y, maxNodeX);
              minNodeY = Math.min(d.x, minNodeY);
              maxNodeY = Math.max(d.x, maxNodeY);

              return `translate(${d.y},${d.x})`;
            })
            .on("click", (_event, d) => updateAndDraw(d.id))
            .call(setClass, highlight, id)
            .call(createNode)
            .call(fadeIn),
        update => update.call(setClass, highlight, id),
        exit => exit.call(fadeOut)
      );

    console.log(minNodeY, maxNodeY);
    console.log(g.node().getBBox().height, g.node().getBBox().width);

    if (maxNodeX > -1) {
      zoom.translateExtent([
        [
          -100, // the root node has pos 0,0 so the minimum X will always be -100
          Math.min(minNodeY - 50, svgheight / -2)
        ],
        [
          Math.max(svgwidth - 100, maxNodeX + 100),
          Math.max(maxNodeY + 50, svgheight / 2)
        ]
      ]);
    }
  };
}
