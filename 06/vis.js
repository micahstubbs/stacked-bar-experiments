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

  const xMaxGrouped = d3.max(data, d => d3.max(Object.values(d).filter(e => typeof e !== 'string')));
  const xMaxStacked = d3.max(data, d => d3.sum(Object.values(d).filter(e => typeof e !== 'string')));
  const n = seriesKeys.length; // the number of series
  const yValuesDomain = d3.range(data.length); // the number of values per series
  const yLabelsDomain = stackedData[0].map(d => d.data.name);


  console.log('stackedData', stackedData);
  console.log('xMaxGrouped', xMaxGrouped);
  console.log('xMaxStacked', xMaxStacked);
  console.log('n, the number of series', n);
  console.log('yValuesDomain', yValuesDomain);
  console.log('yLabelsDomain', yLabelsDomain);

  const svg = d3.select('svg');
  const margin = {top: 20, right: 10, bottom: 20, left: 60};
  const width = +svg.attr('width') - margin.left - margin.right;
  const height = +svg.attr('height') - margin.top - margin.bottom;
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .domain([0, xMaxStacked])
    .range([0, width]);

  const yValuesScale = d3.scaleBand()
    .domain(yValuesDomain)
    .rangeRound([0, height])
    .padding(0.08);

  const yLabelsScale = d3.scaleBand()
    .domain(yLabelsDomain)
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
      .attr('y', (d, i) => yValuesScale(i))
      .attr('width', 0)
      .attr('height', yValuesScale.bandwidth());

  rect.transition()
    .delay((d, i) => i * 10)
    .attr('x', d => x(d[0]))
    .attr('y', (d, i) => yValuesScale(i))
    .attr('width', d => {
      return x(d[1]) - x(d[0]);
    });

  g.append('g')
    .attr('class', 'axis axis--y')
    .attr('transform', `translate(0,0)`)
    .call(d3.axisLeft(yLabelsScale)
      .tickSize(0)
      .tickPadding(6)
    );

  d3.selectAll('input')
    .on('change', changed);

  // change to grouped once
  let timeout = d3.timeout(() => {
    d3.select('input[value=\'grouped\']')
      .property('checked', true)
      .dispatch('change');
  }, 2000);

  // it looks like the error messages originate
  // from the tweening that d3 does on the transition
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
        // console.log('n from rect.transition', n);
        // console.log('this.parentNode.__data__.key', d3.select(this.parentNode).data());
        return yValuesScale(i) + yValuesScale.bandwidth() / n * +d3.select(this.parentNode).data()[0].index;
      })
      .attr('height', yValuesScale.bandwidth() / n)
      .transition()
      .delay((d, i) => 1000 + i * 10)
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
      .delay((d, i) => 1000 + i * 10)
        .attr('y', (d, i) => yValuesScale(i))
        .attr('height', yValuesScale.bandwidth());
  }
}
