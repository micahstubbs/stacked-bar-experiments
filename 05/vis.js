const queue = d3_queue.queue();

queue
  .defer(d3.json, 'data.json')
  .await(render);

  function render(error, data) {
    const seriesKeys = Object.keys(data[0]).slice(0, Object.keys(data[0]).length - 1);
    console.log('Object.keys(data[0])', Object.keys(data[0]));
    console.log('seriesKeys', seriesKeys);

    const stackedData = d3.stack()
      .keys(seriesKeys)(data);

  const xMaxGrouped = d3.max(data, d => d3.max(Object.values(d)));
  const xMaxStacked = d3.max(data, d => d3.sum(Object.values(d)));
  const n = Object.keys(data[0]).length; // the number of series
  const m = d3.range(data.length);

  console.log('stackedData', stackedData);
  console.log('xMaxGrouped', xMaxGrouped);
  console.log('xMaxStacked', xMaxStacked);
  console.log('n, the number of series', n);
  console.log('m, the number of values per series', m);

  const svg = d3.select('svg');
  const margin = {top: 40, right: 10, bottom: 20, left: 20};
  const width = +svg.attr('width') - margin.left - margin.right;
  const height = +svg.attr('height') - margin.top - margin.bottom;
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .domain([0, xMaxStacked])
    .range([0, width]);

  const y = d3.scaleBand()
    .domain(m)
    .rangeRound([0, height])
    .padding(0.08);

  const color = d3.scaleOrdinal()
    .domain(d3.range(n))
    .range(d3.schemeCategory20c.slice(8, 12)); // greens

  const series = g.selectAll('.series')
    .data(stackedData)
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
}