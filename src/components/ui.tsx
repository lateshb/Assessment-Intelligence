export function AIBadge() {
  return (
    <span className="ml-2 inline-flex items-center rounded-full bg-[#E9ECF9] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#3A4A9F]">
      AI
    </span>
  );
}

export function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const tone =
    pct >= 80
      ? "bg-[#E4F5F3] text-[#0E7C71]"
      : pct >= 60
        ? "bg-[#FDF3E1] text-[#B45309]"
        : "bg-[#FBE9E3] text-[#B23A1B]";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>
      {pct}% confidence
    </span>
  );
}

export function SectionTitle({
  kicker,
  title,
}: {
  kicker: string;
  title: string;
}) {
  return (
    <div className="mb-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#B45309]">{kicker}</p>
      <h2 className="text-xl font-bold text-[#141834]">{title}</h2>
    </div>
  );
}

export const CATEGORY_META: Record<
  string,
  { label: string; chip: string; dot: string }
> = {
  correct: { label: "Correct", chip: "bg-[#E4F5F3] text-[#0E7C71]", dot: "bg-[#17B0A0]" },
  partial: { label: "Partially correct", chip: "bg-[#FDF3E1] text-[#B45309]", dot: "bg-[#F5A623]" },
  misconception: { label: "Misconception", chip: "bg-[#FBE9E3] text-[#B23A1B]", dot: "bg-[#E4572E]" },
  needs_review: { label: "Needs teacher review", chip: "bg-[#EDEFF6] text-[#565C82]", dot: "bg-[#6C7396]" },
};
