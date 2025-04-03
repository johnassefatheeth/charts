class LineChart {
  /**
   * Constructor for the advanced LineChart.
   * @param {string} containerId - ID of the container element.
   * @param {string} canvasId - ID to assign to the canvas element.
   * @param {string} tooltipId - ID of the tooltip element.
   * @param {string} legendContainerId - ID of the legend container.
   * @param {number[][]} dataArrays - Array of data arrays (each array represents a dataset).
   * @param {object} options - Configuration options.
   */
  constructor(containerId, canvasId, tooltipId, legendContainerId, dataArrays, options = {}) {
    this.containerId = containerId;
    this.tooltipId = tooltipId;
    this.legendContainerId = legendContainerId;
    this.dataArrays = dataArrays; // Array of data arrays
    this.options = { ...LineChart.defaultOptions, ...options };
    this.hoverIndex = -1;
    this.hoverDatasetIndex = -1; // Track which dataset is hovered

    // Create and append canvas
    this.canvas = document.createElement('canvas');
    this.canvas.id = canvasId;
    document.getElementById(containerId).appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    // Initialize
    this.init();
  }

  // Default options
  static defaultOptions = {
    width: 600,
    height: 400,
    padding: 100,
    axisColor: '#121212',
    gridLineColor: '#ccc',
    gridLineThickness: 1,
    axisThickness: 2,
    lineColors: ['yellow', 'blue', 'green', 'red'], // Array of colors for each dataset
    lineWidth: 2,
    pointColor: '#345',
    hoverPointColor: 'red',
    labelColor: 'green',
    xLabelColor: 'gray',
    font: '16px Arial',
    tooltipBackgroundColor: '#fff',
    tooltipFont: '14px Arial',
    tooltipTextColor: '#333',
    animationDuration: 1000,
    displayLegend: true,
    legendFont: '14px Arial',
    legendColor: '#000',
    numIntervals: 5,
    showGridLines: true,
    showAxisLines: true,
    legendFontSize: '14px', 
    tooltipFontSize: '14px',
  };

  /**
   * Initializes the chart: sets up canvas, events, and draws.
   */
  init() {
    this.resizeCanvas();
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseout', () => this.handleMouseOut());
    this.draw();
  }

  /**
   * Resizes the canvas to fit its container and account for DPR.
   */
  resizeCanvas() {
    const container = document.getElementById(this.containerId);
    const style = getComputedStyle(container);
    const width = parseInt(style.width, 10);
    const height = parseInt(style.height, 10);
    const DPR = window.devicePixelRatio || 1;

    this.canvas.width = width * DPR;
    this.canvas.height = height * DPR;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.scale(DPR, DPR);

    // Scale the font size proportionally
    const baseFontSize = 16; // Base font size for reference
    const scaleFactor = Math.min(width, height) / 300; // Adjust 300 to your reference canvas size
    this.options.font = `${baseFontSize * scaleFactor}px Arial`;
  }

  /**
   * Draws the line chart, including axes, grid lines, labels, the connecting lines, and data points.
   */
  draw() {
    const chartWidth = this.canvas.width / window.devicePixelRatio;
    const chartHeight = this.canvas.height / window.devicePixelRatio;
    const padding = this.options.padding;

    // Determine the maximum and minimum values for scaling.
    const allData = this.dataArrays.flat();
    const maxValue = Math.max(...allData);
    const minValue = Math.min(...allData);
    const valueRange = maxValue - minValue;

    // Determine the number of intervals (grid lines) on the y-axis.
    const numIntervals = this.options.numIntervals;
    const intervalValue = valueRange / numIntervals;

    // Clear the entire canvas before redrawing.
    this.ctx.clearRect(0, 0, chartWidth, chartHeight);

    // ---------- Draw Y-Axis ----------
    if (this.options.showAxisLines) {
      this.ctx.beginPath();
      this.ctx.moveTo(padding, padding);
      this.ctx.lineTo(padding, chartHeight - padding);
      this.ctx.strokeStyle = this.options.axisColor;
      this.ctx.lineWidth = this.options.axisThickness;
      this.ctx.stroke();
    }

    // ---------- Draw X-Axis ----------
    if (this.options.showAxisLines) {
      this.ctx.beginPath();
      this.ctx.moveTo(padding, chartHeight - padding);
      this.ctx.lineTo(chartWidth - padding, chartHeight - padding);
      this.ctx.strokeStyle = this.options.axisColor;
      this.ctx.lineWidth = this.options.axisThickness;
      this.ctx.stroke();
    }
    for (let i = 0; i <= numIntervals; i++) {
      
      const y = padding + ((chartHeight - 2 * padding) / numIntervals) * i;
      const value = (maxValue - i * intervalValue).toFixed(2);


      // Draw the y-axis label.
      this.ctx.fillStyle = this.options.labelColor;
      this.ctx.font = this.options.font;
      this.ctx.textAlign = 'right';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(value, padding - 10, y);
    }

    // ---------- Draw Y-Axis Grid Lines and Labels ----------
    if (this.options.showGridLines) {
      for (let i = 0; i <= numIntervals; i++) {
        const y = padding + ((chartHeight - 2 * padding) / numIntervals) * i;
        const value = (maxValue - i * intervalValue).toFixed(2);

        // Draw horizontal grid line.
        this.ctx.beginPath();
        this.ctx.moveTo(padding, y);
        this.ctx.lineTo(chartWidth - padding, y);
        this.ctx.strokeStyle = this.options.gridLineColor;
        this.ctx.lineWidth = this.options.gridLineThickness;
        this.ctx.stroke();

        
      }
      // Draw vertical grid lines (for X-axis)
      for (let i = 0; i < this.dataArrays[0].length; i++) {
        const x = padding + ((chartWidth - 2 * padding) / (this.dataArrays[0].length - 1)) * i;
        this.ctx.beginPath();
        this.ctx.moveTo(x, padding);
        this.ctx.lineTo(x, chartHeight - padding);
        this.ctx.strokeStyle = this.options.gridLineColor;
        this.ctx.lineWidth = this.options.gridLineThickness;
        this.ctx.stroke();
      }
    }

    // ---------- Draw X-Axis Labels ----------
    const xStep = (chartWidth - 2 * padding) / (this.dataArrays[0].length - 1);
    const availableWidth = chartWidth - 2 * padding;
    const labelWidth = this.ctx.measureText("Data 000").width;
    const maxLabels = Math.floor(availableWidth / (labelWidth / 2));
    const labelInterval = Math.ceil(this.dataArrays[0].length / maxLabels);

    for (let i = 0; i < this.dataArrays[0].length; i++) {
      if (i % labelInterval !== 0) continue;

      const x = padding + xStep * i;
      const y = chartHeight - padding;

      this.ctx.fillStyle = this.options.xLabelColor;
      this.ctx.font = this.options.font;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'top';
      this.ctx.fillText(`Data${i + 1}`, x, y + 10);
    }

    // ---------- Draw the Lines Connecting the Data Points for Each Dataset ----------
    this.dataArrays.forEach((data, datasetIndex) => {
      this.ctx.beginPath();
      this.ctx.moveTo(
        padding,
        chartHeight - padding - ((data[0] - minValue) / valueRange) * (chartHeight - 2 * padding)
      );

      for (let i = 1; i < data.length; i++) {
        const x = padding + xStep * i;
        const y = chartHeight - padding - ((data[i] - minValue) / valueRange) * (chartHeight - 2 * padding);
        this.ctx.lineTo(x, y);
      }

      // Set the stroke style and line width for the current dataset.
      this.ctx.strokeStyle = this.options.lineColors[datasetIndex % this.options.lineColors.length];
      this.ctx.lineWidth = this.options.lineWidth;
      this.ctx.stroke();
    });

    // ---------- Draw Data Points for Each Dataset ----------
    this.dataArrays.forEach((data, datasetIndex) => {
      for (let i = 0; i < data.length; i++) {
        const x = padding + xStep * i;
        const y = chartHeight - padding - ((data[i] - minValue) / valueRange) * (chartHeight - 2 * padding);

        // Highlight the data point if it is hovered.
        this.ctx.fillStyle =
          i === this.hoverIndex && datasetIndex === this.hoverDatasetIndex
            ? this.options.pointColor
            : this.options.pointColor;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 5, 0, 2 * Math.PI);
        this.ctx.fill();
      }
    });

    // Draw legend if enabled
    if (this.options.displayLegend) this.drawLegend();
  }

  /**
   * Draws the legend in the specified container.
   */
  drawLegend() {
  const container = document.getElementById(this.legendContainerId);
  container.innerHTML = '';

  this.dataArrays.forEach((data, datasetIndex) => {
    const item = document.createElement('div');
    item.style.display = 'flex';
    item.style.alignItems = 'center';
    item.style.margin = '4px 0';

    const colorBox = document.createElement('div');
    colorBox.style.width = '20px';
    colorBox.style.height = '20px';
    colorBox.style.backgroundColor = this.options.lineColors[datasetIndex % this.options.lineColors.length];
    colorBox.style.marginRight = '8px';

    const label = document.createElement('span');
    label.style.font = `${this.options.legendFontSize} Arial`; // Use legendFontSize
    label.style.color = this.options.legendColor;
    label.textContent = `Dataset ${datasetIndex + 1}`;

    item.appendChild(colorBox);
    item.appendChild(label);
    container.appendChild(item);
  });
}

  /**
   * Animates the transition from the current data to new data values.
   * @param {number[][]} newDataArrays - The new data arrays for the chart.
   */
  animate(newDataArrays) {
    const duration = this.options.animationDuration; // Total animation duration.
    const frameRate = 60; // Frames per second.
    const totalFrames = duration / (1000 / frameRate);
    let currentFrame = 0;
    const oldDataArrays = this.dataArrays.map((data) => [...data]); // Copy current data.

    const animate = () => {
      if (currentFrame <= totalFrames) {
        // Calculate intermediate values for each data point in each dataset.
        this.dataArrays = oldDataArrays.map((oldData, datasetIndex) =>
          oldData.map((startValue, index) => {
            const endValue = newDataArrays[datasetIndex][index];
            const delta = endValue - startValue;
            return startValue + (delta * currentFrame) / totalFrames;
          })
        );
        this.draw();

        // Call handleMouseMove to update the tooltip position and content during the animation.
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = rect.left + (this.hoverIndex * (this.canvas.width - 2 * this.options.padding) / (this.dataArrays[0].length - 1)) + this.options.padding;
      const mouseY = rect.top + (this.canvas.height / 2); // Approximate Y position for the tooltip.
      const fakeEvent = { clientX: mouseX, clientY: mouseY }; // Simulate a mouse event.
      this.handleMouseMove(fakeEvent); 
      currentFrame++;
        requestAnimationFrame(animate);
      } else {
        // After animation completes, set the data to the new data values.
        this.dataArrays = newDataArrays;
        this.draw();
      }
    };

    animate();
  }

  /**
   * Handles the mouse move event to determine which data point is hovered.
   * @param {MouseEvent} event - The mouse move event.
   */
  handleMouseMove(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (this.canvas.width / rect.width);
    const padding = this.options.padding;
    const xStep = (this.canvas.width - 2 * padding) / (this.dataArrays[0].length - 1);
    const hoverIndex = Math.round((x - padding) / xStep);
  
    // Ensure hoverIndex is within bounds
    if (hoverIndex < 0 || hoverIndex >= this.dataArrays[0].length) {
      this.hideTooltip();
      return;
    }
  
    if (hoverIndex !== this.hoverIndex) {
      this.hoverIndex = hoverIndex;
      this.hoverDatasetIndex = -1; // Reset dataset hover index
  
      // Find which dataset is being hovered
      for (let i = 0; i < this.dataArrays.length; i++) {
        if (hoverIndex >= 0 && hoverIndex < this.dataArrays[i].length) {
          this.hoverDatasetIndex = i;
          break;
        }
      }
  
      this.draw();
      if (this.hoverDatasetIndex !== -1) {
        // Generate tooltip data using a loop
        const tooltipData = [];
        for (let i = 1; i < this.dataArrays.length; i++) {
          const value = this.dataArrays[i][hoverIndex];
          if (value !== undefined && !isNaN(value)) {
            tooltipData.push(`Dataset ${i + 1}: ${value}`);
          }
        
        }
  
        // Display tooltip if there is valid data
        if (tooltipData.length > 0) {
          this.showTooltip(event, tooltipData.join('<br>'));
        } else {
          this.hideTooltip();
        }
      } else {
        this.hideTooltip();
      }
    }
  
    // Update tooltip position to follow the cursor
    if (this.hoverDatasetIndex !== -1) {
      // Generate tooltip data using a loop
      const tooltipData = [];
      for (let i = 0; i < this.dataArrays.length; i++) {
        const value = this.dataArrays[i][hoverIndex];
        if (value !== undefined && !isNaN(value)) {
          tooltipData.push(`Dataset ${i + 1}: ${value}`);
        }
      }
  
      // Display tooltip if there is valid data
      if (tooltipData.length > 0) {
        console.log(tooltipData);
        this.showTooltip(event, tooltipData.join('<br>'));
      }
    }
  }
  /**
   * Handles the mouse out event to reset the hover state.
   */
  handleMouseOut() {
    this.hoverIndex = -1;
    this.hoverDatasetIndex = -1;
    this.draw();
    this.hideTooltip();
  }

  /**
   * Displays tooltip with dataset data.
   * @param {MouseEvent} event - The mouse event.
   * @param {number} value - The value of the hovered data point.
   * @param {number} datasetIndex - The index of the hovered dataset.
   */
  /**
 * Displays tooltip with dataset data.
 * @param {MouseEvent} event - The mouse event.
 * @param {string} tooltipContent - The content to display in the tooltip.
 */
showTooltip(event, tooltipContent) {
  const tooltip = document.getElementById(this.tooltipId);
  if (!tooltip) return;

  tooltip.style.position = 'fixed';
  tooltip.style.left = `${event.clientX + 10}px`;
  tooltip.style.top = `${event.clientY + 10}px`;
  tooltip.style.backgroundColor = this.options.tooltipBackgroundColor;
  tooltip.style.padding = '8px';
  tooltip.style.borderRadius = '4px';
  tooltip.style.font = `${this.options.tooltipFontSize} Arial`; // Use tooltipFontSize
  tooltip.style.color = this.options.tooltipTextColor;
  tooltip.innerHTML = tooltipContent;
  tooltip.style.display = 'block';
}

  /**
   * Hides the tooltip.
   */
  hideTooltip() {
    const tooltip = document.getElementById(this.tooltipId);
    if (tooltip) tooltip.style.display = 'none';
  }
}