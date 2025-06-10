import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { Pie, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { ShieldCheck, AlertTriangle, X, PlusCircle } from 'lucide-react';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
);

const DashBoardGraphs = () => {
  const [environments, setEnvironments] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRecs, setSelectedRecs] = useState([]);
  const [selectedEnvName, setSelectedEnvName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEnvironments = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const decoded = jwtDecode(token);
        const userId = decoded.id;

        const res = await axios.get(
          `https://water-watch-si4e.vercel.app/api/environment/getEnvironments/${userId}`
        );
        setEnvironments(res.data.environments);
      } catch (err) {
        console.error('Error fetching environments:', err);
      }
    };

    fetchEnvironments();
  }, []);

  const statusCounts = environments.reduce(
    (acc, env) => {
      const status = (env.status || 'unknown').toLowerCase();
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    { safe: 0, unsafe: 0, unknown: 0 }
  );

  const pieData = {
    labels: ['Safe', 'Unsafe', 'Unknown'],
    datasets: [
      {
        data: [statusCounts.safe, statusCounts.unsafe, statusCounts.unknown],
        backgroundColor: ['#10b981', '#ef4444', '#9ca3af'],
        borderWidth: 1,
      },
    ],
  };

  const radarData = {
    labels: environments.map((e) => e.name),
    datasets: [
      {
        label: 'Safety Status (1 = Safe, 0 = Unsafe)',
        data: environments.map((e) => (e.status === 'safe' ? 1 : 0)),
        backgroundColor: 'rgba(16, 185, 129, 0.3)',
        borderColor: '#10b981',
        borderWidth: 2,
        fill: true,
        pointBackgroundColor: environments.map((e) =>
          e.status === 'safe' ? '#10b981' : '#ef4444'
        ),
      },
    ],
  };

  const openModal = (recs, envName) => {
    setSelectedRecs(recs);
    setSelectedEnvName(envName);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedRecs([]);
    setSelectedEnvName('');
  };

  // ✅ No environments UI
  if (environments.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <PlusCircle className="h-20 w-20 text-blue-500 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">No environments added yet</h2>
        <p className="text-gray-500 mb-6">
          You haven't added any water environments to monitor. Start by adding one!
        </p>
        <button
          onClick={() => navigate('/environments')}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
        >
          Add Environment
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-12">
      <h1 className="text-4xl font-bold text-center text-blue-800">Environment Safety Dashboard</h1>

      <div className="grid md:grid-cols-2 gap-8 justify-center">
        <div className="bg-white p-6 rounded-xl shadow border max-w-xs mx-auto">
          <h2 className="text-lg font-semibold mb-4 text-center">Safety Distribution</h2>
          <Pie data={pieData} />
        </div>

        <div className="bg-white p-6 rounded-xl shadow border max-w-xs mx-auto">
          <h2 className="text-lg font-semibold mb-4 text-center">Environment Status Radar</h2>
          <Radar data={radarData} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {environments.map((env) => {
          const status = env.status || 'unknown';
          const icon =
            status === 'safe' ? (
              <ShieldCheck className="text-green-600 h-6 w-6" />
            ) : (
              <AlertTriangle className="text-red-600 h-6 w-6" />
            );

          const latestRec =
            env.recommandations && env.recommandations.length > 0
              ? env.recommandations[env.recommandations.length - 1]
              : null;

          return (
            <div
              key={env._id}
              className="border rounded-xl p-5 bg-white shadow hover:shadow-lg transition duration-300"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-gray-800 truncate max-w-[70%]">{env.name}</h2>
                {icon}
              </div>
              <p className="text-sm text-gray-500 mb-2">{env.location}</p>
              <span
                className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${
                  status === 'safe'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>

              {latestRec && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Latest Recommendation:</h3>
                  <p className="text-gray-600 text-sm truncate">{latestRec}</p>
                </div>
              )}

              {env.recommandations && env.recommandations.length > 1 && (
                <button
                  onClick={() => openModal(env.recommandations, env.name)}
                  className="mt-3 text-xs text-blue-600 hover:underline focus:outline-none"
                >
                  View All Recommendations
                </button>
              )}
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 relative shadow-lg">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 focus:outline-none"
              aria-label="Close modal"
            >
              <X className="h-6 w-6" />
            </button>

            <h2 className="text-xl font-semibold mb-4">All Recommendations - {selectedEnvName}</h2>

            <ul className="list-disc list-inside space-y-2 max-h-64 overflow-y-auto text-gray-700">
              {selectedRecs.map((rec, idx) => (
                <li key={idx} className="text-sm">
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashBoardGraphs;
