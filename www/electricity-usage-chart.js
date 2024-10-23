(() => {
  class ElectricityUsageChart extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.chart = null;
    }

    set hass(hass) {
      if (!this.config) {
        return;
      }
      console.log("Config: ", this.config);
      const entityId = this.config.entity;
      const stateObj = hass.states[entityId];
      if (!stateObj) {
        console.error(`Entity not found: ${entityId}`);
        return;
      }

      this.monthlyData = stateObj.attributes.monthly_data || [];
      this.render();
    }

    setConfig(config) {
      if (!config.entity) {
        throw new Error("You need to define an entity");
      }
      this.config = config;
    }

    connectedCallback() {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.chart) {
          this.chart.updateOptions({ chart: { width: "100%" } });
        }
      });
      this.resizeObserver.observe(this);
    }

    disconnectedCallback() {
      if (this.resizeObserver) {
        this.resizeObserver.unobserve(this);
      }
    }

    render() {
      if (!this.monthlyData || this.monthlyData.length === 0) {
        this.shadowRoot.innerHTML = "<div>No data available</div>";
        return;
      }

      this.shadowRoot.innerHTML = `
          <style>
            :host {
              display: block;
              width: 100%;
              overflow: hidden;
            }
            #chart {
              width: 100%;
              min-height: 400px;
            }
          </style>
          <ha-card header="${this.config.title || "Electricity Usage"}">
            <div id="chart"></div>
          </ha-card>
        `;

      setTimeout(() => this.createChart(), 0);
    }

    createChart() {
      const chartOptions = {
        chart: {
          type: "line",
          height: 400,
          width: "100%",
          animations: {
            enabled: false,
          },
          toolbar: {
            show: true,
          },
          background: "transparent",
          foreColor: "#D3D3D3",
        },
        series: [
          {
            name: "Units Consumed",
            type: "column",
            data: this.monthlyData.map((entry) => ({
              x: entry.month,
              y: parseFloat(entry.consumed_units) || 0,
            })),
          },
          {
            name: "Bill Amount",
            type: "line",
            data: this.monthlyData.map((entry) => ({
              x: entry.month,
              y: parseFloat(entry.bill_amount) || 0,
            })),
          },
          {
            name: "Rebate",
            type: "line",
            data: this.monthlyData.map((entry) => ({
              x: entry.month,
              y: parseFloat(entry.rebate_amount) || 0,
            })),
          },
        ],
        xaxis: {
          type: "category",
          labels: {
            rotate: -45,
            rotateAlways: true,
            trim: false,
            style: {
              colors: "#D3D3D3",
              fontSize: "14px",
            },
          },
        },
        yaxis: [
          {
            title: {
              text: "Units",
              style: {
                color: "#D3D3D3",
                fontSize: "16px",
              },
            },
            labels: {
              style: {
                colors: "#D3D3D3",
                fontSize: "14px",
              },
            },
          },
          {
            opposite: true,
            title: {
              text: "Amount (NPR)",
              style: {
                color: "#D3D3D3",
                fontSize: "16px",
              },
            },
            labels: {
              style: {
                colors: "#D3D3D3",
                fontSize: "14px",
              },
            },
          },
        ],
        stroke: {
          curve: "smooth",
          width: 3,
        },
        legend: {
          position: "top",
          fontSize: "16px",
          labels: {
            colors: "#D3D3D3",
          },
        },
        dataLabels: {
          enabled: false,
        },
        tooltip: {
          theme: "dark",
          background: "#424242",
          style: {
            fontSize: "14px",
          },
        },
        responsive: [
          {
            breakpoint: 480,
            options: {
              legend: {
                position: "bottom",
              },
            },
          },
        ],
      };

      if (this.chart) {
        this.chart.destroy();
      }

      this.chart = new ApexCharts(
        this.shadowRoot.querySelector("#chart"),
        chartOptions
      );
      this.chart.render().then(() => {
        this.chart.updateOptions({});
      });
    }
  }

  customElements.define("electricity-usage-chart", ElectricityUsageChart);
})();
