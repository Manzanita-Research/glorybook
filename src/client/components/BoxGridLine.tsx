interface BoxGridLineProps {
  raw: string;
}

/**
 * BoxGridLine — renders one pipe-separated chord grid line.
 *
 * Splits on |, filters empty strings from leading/trailing pipes,
 * and renders each cell as a bordered inline-block with gold text.
 */
export function BoxGridLine({ raw }: BoxGridLineProps) {
  const cells = raw.split("|").filter((cell) => cell !== "");

  return (
    <div className="flex gap-0 font-mono text-xl my-1">
      {cells.map((cell, i) => (
        <span
          key={i}
          className="inline-block border border-border px-2 py-0.5 text-accent-gold min-w-[3.5rem] text-center font-mono text-xl"
        >
          {cell.trim() || "\u00A0"}
        </span>
      ))}
    </div>
  );
}
