import React, { useEffect, useState } from "react";
import { getMaterials } from "../../materials/services/materialApi";

export default function StudentMaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMaterials()
      .then(setMaterials)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="panel p-5">
      <h2 className="text-lg font-semibold text-slate-800">Materials</h2>
      {loading ? <p className="mt-3 text-sm text-slate-500">Loading materials...</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      {!loading && !error && materials.length === 0 ? <p className="mt-3 text-sm text-slate-500">No data available.</p> : null}
      <div className="mt-4 space-y-3">
        {materials.map((material) => (
          <div key={material._id || material.id} className="rounded-xl border border-emerald-100 p-4">
            <p className="font-semibold text-slate-800">{material.title}</p>
            <p className="text-sm text-slate-500">{material.description || "No description available."}</p>
            <a className="mt-2 inline-block text-sm font-semibold text-campus-700" href={material.fileUrl} target="_blank" rel="noreferrer">Download Material</a>
          </div>
        ))}
      </div>
    </section>
  );
}
