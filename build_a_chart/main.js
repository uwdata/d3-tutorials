// set up dimensions and margins
var margin = {top: 20, right: 20, bottom: 30, left: 40},
  width = 960 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom,
  currentYear = 1980;

// scales
var x = d3.scale.linear()
  .range([0, width]);

var y = d3.scale.linear()
  .range([height, 0]);

// axes
var xAxis = d3.svg.axis()
  .scale(x)
  .orient("bottom")
  .ticks(10);

var yAxis = d3.svg.axis()
  .scale(y)
  .orient("left")
  .ticks(8);

// create svg element
var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var slider = d3.select("#slider");

// create axes
svg.append("g")
  .attr("class", "x axis")
  .attr("transform", "translate(0," + height + ")")
  .call(xAxis)
.append("text")
  .attr("dx", width)
  .attr("dy", "-.3em")
  .style("text-anchor", "end")
  .text("Fertility");

svg.append("g")
  .attr("class", "y axis")
  .call(yAxis)
.append("text")
  .attr("transform", "rotate(-90)")
  .attr("y", 6)
  .attr("dy", ".7em")
  .style("text-anchor", "end")
  .text("Life Expectancy");

var yearLabel = svg.append("text")
  .attr("class", "big-year")
  .attr("x", width/2)
  .attr("y", height/2)
  .style("text-anchor", "middle");

// country tooltip
var countryLabel = svg.append("text")
  .attr("class", "country-label")
  .style({opacity: 0});

// load data
d3.csv("countries.csv", function(d) {
  d.fertility = +d.fertility;
  d.life_expect = +d.life_expect;
  return d;
}, function(error, data) {
  var nested = d3.nest()
    .key(function(d) { return d.country; })
    .entries(data);

  nested = nested.map(function(d) {
    var years = {};
    d.values.forEach(function(e) {
      years[e.year] = e;
    });
    return {
      key: d.key,
      values: years
    };
  });

  var draw = function() {
    var country = svg.selectAll(".country")
      .data(nested, function(d) {
        return d.key;
      });

    yearLabel.text(currentYear);

    // enter
    country.enter().append("circle")
      .attr("class", "country")
      .attr("r", 6);

    // update
    country
      .transition()
      .duration(500)
      .attr("cx", function(d) {
        return x(d.values[currentYear].fertility);
      })
      .attr("cy", function(d) {
        return y(d.values[currentYear].life_expect);
      });

    // interactions
    country.on('mouseover', function(d) {
        countryLabel
          .attr("x", x(d.values[currentYear].fertility) + 10)
          .attr("y", y(d.values[currentYear].life_expect) + 5)
          .text(d.key)
          .style({opacity: 1});
      });

    country.on('mouseout', function(d) {
        countryLabel.style({opacity: 0});
      });
  };

  x.domain(d3.extent(data, function(d) { return d.fertility; }));
  y.domain(d3.extent(data, function(d) { return d.life_expect; }));

  var timeRange = d3.extent(data, function(d) { return d.year; });

  slider.attr("min", timeRange[0]);
  slider.attr("max", timeRange[1]);
  slider.attr("step", 5);
  slider.attr("value", currentYear);
  slider.on("input", function() {
    currentYear = +this.value;
    draw();
  });

  draw();
});
