import "./StateCard.css";

interface Props {
  title: string;
  value: string | number;
  accent?: "green" | "amber" | "neutral";
}

export default function StatCard({ title, value, accent = "neutral" }: Props) {
  return (
    <div className={`stat-card stat-card--${accent}`}>
      <span className="stat-card-accent" aria-hidden="true" />
      <h3 className="stat-card-title">{title}</h3>
      <strong className="stat-card-value">{value}</strong>
    </div>
  );
}