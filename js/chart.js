function interpolateChart() {
  var width = 900,
      height = 500;

  var n = 36,
      random = d3.random.normal(height / 3 * 2, 50),
      data = d3.range(n).map(random);

  var x = d3.scale.linear()
      .domain([0, n - 1])
      .range([0, width]);

  var area = d3.svg.area()
      .x(function(d, i) { return x(i); })
      .y0(height)
      .y1(Number)

  function chart(selection) {
    selection.each(function(d) {

      var svg = d3.select(this).selectAll("svg")
          .data([null]);

      var svgEnter = svg.enter().append("svg")
          .datum(data)
          .attr("class", "interpolate chart")
          .attr("width", width)
          .attr("height", height);

      svgEnter.append("rect")
          .attr("class", "background")
          .attr("width", width)
          .attr("height", height)
          .style("pointer-events", "all");

      svgEnter.append("path")
          .attr("class", "area");

      svgEnter.selectAll("circle")
          .data(data)
        .enter().append("circle")
          .attr("r", 6);

      svg.selectAll("circle")
          .attr("cx", function(d, i) { return x(i); })
          .attr("cy", Number);

      svg.select("path")
          .attr("d", area);
    });
  }

  function mousemove(d) {
    var m = d3.mouse(this),
        i = Math.floor(x.invert(m[0]));
    d[i] = m[1] % height; // XXX webkit-transform-3d
    var svg = d3.select(this);
    svg.selectAll("circle").data(d).attr("cy", Number);
    svg.select("path").attr("d", area);
  }

  return d3.rebind(chart, area, "interpolate");
}