import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="bg-blue-0">
      <div className="max-w-7xl mx-auto px-6 py-16 flex flex-col-reverse md:flex-row items-center justify-between">
        <div className="w-full md:w-1/2 text-center md:text-left space-y-6">
          <p className="text-4xl font-bold text-blue-800 leading-tight">
            Monitor. <span className="text-green-400">Predict.</span> Protect.
          </p>
          <p className="text-green-800 text-lg">
            WaterWatch empowers local communities to monitor the health of rivers, ponds, and wells in real-time — without lab equipment.
          </p>
          <div className="space-x-4">
            <Link to="/environments" className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-400 transition">
              Check Environments
            </Link>
          </div>
        </div>

        <div className="w-full md:w-1/2 mb-10 md:mb-0">
          <img src="https://i.imghippo.com/files/sLML6798MI.png" alt="Water Monitoring" className="w-full max-w-md mx-auto border-2 " />
        </div>
      </div>
    </section>
  );
}
