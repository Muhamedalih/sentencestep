import { BinanceMark } from "@/components/billing/binance-mark";

/**
 * Small drawings of the payment brands shown beside the ways to pay in the upgrade pop-up. They are
 * simplified marks drawn here (no image files to load); the Binance one is the mark the site already uses.
 */

/** A yellow tile with the dark Binance diamond. */
export function BinanceTile({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`flex items-center justify-center bg-[#f0b90b] text-[#1e2026] ${className ?? ""}`}
    >
      <BinanceMark className="size-6" />
    </span>
  );
}

/** A red tile with the white speech mark. */
export function VodafoneTile({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`flex items-center justify-center ${className ?? ""}`}>
      <svg viewBox="0 0 40 40" className="size-full" focusable="false">
        <rect width="40" height="40" fill="#e60000" />
        <circle cx="20" cy="22.5" r="9.6" fill="#fff" />
        <circle cx="20.6" cy="22.2" r="4.9" fill="#e60000" />
        <path d="M12.4 17c.7-4.6 4.4-7.8 9.7-8.6l.3 2c-3.4.6-5.6 2.4-6.4 5z" fill="#fff" />
      </svg>
    </span>
  );
}

/** The VISA wordmark on a small white plate. */
export function VisaPlate() {
  return (
    <span
      aria-hidden="true"
      className="flex h-[26px] w-[38px] shrink-0 items-center justify-center rounded-md bg-white"
    >
      <svg viewBox="0 0 38 14" className="h-[11px] w-[26px]" focusable="false">
        <text
          x="19"
          y="11.5"
          textAnchor="middle"
          fontSize="13.5"
          fontStyle="italic"
          fontWeight="800"
          fontFamily="Arial, Helvetica, sans-serif"
          fill="#1a1f71"
        >
          VISA
        </text>
      </svg>
    </span>
  );
}

/** The two circles of Mastercard on a small white plate. */
export function MastercardPlate() {
  return (
    <span
      aria-hidden="true"
      className="flex h-[26px] w-[38px] shrink-0 items-center justify-center rounded-md bg-white"
    >
      <svg viewBox="0 0 30 20" className="h-[18px] w-[27px]" focusable="false">
        <circle cx="10.5" cy="10" r="8" fill="#eb001b" />
        <circle cx="19.5" cy="10" r="8" fill="#f79e1b" />
        <path d="M15 3.7a8 8 0 0 1 0 12.6a8 8 0 0 1 0-12.6z" fill="#ff5f00" />
      </svg>
    </span>
  );
}
