const tooltip = document.getElementById('tooltip');
        const barCanvas = document.getElementById('barChart');
        const pieCanvas = document.getElementById('pieChart');
        const lineCanvas = document.getElementById('lineChart');
        const barCtx = barCanvas.getContext('2d');
        const pieCtx = pieCanvas.getContext('2d');
        const lineCtx = lineCanvas.getContext('2d');

        const defaultOptions = {
            width: 400,
            height: 400,
            backgroundColor: 'blue',
            font: '16px Arial',
            axisColor: '#000',
            dataLabels: true,
            legendPosition: 'top-right',
            animationDuration: 1000
        };

        class BarChart {
            constructor(canvas, data, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.data = data;
        this.originalData = [...data];
        this.options = { ...defaultOptions, ...options };
        this.hoverIndex = -1;
        this.padding = 50;
        this.init();
    }

    init() {
        this.canvas.width = this.options.width;
        this.canvas.height = this.options.height;
        this.draw();
    }

    draw() {
    const barColor = this.barColor || '#345'; // Default color if not set
    const barWidth = this.barWidth || 40; // Default width if not set
    const barSpacing = 20;
    const chartHeight = this.canvas.height - 2 * this.padding;
    const scaledData = this.scaleData(this.data, chartHeight);

    const maxValue = Math.max(...this.data);
    const minValue = Math.min(...this.data);
    const zeroY = this.canvas.height - this.padding - ((0 - minValue) / (maxValue - minValue)) * chartHeight;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    scaledData.forEach((value, index) => {
        const barHeight = value;
        const x = index * (barWidth + barSpacing) + this.padding;
        const y = value >= 0 ? zeroY - barHeight : zeroY;

        this.ctx.fillStyle = index === this.hoverIndex ? 'red' : barColor;
        this.ctx.fillRect(x, y, barWidth, Math.abs(barHeight));

        const originalValue = this.originalData[index].toFixed(2);
        this.ctx.fillStyle = '#000';
        // Adjust vertical position of labels based on value's sign
        const labelY = value >= 0 ? y - 5 : y + Math.abs(barHeight) + 15;
        this.ctx.fillText(originalValue, x + barWidth / 2 - this.ctx.measureText(originalValue).width / 2, labelY);

        if (this.options.dataLabels) {
    const dataLabelY = this.canvas.height - this.padding / 2;
    
    // Calculate text position
    const textX = x + barWidth / 2 - this.ctx.measureText(`Value ${index + 1}`).width / 2;
    const textWidth = this.ctx.measureText(`Value ${index + 1}`).width;
    const textHeight = parseInt(this.ctx.font, 10); // Assuming the font size is set in pixels

    // Check if text overlaps with bar
    const textOverlapsBar = value >= 0 && textX < x + barWidth && textX + textWidth > x && dataLabelY > y && dataLabelY < y + Math.abs(barHeight);

    if (textOverlapsBar) {
        this.ctx.fillStyle = '#fff'; // Set color to white if text overlaps with the bar
    } else {
        this.ctx.fillStyle = '#000'; // Set color to black otherwise
    }

    this.ctx.fillText(`Value ${index + 1}`, textX, dataLabelY);
    this.ctx.fillStyle = barColor; // Restore original fillStyle
}


    });
}




        scaleData(data, maxHeight) {
            const maxValue = Math.max(...data);
            const minValue = Math.min(...data);
            const range = maxValue - minValue;
            if (range > 0) {
                const scale = maxHeight / range;
                return data.map(value => value * scale);
            }
            return data;
        }


    animate(newData) {
        const duration = this.options.animationDuration;
        const frameRate = 60;
        const totalFrames = duration / (1000 / frameRate);
        let currentFrame = 0;
        const oldData = [...this.data];

        const animate = () => {
            if (currentFrame <= totalFrames) {
                this.data = oldData.map((startValue, index) => {
                    const endValue = newData[index];
                    const delta = endValue - startValue;
                    return startValue + (delta * currentFrame) / totalFrames;
                });
                this.draw();
                currentFrame++;
                requestAnimationFrame(animate);
            } else {
                this.data = newData;
                this.originalData = [...newData]; // Update original data
                this.draw();
            }
        };

        animate();
    }

    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const barWidth = 40;
        const barSpacing = 20;
        const hoverIndex = Math.floor((x - this.padding) / (barWidth + barSpacing));
        if (hoverIndex !== this.hoverIndex) {
            this.hoverIndex = hoverIndex;
            this.draw();
        }
    }

    handleMouseOut() {
        this.hoverIndex = -1;
        this.draw();
    }
}


        class PieChart {
            constructor(canvas, data, options = {}) {
                this.canvas = canvas;
                this.ctx = canvas.getContext('2d');
                this.data = data;
                this.options = { ...defaultOptions, ...options };
                this.colors = ['#ff6384', '#36a2eb', '#cc65fe', '#ffce56'];
                this.hoverIndex = -1;
                this.legendContainer = document.getElementById('pieLegend');
                this.init();
            }

            init() {
                this.canvas.width = this.options.width;
                this.canvas.height = this.options.height;
                this.draw();
            }

            draw() {
                const total = this.data.reduce((acc, val) => acc + val, 0);
                let startAngle = 0;

                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

                this.data.forEach((value, index) => {
                    if (!this.colors[index]) {
                        this.colors[index] = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
                    }

                    const sliceAngle = (value / total) * 2 * Math.PI;
                    const endAngle = startAngle + sliceAngle;

                    this.ctx.fillStyle = index === this.hoverIndex ? 'red' : this.colors[index];
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.canvas.width / 2, this.canvas.height / 2);
                    this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, this.canvas.height / 2, startAngle, endAngle);
                    this.ctx.closePath();
                    this.ctx.fill();

                    // Calculate the label position
                    const middleAngle = startAngle + sliceAngle / 2;
                    const labelX = this.canvas.width / 2 + (this.canvas.height / 4) * Math.cos(middleAngle);
                    const labelY = this.canvas.height / 2 + (this.canvas.height / 4) * Math.sin(middleAngle);

                    this.ctx.fillStyle = '#000';
                    this.ctx.font = '14px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(`${value.toFixed(2)} (${((value / total) * 100).toFixed(2)}%)`, labelX, labelY);

                    startAngle += sliceAngle;
                });
                this.drawLegend();
                 // Highlight the legend item corresponding to the hovered slice
                const legendItems = this.legendContainer.querySelectorAll('.legend-item');
                legendItems.forEach((item, index) => {
                    if (index === this.hoverIndex) {
                        item.style.fontWeight = 'bold';
                    } else {
                        item.style.fontWeight = 'normal';
                    }
                });
            }
            drawLegend() {
                this.legendContainer.innerHTML = ''; // Clear previous legend items

                this.data.forEach((value, index) => {
                    const legendItem = document.createElement('div');
                    legendItem.className = 'legend-item';

                    const colorBox = document.createElement('div');
                    colorBox.className = 'legend-color-box';
                    colorBox.style.backgroundColor = this.colors[index];

                    const label = document.createElement('span');
                    label.innerText = `Value ${index + 1}: ${value.toFixed(2)}`;

                    legendItem.appendChild(colorBox);
                    legendItem.appendChild(label);

                    this.legendContainer.appendChild(legendItem);
                });
            }

            animate(newData) {
                const duration = this.options.animationDuration;
                const frameRate = 60;
                const totalFrames = duration / (1000 / frameRate);
                let currentFrame = 0;
                const oldData = [...this.data];

                const animate = () => {
                    if (currentFrame <= totalFrames) {
                        this.data = oldData.map((startValue, index) => {
                            const endValue = newData[index];
                            const delta = endValue - startValue;
                            return startValue + (delta * currentFrame) / totalFrames;
                        });
                        this.draw();
                        currentFrame++;
                        requestAnimationFrame(animate);
                    } else {
                        this.data = newData;
                        this.draw();
                    }
                };

                animate();
            }

            handleMouseMove(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const total = this.data.reduce((acc, val) => acc + val, 0);
    let startAngle = 0;
    let hoverIndex = -1;

    this.data.forEach((value, index) => {
        const sliceAngle = (value / total) * 2 * Math.PI;
        const endAngle = startAngle + sliceAngle;

        const dx = x - this.canvas.width / 2;
        const dy = y - this.canvas.height / 2;
        const distance = Math.sqrt(dx * dx + dy * dy);
        let angle = Math.atan2(dy, dx);

        // Ensure the angle is positive
        if (angle < 0) angle += 2 * Math.PI;

        // Check if the mouse is within the current slice
        if (distance <= this.canvas.height / 2 && angle >= startAngle && angle < endAngle) {
            hoverIndex = index;
        }

        startAngle = endAngle;
    });

    if (hoverIndex !== this.hoverIndex) {
        this.hoverIndex = hoverIndex;
        this.draw();
    }
}


            handleMouseOut() {
                this.hoverIndex = -1;
                this.draw();
            }
        }

        class LineChart {
            constructor(canvas, data, options = {}) {
                this.canvas = canvas;
                this.ctx = canvas.getContext('2d');
                this.data = data;
                this.options = { ...defaultOptions, ...options };
                this.hoverIndex = -1;
                this.init();
            }

            init() {
                this.canvas.width = this.options.width;
                this.canvas.height = this.options.height;
                this.draw();
            }
            draw() {
    const chartWidth = this.canvas.width;
    const chartHeight = this.canvas.height;
    const padding = 40;
    const maxValue = Math.max(...this.data);
    const minValue = Math.min(...this.data);
    const valueRange = maxValue - minValue;
    const numIntervals = 5;
    const intervalValue = valueRange / numIntervals;

    this.ctx.clearRect(0, 0, chartWidth, chartHeight);

    // Draw y-axis
    this.ctx.beginPath();
    this.ctx.moveTo(padding, padding);
    this.ctx.lineTo(padding, chartHeight - padding);
    this.ctx.strokeStyle = this.options.axisColor;
    this.ctx.stroke();

    // Draw x-axis
    this.ctx.beginPath();
    this.ctx.moveTo(padding, chartHeight - padding);
    this.ctx.lineTo(chartWidth - padding, chartHeight - padding);
    this.ctx.strokeStyle = this.options.axisColor;
    this.ctx.stroke();

    // Draw y-axis intervals and labels
    for (let i = 0; i <= numIntervals; i++) {
        const y = padding + ((chartHeight - 2 * padding) / numIntervals) * i;
        const value = (maxValue - i * intervalValue).toFixed(2);

        // Draw horizontal grid line
        this.ctx.beginPath();
        this.ctx.moveTo(padding, y);
        this.ctx.lineTo(chartWidth - padding, y);
        this.ctx.strokeStyle = '#ccc';
        this.ctx.stroke();

        // Draw y-axis label
        this.ctx.fillStyle = '#000';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(value, padding - 10, y);
    }

    // Draw x-axis labels
    const xStep = (chartWidth - 2 * padding) / (this.data.length - 1);
    for (let i = 0; i < this.data.length; i++) {
        const x = padding + xStep * i;
        const y = chartHeight - padding;

        // Draw x-axis label
        this.ctx.fillStyle = '#000';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(`Data ${i + 1}`, x, y + 10);
    }

    // Draw the line chart
    this.ctx.beginPath();
    this.ctx.moveTo(padding, chartHeight - padding - ((this.data[0] - minValue) / valueRange) * (chartHeight - 2 * padding));
    for (let i = 1; i < this.data.length; i++) {
        const x = padding + xStep * i;
        const y = chartHeight - padding - ((this.data[i] - minValue) / valueRange) * (chartHeight - 2 * padding);
        this.ctx.lineTo(x, y);
    }
    this.ctx.strokeStyle = '#345';
    this.ctx.lineWidth = this.options.lineWidth;
    this.ctx.stroke();

    // Draw points
    for (let i = 0; i < this.data.length; i++) {
        const x = padding + xStep * i;
        const y = chartHeight - padding - ((this.data[i] - minValue) / valueRange) * (chartHeight - 2 * padding);

        this.ctx.fillStyle = i === this.hoverIndex ? 'red' : '#345';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 5, 0, 2 * Math.PI);
        this.ctx.fill();
    }
}


            animate(newData) {
                const duration = this.options.animationDuration;
                const frameRate = 60;
                const totalFrames = duration / (1000 / frameRate);
                let currentFrame = 0;
                const oldData = [...this.data];

                const animate = () => {
                    if (currentFrame <= totalFrames) {
                        this.data = oldData.map((startValue, index) => {
                            const endValue = newData[index];
                            const delta = endValue - startValue;
                            return startValue + (delta * currentFrame) / totalFrames;
                        });
                        this.draw();
                        currentFrame++;
                        requestAnimationFrame(animate);
                    } else {
                        this.data = newData;
                        this.draw();
                    }
                };

                animate();
            }

            handleMouseMove(event) {
                const rect = this.canvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const padding = 40;
                const xStep = (this.canvas.width - 2 * padding) / (this.data.length - 1);
                const hoverIndex = Math.round((x - padding) / xStep);
                if (hoverIndex !== this.hoverIndex) {
                    this.hoverIndex = hoverIndex;
                    this.draw();
                }
            }

            handleMouseOut() {
                this.hoverIndex = -1;
                this.draw();
            }
        }

        const barChart = new BarChart(barCanvas, [50, 75, 150, 100, 200]);
        const pieChart = new PieChart(pieCanvas, [10, 20, 30, 40]);
        const lineChart = new LineChart(lineCanvas, [10, 20, 15, 25, 30, 20, 10]);

        document.getElementById('barData').addEventListener('input', (e) => {
            const newData = e.target.value.split(',').map(Number);
            barChart.animate(newData);
        });

        document.getElementById('pieData').addEventListener('input', (e) => {
            const newData = e.target.value.split(',').map(Number);
            pieChart.animate(newData);
        });

        document.getElementById('lineData').addEventListener('input', (e) => {
            const newData = e.target.value.split(',').map(Number);
            lineChart.animate(newData);
        });
        document.getElementById('barColor').addEventListener('input', () => {
            barChart.barColor = document.getElementById('barColor').value;
            barChart.draw();
        });

        document.getElementById('barWidth').addEventListener('input', () => {
            barChart.barWidth = parseInt(document.getElementById('barWidth').value, 10);
            barChart.draw();
        });

        let lineThicknessInput=document.getElementById('lineThickness');
        // Add an event listener to update the line chart when the line thickness changes
        document.getElementById('lineThickness').addEventListener('input',async () => {
                lineChart.options.lineWidth = document.getElementById('lineThickness').value;
                lineChart.draw();
        });



        function handleHover(event, chart) {
    const rect = chart.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    let tooltipText = '';

    switch (chart) {
        case barChart:
            const barWidth = parseInt(document.getElementById('barWidth').value, 10) || 40;
            const barSpacing = 20;
            const chartHeight = chart.canvas.height - 50;
            chart.data.forEach((value, index) => {
                const xStart = chart.padding + index * (barWidth + barSpacing);
                const xEnd = xStart + barWidth;
                const yStart = chartHeight - value;
                const yEnd = chartHeight;
                if (x >= xStart && x <= xEnd && y >= yStart && y <= yEnd) {
                    tooltipText = `Value: ${value}`;
                    tooltip.style.left = `${rect.left + xEnd + 10}px`; // Position the tooltip to the right of the bar
                    tooltip.style.top = `${event.pageY - 10}px`; // Align with the mouse pointer vertically
                }
            });
            break;
        case pieChart:
            const total = chart.data.reduce((acc, val) => acc + val, 0);
            let startAngle = 0;
            chart.data.forEach((value, index) => {
                const sliceAngle = (value / total) * 2 * Math.PI;
                const endAngle = startAngle + sliceAngle;
                const dx = x - chart.canvas.width / 2;
                const dy = y - chart.canvas.height / 2;
                const distance = Math.sqrt(dx * dx + dy * dy);
                let angle = Math.atan2(dy, dx);

                // Ensure the angle is positive
                if (angle < 0) angle += 2 * Math.PI;

                // Check if the mouse is within the current slice
                if (distance <= chart.canvas.height / 2 && angle >= startAngle && angle <= endAngle) {
                    tooltipText = `Value: ${value.toFixed(2)}`;
                }
                startAngle = endAngle;
            });
            break;
        case lineChart:
            const padding = 10;
            const xStep = (chart.canvas.width - 2 * padding) / (chart.data.length - 1);
            const hoverIndex = chart.hoverIndex;
            if (hoverIndex !== -1) {
                const value = chart.data[hoverIndex];
                tooltipText = `Value: ${value.toFixed(2)}`;
            }
            break;
    }

    if (tooltipText) {
        tooltip.style.display = 'block';
        tooltip.style.left = `${event.pageX + 10}px`;
        tooltip.style.top = `${event.pageY - 10}px`;
        tooltip.innerHTML = tooltipText;
    } else {
        tooltip.style.display = 'none';
    }
}


        barCanvas.addEventListener('mousemove', (event) => handleHover(event, barChart));
        pieCanvas.addEventListener('mousemove', (event) => handleHover(event, pieChart));
        lineCanvas.addEventListener('mousemove', (event) => handleHover(event, lineChart));
        barCanvas.addEventListener('mouseout', () => { tooltip.style.display = 'none'; });
        pieCanvas.addEventListener('mouseout', () => { tooltip.style.display = 'none'; });
        lineCanvas.addEventListener('mouseout', () => { tooltip.style.display = 'none'; });

        barCanvas.addEventListener('mousemove', (event) => barChart.handleMouseMove(event));
        barCanvas.addEventListener('mouseout', () => barChart.handleMouseOut());
        pieCanvas.addEventListener('mousemove', (event) => pieChart.handleMouseMove(event));
        pieCanvas.addEventListener('mouseout', () => pieChart.handleMouseOut());
        lineCanvas.addEventListener('mousemove', (event) => lineChart.handleMouseMove(event));
        lineCanvas.addEventListener('mouseout', () => lineChart.handleMouseOut());
