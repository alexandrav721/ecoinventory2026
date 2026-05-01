import { Flame, Repeat2, Lightbulb } from "lucide-react";

interface Props {
  duplicateGroups: number;
  demandCount: number;
  duplicateValue: number;
  onClickDuplicates?: () => void;
  onClickDemand?: () => void;
}

export const InsightChipRow = ({
  duplicateGroups,
  demandCount,
  duplicateValue,
  onClickDuplicates,
  onClickDemand,
}: Props) => {
  const chips: {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
  }[] = [];

  if (duplicateGroups > 0) {
    chips.push({
      icon: <Repeat2 className="w-3.5 h-3.5" />,
      label: `${duplicateGroups} duplicate group${duplicateGroups === 1 ? "" : "s"} found`,
      onClick: onClickDuplicates,
    });
  }
  if (demandCount > 0) {
    chips.push({
      icon: <Flame className="w-3.5 h-3.5" />,
      label: `${demandCount} item${demandCount === 1 ? "" : "s"} in high demand nearby`,
      onClick: onClickDemand,
    });
  }
  if (duplicateValue > 0) {
    chips.push({
      icon: <Lightbulb className="w-3.5 h-3.5" />,
      label: `Est. $${duplicateValue} resale value in duplicates`,
      onClick: onClickDuplicates,
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {chips.map((c, i) => (
        <button
          key={i}
          onClick={c.onClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 transition-colors"
        >
          {c.icon}
          {c.label}
        </button>
      ))}
    </div>
  );
};
