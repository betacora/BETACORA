/** BeTacora wordmark with syllable-alternating colors: Be/co teal, Ta/ra coral. */
export function BrandWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={className} aria-label="BeTacora">
      <span className="text-[#2D7B7B]">Be</span>
      <span className="text-[#E8634A]">Ta</span>
      <span className="text-[#2D7B7B]">co</span>
      <span className="text-[#E8634A]">ra</span>
    </span>
  );
}
