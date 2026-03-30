import { libraryRows } from "../data/mockData";
import MaterialIcon from "./MaterialIcon";

const KnowledgeTable = () => {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h3 className="font-headline text-lg font-bold">Library</h3>
        <button className="text-slate-400 transition-colors hover:text-black">
          <MaterialIcon name="filter_list" />
        </button>
      </div>
      <div className="overflow-hidden border-t border-slate-100">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="py-4 font-medium">Name</th>
              <th className="py-4 font-medium">Size</th>
              <th className="py-4 font-medium">Status</th>
              <th className="py-4 text-right font-medium">Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {libraryRows.map((row) => (
              <tr key={row.name} className="group transition-colors hover:bg-slate-50/50">
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <MaterialIcon name={row.icon} className="text-slate-300" />
                    <span className="text-sm font-medium text-black">{row.name}</span>
                  </div>
                </td>
                <td className="py-4 text-sm text-slate-500">{row.size}</td>
                <td className="py-4">
                  <span
                    className={`text-[11px] font-bold uppercase tracking-tight ${
                      row.statusTone === "success" ? "text-emerald-600" : "text-amber-600"
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="py-4 text-right text-sm text-slate-400">{row.added}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-slate-50 py-8">
          <p className="text-xs text-slate-400">3 files listed</p>
          <div className="flex gap-4">
            <button className="text-xs font-semibold text-slate-400 hover:text-black">Previous</button>
            <button className="text-xs font-semibold text-slate-400 hover:text-black">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeTable;
