import Image from "next/image";

export function Logo({
  width = 150,
  className,
}: {
  width?: number;
  className?: string;
}) {
  return (
    <Image
      src="/logo.png"
      alt="My Care Academy"
      width={width}
      height={Math.round(width * 0.235)}
      priority
      className={className}
    />
  );
}
