import React, { useEffect, useState } from 'react';
import { Line, Radar, Scatter } from 'react-chartjs-2';
import GaugeChart from 'react-gauge-chart';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
} from 'chart.js';
import { useParams } from 'react-router-dom';

// Register chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
);

const colors = {
  ph: 'rgba(59,130,246,1)',
  Turbidity: 'rgba(239,68,68,1)',
  Chloramines: 'rgba(234,179,8,1)',
  Hardness: 'rgba(96,165,250,1)',
  Solids: 'rgba(20,184,166,1)',
  Sulfate: 'rgba(99,102,241,1)',
  Conductivity: 'rgba(168,85,247,1)',
  Organic_carbon: 'rgba(251,191,36,1)',
  Trihalomethanes: 'rgba(244,114,182,1)',
};

const normalize = (arr) => {
  const max = Math.max(...arr);
  const min = Math.min(...arr);
  return arr.map((v) => (v - min) / (max - min || 1));
};

const Graphs = () => {
  const { id } = useParams();
  const [labels, setLabels] = useState([]);
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`https://water-watch-si4e.vercel.app/api/waterReadings/getWaterReadings/${id}`);
        const json = await res.json();
        const data = json.data || [];
        setLabels(data.map((d) => new Date(d.createdAt).toLocaleDateString()));
        setReadings(data);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] text-blue-600 text-xl font-semibold">
        Loading data...
      </div>
    );
  }

  if (readings.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <div className="text-center">
          <img
            src="https://i.imghippo.com/files/sLML6798MI.png"
            alt="No data"
            className="mx-auto w-60 mb-6"
          />
          <h2 className="text-2xl font-semibold text-gray-700">No Water Readings Available</h2>
          <p className="text-gray-500 mt-2">Data for this water body hasn’t been recorded yet.</p>
        </div>
      </div>
    );
  }

  const normalizedChartData = {
    labels,
    datasets: Object.keys(colors).map((key) => {
      const raw = readings.map((d) => d[key]);
      const normalized = normalize(raw);
      return {
        label: key + ' (normalized)',
        data: normalized,
        borderColor: colors[key],
        backgroundColor: colors[key] + '33',
        tension: 0.4,
        fill: false,
        pointRadius: 3,
      };
    }),
  };

  const normalizedOptions = {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', labels: { boxWidth: 20 } },
      title: { display: true, text: 'Normalized Water Quality Parameters Over Time' },
    },
    scales: {
      y: { beginAtZero: true, max: 1, title: { display: true, text: 'Normalized Value (0 to 1)' } },
    },
  };

  const predictionChartData = {
    labels,
    datasets: [
      {
        label: 'Prediction (1 = Unsafe, 0 = Safe)',
        data: readings.map((d) => (d.prediction ? 1 : 0)),
        borderColor: 'rgba(239,68,68,1)',
        backgroundColor: 'rgba(239,68,68,0.2)',
        tension: 0.2,
        stepped: true,
        fill: true,
        pointRadius: 3,
      },
    ],
  };

  const predictionOptions = {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', labels: { boxWidth: 20 } },
      title: { display: true, text: 'Water Safety Prediction Over Time' },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 1,
        ticks: { callback: (v) => (v === 1 ? 'Unsafe' : 'Safe') },
        title: { display: true, text: 'Prediction' },
      },
    },
  };

  const minMaxMap = {};
  Object.keys(colors).forEach((key) => {
    const values = readings.map((d) => d[key]);
    minMaxMap[key] = {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  });

  const latestReading = readings[readings.length - 1];
  const normalizedRadarData = Object.keys(colors).map((key) => {
    const { min, max } = minMaxMap[key];
    return (latestReading[key] - min) / (max - min || 1);
  });

  const radarData = {
    labels: Object.keys(colors),
    datasets: [
      {
        label: 'Latest Water Quality Snapshot (Normalized)',
        data: normalizedRadarData,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    scales: {
      r: {
        beginAtZero: true,
        max: 1,
        ticks: { stepSize: 0.2 },
      },
    },
    plugins: { title: { display: true, text: 'Radar Chart - Latest Reading (Normalized)' } },
  };

  const scatterData = {
    datasets: [
      {
        label: 'Water Samples',
        data: readings.map((r) => ({ x: r.ph, y: r.Turbidity })),
        backgroundColor: readings.map((r) =>
          r.prediction ? 'rgba(239,68,68,0.8)' : 'rgba(34,197,94,0.8)'
        ),
        pointRadius: 5,
      },
    ],
  };

  const scatterOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Scatter Plot: pH vs Turbidity (Red = Unsafe, Green = Safe)',
      },
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const idx = context.dataIndex;
            const pred = readings[idx]?.prediction ? 'Unsafe' : 'Safe';
            return `pH: ${context.parsed.x}, Turbidity: ${context.parsed.y}, ${pred}`;
          },
        },
      },
    },
    scales: {
      x: { title: { display: true, text: 'pH' }, min: 0, max: 14 },
      y: { title: { display: true, text: 'Turbidity' }, min: 0 },
    },
  };

  const latestPH = latestReading.ph || 7;
  const phNormalized = latestPH / 14;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-16 bg-gray-50 rounded-xl shadow-lg my-2">
      <h1 className="text-4xl md:text-5xl font-extrabold text-blue-700 mb-8 text-center drop-shadow-md border-b-4 border-blue-400 pb-2">
        Analytics of NIT Silchar Lake 1
      </h1>

      {/* Normalized Line Chart */}
      <section className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">Normalized Water Quality Parameters Over Time</h2>
        <Line data={normalizedChartData} options={normalizedOptions} className="h-64 max-h-[400px]" />
        <p className="mt-3 text-gray-600 text-sm">
          <strong>Note:</strong> Values are <span className="font-semibold">normalized</span> between 0 and 1 based on each parameter’s range.
        </p>
      </section>

      {/* Prediction Line Chart */}
      <section className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">Water Safety Prediction Over Time</h2>
        <Line data={predictionChartData} options={predictionOptions} className="h-56 max-h-[360px]" />
        <p className="mt-3 text-gray-600 text-sm">
          <strong>Prediction:</strong> 1 = <span className="text-red-600 font-semibold">Unsafe</span>, 0 = <span className="text-green-600 font-semibold">Safe</span>
        </p>
      </section>

      {/* Radar & Gauge */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center max-w-[480px] mx-auto">
          <h2 className="text-xl font-semibold mb-4">Latest Water Quality Snapshot (Radar)</h2>
          <Radar data={radarData} options={radarOptions} className="max-h-[360px] w-full" />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center max-w-[480px] mx-auto">
          <h2 className="text-xl font-semibold mb-4">pH Level Gauge (Latest)</h2>
          <GaugeChart
            id="ph-gauge"
            nrOfLevels={14}
            colors={['#FF5F6D', '#FFC371', '#5BE12C']}
            arcWidth={0.3}
            percent={phNormalized}
            textColor="#333"
            formatTextValue={() => latestPH.toFixed(2)}
            animate={false}
            needleColor="#464A4F"
            style={{ width: '100%', maxWidth: 280 }}
          />
        </div>
      </section>

      {/* Scatter Plot */}
      <section className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">Scatter Plot: pH vs Turbidity</h2>
        <Scatter data={scatterData} options={scatterOptions} className="h-64 max-h-[400px]" />
      </section>
    </div>
  );
};

export default Graphs;
