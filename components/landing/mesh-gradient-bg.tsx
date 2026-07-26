"use client";

export function MeshGradientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Deep blue blob - top left */}
      <div
        className="mesh-blob-1 absolute -top-[20%] -left-[10%] h-[600px] w-[600px] rounded-full opacity-60 dark:opacity-40"
        style={{
          background:
            "radial-gradient(circle at center, rgba(37, 99, 235, 0.5) 0%, rgba(37, 99, 235, 0.15) 50%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      {/* Purple blob - center right */}
      <div
        className="mesh-blob-2 absolute top-[20%] -right-[5%] h-[550px] w-[550px] rounded-full opacity-50 dark:opacity-35"
        style={{
          background:
            "radial-gradient(circle at center, rgba(147, 51, 234, 0.45) 0%, rgba(147, 51, 234, 0.12) 50%, transparent 70%)",
          filter: "blur(90px)",
        }}
      />
      {/* Soft white / lavender blob - bottom center */}
      <div
        className="mesh-blob-3 absolute -bottom-[10%] left-[20%] h-[500px] w-[500px] rounded-full opacity-40 dark:opacity-25"
        style={{
          background:
            "radial-gradient(circle at center, rgba(199, 210, 254, 0.6) 0%, rgba(199, 210, 254, 0.15) 50%, transparent 70%)",
          filter: "blur(70px)",
        }}
      />
      {/* Indigo accent blob */}
      <div
        className="mesh-blob-4 absolute top-[60%] left-[10%] h-[400px] w-[400px] rounded-full opacity-35 dark:opacity-20"
        style={{
          background:
            "radial-gradient(circle at center, rgba(99, 102, 241, 0.4) 0%, rgba(99, 102, 241, 0.1) 50%, transparent 70%)",
          filter: "blur(85px)",
        }}
      />
    </div>
  );
}
