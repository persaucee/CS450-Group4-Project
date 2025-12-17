import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const cities = ['amsterdam', 'athens', 'barcelona', 'berlin', 'budapest', 
                'lisbon', 'london', 'paris', 'rome', 'vienna'];

const ValueMatrix = () => {
  const svgRef = useRef();
  const [allCitiesData, setAllCitiesData] = useState({});
  const [selectedCity, setSelectedCity] = useState('amsterdam');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const citiesData = {};

      for (const city of cities) {
        const weekdaysPath = `/data/${city}_weekdays.csv`;
        const weekendsPath = `/data/${city}_weekends.csv`;
        
        const weekdaysResponse = await fetch(weekdaysPath);
        const weekdaysText = await weekdaysResponse.text();
        
        const weekendsResponse = await fetch(weekendsPath);
        const weekendsText = await weekendsResponse.text();
        
        const parsedWeekdays = d3.csvParse(weekdaysText, d => ({
          price: +d.realSum,
          satisfaction: +d.guest_satisfaction_overall,
          roomType: d.room_type,
          bedrooms: +d.bedrooms || 1,
          isSuperhost: d.host_is_superhost === 'True',
          distance: +d.dist || 0
        }));

        const parsedWeekends = d3.csvParse(weekendsText, d => ({
          price: +d.realSum,
          satisfaction: +d.guest_satisfaction_overall,
          roomType: d.room_type,
          bedrooms: +d.bedrooms || 1,
          isSuperhost: d.host_is_superhost === 'True',
          distance: +d.dist || 0
        }));

        const allData = [...parsedWeekdays, ...parsedWeekends];

        const validData = allData.filter(d => 
          !isNaN(d.price) && !isNaN(d.satisfaction) && 
          d.price > 0 && d.satisfaction > 0 &&
          d.price <= 1600 && d.satisfaction >= 60 && d.satisfaction <= 100
        );

        citiesData[city] = validData;
      }

      setAllCitiesData(citiesData);
      setLoading(false);
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!allCitiesData[selectedCity] || loading) return;

    const data = allCitiesData[selectedCity];
    if (data.length === 0) return;

    const renderChart = () => {
      // Dynamic sampling based on data size
      const targetPoints = 1500;
      const samplingRate = Math.min(1, targetPoints / data.length);
      const displayData = data.filter(() => Math.random() < samplingRate);
      
      const margin = { top: 60, right: 200, bottom: 80, left: 80 };
      const width = 900 - margin.left - margin.right;
      const height = 600 - margin.top - margin.bottom;

      d3.select(svgRef.current).selectAll('*').remove();

      const svg = d3.select(svgRef.current)
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Tooltip
      const tooltip = d3.select('body').selectAll('.value-matrix-tooltip')
        .data([0])
        .join('div')
        .attr('class', 'value-matrix-tooltip')
        .style('position', 'absolute')
        .style('background', 'white')
        .style('border', '2px solid #333')
        .style('padding', '10px')
        .style('border-radius', '5px')
        .style('pointer-events', 'none')
        .style('display', 'none')
        .style('font-size', '12px');

      
      const xScale = d3.scaleLinear()
        .domain([0, 1600])
        .range([0, width])
        .nice();

      const yScale = d3.scaleLinear()
        .domain([50, 100])
        .range([height, 0])
        .nice();

      const colorScale = d3.scaleOrdinal()
        .domain(['Entire home/apt', 'Private room', 'Shared room'])
        .range(['#3498db', '#2ecc71', '#f1c40f']);

      // Calculate midpoints for symmetrical reference lines
      const midPrice = 800;  // Half of 1600
      const midSatisfaction = 75;

      // Reference lines at midpoints
      svg.append('line')
        .attr('x1', xScale(midPrice))
        .attr('x2', xScale(midPrice))
        .attr('y1', 0)
        .attr('y2', height)
        .attr('stroke', 'rgba(128, 128, 128, 0.5)')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');

      svg.append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', yScale(midSatisfaction))
        .attr('y2', yScale(midSatisfaction))
        .attr('stroke', 'rgba(128, 128, 128, 0.5)')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');

      // Draw circles
      svg.selectAll('circle')
        .data(displayData)
        .join('circle')
        .attr('cx', d => xScale(d.price))
        .attr('cy', d => yScale(d.satisfaction))
        .attr('r', d => 3 + d.bedrooms * 1.5)
        .attr('fill', d => colorScale(d.roomType))
        .attr('opacity', 0.6)
        .attr('stroke', d => d.isSuperhost ? '#e74c3c' : 'none')
        .attr('stroke-width', 2)
        .on('mouseover', function(event, d) {
          d3.select(this)
            .attr('opacity', 1)
            .attr('r', 3 + d.bedrooms * 1.5 + 2);

          tooltip
            .style('display', 'block')
            .html(`
              <strong>Price:</strong> €${d.price.toFixed(2)}<br>
              <strong>Satisfaction:</strong> ${d.satisfaction}<br>
              <strong>Room Type:</strong> ${d.roomType}<br>
              <strong>Bedrooms:</strong> ${d.bedrooms}<br>
              <strong>Distance:</strong> ${d.distance.toFixed(1)} km<br>
              <strong>${d.isSuperhost ? '⭐ Superhost' : 'Regular Host'}</strong>
            `)
            .style('left', (event.pageX + 15) + 'px')
            .style('top', (event.pageY - 28) + 'px');
        })
        .on('mousemove', function(event) {
          tooltip
            .style('left', (event.pageX + 15) + 'px')
            .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function(event, d) {
          d3.select(this)
            .attr('opacity', 0.6)
            .attr('r', 3 + d.bedrooms * 1.5);

          tooltip.style('display', 'none');
        });

      // Axes
      svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale).ticks(8).tickFormat(d => `€${d}`))
        .selectAll('text')
        .style('font-size', '12px');

      svg.append('g')
        .call(d3.axisLeft(yScale))
        .selectAll('text')
        .style('font-size', '12px');

      // Axis labels
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 50)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('Price (EUR)');

      svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -60)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('Guest Satisfaction (0-100)');

      // Title
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', -30)
        .attr('text-anchor', 'middle')
        .style('font-size', '18px')
        .style('font-weight', 'bold')
        .text(`Value Matrix: ${selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)} - Price vs Guest Satisfaction`);

      // Legend
      const legend = svg.append('g')
        .attr('transform', `translate(${width + 40}, 0)`);

      // Legend background box
      legend.append('rect')
        .attr('x', -15)
        .attr('y', -15)
        .attr('width', 150)
        .attr('height', 145)
        .attr('fill', '#f8f9fa')
        .attr('stroke', '#dee2e6')
        .attr('stroke-width', 1)
        .attr('rx', 5)
        .attr('ry', 5);

      const legendData = [
        { label: 'Entire home/apt', color: '#3498db' },
        { label: 'Private room', color: '#2ecc71' },
        { label: 'Shared room', color: '#f1c40f' }
      ];

      legendData.forEach((item, i) => {
        const legendRow = legend.append('g')
          .attr('transform', `translate(0, ${i * 25})`);

        legendRow.append('circle')
          .attr('r', 6)
          .attr('fill', item.color)
          .attr('opacity', 0.7);

        legendRow.append('text')
          .attr('x', 15)
          .attr('y', 4)
          .style('font-size', '12px')
          .text(item.label);
      });

      // Legend note for superhost
      legend.append('text')
        .attr('x', 0)
        .attr('y', 90)
        .style('font-size', '11px')
        .style('font-weight', 'bold')
        .text('Red border = Superhost');

      legend.append('text')
        .attr('x', 0)
        .attr('y', 110)
        .style('font-size', '11px')
        .text('Size = Bedrooms');
    };

    requestAnimationFrame(renderChart);
  }, [allCitiesData, selectedCity, loading]);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <label htmlFor="city-select" style={{ marginRight: '10px', fontWeight: 'bold', fontSize: '16px' }}>
          Select City:
        </label>
        <select
          id="city-select"
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          style={{
            padding: '8px 12px',
            fontSize: '14px',
            borderRadius: '5px',
            border: '1px solid #ccc',
            cursor: 'pointer'
          }}
        >
          {cities.map(city => (
            <option key={city} value={city}>
              {city.charAt(0).toUpperCase() + city.slice(1)}
            </option>
          ))}
        </select>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
};

export default ValueMatrix;
