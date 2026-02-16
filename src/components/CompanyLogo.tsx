import { useState } from "react";

const LOGO_DEV_PUBLIC_KEY = 'pk_IzlBLDwbTDmjauKaJCedig';

interface CompanyLogoProps {
  ticker: string;
  size?: number;
  className?: string;
}

const CompanyLogo = ({ ticker, size = 32, className = "" }: CompanyLogoProps) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="font-bold text-foreground">{ticker[0]}</span>
    );
  }

  return (
    <img
      src={`https://img.logo.dev/ticker/${ticker}?token=${LOGO_DEV_PUBLIC_KEY}`}
      alt={ticker}
      width={size}
      height={size}
      className={className}
      onError={() => setFailed(true)}
    />
  );
};

export default CompanyLogo;
