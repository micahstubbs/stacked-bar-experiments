const n = 4; // The number of series
const m = 58; // The number of values per series

// The xz array has m elements, representing the x-values shared by all series
// The yz array has n elements, representing the y-values of each of the n series
// Each yz[i] is an array of m non-negative numbers representing a y-value for xz[i]
// The x01z array has the same structure as yz, but with stacked [y₀, y₁] instead of y
const xz = d3.range(n).map(() => bumps(m));
const yz = d3.range(m);
const x01z = d3.stack().keys(d3.range(n))(d3.transpose(xz));
const xMaxGrouped = d3.max(xz, x => d3.max(x));
const xMaxStacked = d3.max(x01z, x => d3.max(x, d => d[1]));

console.log('xz', xz);
console.log('yz', yz);
console.log('x01z', x01z);
console.log('xMaxGrouped', xMaxGrouped);
console.log('xMaxStacked', xMaxStacked);

const svg = d3.select('svg');
const controlHeight = 50;
const margin = {top: 10, right: 10, bottom: 20, left: 20};
const width = +svg.attr('width') - margin.left - margin.right;
const height = +svg.attr('height') - controlHeight - margin.top - margin.bottom;
const g = svg.append('g')
  .attr('transform', `translate(${margin.left},${margin.top})`);

const x = d3.scaleLinear()
  .domain([0, xMaxStacked])
  .range([0, width]);

const y = d3.scaleBand()
  .domain(yz)
  .rangeRound([0, height])
  .padding(0.08);

const color = d3.scaleOrdinal()
  .domain(d3.range(n))
  .range(d3.schemeCategory20c.slice(8, 12)); // greens

const series = g.selectAll('.series')
  .data(x01z)
  .enter().append('g')
    .attr('fill', (d, i) => color(i));

const rect = series.selectAll('rect')
  .data(d => d)
  .enter().append('rect')
    .attr('x', 0)
    .attr('y', (d, i) => y(i))
    .attr('width', 0)
    .attr('height', y.bandwidth());

rect.transition()
  .delay((d, i) => i * 10)
  .attr('x', d => x(d[0]))
  .attr('y', (d, i) => y(i))
  .attr('width', d => x(d[1]) - x(d[0]));

g.append('g')
  .attr('class', 'axis axis--y')
    .attr('transform', `translate(0,0)`)
    .call(d3.axisLeft(y)
      .tickSize(0)
      .tickPadding(6));

d3.selectAll('input')
  .on('change', changed);

const timeout = d3.timeout(() => {
  d3.select('input[value=\'grouped\']')
    .property('checked', true)
    .dispatch('change');
}, 2000);

function changed() {
  timeout.stop();
  if (this.value === 'grouped') transitionGrouped();
  else transitionStacked();
}

function transitionGrouped() {
  x.domain([0, xMaxGrouped]);

  rect.transition()
    .duration(500)
    .delay((d, i) => i * 10)
    .attr('y', function(d, i) {
      return y(i) + y.bandwidth() / n * this.parentNode.__data__.key;
    })
    .attr('height', y.bandwidth() / n)
    .transition()
      .attr('x', d => x(0))
      .attr('width', d => x(0) + x(d[1] - d[0]));
}

function transitionStacked() {
  x.domain([0, xMaxStacked]);

  rect.transition()
    .duration(500)
    .delay((d, i) => i * 10)
    .attr('x', d => x(d[0]))
    .attr('width', d => x(d[1]) - x(d[0]))
    .transition()
      .attr('y', (d, i) => y(i))
      .attr('height', y.bandwidth());
}

// Returns an array of m psuedorandom, smoothly-varying non-negative numbers.
// Inspired by Lee Byron’s test data generator.
// http://leebyron.com/streamgraph/
function bumps(m) {
  const values = [];
  let i;
  let j;
  let w;
  let x;
  let y;
  let z;

  // Initialize with uniform random values in [0.1, 0.2).
  for (i = 0; i < m; ++i) {
    values[i] = 0.1 + 0.1 * Math.random();
  }

  // Add five random bumps.
  for (j = 0; j < 5; ++j) {
    x = 1 / (0.1 + Math.random());
    y = 2 * Math.random() - 0.5;
    z = 10 / (0.1 + Math.random());
    for (i = 0; i < m; i++) {
      w = (i / m - y) * z;
      values[i] += x * Math.exp(-w * w);
    }
  }

  // Ensure all values are positive.
  for (i = 0; i < m; ++i) {
    values[i] = Math.max(0, values[i]);
  }

  return values;
}