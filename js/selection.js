/* global d3*/

var tutorial = tutorial || {};
tutorial.selection = (function(){
  // var numbers = [4, 5, 18, 23, 42];

  // var letters = [
  //   {name: "A", frequency: .08167},
  //   {name: "B", frequency: .01492},
  //   {name: "C", frequency: .02780},
  //   {name: "D", frequency: .04253},
  //   {name: "E", frequency: .12702}
  // ];

  // var vowels = [
  //   {name: "A", frequency: .08167},
  //   {name: "E", frequency: .12702},
  //   {name: "I", frequency: .06973},
  //   {name: "O", frequency: .07507},
  //   {name: "U", frequency: .02758}
  // ];

  // var matrix = [
  //   [ 0,  1,  2,  3],
  //   [ 4,  5,  6,  7],
  //   [ 8,  9, 10, 11],
  //   [12, 13, 14, 15]
  // ];

  function name(d) {
    return d.name;
  }

  var margin = window.svgMargin || {top: 0, right: 40, bottom: 0, left: 40},
      width = window.svgWidth || 500,
      step = 100;

  var tree = function(container){
    container = container || "body";

    return function (leftRoot, rightRoot, outerHeight) {
      if (arguments.length < 3){
        outerHeight = rightRoot; rightRoot = null;
      }

      var height = outerHeight - margin.top - margin.bottom;

      var tree = d3.layout.tree()
          .size([height, 1])
          .separation(function() { return 1; });

      var svg = d3.select(container).append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .style("margin", "1em 0 1em " + -margin.left + "px");

      var g = svg.selectAll("g")
          .data([].concat(
            leftRoot ? {type: "left", nodes: tree.nodes(leftRoot)} : [],
            rightRoot ? {type: "right", nodes: tree.nodes(rightRoot).map(flip), flipped: true} : []
          ))
        .enter().append("g")
          .attr("class", function(d) { return d.type; })
          .attr("transform", function(d) { return "translate(" + (!!d.flipped * width + margin.left) + "," + margin.top + ")"; });

      var link = g.append("g")
          .attr("class", "link")
        .selectAll("path")
          .data(function(d) { return tree.links(d.nodes); })
        .enter().append("path")
          .attr("class", linkType);

      var node = g.append("g")
          .attr("class", "node")
        .selectAll("g")
          .data(function(d) { return d.nodes; })
        .enter().append("g")
          .attr("class", function(d) { return d.type; });

      node.append("rect");

      node.append("text")
          .attr("dy", ".35em")
          .text(function(d) { return d.name; })
          .each(function(d) { d.width = Math.max(32, this.getComputedTextLength() + 12); })
          .attr("x", function(d) { return d.flipped ? 6 - d.width : 6; });

      node.filter(function(d) { return "join" in d; }).insert("path", "text")
          .attr("class", "join");

      svg.call(reset);

      function flip(d) {
        d.depth *= -1;
        d.flipped = true;
        return d;
      }

      return svg;
    };
  };

  function linkType(d) {
    return d.target.type.split(/\s+/).map(function(t) { return "to-" + t; })
        .concat(d.source.type.split(/\s+/).map(function(t) { return "from-" + t; }))
        .join(" ");
  }

  function reset(svg) {
    svg.selectAll("*")
        .style("stroke-opacity", null)
        .style("fill-opacity", null)
        .style("display", null);

    var node = svg.selectAll(".node g")
        .attr("class", function(d) { return d.type; })
        .attr("transform", function(d, i) { return "translate(" + d.depth * step + "," + d.x + ")"; });

    node.select("rect")
        .attr("ry", 6)
        .attr("rx", 6)
        .attr("y", -10)
        .attr("height", 20)
        .attr("width", function(d) { return d.width; })
      .filter(function(d) { return d.flipped; })
        .attr("x", function(d) { return -d.width; });

    node.select(".join")
        .attr("d", d3.svg.diagonal()
          .source(function(d) { return {y: d.width, x: 0}; })
          .target(function(d) { return {y: 88, x: d.join * 24}; })
          .projection(function(d) { return [d.y, d.x]; }));

    svg.selectAll(".link path")
        .attr("class", linkType)
        .attr("d", d3.svg.diagonal()
          .source(function(d) { return {y: d.source.depth * step + (d.source.flipped ? -1 : +1) * d.source.width, x: d.source.x}; })
          .target(function(d) { return {y: d.target.depth * step, x: d.target.x}; })
          .projection(function(d) { return [d.y, d.x]; }));
  }

  function selectAllAnimation(startRoot, startHeight, endRoot, endHeight) {
    var end = tree(endRoot, endHeight).remove(),
        event = d3.dispatch("start", "middle", "end", "reset"),
        height = +end.attr("height"),
        start = tree(startRoot, startHeight).attr("height", height),
        svg = start.node(),
        offset = (endHeight - startHeight) / 2,
        transform = "translate(" + margin.left + "," + offset + ")";

    var play = start.append("g")
        .attr("class", "play");

    play.append("circle")
        .attr("r", 45)
        .attr("transform", "translate(" + (margin.left + width / 2) + "," + height / 2 + ")");

    play.append("path")
        .attr("d", "M-22,-30l60,30l-60,30z")
        .attr("transform", "translate(" + (margin.left + width / 2) + "," + height / 2 + ")scale(.7)");

    play.append("rect")
        .attr("width", width)
        .attr("height", height)
        .on("mousedown", function() {
          play.classed("mousedown", true);
          d3.select(window).on("mouseup", function() { play.classed("mousedown", false); });
        })
        .on("click", function() {
          resetAll();
          animation();
        });

    end = d3.select(svg.appendChild(end.node().firstChild));
    start = d3.select(svg.firstChild).attr("transform", transform);
    end.selectAll(".array").each(function() { this.parentNode.appendChild(this); }); // mask elements

    var startNodes = start.datum().nodes,
        startElements = startNodes.filter(function(d) { return d.type === "element"; }),
        endNodes = end.datum().nodes,
        endGroups = endNodes.filter(function(d) { return d.type === "array"; });

    resetAll();

    return event;

    function resetAll() {
      start.style("display", "none").call(reset);
      end.style("display", null).call(reset);
      play.style("display", null);
      event.reset();
    }

    function animation() {
      start.call(fadeIn, 150);
      end.style("display", "none");
      play.style("display", "none");
      setTimeout(transition1, 1250);
      event.start();
    }

    function transition1() {
      var t = start.transition()
          .duration(1000 + (startElements.length - 1) * 50)
          .each("end", transition2);

      t.selectAll(".selection,.array,.link")
          .duration(0)
          .style("stroke-opacity", 0)
          .style("fill-opacity", 0);

      t.selectAll(".element")
          .duration(500)
          .delay(function(d, i) { return 500 + i * 50; })
          .attr("transform", function(d, i) { return "translate(" + (d.depth - 1) * step + "," + (endGroups[i].x - offset) + ")"; })
          .attr("class", "array")
        .select("rect")
          .attr("width", function(d, i) { return endGroups[i].width; });

      event.middle();
    }

    function transition2() {
      end.style("display", null)
        .selectAll(".element,.to-element")
          .style("display", "none");

      end.selectAll(".selection,.to-array,.array")
          .call(fadeIn);

      end.transition()
          .duration(500)
          .each("end", transition3);

      event.end();
    }

    function transition3() {
      start.style("display", "none");

      end.selectAll(".element")
          .style("display", null)
          .attr("transform", function(d) { return "translate(" + d.parent.depth * step + "," + d.parent.x + ")"; })
        .transition()
          .duration(500)
          .delay(function(d, i) { return i * 50; })
          .attr("transform", function(d) { return "translate(" + d.depth * step + "," + d.x + ")"; });

      end.selectAll(".to-element")
          .style("display", null)
          .attr("d", d3.svg.diagonal()
            .source(function(d) { return {y: d.source.depth * step + d.source.width, x: d.source.x}; })
            .target(function(d, i) { return {y: d.source.depth * step + d.source.width, x: d.source.x}; })
            .projection(function(d) { return [d.y, d.x]; }))
        .transition()
          .duration(500)
          .delay(function(d, i) { return i * 50; })
          .attr("d", d3.svg.diagonal()
            .source(function(d) { return {y: d.source.depth * step + d.source.width, x: d.source.x}; })
            .target(function(d, i) { return {y: d.target.depth * step, x: d.target.x}; })
            .projection(function(d) { return [d.y, d.x]; }));

      end.transition()
          .duration(2000)
          .each("end", resetAll);
    }
  }

  function updateAnimation(leftRoot, rightRoot, endRoot, outerHeight) {
    var start = tree(leftRoot, rightRoot, outerHeight),
        left = d3.select(start.node().firstChild),
        right = d3.select(left.node().nextSibling),
        end = tree(endRoot, outerHeight).remove(),
        height = +start.attr("height");

    end = d3.select(start.node().appendChild(end.node().firstChild));
    left.selectAll(".element").each(function() { this.parentNode.appendChild(this); }); // mask keys
    right.selectAll(".datum").each(function() { this.parentNode.appendChild(this); }); // mask keys
    start.node().appendChild(left.node());
    start.node().appendChild(right.node());

    var leftKeys = left.datum().nodes.filter(function(d) { return d.type === "key"; }),
        rightKeys = right.datum().nodes.filter(function(d) { return d.type === "key"; }),
        endElements = end.datum().nodes.filter(function(d) { return d.parent && d.parent.type === "array"; });

    leftKeys.forEach(function(l, i) {
      if ("join" in l) {
        rightKeys[i + l.join].joined = true;
        endElements[i + l.join].start = l.parent;
        l.parent.end = endElements[i + l.join];
      }
    });

    leftKeys.forEach(function(l, i) {
      if (!("join" in l)) endElements.some(function(e) {
        if (!e.start) {
          e.start = l.parent;
          l.parent.end = e;
          return true;
        }
      });
    });

    var play = start.append("g")
        .attr("class", "play");

    play.append("circle")
        .attr("r", 45)
        .attr("transform", "translate(" + (margin.left + width / 2) + "," + height / 2 + ")");

    play.append("path")
        .attr("d", "M-22,-30l60,30l-60,30z")
        .attr("transform", "translate(" + (margin.left + width / 2) + "," + height / 2 + ")scale(.7)");

    play.append("rect")
        .attr("width", width)
        .attr("height", height)
        .on("mousedown", function() {
          play.classed("mousedown", true);
          d3.select(window).on("mouseup", function() { play.classed("mousedown", false); });
        })
        .on("click", function() {
          resetAll();
          animation();
        });

    resetAll();

    function resetAll() {
      play.style("display", null);
      left.style("display", "none").call(reset);
      right.style("display", "none").call(reset);
      right.selectAll(".key").classed("joined", function(d) { return d.joined; });
      right.selectAll(".datum").classed("joined", function(d) { return d.children[0].joined; });
      right.selectAll(".to-key").classed("joined", function(d) { return d.target.joined; });
      end.call(reset);
    }

    function animation() {
      play.style("display", "none");
      end.style("display", "none");
      left.call(fadeIn);
      right.call(fadeIn);
      setTimeout(transition1, 1250);
    }

    function transition1() {
      left.selectAll(".key").filter(function(d) { return !("join" in d); })
          .style("stroke-opacity", 0)
          .style("fill-opacity", 0);

      left.selectAll(".to-key").filter(function(d) { return !("join" in d.target); })
          .style("stroke-opacity", 0)
          .style("fill-opacity", 0);

      left.selectAll(".element").filter(function(d) { return !("join" in d.children[0]); })
          .style("stroke-opacity", 0)
          .style("fill-opacity", 0);

      left.selectAll(".to-element").filter(function(d) { return !("join" in d.target.children[0]); })
          .style("stroke-opacity", 0)
          .style("fill-opacity", 0);

      right.selectAll(".link > :not(.joined),.node > :not(.joined)")
          .style("stroke-opacity", 0)
          .style("fill-opacity", 0);

      end.style("display", null);

      end.selectAll(".datum,.to-datum")
          .style("display", "none");

      end.selectAll(".element,.null")
          .attr("transform", function(d, i) { return "translate(" + d.depth * step + "," + d.start.x + ")"; });

      end.selectAll(".to-element,.to-null")
          .attr("d", d3.svg.diagonal()
            .source(function(d) { return {y: d.source.depth * step + d.source.width, x: d.source.x}; })
            .target(function(d) { return {y: d.target.depth * step, x: d.target.start.x}; })
            .projection(function(d) { return [d.y, d.x]; }));

      setTimeout(transition2, 500);
    }

    function transition2() {
      left.selectAll(".element").transition()
          .duration(500)
          .attr("transform", function(d, i) { return "translate(" + d.depth * step + "," + d.end.x + ")"; });

      left.selectAll(".key").transition()
          .duration(500)
          .attr("transform", function(d, i) { return "translate(" + d.depth * step + "," + d.parent.end.x + ")"; });

      left.selectAll(".to-element").transition()
          .duration(500)
          .attr("d", d3.svg.diagonal()
            .source(function(d) { return {y: d.source.depth * step + d.source.width, x: d.source.x}; })
            .target(function(d) { return {y: d.target.depth * step, x: d.target.end.x}; })
            .projection(function(d) { return [d.y, d.x]; }));

      left.selectAll(".to-key").transition()
          .duration(500)
          .attr("d", d3.svg.diagonal()
            .source(function(d) { return {y: d.source.depth * step + d.source.width, x: d.source.end.x}; })
            .target(function(d) { return {y: d.target.depth * step, x: d.target.parent.end.x}; })
            .projection(function(d) { return [d.y, d.x]; }));

      left.selectAll(".join").transition()
          .duration(500)
          .attr("d", d3.svg.diagonal()
            .source(function(d) { return {y: d.width, x: 0}; })
            .target(function(d) { return {y: 88, x: 0}; })
            .projection(function(d) { return [d.y, d.x]; }));

      end.selectAll(".element,.null").transition()
          .duration(500)
          .attr("transform", function(d, i) { return "translate(" + d.depth * step + "," + d.x + ")"; });

      end.selectAll(".to-element,.to-null").transition()
          .duration(500)
          .attr("d", d3.svg.diagonal()
            .source(function(d) { return {y: d.source.depth * step + d.source.width, x: d.source.x}; })
            .target(function(d) { return {y: d.target.depth * step, x: d.target.x}; })
            .projection(function(d) { return [d.y, d.x]; }));

      setTimeout(transition3, 500);
    }

    function transition3() {
      var offset = 12;

      left.selectAll(".join").transition()
          .duration(500)
          .attr("d", d3.svg.diagonal()
            .source(function(d) { return {y: d.width, x: 0}; })
            .target(function(d) { return {y: d.width, x: 0}; })
            .projection(function(d) { return [d.y, d.x]; }));

      left.selectAll(".to-key")
          .attr("class", "from-element to-datum");

      right.selectAll(".to-key").transition()
          .duration(500)
          .attr("d", d3.svg.diagonal()
            .source(function(d) { return {y: (d.source.depth - 2) * step + offset - d.source.width, x: d.source.x}; })
            .target(function(d) { return {y: (d.source.depth - 2) * step + offset - d.source.width, x: d.source.x}; })
            .projection(function(d) { return [d.y, d.x]; }));

      right.selectAll(".key").transition()
          .duration(500)
          .attr("transform", function(d, i) { return "translate(" + ((d.depth - 1) * step + offset) + "," + d.x + ")"; });

      right.selectAll(".datum").transition()
          .duration(500)
          .attr("transform", function(d, i) { return "translate(" + ((d.depth - 2) * step + offset) + "," + d.x + ")"; });

      setTimeout(resetAll, 2000);
    }
  }

  function exitAnimation(leftRoot, rightRoot, endRoot, outerHeight) {
    var start = tree(leftRoot, rightRoot, outerHeight),
        left = d3.select(start.node().firstChild),
        right = d3.select(left.node().nextSibling),
        end = tree(endRoot, outerHeight).remove(),
        height = +start.attr("height");

    end = d3.select(start.node().appendChild(end.node().firstChild));
    start.node().appendChild(left.node());
    start.node().appendChild(right.node());

    var play = start.append("g")
        .attr("class", "play");

    play.append("circle")
        .attr("r", 45)
        .attr("transform", "translate(" + (margin.left + width / 2) + "," + height / 2 + ")");

    play.append("path")
        .attr("d", "M-22,-30l60,30l-60,30z")
        .attr("transform", "translate(" + (margin.left + width / 2) + "," + height / 2 + ")scale(.7)");

    play.append("rect")
        .attr("width", width)
        .attr("height", height)
        .on("mousedown", function() {
          play.classed("mousedown", true);
          d3.select(window).on("mouseup", function() { play.classed("mousedown", false); });
        })
        .on("click", function() {
          resetAll();
          animation();
        });

    resetAll();

    function resetAll() {
      play.style("display", null);
      left.style("display", "none").call(reset);
      right.style("display", "none").call(reset);
      end.call(reset);
    }

    function animation() {
      play.style("display", "none");
      end.style("display", "none");
      left.call(fadeIn);
      right.call(fadeIn);
      setTimeout(transition1, 1250);
    }

    function transition1() {
      end.style("display", null);

      left
          .style("stroke-opacity", 0)
          .style("fill-opacity", 0);

      right
          .style("stroke-opacity", 0)
          .style("fill-opacity", 0);

      setTimeout(resetAll, 2000);
    }
  }

  function enterAnimation(leftRoot, rightRoot, endRoot, outerHeight) {
    var start = tree(leftRoot, rightRoot, outerHeight),
        left = d3.select(start.node().firstChild),
        right = d3.select(left.node().nextSibling),
        end = tree(endRoot, outerHeight).remove(),
        height = +start.attr("height");

    start.node().appendChild(left.node());
    start.node().appendChild(right.node());
    end = d3.select(start.node().appendChild(end.node().firstChild));

    var leftKeys = left.datum().nodes.filter(function(d) { return d.type === "key"; }),
        rightKeys = right.datum().nodes.filter(function(d) { return d.type === "key"; });

    leftKeys.forEach(function(l, i) {
      if ("join" in l) {
        rightKeys[i + l.join].joined = true;
      }
    });

    var play = start.append("g")
        .attr("class", "play");

    play.append("circle")
        .attr("r", 45)
        .attr("transform", "translate(" + (margin.left + width / 2) + "," + height / 2 + ")");

    play.append("path")
        .attr("d", "M-22,-30l60,30l-60,30z")
        .attr("transform", "translate(" + (margin.left + width / 2) + "," + height / 2 + ")scale(.7)");

    play.append("rect")
        .attr("width", width)
        .attr("height", height)
        .on("mousedown", function() {
          play.classed("mousedown", true);
          d3.select(window).on("mouseup", function() { play.classed("mousedown", false); });
        })
        .on("click", function() {
          resetAll();
          animation();
        });

    resetAll();

    function resetAll() {
      play.style("display", null);
      left.style("display", "none").call(reset);
      right.style("display", "none").call(reset);
      right.selectAll(".key").classed("joined", function(d) { return d.joined; });
      right.selectAll(".datum").classed("joined", function(d) { return d.children[0].joined; });
      right.selectAll(".to-key").classed("joined", function(d) { return d.target.joined; });
      end.call(reset);
    }

    function animation() {
      play.style("display", "none");
      end.style("display", "none");
      left.call(fadeIn);
      right.call(fadeIn);
      setTimeout(transition1, 1250);
    }

    function transition1() {
      end.style("display", null);

      end.selectAll(".element,.datum,.to-datum")
          .style("stroke-opacity", 0)
          .style("fill-opacity", 0);

      left.selectAll(".element,.to-element,.key,.to-key")
          .style("stroke-opacity", 0)
          .style("fill-opacity", 0);

      right.selectAll(".array,.to-array,.data,.to-function,.to-datum,.joined")
          .style("stroke-opacity", 0)
          .style("fill-opacity", 0);

      setTimeout(transition2, 750);
    }

    function transition2() {
      var offset = 12;

      right.selectAll(".key:not(.joined)").transition()
          .duration(500)
          .attr("transform", function(d, i) { return "translate(" + ((d.depth - 2) * step + offset) + "," + d.x + ")"; });

      right.selectAll(".datum:not(.joined)").transition()
          .duration(500)
          .attr("transform", function(d, i) { return "translate(" + ((d.depth - 2) * step + offset) + "," + d.x + ")"; });

      right.selectAll(".to-key:not(.joined)").transition()
          .duration(500)
          .attr("d", d3.svg.diagonal()
            .source(function(d) { return {y: (d.source.depth - 2) * step + offset - d.source.width, x: d.source.x}; })
            .target(function(d) { return {y: (d.source.depth - 3) * step + offset - d.source.width, x: d.source.x}; })
            .projection(function(d) { return [d.y, d.x]; }));

      setTimeout(transition3, 500);
    }

    function transition3() {
      right.selectAll(".to-key:not(.joined)")
          .style("stroke-opacity", 0);

      end.selectAll(".element,.datum,.to-datum")
          .style("stroke-opacity", 1)
          .style("fill-opacity", 1);

      setTimeout(resetAll, 2000);
    }
  }

  function fadeIn(selection, delay) {
    selection
        .style("display", null)
        .style("stroke-opacity", 0)
        .style("fill-opacity", 0)
      .transition()
        .duration(delay || 0)
        .style("stroke-opacity", 1)
        .style("fill-opacity", 1);
  }

  return {
    tree: tree
  };
})();