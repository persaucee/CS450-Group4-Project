import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const BarChart = () => {
  const svgRef = useRef();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const cities = ['amsterdam', 'athens', 'barcelona', 'berlin', 'budapest', 
                      'lisbon', 'london', 'paris', 'rome', 'vienna'];
      const allData = [];

      for (const city of cities) {
          const weekdaysResponse = await fetch(`/data/${city}_weekdays.csv`);
          const weekdaysText = await weekdaysResponse.text();
          
          const weekendsResponse = await fetch(`/data/${city}_weekends.csv`);
          const weekendsText = await weekendsResponse.text();

          const weekdaysData = d3.csvParse(weekdaysText, d => ({
            realSum: +d.realSum,
            host_is_superhost: d.host_is_superhost === 'True'
          }));

          const weekendsData = d3.csvParse(weekendsText, d => ({
            realSum: +d.realSum,
            host_is_superhost: d.host_is_superhost === 'True'
          }));

          allData.push({
            city,
            weekdays: weekdaysData,
            weekends: weekendsData
          }); //get all the data

      }

      setData(allData);
      setLoading(false);
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!data || loading) return;

    const renderChart = () => {
      const calculateAverages = () => {
      const result = {
        nonSuperhost: { weekday: [], weekend: [], avgWeekday: 0, avgWeekend: 0 },
        superhost: { weekday: [], weekend: [], avgWeekday: 0, avgWeekend: 0 }
      };

      let totalNonSuperhostWeekday = 0;
      let totalNonSuperhostWeekend = 0;
      let totalSuperhostWeekday = 0;
      let totalSuperhostWeekend = 0;

      data.forEach(cityData => {
        const cityName = cityData.city.charAt(0).toUpperCase() + cityData.city.slice(1);
        
        const nonSuperhostWeekday = cityData.weekdays.filter(d => !d.host_is_superhost);
        const superhostWeekday = cityData.weekdays.filter(d => d.host_is_superhost);
        const avgNonSuperhostWeekday = d3.mean(nonSuperhostWeekday, d => d.realSum) || 0;
        const avgSuperhostWeekday = d3.mean(superhostWeekday, d => d.realSum) || 0;
        const nonSuperhostWeekend = cityData.weekends.filter(d => !d.host_is_superhost);
        const superhostWeekend = cityData.weekends.filter(d => d.host_is_superhost);
        const avgNonSuperhostWeekend = d3.mean(nonSuperhostWeekend, d => d.realSum) || 0;
        const avgSuperhostWeekend = d3.mean(superhostWeekend, d => d.realSum) || 0;

        result.nonSuperhost.weekday.push({ city: cityName, avg: avgNonSuperhostWeekday });
        result.nonSuperhost.weekend.push({ city: cityName, avg: avgNonSuperhostWeekend });
        result.superhost.weekday.push({ city: cityName, avg: avgSuperhostWeekday });
        result.superhost.weekend.push({ city: cityName, avg: avgSuperhostWeekend });

        totalNonSuperhostWeekday += avgNonSuperhostWeekday;
        totalNonSuperhostWeekend += avgNonSuperhostWeekend;
        totalSuperhostWeekday += avgSuperhostWeekday;
        totalSuperhostWeekend += avgSuperhostWeekend;
      });

      result.nonSuperhost.avgWeekday = totalNonSuperhostWeekday / data.length;
      result.nonSuperhost.avgWeekend = totalNonSuperhostWeekend / data.length;
      result.superhost.avgWeekday = totalSuperhostWeekday / data.length;
      result.superhost.avgWeekend = totalSuperhostWeekend / data.length;

      result.nonSuperhost.weekday.sort((a, b) => b.avg - a.avg); //sort each of the vertical charts from highest to lowest
      result.nonSuperhost.weekend.sort((a, b) => b.avg - a.avg);
      result.superhost.weekday.sort((a, b) => b.avg - a.avg);
      result.superhost.weekend.sort((a, b) => b.avg - a.avg);

      return result;
    };

    const averages = calculateAverages();

    const margin = { top: 60, right: 30, bottom: 80, left: 80 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right).attr('height', height + margin.top + margin.bottom)
      .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const tooltip = d3.select('body').selectAll('.airbnb-tooltip').data([0]).join('div')
      .attr('class', 'airbnb-tooltip')
      .style('position', 'absolute')
      .style('background', 'white')
      .style('border', '2px solid #333')

    const barData = [
      { group: 'Non-Superhost', type: 'Weekday', value: averages.nonSuperhost.avgWeekday, cities: averages.nonSuperhost.weekday },
      { group: 'Non-Superhost', type: 'Weekend', value: averages.nonSuperhost.avgWeekend, cities: averages.nonSuperhost.weekend },
      { group: 'Superhost', type: 'Weekday', value: averages.superhost.avgWeekday, cities: averages.superhost.weekday },
      { group: 'Superhost', type: 'Weekend', value: averages.superhost.avgWeekend, cities: averages.superhost.weekend }
    ]; //data for 4 main bars

    const x0 = d3.scaleBand().domain(['Non-Superhost', 'Superhost']).range([0, width]).padding(0.2);

    const x1 = d3.scaleBand().domain(['Weekday', 'Weekend']).range([0, x0.bandwidth()]).padding(0.1);

    const y = d3.scaleLinear().domain([0, d3.max(barData, d => d.value) * 1.1]).range([height, 0]);

    const color = d3.scaleOrdinal().domain(['Weekday', 'Weekend']).range(['blue', 'red']);

    svg.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x0)).selectAll('text')
      .style('font-size', '14px').style('font-weight', 'bold');

    svg.append('g').call(d3.axisLeft(y).ticks(6)
    .tickFormat(d => `€${d.toFixed(0)}`)).selectAll('text').style('font-size', '12px');

    svg.append('text').attr('transform', 'rotate(-90)').attr('y', -60)
      .attr('x', -height / 2).attr('text-anchor', 'middle').style('font-size', '14px')
      .style('font-weight', 'bold').text('Average Price (€)');

    svg.append('text').attr('x', width / 2).attr('y', -30).attr('text-anchor', 'middle')
      .style('font-size', '18px').style('font-weight', 'bold').text('Airbnb Prices: Superhost vs Non-Superhost (Weekday vs Weekend)');

    const groups = svg.selectAll('.group').data(['Non-Superhost', 'Superhost']).join('g')
      .attr('class', 'group').attr('transform', d => `translate(${x0(d)},0)`);

    groups.selectAll('rect')
      .data(d => ['Weekday', 'Weekend'].map(type => {
        const bar = barData.find(b => b.group === d && b.type === type);
        return { ...bar, group: d, type };
      })).join('rect').attr('x', d => x1(d.type)).attr('width', x1.bandwidth()).attr('y', height).attr('height', 0)
      .attr('fill', d => color(d.type))
      .on('mouseover', function(event, d) {
        d3.select(this)

        const tooltipWidth = 400;
        const tooltipHeight = 350;
        const tooltipMargin = { top: 40, right: 60, bottom: 30, left: 100 };
        const chartWidth = tooltipWidth - tooltipMargin.left - tooltipMargin.right;
        const chartHeight = tooltipHeight - tooltipMargin.top - tooltipMargin.bottom; //horizontal bar charts

        const xScale = d3.scaleLinear()
          .domain([0, d3.max(d.cities, c => c.avg)])
          .range([0, chartWidth]);

        const yScale = d3.scaleBand()
          .domain(d.cities.map(c => c.city))
          .range([0, chartHeight])
          .padding(0.15);

        let tooltipContent = `
          <div style="width: ${tooltipWidth}px; height: ${tooltipHeight}px;">
            <h3 style="margin: 0 0 10px 0; text-align: center; font-size: 14px;">
              ${d.group} - ${d.type}
            </h3>
            <svg width="${tooltipWidth}" height="${tooltipHeight - 30}">
              <g transform="translate(${tooltipMargin.left},${tooltipMargin.top})">
        `;

        d.cities.forEach(city => {
          const barWidth = xScale(city.avg);
          const barY = yScale(city.city);
          tooltipContent += `
            <rect x="0" y="${barY}" width="${barWidth}" height="${yScale.bandwidth()}" 
                  fill="${color(d.type)}"/>
            <text x="${barWidth + 5}" y="${barY + yScale.bandwidth() / 2}" 
                  dy="0.35em" font-size="11px" font-weight="bold">
              €${city.avg.toFixed(0)}
            </text>
          `; //wasnt working with .attr so i put it in html instead
        });

        d.cities.forEach(city => {
          const barY = yScale(city.city);
          tooltipContent += `
            <text x="-5" y="${barY + yScale.bandwidth() / 2}" 
                  dy="0.35em" text-anchor="end" font-size="11px">
              ${city.city}
            </text>
          `;
        });

        tooltipContent += `
              </g>
            </svg>
          </div>
        `;

        tooltip
          .style('display', 'block')
          .html(tooltipContent)
          .style('left', (event.pageX + 15) + 'px')
          .style('top', (event.pageY - 180) + 'px');
      })
      .on('mousemove', function(event) {
        tooltip.style('left', (event.pageX + 15) + 'px').style('top', (event.pageY - 180) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this)
        tooltip.style('display', 'none');
      })
      .transition()
      .duration(800)
      .delay((d, i) => i * 150) //staggers animation for bars
      .attr('y', d => y(d.value))
      .attr('height', d => height - y(d.value));

    groups.selectAll('.value-label')
      .data(d => ['Weekday', 'Weekend'].map(type => {
        const bar = barData.find(b => b.group === d && b.type === type);
        return { ...bar, group: d, type };
      })).join('text').attr('class', 'value-label').attr('x', d => x1(d.type) + x1.bandwidth() / 2)
      .attr('y', height).attr('text-anchor', 'middle').style('font-size', '13px').style('font-weight', 'bold')
      .style('fill', '#000')
      //.style('opacity', 0)
      .transition()
      .duration(800)
      .delay((d, i) => i * 150) //staggered by same amount
      .attr('y', d => Math.min(y(d.value) - 8, height - 10))
      .text(d => `€${Math.round(d.value)}`);

    
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 150}, ${height + 40})`);

    ['Weekday', 'Weekend'].forEach((type, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 25})`);

      legendRow.append('rect')
        .attr('width', 18)
        .attr('height', 18)
        .attr('fill', color(type))

      legendRow.append('text')
        .attr('x', 25)
        .attr('y', 9)
        .attr('dy', '0.35em')
        .style('font-size', '12px')
        .text(type);
    });

    };

    requestAnimationFrame(renderChart); //used to render (wasnt working without it)

  }, [data, loading]);

  return (
    <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default BarChart;