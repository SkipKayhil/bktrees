window.addEventListener('load', () => {
  d3.json('./data/archive.json', (error, data) => {
    const updateData = withData(data);
    updateData(2046);
  });
});

function withData(json) {
  return function updateData(id) {
    const filteredData = getBigLine(id).concat(getLittleTree(id).slice(1));
    draw(updateData, filteredData, id);
  };

  function getLittleTree(id) {
    var arr = [];
    if (json[id] !== undefined) {
      arr = arr.concat(json[id]);
      for (var i = 0; i < json[id].children.length; i++) {
        arr = arr.concat(getLittleTree(json[id].children[i]));
      }
    }
    return arr;
  }

  function getBigLine(id) {
    var arr = [];
    if (json[id].big) {
      arr = arr.concat(getBigLine(json[id].big));
    }
    arr = arr.concat(json[id]);
    return arr;
  }
}

const svg = d3.select('svg');
const svgwidth = parseInt(svg.style('width'));
const svgheight = parseInt(svg.style('height'));
const g = svg.append('g').attr('id', 'g');
const toRemove = svg.append('g').style('opacity', '1');
//.attr('transform', 'translate(100,' + svgheight / 2 + ') scale(1)');

//console.log(g);

var zoom = d3
  .zoom()
  .scaleExtent([1, 1])
  //.translateExtent([[svgwidth / 2 - 100, 0], [svgwidth / 2 - 100, 0]])
  .on('zoom', () => {
    g.attr('transform', d3.event.transform);
  });
svg.call(zoom).call(zoom.translateTo, svgwidth / 2 - 100, 0);
// g.call(zoom.transform, d3.zoomIdentity.);

const nwidth = 150;
const nheight = 50;

function draw(updateData, data, id) {
  const addRemoveT = d3
    .transition()
    .duration(375)
    .ease(d3.easeLinear);
  //.on('end', setTranslateExtent());
  const updateT = d3
    .transition()
    .duration(375)
    .ease(d3.easeLinear)
    .on('end', setTranslateExtent());

  const root = d3
    .stratify()
    .id(node => node.id)
    .parentId(node => node.big)(data);

  const tree = d3.tree(root).nodeSize([nheight + 10, nwidth + 25]);
  // .size([svgheight, svgwidth - 200]);

  // Get base references
  const link = g
    .selectAll('.link')
    .data(tree(root).links(), d => d.source.id * 10000 + d.target.id);
  const node = g.selectAll('.node').data(root.descendants(), d => d.id);

  // Remove exiting links/nodes
  link
    .exit()
    .transition(addRemoveT)
    .style('stroke-opacity', 1e-6)
    .remove();
  node
    .exit()
    .transition(addRemoveT)
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
        .source(d => ({ x: d.source.x, y: d.source.y + nwidth / 2 }))
        .target(d => ({ x: d.target.x, y: d.target.y - nwidth / 2 }))
    )
    .style('stroke-opacity', 1e-6)
    .transition(addRemoveT)
    .style('stroke-opacity', 1);

  nodeEnter = node
    .enter()
    .append('g')
    .attr('class', d => getClass('node', d, id))
    //.attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
    .attr('transform', d => 'translate(' + d.y + ',' + d.x + ')');

  nodeEnter
    .on('click', (d, i) => {
      // Only redraw if necessary
      if (g.select('.selected').data()[0].id === d.id) return;
      updateData(d.id);
      //setTranslateExtent();
      // const gheight = document.getElementById('g').getBBox().height;
      // if (gheight < svgheight) {
      //   svg.call(zoom.translateExtent([[0, 0], [0, 0]]));
      // }
      // svg.call(zoom.translateExtent([[], []]));
    })
    .style('opacity', 1e-6)
    .transition(addRemoveT)
    .style('opacity', 1);

  // node.append("circle")
  //     .attr("r", 10);
  nodeEnter
    .append('rect')
    //.attr("class", d => getClass("node-rect", d, id))
    .attr('width', nwidth)
    .attr('height', nheight)
    .attr(
      'transform',
      d => 'translate(-' + nwidth / 2 + ', -' + nheight / 2 + ')'
    );

  nodeEnter
    .append('text')
    //.attr("class", d => getClass("node-id", d, id))
    .attr('dy', -3.5)
    .style('text-anchor', 'middle')
    .text(d => 'BK ' + d.id);

  nodeEnter
    .append('text')
    //.attr("class", d => getClass("node-name", d, id))
    .attr('dy', 15)
    .style('text-anchor', 'middle')
    .text(d => d.data.name);

  // Update positions of old links/nodes
  link
    .style('stroke-opacity', 1)
    .transition(updateT)
    .attr(
      'd',
      d3
        .linkHorizontal()
        .x(d => d.y) // define how the x/y values should be gotten from source
        .y(d => d.x) // or target object ie. source/target = {x: x, y: y}
        .source(d => ({ x: d.source.x, y: d.source.y + nwidth / 2 }))
        .target(d => ({ x: d.target.x, y: d.target.y - nwidth / 2 }))
    );
  node
    .attr('class', d => getClass('node', d, id))
    .transition(
      updateT.on('start', () => {
        svg.transition(updateT).call(zoom.translateTo, svgwidth / 2 - 100, 0);
      })
    )
    .attr('transform', d => 'translate(' + d.y + ',' + d.x + ')');

  // setTranslateExtent();

  function setTranslateExtent() {
    const gheight = document.getElementById('g').getBBox().height;
    if (gheight < svgheight) {
      console.log('smaller', gheight);
      zoom.translateExtent([[svgwidth / 2 - 100, 0], [svgwidth / 2 - 100, 0]]);
    } else {
      console.log('bigger', gheight);
      zoom.translateExtent([
        [svgwidth / 2 - 100, -1 * gheight],
        [svgwidth / 2 - 100, gheight]
      ]);
    }
  }

  function getClass(def, d, id) {
    //console.log(d, id);
    def += d.data.active ? ' active' : '';
    def += d.id == id ? ' selected' : '';
    return def;
  }
}
