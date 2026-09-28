import { Activity, CheckCircle2, FileText, Target, TrendingDown, TrendingUp, Users } from "lucide-react";

const icons = {
  "New leads": Users,
  Contacted: Activity,
  Qualified: Target,
  Documents: FileText,
  Won: CheckCircle2,
  Lost: TrendingDown
};

export default function StatCard({ label, value, tone = "" }) {
  const Icon = icons[label] || TrendingUp;
  const trend = label === "Lost" ? "Needs review" : label === "Won" ? "Healthy momentum" : "Live data";

  return (
    <div className={`stat-card stat-card-modern ${tone}`}>
      <div className="stat-topline">
        <div className="stat-icon"><Icon size={17} /></div>
        <span className="stat-live">● live</span>
      </div>
      <span className="stat-label">{label}</span>
      <strong>{value}</strong>
      <small>{trend}</small>
    </div>
  );
}
