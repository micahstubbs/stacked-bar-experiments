const n = 4; // The number of series
const m = 58; // The number of values per series

// The xz array has m elements, representing the x-values shared by all series
// The yz array has n elements, representing the y-values of each of the n series
// Each yz[i] is an array of m non-negative numbers representing a y-value for xz[i]
// The y01z array has the same structure as yz, but with stacked [y₀, y₁] instead of y
const xz = d3.range(m);
console.log('xz', xz);
const yz = d3.range(n).map(() => bumps(m));
const y01z = d3.stack().keys(d3.range(n))(d3.transpose(yz));
console.log('d3.range(n)', d3.range(n));
console.log('d3.transpose(yz)', d3.transpose(yz));

const arrayOfObjects = [];

// unstack
y01z.forEach((d, i) => {
  d.forEach((e, j) => {
    if (typeof arrayOfObjects[j] === 'undefined') {
      arrayOfObjects[j] = {};
    } 
    // calculate current value from y1 - y0
    const currentValue = e[1] - e[0]; 
    arrayOfObjects[j][i] = currentValue; 
  })
})

window.groupedData = y01z;
window.data = arrayOfObjects;

// grouped yMax
const yMax = d3.max(yz, y => d3.max(y));
// stacked yMax. this one is larger
const y1Max = d3.max(y01z, y => d3.max(y, d => d[1]));
console.log('yMax', yMax);
console.log('y1Max', y1Max);

const svg = d3.select('svg');
const margin = {top: 40, right: 10, bottom: 20, left: 10};
const width = +svg.attr('width') - margin.left - margin.right;
const height = +svg.attr('height') - margin.top - margin.bottom;
const g = svg.append('g')
  .attr('transform', `translate(${margin.left},${margin.top})`);

const x = d3.scaleBand()
  .domain(xz)
  .rangeRound([0, width])
  .padding(0.08);

const y = d3.scaleLinear()
  .domain([0, y1Max])
  .range([height, 0]);

const color = d3.scaleOrdinal()
  .domain(d3.range(n))
  .range(d3.schemeCategory20c);

const series = g.selectAll('.series')
  .data(y01z)
  .enter().append('g')
    .attr('fill', (d, i) => color(i));

const rect = series.selectAll('rect')
  .data(d => d)
  .enter().append('rect')
    .attr('x', (d, i) => x(i))
    .attr('y', height)
    .attr('width', x.bandwidth())
    .attr('height', 0);

rect.transition()
  .delay((d, i) => i * 10)
  .attr('y', d => y(d[1]))
  .attr('height', d => y(d[0]) - y(d[1]));

g.append('g')
  .attr('class', 'axis axis--x')
  .attr('transform', `translate(0,${height})`)
  .call(d3.axisBottom(x)
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
  y.domain([0, yMax]);

  rect.transition()
    .duration(500)
    .delay((d, i) => i * 10)
    .attr('x', function(d, i) {
      return x(i) + x.bandwidth() / n * this.parentNode.__data__.key;
    })
    .attr('width', x.bandwidth() / n)
    .transition()
      .attr('y', d => y(d[1] - d[0]))
      .attr('height', d => y(0) - y(d[1] - d[0]));
}

function transitionStacked() {
  y.domain([0, y1Max]);

  rect.transition()
    .duration(500)
    .delay((d, i) => i * 10)
    .attr('y', d => y(d[1]))
    .attr('height', d => y(d[0]) - y(d[1]))
    .transition()
      .attr('x', (d, i) => x(i))
      .attr('width', x.bandwidth());
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