export default function DashboardLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background gap-10">

      {/* Till animation */}
      <div className="relative flex items-center justify-center">
        {/* Outer pulse rings */}
        <span className="absolute inline-flex h-32 w-32 rounded-full bg-amber-400/20 animate-ping" />
        <span className="absolute inline-flex h-24 w-24 rounded-full bg-amber-400/30 animate-ping [animation-delay:150ms]" />

        {/* Inner receipt printer box */}
        <div className="relative z-10 w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-2xl shadow-amber-500/40 flex items-center justify-center animate-bounce [animation-duration:1.2s]">
          {/* Receipt strip coming out */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-7 flex flex-col items-center gap-[3px] overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-full h-[3px] rounded-full bg-foreground/30 animate-[slideDown_1s_ease-in-out_infinite]"
                style={{ animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>

          {/* Till icon: horizontal lines = receipt */}
          <div className="flex flex-col gap-[5px] w-8">
            <div className="h-[3px] w-full rounded-full bg-white/90" />
            <div className="h-[3px] w-4/5 rounded-full bg-white/70" />
            <div className="h-[3px] w-full rounded-full bg-white/90" />
            <div className="h-[3px] w-3/5 rounded-full bg-white/60" />
          </div>
        </div>
      </div>

      {/* Cycling text */}
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-lg font-semibold text-foreground animate-pulse">
          Opening the till
          <span className="inline-flex gap-[2px] ml-1">
            <span className="animate-[bounce_1s_infinite_0ms]">.</span>
            <span className="animate-[bounce_1s_infinite_150ms]">.</span>
            <span className="animate-[bounce_1s_infinite_300ms]">.</span>
          </span>
        </p>
        <p className="text-sm text-muted-foreground">
          Counting the coins, please stand by 🪙
        </p>
      </div>

      {/* Barcode scanner sweep */}
      <div className="relative w-48 h-10 overflow-hidden rounded-lg border border-border bg-muted/40">
        {/* Static barcode lines */}
        <div className="absolute inset-0 flex items-center justify-center gap-[3px] px-3 opacity-30">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="h-6 rounded-full bg-foreground"
              style={{ width: i % 3 === 0 ? '3px' : '1px' }}
            />
          ))}
        </div>
        {/* Laser sweep */}
        <div
          className="absolute inset-y-0 w-1 bg-gradient-to-b from-transparent via-red-500 to-transparent opacity-80 animate-[barcodeScan_1.4s_ease-in-out_infinite]"
        />
      </div>

      <style>{`
        @keyframes barcodeScan {
          0%   { left: 0%; }
          50%  { left: calc(100% - 4px); }
          100% { left: 0%; }
        }
        @keyframes slideDown {
          0%   { opacity: 0; transform: translateY(-6px); }
          50%  { opacity: 1; }
          100% { opacity: 0; transform: translateY(6px); }
        }
      `}</style>
    </div>
  );
}
