import Image from "next/image";

type RovikLogoProps = {
  className?: string;
  title?: string;
};

export function RovikLogo({
  className,
  title = "Rovik logo",
}: RovikLogoProps) {
  return (
    <Image
      src="/brand/rovik-logo.png"
      alt={title}
      width={489}
      height={361}
      priority
      sizes="(max-width: 768px) 16rem, 20rem"
      className={className}
    />
  );
}
