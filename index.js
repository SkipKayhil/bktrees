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
// the blank background is a hack to call setTranslateEvent on mousedown
const bg = svg
  .append('rect')
  .attr('class', 'bg')
  .attr('width', svgwidth)
  .attr('height', svgheight);
const g = svg.append('g').attr('id', 'g');
const toRemove = svg.append('g').style('opacity', '1');
//.attr('transform', 'translate(100,' + svgheight / 2 + ') scale(1)');

const zoom = d3
  .zoom()
  .scaleExtent([1, 1])
  .translateExtent([[-100, svgheight / -2], [svgwidth - 100, svgheight / 2]])
  .on('zoom', () => {
    g.attr('transform', d3.event.transform);
  });
svg.call(zoom).call(zoom.translateTo, 100, svgheight / 2);
bg.on('mousedown.te', setTranslateExtent);

const NODE_WIDTH = 150;
const NODE_HEIGHT = 50;

function draw(updateData, data, id) {
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
  // .size([svgheight, svgwidth - 200]);

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

  // // EXPERIMENTAL CODE

  // couldn't get this idea to work, but I want the concept in the git history
  // in case I want to try again in the future

  // removedLinks = link.exit();
  // // .remove()
  // // .on('end', setTranslateExtent);
  // removedNodes = node.exit();
  // // .remove()
  // // .on('end', setTranslateExtent);
  // console.log(removedLinks, removedNodes);
  //
  // // double experimental
  // removedLinks.each(function() {
  //   this.remove();
  // });
  // removedNodes.each(function() {
  //   this.remove();
  // });
  // setTranslateExtent();
  //
  // removedLinks.each(function() {
  //   //console.log(this);
  //   toRemove.append(() => this);
  // });
  //
  // removedNodes.each(function() {
  //   //console.log(this);
  //   toRemove.append(() => this);
  // });
  // //setTranslateExtent();

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
    //.attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
    .attr('transform', d => 'translate(' + d.y + ',' + d.x + ')');

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
    .attr('transform', d => 'translate(' + d.y + ',' + d.x + ')');

  // setTranslateExtent();

  function getClass(def, d, id) {
    //console.log(d, id);
    def += d.data.active ? ' active' : '';
    def += d.id == id ? ' selected' : '';
    return def;
  }
}

function setTranslateExtent() {
  zoom.translateExtent(calcTranslateExtent());
}

function calcTranslateExtent() {
  const gwidth = g.node().getBBox().width;
  const gheight = g.node().getBBox().height;
  const minY = gheight < svgheight ? svgheight / -2 : -1 * gheight;
  const maxY = gheight < svgheight ? svgheight / 2 : gheight;
  const minX = -100;
  const maxX = gwidth - 50;
  console.log('===calcTranslateExtent===');
  console.log(minX, minY, maxX, maxY);
  console.log(gheight < svgheight ? 'smaller' : 'bigger', gheight);
  return [[minX, minY], [maxX, maxY]];
}
