window.addEventListener('load', () => {
  const HIGHEST_BK = 2084;

  d3.json('./data/archive.json', (error, data) => {
    const updateData = withData(data);
    const searchForm = document.getElementById('search');
    const searchInput = document.getElementById('search-input');
    updateData(HIGHEST_BK);

    searchForm.addEventListener('submit', e => {
      e.preventDefault();
      const searchValue = parseInt(searchInput.value);
      // TODO: show some kind of error when the search is invalid
      if (!Number.isInteger(searchValue)) return; // not a valid number
      if (searchValue < 1 || searchValue > HIGHEST_BK) return; // not a valid BK
      if (!data[searchValue]) return; // not found in archive
      closeAuto();
      updateData(searchValue);
    });

    searchInput.addEventListener('input', e => {
      closeAuto();
      if (!searchInput.value) return false;

      const autoList = document.createElement('div');
      autoList.setAttribute('id', 'auto-list');
      autoList.setAttribute('class', 'auto-items');
      searchInput.parentNode.parentNode.parentNode.appendChild(autoList);

      const bklist = Object.keys(data);
      for (let i = 0; i < bklist.length; i++) {
        if (autoList.children.length === 10) break;

        const person = data[bklist[i]];
        const isNum = Number.isInteger(parseInt(searchInput.value));
        const index = isNum
          ? person.id.indexOf(searchInput.value)
          : person.name.toUpperCase().indexOf(searchInput.value.toUpperCase());
        if (index === -1 || (isNum && index !== 0)) continue;

        autoList.appendChild(
          createAutoItem(isNum, searchInput.value, person, index)
        );
      }
    });

    function createAutoItem(isNum, input, person, index) {
      const autoItem = document.createElement('div');
      const first = isNum ? person.id : person.name;
      const paren = isNum ? person.name : person.id;

      autoItem.innerHTML = getString(
        first.slice(0, index),
        first.slice(index, index + input.length),
        first.slice(index + input.length),
        paren
      );

      autoItem.addEventListener('click', e => {
        searchInput.value = person.id;
        closeAuto();
        updateData(person.id);
      });
      return autoItem;

      function getString(pre, bold, post, paren) {
        return `${pre}<strong>${bold}</strong>${post} (${paren})`;
      }
    }

    function closeAuto() {
      const autoItems = document.getElementById('auto-list');
      if (autoItems === null) return;
      autoItems.parentNode.removeChild(autoItems);
    }
  });
});

function withData(json) {
  return function updateData(id) {
    draw(updateData, [...getBigLine(json[id].big), ...getLittleTree(id)], id);
  };

  function getLittleTree(id) {
    return json[id] === undefined
      ? []
      : [
          json[id],
          ...json[id].children.reduce(
            (tree, child, i, a) => [...tree, ...getLittleTree(child)],
            []
          )
        ];
  }

  function getBigLine(id) {
    return json[id] === undefined
      ? []
      : [...getBigLine(json[id].big), json[id]];
  }
}

const svg = d3.select('svg');
const svgwidth = parseInt(svg.style('width'));
const svgheight = parseInt(svg.style('height'));
// the blank background is a hack to call setTranslateEvent on mousedown
const bg = svg
  .append('rect')
  .attr('class', 'bg')
  .attr('width', svgwidth)
  .attr('height', svgheight);
const g = svg.append('g').attr('id', 'g');

const zoom = d3
  .zoom()
  .scaleExtent([0.5, 1])
  .translateExtent([[-100, svgheight / -2], [svgwidth - 100, svgheight / 2]])
  .on('zoom', () => {
    g.attr('transform', d3.event.transform);
  });
svg.call(zoom).call(zoom.translateTo, 100, svgheight / 2);

const NODE_WIDTH = 150;
const NODE_HEIGHT = 50;

function draw(updateData, data, id) {
  // used to find min/max y nodes
  let minNodeY = 0;
  let maxNodeY = 0;

  console.log('===DRAW CALLED===');
  const baseT = d3
    .transition()
    .duration(375)
    .ease(d3.easeLinear);

  const root = d3
    .stratify()
    .id(node => node.id)
    .parentId(node => node.big)(data);

  const tree = d3.tree(root).nodeSize([NODE_HEIGHT + 10, NODE_WIDTH + 25]);

  // Get base references
  const link = g
    .selectAll('.link')
    .data(tree(root).links(), d => d.source.id * 10000 + d.target.id);
  const node = g.selectAll('.node').data(root.descendants(), d => d.id);

  // Remove exiting links/nodes
  link
    .exit()
    .transition(baseT)
    .style('stroke-opacity', 1e-6)
    .remove();
  node
    .exit()
    .transition(baseT)
    .style('opacity', 1e-6)
    .remove();

  // Append new elements if the link or node is entering
  linkEnter = link
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr(
      'd',
      d3
        .linkHorizontal()
        .x(d => d.y) // define how the x/y values should be gotten from source
        .y(d => d.x) // or target object ie. source/target = {x: x, y: y}
        .source(d => ({ x: d.source.x, y: d.source.y + NODE_WIDTH / 2 }))
        .target(d => ({ x: d.target.x, y: d.target.y - NODE_WIDTH / 2 }))
    )
    .style('stroke-opacity', 1e-6)
    .transition(baseT)
    .style('stroke-opacity', 1);

  nodeEnter = node
    .enter()
    .append('g')
    .attr('class', d => getClass('node', d, id))
    .attr('transform', d => {
      minNodeY = Math.min(d.x, minNodeY);
      maxNodeY = Math.max(d.x, maxNodeY);

      return 'translate(' + d.y + ',' + d.x + ')';
    });

  nodeEnter
    .on('click', (d, i) => {
      // Only redraw if necessary
      if (g.select('.selected').data()[0].id === d.id) return;
      updateData(d.id);
    })
    .style('opacity', 1e-6)
    .transition(baseT)
    .style('opacity', 1);

  // node.append("circle")
  //     .attr("r", 10);
  nodeEnter
    .append('rect')
    //.attr("class", d => getClass("node-rect", d, id))
    .attr('width', NODE_WIDTH)
    .attr('height', NODE_HEIGHT)
    .attr(
      'transform',
      d => 'translate(-' + NODE_WIDTH / 2 + ', -' + NODE_HEIGHT / 2 + ')'
    );

  nodeEnter
    .append('text')
    //.attr("class", d => getClass("node-id", d, id))
    .attr('dy', -3.5)
    .style('text-anchor', 'middle')
    .text(d => (d.id.startsWith('AM') ? d.id : 'BK ' + d.id));

  nodeEnter
    .append('text')
    //.attr("class", d => getClass("node-name", d, id))
    .attr('dy', 15)
    .style('text-anchor', 'middle')
    .text(d => d.data.name);

  // Update positions of old links/nodes
  link
    .style('stroke-opacity', 1)
    .transition(baseT)
    .attr(
      'd',
      d3
        .linkHorizontal()
        .x(d => d.y) // define how the x/y values should be gotten from source
        .y(d => d.x) // or target object ie. source/target = {x: x, y: y}
        .source(d => ({ x: d.source.x, y: d.source.y + NODE_WIDTH / 2 }))
        .target(d => ({ x: d.target.x, y: d.target.y - NODE_WIDTH / 2 }))
    );
  node
    .attr('class', d => getClass('node', d, id))
    .transition(
      baseT.on('start', () => {
        svg.transition(baseT).call(zoom.translateTo, 100, 0);
      })
    )
    .attr('transform', d => {
      minNodeY = Math.min(d.x, minNodeY);
      maxNodeY = Math.max(d.x, maxNodeY);

      return 'translate(' + d.y + ',' + d.x + ')';
    });

  // Re enable calling setTranslateExtent
  bg.on('mousedown.te', () => setTranslateExtent(minNodeY, maxNodeY));
  bg.on('touchstart.te', () => setTranslateExtent(minNodeY, maxNodeY));

  function getClass(def, d, id) {
    //console.log(d, id);
    def += d.data.active ? ' active' : '';
    def += d.id == id ? ' selected' : '';
    return def;
  }

  function setTranslateExtent(minNodeY, maxNodeY) {
    const gwidth = g.node().getBBox().width;

    zoom.translateExtent([
      [
        -100, // the root node has pos 0,0 so the minimum X will always be -100
        Math.min(minNodeY - 50, svgheight / -2)
      ],
      [
        Math.max(svgwidth - 100, gwidth - 50),
        Math.max(maxNodeY + 50, svgheight / 2)
      ]
    ]);

    // Optimization to only update translateExtent after redraw
    bg.on('mousedown.te', () => {});
    bg.on('touchstart.te', () => {});
  }
}
