class CompositeChart {
  constructor(
    containerId,
    canvasId,
    tooltipId,
    legendContainerId,
    barData,
    lineDataArrays,
    options = {},
  ) {
    this.containerId = containerId;
    this.tooltipId = tooltipId;
    this.legendContainerId = legendContainerId;
    this.barData = barData;
    this.lineDataArrays = lineDataArrays; // Array of line datasets
    this.initialOptions = options; // original options
    this.options = { ...CompositeChart.defaultOptions, ...options };

    this.canvas = document.createElement("canvas");
    this.canvas.id = canvasId;
    document.getElementById(containerId).appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");

    this.hoverIndex = -1; // Track hovered data point
    this.hoverDatasetIndex = -1; // Track which dataset is hovered
    this.init();
  }

  static defaultOptions = {
    width: 600,
    height: 400,
    padding: 80,
    barColor: "#345",
    lineColors: ["yellow", "blue", "green", "red"],
    lineWidth: 2,
    axisLineWidth: 1,
    gridLineColor: "#ccc",
    gridLineWidth: 1,
    axisColor: "#000",
    showGridLines: true,
    showAxisLines: true,
    tooltipBackgroundColor: "#fff",
    tooltipTextColor: "#333",
    animationDuration: 1000,
    labelColor: "green",
    xLabelColor: "gray",
    font: "16px Arial",
    numIntervals: 5,
    zeroLineColor: "red",
    zeroLineWidth: 1,
    displayLegend: true,
    legendFont: "14px Arial",
    legendColor: "#000",
    showLinePoints: true,
    pointRadius: 3,
    pointHoverRadius: 5,
    pointHoverColor: "red",
  };

  init() {
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
    this.canvas.addEventListener("mousemove", (e) => this.handleMouseMove(e));
    this.canvas.addEventListener("mouseout", () => this.handleMouseOut());
    this.draw();
  }

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

    if (
      !this.initialOptions ||
      typeof this.initialOptions.font === "undefined"
    ) {
      const baseFontSize = 12;
      const scaleFactor = Math.min(width, height) / 300;
      this.options.font = `${baseFontSize * scaleFactor}px Arial`;
    }

    this.draw();
  }

  draw() {
    const rect = this.canvas.getBoundingClientRect();
    const logicalWidth = rect.width;
    const logicalHeight = rect.height;
    const { padding } = this.options;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Scale calculations
    const allLineData = this.lineDataArrays.flat();
    const maxValue = Math.max(...this.barData, ...allLineData);
    const minValue = Math.min(...this.barData, ...allLineData, 0); // Include 0 to handle negative values
    const chartHeight = logicalHeight - 2 * padding;
    const chartWidth = logicalWidth - 2 * padding;

    // Draw Axes
    if (this.options.showAxisLines) {
      this.ctx.beginPath();
      this.ctx.moveTo(padding, padding);
      this.ctx.lineTo(padding, logicalHeight - padding);
      this.ctx.lineTo(logicalWidth - padding, logicalHeight - padding);
      this.ctx.strokeStyle = this.options.axisColor;
      this.ctx.lineWidth = this.options.axisLineWidth;
      this.ctx.stroke();
    }

    // Draw Grid Lines
    if (this.options.showGridLines) {
      this.ctx.strokeStyle = this.options.gridLineColor;
      this.ctx.lineWidth = this.options.gridLineWidth;
      for (let i = 0; i <= this.options.numIntervals; i++) {
        const y = padding + (chartHeight / this.options.numIntervals) * i;
        this.ctx.beginPath();
        this.ctx.moveTo(padding, y);
        this.ctx.lineTo(logicalWidth - padding, y);
        this.ctx.stroke();
      }
    }

    // Draw Zero Line
    const range = maxValue - minValue;
    const zeroY =
      range === 0
        ? logicalHeight - padding
        : logicalHeight - padding - ((0 - minValue) / range) * chartHeight;
    this.ctx.strokeStyle = this.options.zeroLineColor;
    this.ctx.lineWidth = this.options.zeroLineWidth;
    this.ctx.beginPath();
    this.ctx.moveTo(padding, zeroY);
    this.ctx.lineTo(logicalWidth - padding, zeroY);
    this.ctx.stroke();

    // Draw Y-Axis Labels
    this.ctx.fillStyle = this.options.labelColor;
    this.ctx.font = this.options.font;
    this.ctx.textAlign = "right";
    this.ctx.textBaseline = "middle";
    for (let i = 0; i <= this.options.numIntervals; i++) {
      const y = padding + (chartHeight / this.options.numIntervals) * i;
      const value =
        range === 0
          ? maxValue
          : maxValue - (i * range) / this.options.numIntervals;
      this.ctx.fillText(value.toFixed(2), padding - 10, y);
    }

    // Draw X-Axis Labels
    this.ctx.fillStyle = this.options.xLabelColor;
    this.ctx.font = this.options.font;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "top";

    const xStep = chartWidth / this.barData.length;
    const availableWidth = chartWidth;
    const labelWidth = this.ctx.measureText("Data 000").width;
    const maxLabels =
      labelWidth > 0
        ? Math.floor(availableWidth / labelWidth)
        : this.barData.length;
    const labelInterval =
      maxLabels > 0 ? Math.ceil(this.barData.length / maxLabels) : 1;

    for (let i = 0; i < this.barData.length; i++) {
      if (i % labelInterval !== 0) continue;

      const x = padding + xStep * i + xStep / 2;
      this.ctx.fillText(`Data ${i + 1}`, x, logicalHeight - padding + 10);
    }

    // Draw Bar Chart
    const barWidth = xStep / 2;
    this.barData.forEach((value, index) => {
      const barX = padding + index * xStep + (xStep - barWidth) / 2;
      const barHeightValue =
        range === 0 ? 0 : (Math.abs(value) / range) * chartHeight;
      const barHeight = Math.max(0, barHeightValue);

      const y = value >= 0 ? zeroY - barHeight : zeroY;
      this.ctx.fillStyle = this.options.barColor;
      this.ctx.fillRect(barX, y, barWidth, barHeight);

      // Highlight hovered bar
      if (index === this.hoverIndex) {
        this.ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
        this.ctx.fillRect(barX, y, barWidth, barHeight);
      }
    });

    // Draw Line Chart for each dataset

    this.lineDataArrays.forEach((lineData, datasetIndex) => {
      // Set up the line drawing
      this.ctx.strokeStyle =
        this.options.lineColors[datasetIndex % this.options.lineColors.length];
      const lineColor = this.ctx.strokeStyle; // Save for later use in points
      this.ctx.lineWidth = this.options.lineWidth;
      this.ctx.beginPath();

      const lineXStep = chartWidth / this.barData.length;
      let firstValidPoint = true;
      lineData.forEach((data, index) => {
        if (index >= this.barData.length) return;
        if (typeof data !== "number" || isNaN(data)) {
          firstValidPoint = true;
          return;
        }
        const x = padding + index * lineXStep + lineXStep / 2;
        const y =
          range === 0
            ? logicalHeight - padding
            : logicalHeight -
              padding -
              ((data - minValue) / range) * chartHeight;
        if (firstValidPoint) {
          this.ctx.moveTo(x, y);
          firstValidPoint = false;
        } else {
          this.ctx.lineTo(x, y);
        }
      });
      this.ctx.stroke();

      if (this.options.showLinePoints && this.hoverIndex >= 0) {
        lineData.forEach((data, index) => {
          if (index !== this.hoverIndex) return;
          if (index >= this.barData.length) return;
          if (typeof data !== "number" || isNaN(data)) return;
          const x = padding + index * lineXStep + lineXStep / 2;
          const y =
            range === 0
              ? logicalHeight - padding
              : logicalHeight -
                padding -
                ((data - minValue) / range) * chartHeight;
          const radius = this.options.pointHoverRadius;
          this.ctx.fillStyle = this.options.pointHoverColor;
          this.ctx.beginPath();
          this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
          this.ctx.fill();
        });
      }
    });

    // Draw legend if enabled
    if (this.options.displayLegend) this.drawLegend();
  }

  drawLegend() {
    const container = document.getElementById(this.legendContainerId);
    container.innerHTML = "";

    this.lineDataArrays.forEach((lineData, datasetIndex) => {
      const item = document.createElement("div");
      item.style.display = "flex";
      item.style.alignItems = "center";
      item.style.margin = "4px 0";

      const colorBox = document.createElement("div");
      colorBox.style.width = "20px";
      colorBox.style.height = "20px";
      colorBox.style.backgroundColor =
        this.options.lineColors[datasetIndex % this.options.lineColors.length];
      colorBox.style.marginRight = "8px";

      const label = document.createElement("span");
      label.style.font = this.options.legendFont;
      label.style.color = this.options.legendColor;
      label.textContent = `Dataset ${datasetIndex + 1}`;

      item.appendChild(colorBox);
      item.appendChild(label);
      container.appendChild(item);
    });
  }

  animate(newBarData, newLineDataArrays) {
    const duration = this.options.animationDuration;
    const frameRate = 60;
    const totalFrames = (duration / 1000) * frameRate;
    let currentFrame = 0;

    const oldBarData = [...this.barData];
    const oldLineDataArrays = this.lineDataArrays.map((data) => [...data]);

    if (newBarData.length < oldBarData.length || duration <= 0) {
      this.barData = newBarData.map(Number);
      this.lineDataArrays = newLineDataArrays.map((arr) => arr.map(Number));
      this.draw();
      return;
    }

    if (
      JSON.stringify(oldBarData) === JSON.stringify(newBarData) &&
      JSON.stringify(oldLineDataArrays) === JSON.stringify(newLineDataArrays)
    ) {
      this.barData = newBarData;
      this.lineDataArrays = newLineDataArrays;
      this.draw();
      return;
    }

    const animateStep = () => {
      if (currentFrame <= totalFrames) {
        this.barData = oldBarData.map((startValue, index) => {
          const endValue = newBarData[index];
          const delta = endValue - startValue;
          return (startValue + (delta * currentFrame) / totalFrames).toFixed(2);
        });

        this.lineDataArrays = oldLineDataArrays.map(
          (oldLineData, datasetIndex) =>
            oldLineData.map((startValue, index) => {
              const endValue = newLineDataArrays[datasetIndex][index];
              const delta = endValue - startValue;
              return (
                startValue +
                (delta * currentFrame) / totalFrames
              ).toFixed(2);
            }),
        );

        this.draw();
        currentFrame++;
        requestAnimationFrame(animateStep);
      } else {
        this.barData = newBarData;
        this.lineDataArrays = newLineDataArrays;
        this.draw();
      }
    };

    animateStep();
  }

  handleMouseMove(event) {
    const rect = this.canvas.getBoundingClientRect();
    const logicalX = event.clientX - rect.left;
    const logicalWidth = rect.width;
    const padding = this.options.padding;
    const chartWidth = logicalWidth - 2 * padding;

    let foundHover = false;

    const xStep = chartWidth / this.barData.length;
    const barWidth = xStep / 2;

    for (let i = 0; i < this.barData.length; i++) {
      const barX = padding + i * xStep + (xStep - barWidth) / 2;
      const barRight = barX + barWidth;

      if (logicalX >= barX && logicalX <= barRight) {
        this.hoverIndex = i;
        this.hoverDatasetIndex = -1;

        for (let j = 0; j < this.lineDataArrays.length; j++) {
          if (i < this.lineDataArrays[j].length) {
            this.hoverDatasetIndex = j;
            break;
          }
        }

        const tooltipData = [];
        tooltipData.push(`Bar: ${this.barData[i].toFixed(2)}`);
        this.lineDataArrays.forEach((lineData, datasetIndex) => {
          if (i < lineData.length) {
            tooltipData.push(
              `Dataset ${datasetIndex + 1}: ${lineData[i].toFixed(2)}`,
            );
          }
        });

        this.showTooltip(event, tooltipData.join("<br>"));
        this.draw();
        foundHover = true;
        break;
      }
    }

    if (!foundHover && this.hoverIndex !== -1) {
      this.hoverIndex = -1;
      this.hoverDatasetIndex = -1;
      this.hideTooltip();
      this.draw();
    }
  }

  handleMouseOut() {
    this.hoverIndex = -1;
    this.hoverDatasetIndex = -1;
    this.draw();
    this.hideTooltip();
  }

  showTooltip(event, tooltipContent) {
    const tooltip = document.getElementById(this.tooltipId);
    if (!tooltip) return;

    tooltip.style.position = "fixed";
    tooltip.style.left = `${event.clientX + 10}px`;
    tooltip.style.top = `${event.clientY + 10}px`;
    tooltip.style.backgroundColor = this.options.tooltipBackgroundColor;
    tooltip.style.padding = "8px";
    tooltip.style.borderRadius = "4px";
    tooltip.style.font = this.options.font;
    tooltip.style.color = this.options.tooltipTextColor;
    tooltip.innerHTML = tooltipContent;
    tooltip.style.display = "block";
  }

  hideTooltip() {
    const tooltip = document.getElementById(this.tooltipId);
    if (tooltip) tooltip.style.display = "none";
  }
}
